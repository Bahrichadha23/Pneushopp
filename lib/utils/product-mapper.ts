import type { Product } from "@/types/product";
import type { ProductCreateData } from "@/lib/services/admin";

// Mapper les saisons vers l'API
const seasonMap = {
  ete: "summer",
  hiver: "winter",
  "toutes-saisons": "all_season",
} as const;

// Mapper les catégories frontend vers les IDs Django
const categoryMap = {
  auto: 1, // Pneus Voiture
  suv: 1, // Pneus Voiture
  camionnette: 2, // Pneus Camionnette
  utilitaire: 2, // Pneus Camionnette
  "poids-lourd": 3, // Pneus Camion
  agricole: 4, // Pneus Agricole
  "4x4": 1, // Pneus Voiture
} as const;

// Générer un slug unique à partir du brand, name et model (max 50 caractères)
const generateSlug = (brand: string, name: string, model: string) => {
  const cleanString = (str: string) =>
    str
      .toLowerCase()
      .replace(/[àáâãäå]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ýÿ]/g, "y")
      .replace(/[ñ]/g, "n")
      .replace(/[ç]/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const cleanBrand = cleanString(brand);
  const cleanName = cleanString(name);
  const cleanModel = cleanString(model);

  let slug = "";

  if (cleanBrand && cleanName && cleanModel) {
    slug = `${cleanBrand}-${cleanName}-${cleanModel}`;
  } else if (cleanBrand && cleanName) {
    slug = `${cleanBrand}-${cleanName}`;
  } else {
    slug = cleanName || cleanBrand || "produit";
  }

  if (slug.length > 50) {
    if (cleanBrand && cleanName) {
      slug = `${cleanBrand}-${cleanName}`;
    }
    if (slug.length > 50) {
      const words = slug.split("-");
      slug = "";
      for (const word of words) {
        if ((slug + "-" + word).length <= 50) {
          slug = slug ? slug + "-" + word : word;
        } else {
          break;
        }
      }
    }
  }

  return slug.slice(0, 50).replace(/-$/, "") || "produit";
};

export const productToCreateData = (
  product: Partial<Product>,
  keepSlug: boolean = false
): ProductCreateData => {
  return {
    name: product.name || "",
    slug:
      keepSlug && product.slug
        ? product.slug
        : generateSlug(
            product.brand || "",
            product.name || "",
            product.model || ""
          ),
    description: product.description || "",
    price: product.price || 0,
    purchase_price: (product as any).purchase_price || undefined,
    category: categoryMap[product.category as keyof typeof categoryMap] || 1,
    brand: product.brand || "",
    size: product.model || "",
    season:
      seasonMap[product.specifications?.season as keyof typeof seasonMap] ||
      "all_season",
    stock: product.stock || 0,
    is_featured: product.is_on_sale || false,
    is_active: true,
  };
};
