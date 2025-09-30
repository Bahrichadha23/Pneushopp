// Base de données simulée des produits de pneus
import type { Product } from "@/types/product"



// Fonction pour filtrer les produits
export function filterProducts(products: Product[], filters: any) {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false
    if (filters.brand && product.brand !== filters.brand) return false
    if (filters.width && product.specifications.width !== filters.width) return false
    if (filters.height && product.specifications.height !== filters.height) return false
    if (filters.diameter && product.specifications.diameter !== filters.diameter) return false
    if (filters.season && product.specifications.season !== filters.season) return false
    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      if (product.price < min || product.price > max) return false
    }
    if (filters.inStock && !product.inStock) return false
    return true
  })
}

// Fonction pour rechercher des produits
export function searchProducts(products: Product[], query: string) {
  const lowercaseQuery = query.toLowerCase()
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.brand.toLowerCase().includes(lowercaseQuery) ||
      product.model.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery),
  )
}
