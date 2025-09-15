import pandas as pd
import re
from decimal import Decimal
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Category

def extract_tire_info(name):
    """Extract tire information from product name"""
    # Extract brand (usually at the beginning)
    brand = "Continental"  # Default brand from Excel file
    
    # Extract tire size using improved regex (format: XXX/XX RXX or XXX/XXrXX)
    size_pattern = r'(\d{3}/\d{2}\s?R?\s?\d{2})'
    size_match = re.search(size_pattern, name, re.IGNORECASE)
    size = size_match.group(1) if size_match else "Unknown"
    
    # Clean size format
    size = re.sub(r'\s+', '', size).replace('r', 'R').replace('R', 'R')
    
    # Remove common prefixes and tire size to extract product name
    clean_name = name.replace("Pneu", "").replace("CONTINENTAL", "").strip()
    
    # Remove the tire size pattern
    if size_match:
        clean_name = clean_name.replace(size_match.group(1), "").strip()
    
    # Remove speed/load rating patterns (like 91H, 88T, etc.)
    clean_name = re.sub(r'\b\d{2,3}[A-Z]{1,2}\b', '', clean_name).strip()
    
    # Remove extra whitespace and clean up
    clean_name = re.sub(r'\s+', ' ', clean_name).strip()
    
    # Extract meaningful product name
    if clean_name:
        # Remove leading/trailing non-alphanumeric characters
        clean_name = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', clean_name)
        product_name = clean_name
    else:
        product_name = "Continental Tire"
    
    return {
        'brand': brand,
        'name': product_name,
        'size': size,
        'full_name': f"{brand} {product_name} {size}".strip()
    }

def determine_season(name, description):
    """Determine tire season based on name and description"""
    text = (name + " " + str(description)).lower()
    
    if any(word in text for word in ['winter', 'hiver', 'neige', 'snow']):
        return 'winter'
    elif any(word in text for word in ['summer', 'été', 'sport']):
        return 'summer'
    else:
        return 'all_season'

@api_view(['POST'])
@permission_classes([AllowAny])  # Remove for production
def import_products_excel(request):
    """Import products from Excel file"""
    try:
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file uploaded'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = request.FILES['file']
        
        # Validate file type
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response({
                'error': 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Read Excel file
        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            return Response({
                'error': f'Error reading Excel file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate required columns
        required_columns = ['Unnamed: 0', 'PRIX TTC', 'DESCRIPTION']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                'error': f'Missing required columns: {missing_columns}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create Continental category
        continental_category, created = Category.objects.get_or_create(
            name='Continental',
            defaults={
                'slug': 'continental',
                'description': 'Pneus Continental - Qualité et performance européenne'
            }
        )
        
        # Process each row
        created_products = []
        updated_products = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Skip rows with missing essential data
                if pd.isna(row['Unnamed: 0']) or pd.isna(row['PRIX TTC']):
                    continue
                
                product_name = str(row['Unnamed: 0']).strip()
                price = float(row['PRIX TTC'])
                description = str(row['DESCRIPTION']) if not pd.isna(row['DESCRIPTION']) else ""
                
                # Extract tire information
                tire_info = extract_tire_info(product_name)
                
                # Generate unique slug
                base_slug = slugify(tire_info['full_name'])
                slug = base_slug
                counter = 1
                while Product.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                # Determine season
                season = determine_season(product_name, description)
                
                # Create or update product
                product, created = Product.objects.get_or_create(
                    name=tire_info['name'],
                    brand=tire_info['brand'],
                    size=tire_info['size'],
                    defaults={
                        'slug': slug,
                        'description': description,
                        'price': Decimal(str(price)),
                        'category': continental_category,
                        'season': season,
                        'stock': 10,  # Default stock
                        'is_active': True
                    }
                )
                
                if created:
                    created_products.append(product.name)
                else:
                    # Update existing product
                    product.price = Decimal(str(price))
                    product.description = description
                    product.season = season
                    product.save()
                    updated_products.append(product.name)
                    
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        return Response({
            'message': 'Import completed successfully',
            'summary': {
                'total_rows': len(df),
                'created': len(created_products),
                'updated': len(updated_products),
                'errors': len(errors)
            },
            'created_products': created_products[:10],  # Show first 10
            'updated_products': updated_products[:10],  # Show first 10
            'errors': errors[:10]  # Show first 10 errors
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # Remove for production
def import_preview(request):
    """Preview Excel file data before import"""
    return Response({
        'message': 'Upload Excel file to preview import data',
        'expected_format': {
            'columns': ['Product Name', 'Price TTC', 'Description', 'Image (optional)'],
            'example': {
                'Unnamed: 0': 'Pneu CONTINENTAL 195/65R15 91H ULTRA CONTACT',
                'PRIX TTC': 299.238,
                'DESCRIPTION': 'Points forts: Kilométrage ultra-élevé...',
                'IMAGE': 'Optional image filename'
            }
        }
    })