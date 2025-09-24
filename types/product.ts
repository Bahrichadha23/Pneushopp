// // Types de données pour les produits et le système e-commerce
// export interface Product {
//   id: string
//   name: string
//   brand: string
//   model: string
//   price: number
//   originalPrice?: number
//   discount?: number
//   image: string
//   images: File[],
//   category: "auto" | "suv" | "camionnette" | "agricole" | "poids-lourd" | "utilitaire" | "4x4"
//   specifications: {
//     width: number // Largeur (ex: 225)
//     height: number // Hauteur (ex: 45)
//     diameter: number // Diamètre (ex: 17)
//     loadIndex: number // Indice de charge (ex: 91)
//     speedRating: string // Indice de vitesse (ex: 'W')
//     season: "ete" | "hiver" | "toutes-saisons"
//     specialty?: "tourisme" | "sport" | "eco"
//   }
//   stock: number
//   description: string
//   features: string[]
//   inStock: boolean
//   isPromotion?: boolean
//   rating?: number
//   reviewCount?: number
// }

// export interface CartItem {
//   product: Product
//   quantity: number
// }

// export interface CartContextType {
//   items: CartItem[]
//   addToCart: (product: Product, quantity?: number) => void
//   removeFromCart: (productId: string) => void
//   updateQuantity: (productId: string, quantity: number) => void
//   clearCart: () => void
//   getTotalItems: () => number
//   getTotalPrice: () => number
// }

// export interface FilterOptions {
//   category?: string
//   brand?: string
//   priceRange?: [number, number]
//   width?: number
//   height?: number
//   diameter?: number
//   season?: string
//   inStock?: boolean
// }


// Types de données pour les produits et le système e-commerce
export interface Product {
  id: string
  name: string
  brand: string
  model: string
  price: number

  // Champs liés à la promotion (venant du backend Django)
  old_price?: number
  is_on_sale?: boolean
  discount_percentage?: number

  image: string
  images: File[]
  category: "auto" | "suv" | "camionnette" | "agricole" | "poids-lourd" | "utilitaire" | "4x4"

  specifications: {
    width: number // Largeur (ex: 225)
    height: number // Hauteur (ex: 45)
    diameter: number // Diamètre (ex: 17)
    loadIndex: number // Indice de charge (ex: 91)
    speedRating: string // Indice de vitesse (ex: 'W')
    season: "ete" | "hiver" | "toutes-saisons"
    specialty?: "tourisme" | "sport" | "eco"
  }

  stock: number
  description: string
  features: string[]
  inStock: boolean

  rating?: number
  reviewCount?: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export interface FilterOptions {
  category?: string
  brand?: string
  priceRange?: [number, number]
  width?: number
  height?: number
  diameter?: number
  season?: string
  inStock?: boolean
  
}
