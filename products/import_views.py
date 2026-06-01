import re
import io
import hashlib
import openpyxl
import urllib.request
import urllib.error
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Product, Category, ImportJob


# Column name aliases (case-insensitive, stripped)
# Primary name fields (checked first)
NAME_PRIMARY = {'nom', 'name', 'product name', 'designation', 'libelle', 'article', 'produit', 'description article'}
# Fallback name fields (used only if no primary name found)
NAME_FALLBACK = {'reference', 'ref', 'code article'}
PRICE_ALIASES = {'prix ttc', 'prix', 'prix vente', 'tarif', 'price', 'prix de vente', 'p.v.ttc', 'pvttc',
                 'pric ttc', 'prix ttc.', 'ttc', 'montant ttc', 'cout ttc', 'prix unitaire', 'pu ttc'}
DESCRIPTION_ALIASES = {'description', 'desc', 'details', 'detail'}
STOCK_ALIASES = {'stock', 'quantite', 'qty', 'qte', 'quantity'}
REFERENCE_ALIASES = {'ref', 'reference', 'code', 'code article', 'code produit'}
CATEG_ALIASES = {'categorie', 'category', 'type', 'famille', 'segment', 'cat'}
BRAND_ALIASES = {'marque', 'brand', 'fabricant'}
SIZE_ALIASES = {'taille', 'dimension', 'size', 'dimension pneu', 'dimensions'}
IMAGE_ALIASES = {'image', 'photo', 'img', 'image url', 'photo url', 'lien image', 'url image', 'image principale'}

# Cache: md5_hash -> cloudinary URL (avoids re-uploading the same image)
_image_cache: dict[str, str] = {}


def normalize_col(col: str) -> str:
    return col.strip().lower().replace('é', 'e').replace('è', 'e').replace('ê', 'e').replace('â', 'a')


SKIP_WORDS = {'pneu', 'pneus', 'tire', 'tyre', 'tyres', 'pneumatique', 'pneumatiques'}

# Mapping lowercase → nom officiel (normalisation à l'import)
BRAND_CANONICAL: dict[str, str] = {
    'michelin': 'Michelin', 'michlen': 'Michelin', 'michlin': 'Michelin',
    'pirelli': 'Pirelli',
    'continental': 'Continental',
    'bridgestone': 'Bridgestone',
    'goodyear': 'Goodyear',
    'dunlop': 'Dunlop',
    'hankook': 'Hankook',
    'kleber': 'Kleber',
    'nexen': 'Nexen',
    'maxxis': 'Maxxis',
    'firestone': 'Firestone',
    'barum': 'Barum',
    'semperit': 'Semperit', 'sempert': 'Semperit',
    'debica': 'Debica',
    'tigar': 'Tigar',
    'laufenn': 'Laufenn',
    'lassa': 'Lassa',
    'fulda': 'Fulda',
    'bfgoodrich': 'BFGoodrich', 'bf goodrich': 'BFGoodrich',
    'westlake': 'Westlake',
    'waterfall': 'Waterfall',
    'alliance': 'Alliance',
    'apollo': 'Apollo',
    'armour': 'Armour',
    'dayton': 'Dayton',
    'central tire': 'Central Tire', 'centraltire': 'Central Tire',
    'amine': 'Amine',
    'yokohama': 'Yokohama',
    'toyo': 'Toyo',
    'falken': 'Falken',
    'kumho': 'Kumho',
    'nokian': 'Nokian',
    'unknown': '',
}

KNOWN_BRANDS = set(BRAND_CANONICAL.keys())


def extract_brand_size_from_name(name: str):
    """Extract brand and size (e.g. 225/45R17) from product name."""
    brand = ''
    size = ''
    size_match = re.search(r'\d{3}/\d{2}\s*[Rr]\s*\d{2,3}', name)
    if size_match:
        size = size_match.group(0).replace(' ', '')

    # Find brand: first word that is a known brand, or first non-skip uppercase word
    parts = name.strip().split()
    for part in parts:
        p_lower = part.lower().rstrip('.,')
        if p_lower in SKIP_WORDS:
            continue
        # Skip parts that look like size components (digit-starts or single-letter+digits like R17)
        if part[0].isdigit() or (len(part) <= 4 and part[0].isalpha() and any(c.isdigit() for c in part)):
            continue
        if p_lower in KNOWN_BRANDS:
            brand = part.rstrip('.,')
            break
        if part[0].isupper() and len(part) > 2:
            brand = part.rstrip('.,')
            break

    return brand, size


def detect_season(name: str) -> str:
    n = name.lower()
    if any(w in n for w in ['winter', 'hiver', 'neige', 'nordic', 'nordica', 'alpin', 'snow']):
        return 'winter'
    if any(w in n for w in ['summer', 'ete', 'été', 'sport', 'ultra contact']):
        return 'summer'
    if any(w in n for w in ['all season', '4 saison', 'allseason', 'toutes saisons', 'all-season', 'crossclimate']):
        return 'all_season'
    return 'summer'


def get_or_create_category(name: str, categ_override: str = '') -> Category:
    n = (categ_override or name).lower()
    if 'agricole' in n:
        cat_name = 'Agricole'
    elif 'moto' in n or 'scooter' in n:
        cat_name = 'Moto'
    elif '4x4' in n or 'suv' in n:
        cat_name = '4x4/SUV'
    elif 'utilitaire' in n or 'camion' in n or 'poids lourd' in n:
        cat_name = 'Utilitaire'
    else:
        cat_name = 'Tourisme'
    slug = cat_name.lower().replace('/', '-').replace(' ', '-')
    cat, _ = Category.objects.get_or_create(slug=slug, defaults={'name': cat_name})
    return cat


def _extract_embedded_images(sheet) -> dict[int, list[bytes]]:
    """
    Return a dict mapping 0-indexed sheet row → list of embedded image bytes.
    Supports multiple images per row (up to 3 for image, image_2, image_3).
    """
    img_map: dict[int, list[bytes]] = {}
    for img in getattr(sheet, '_images', []):
        anchor = img.anchor
        if hasattr(anchor, '_from'):
            row_idx = anchor._from.row  # 0-indexed
            try:
                data = img._data()
                if data:
                    if row_idx not in img_map:
                        img_map[row_idx] = []
                    img_map[row_idx].append(data)
            except Exception:
                pass
    return img_map


def parse_excel_file(file_content: bytes, filename: str = '') -> list[dict]:
    """
    Parse Excel file content (.xlsx or .xls) and return list of row dicts.
    For .xlsx files, embedded images are stored under the key '__embedded_image__'
    as raw bytes in each row dict.
    """
    rows = []
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else 'xlsx'

    if ext == 'xls':
        import xlrd
        wb = xlrd.open_workbook(file_contents=file_content)
        for sheet in wb.sheets():
            headers = None
            for row_idx in range(sheet.nrows):
                row = [sheet.cell_value(row_idx, col) for col in range(sheet.ncols)]
                if headers is None:
                    if any(c != '' for c in row):
                        headers = [normalize_col(str(c)) if c != '' else '' for c in row]
                    continue
                if all(c == '' or c is None for c in row):
                    continue
                row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}
                rows.append(row_dict)
    else:
        wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        for sheet in wb.worksheets:
            # Extract all embedded images indexed by 0-based sheet row
            embedded_images = _extract_embedded_images(sheet)

            headers = None
            sheet_row_idx = -1

            for row in sheet.iter_rows(values_only=True):
                sheet_row_idx += 1

                if headers is None:
                    if any(cell is not None for cell in row):
                        headers = [normalize_col(str(c)) if c is not None else '' for c in row]
                    continue

                if all(cell is None for cell in row):
                    continue

                row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}

                # Attach list of embedded image bytes if any exist at this row
                if sheet_row_idx in embedded_images:
                    row_dict['__embedded_images__'] = embedded_images[sheet_row_idx]

                rows.append(row_dict)
    return rows


def map_row_to_product(row: dict) -> dict | None:
    """Map a row dict to product field dict. Returns None if name or price missing."""
    name = None
    name_fallback = None
    price = None
    description = ''
    stock = 0  # Import catalogue only — stock managed via Achats
    reference = ''
    brand = ''
    size = ''
    image = ''
    categ = ''
    embedded_images = row.get('__embedded_images__') or []  # list of bytes

    for col, val in row.items():
        if col == '__embedded_images__':
            continue
        col_n = normalize_col(col)
        if col_n in NAME_PRIMARY and name is None and val:
            name = str(val).strip()
        if col_n in NAME_FALLBACK and name_fallback is None and val:
            name_fallback = str(val).strip()
        if col_n in REFERENCE_ALIASES and not reference and val:
            reference = str(val).strip()
        if col_n in CATEG_ALIASES and not categ and val:
            categ = str(val).strip()
        if col_n in PRICE_ALIASES and price is None and val is not None:
            try:
                price = float(str(val).replace(',', '.').replace(' ', '').replace('\xa0', ''))
            except (ValueError, TypeError):
                pass
        if col_n in DESCRIPTION_ALIASES and not description and val:
            description = str(val).strip()
        if col_n in STOCK_ALIASES and val is not None:
            try:
                stock = int(float(str(val)))
            except (ValueError, TypeError):
                pass
        if col_n in BRAND_ALIASES and not brand and val:
            brand = str(val).strip()
        if col_n in SIZE_ALIASES and not size and val:
            size = str(val).strip()
        if col_n in IMAGE_ALIASES and not image and val:
            image = str(val).strip()

    if not name:
        name = name_fallback
    if not name or price is None:
        return None

    # Try to extract brand and size from the name if not already set
    if not brand or not size:
        auto_brand, auto_size = extract_brand_size_from_name(name)
        brand = brand or auto_brand
        size = size or auto_size

    # Normaliser la marque vers le nom officiel
    brand_canonical = BRAND_CANONICAL.get(brand.lower().strip())
    if brand_canonical is not None:
        brand = brand_canonical  # '' si 'unknown'

    return {
        'name': name,
        'price': round(price, 3),
        'description': description,
        'stock': stock,
        'reference': reference,
        'brand': brand,
        'size': size,
        'image': image,
        'embedded_images': embedded_images,
        'season': detect_season(name),
        'categ': categ,
    }


def _resolve_image(image_val, embedded_bytes: bytes | None = None) -> str:
    """
    Resolve the best available image to a URL:
    1. If image_val is a non-empty http(s) URL → return as-is
    2. If embedded_bytes provided → upload to Cloudinary (with MD5 dedup cache)
    3. Otherwise → return ''
    """
    global _image_cache

    # Priority 1: explicit URL in cell
    if image_val:
        val = str(image_val).strip()
        if val.startswith('http://') or val.startswith('https://'):
            return val

    # Priority 2: embedded image bytes
    if embedded_bytes:
        img_hash = hashlib.md5(embedded_bytes).hexdigest()

        # Check cache first (same image reused for many products)
        if img_hash in _image_cache:
            return _image_cache[img_hash]

        try:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(
                io.BytesIO(embedded_bytes),
                folder='pneushop/products',
                public_id=f'tire_{img_hash}',
                overwrite=False,
                resource_type='image',
            )
            url = result.get('secure_url', '')
            if url:
                _image_cache[img_hash] = url
            return url
        except Exception:
            return ''

    # Priority 3: try uploading image_val as a path/base64 string
    if image_val:
        val = str(image_val).strip()
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(
                val,
                folder='pneushop/products',
                overwrite=False,
            )
            return result.get('secure_url', '')
        except Exception:
            pass

    return ''


def _status_to_frontend(db_status: str) -> str:
    """Map ImportJob DB status to frontend expected status strings."""
    return {
        'queued': 'queued',
        'running': 'processing',
        'done': 'completed',
        'failed': 'failed',
    }.get(db_status, db_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_excel(request):
    """
    POST /api/products/import/excel/
    Accepts a multipart file upload, parses the Excel, creates products,
    and returns a job_id with status.
    """
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Aucun fichier fourni.'}, status=400)

    ext = file.name.lower().rsplit('.', 1)[-1] if '.' in file.name else ''
    if ext not in ('xlsx', 'xls'):
        return Response({'error': 'Format invalide. Seuls .xlsx et .xls sont acceptés.'}, status=400)

    # Clear the per-request image cache so hashes don't bleed between imports
    _image_cache.clear()

    job = ImportJob.objects.create(
        original_filename=file.name,
        status='running',
        started_at=timezone.now(),
    )

    errors = []
    created_count = 0
    created_names = []
    images_uploaded = 0
    total_rows = 0

    try:
        content = file.read()
        rows = parse_excel_file(content, file.name)
        total_rows = len(rows)
        job.total_rows = total_rows
        job.save(update_fields=['total_rows'])

        for i, row in enumerate(rows):
            product_data = map_row_to_product(row)
            if product_data is None:
                errors.append(f'Ligne {i + 2}: Nom ou prix manquant — ignoré.')
                continue
            try:
                category = get_or_create_category(product_data['name'], product_data.get('categ', ''))
                slug_base = re.sub(r'[^a-z0-9]+', '-', product_data['name'].lower())[:200]

                # Check if product with same reference already exists
                existing = None
                if product_data['reference']:
                    existing = Product.objects.filter(reference=product_data['reference']).first()

                # Résoudre jusqu'à 3 images (image principale + image_2 + image_3)
                embedded_imgs = product_data.get('embedded_images', [])
                image_url  = _resolve_image(product_data.get('image', ''), embedded_imgs[0] if len(embedded_imgs) > 0 else None)
                image_url2 = _resolve_image('', embedded_imgs[1] if len(embedded_imgs) > 1 else None)
                image_url3 = _resolve_image('', embedded_imgs[2] if len(embedded_imgs) > 2 else None)
                any_image = bool(image_url or image_url2 or image_url3)

                if existing:
                    # Update price, description and images — do NOT touch stock (stock managed via Achats)
                    existing.price = product_data['price']
                    if product_data['description']:
                        existing.description = product_data['description']
                    update_fields = ['price', 'updated_at']
                    if product_data['description']:
                        update_fields.append('description')
                    if not existing.image and image_url:
                        existing.image = image_url
                        update_fields.append('image')
                    if not existing.image_2 and image_url2:
                        existing.image_2 = image_url2
                        update_fields.append('image_2')
                    if not existing.image_3 and image_url3:
                        existing.image_3 = image_url3
                        update_fields.append('image_3')
                    if any_image:
                        images_uploaded += 1
                    existing.save(update_fields=update_fields)
                else:
                    # Ensure slug is unique
                    slug = slug_base
                    counter = 1
                    while Product.objects.filter(slug=slug).exists():
                        slug = f'{slug_base}-{counter}'
                        counter += 1

                    if any_image:
                        images_uploaded += 1

                    Product.objects.create(
                        name=product_data['name'],
                        slug=slug,
                        description=product_data['description'],
                        price=product_data['price'],
                        brand=product_data['brand'],
                        size=product_data['size'],
                        season=product_data['season'],
                        stock=0,  # Stock = 0 — géré exclusivement via les Achats
                        reference=product_data['reference'],
                        category=category,
                        image=image_url,
                        image_2=image_url2 or None,
                        image_3=image_url3 or None,
                        is_active=True,
                    )
                    created_names.append(product_data['name'])
                created_count += 1
            except Exception as e:
                errors.append(f'Ligne {i + 2} ({product_data.get("name", "?")}): {str(e)}')

        job.status = 'done'
        job.created_count = created_count
        job.created_names = created_names
        job.error_count = len(errors)
        job.errors = errors
        job.images_processed = images_uploaded
        job.message = f'{created_count} produit(s) importé(s) dont {images_uploaded} avec image, {len(errors)} erreur(s).'
        job.finished_at = timezone.now()
        job.save()

    except Exception as e:
        job.status = 'failed'
        job.message = str(e)
        job.finished_at = timezone.now()
        job.save()
        return Response({
            'job_id': str(job.id),
            'status': 'failed',
            'message': str(e),
        }, status=500)

    return Response({
        'job_id': str(job.id),
        'status': _status_to_frontend(job.status),
        'message': job.message,
        'status_endpoint': f'/api/products/import/status/{job.id}/',
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def import_status(request, job_id):
    """
    GET /api/products/import/status/<job_id>/
    Returns current status of an import job.
    """
    try:
        job = ImportJob.objects.get(id=job_id)
    except ImportJob.DoesNotExist:
        return Response({'error': 'Job introuvable.'}, status=404)

    return Response({
        'job_id': str(job.id),
        'status': _status_to_frontend(job.status),
        'message': job.message,
        'summary': {
            'total_rows': job.total_rows,
            'created': job.created_count,
            'errors': job.error_count,
            'images_processed': job.images_processed,
        },
        'created_names': job.created_names or [],
        'errors': job.errors,
    })
