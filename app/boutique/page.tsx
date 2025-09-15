"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Filter } from "lucide-react"
import type { Product } from "@/types/product"

interface ApiProduct {
  id: number
  name: string
  slug: string
  description: string
  price: string
  old_price?: string
  brand: string
  size: string
  season: string
  season_display: string
  stock: number
  is_featured: boolean
  is_on_sale: boolean
  discount_percentage: number
  image?: string
  category: {
    id: number
    name: string
    slug: string
  }
}

// Convert API product to frontend Product type
const convertApiProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.id.toString(),
  name: apiProduct.name,
  brand: apiProduct.brand,
  model: apiProduct.size,
  price: parseFloat(apiProduct.price),
  originalPrice: apiProduct.old_price ? parseFloat(apiProduct.old_price) : undefined,
  discount: apiProduct.discount_percentage,
  image: apiProduct.image || '/placeholder.jpg',
  images: [apiProduct.image || '/placeholder.jpg'],
  category: 'auto',
  specifications: {
    width: 225,
    height: 45,
    diameter: 17,
    loadIndex: 91,
    speedRating: 'W',
    season: apiProduct.season === 'summer' ? 'ete' : apiProduct.season === 'winter' ? 'hiver' : 'toutes-saisons',
    specialty: 'tourisme'
  },
  stock: apiProduct.stock,
  description: apiProduct.description,
  features: [],
  inStock: apiProduct.stock > 0,
  isPromotion: apiProduct.is_featured,
  rating: 4.5,
  reviewCount: 0
})

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [brandFilter, setBrandFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        console.log('🚀 Starting to fetch products from API...')
        
        // Direct API call since the service wrapper seems to have type issues
        const response = await fetch('http://localhost:8000/api/products/')
        console.log('📡 API Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📦 Raw API data:', data)
        console.log('📊 Number of products received:', data.results?.length || 0)
        
        const apiProducts = data.results || []
        const convertedProducts = apiProducts.map(convertApiProduct)
        console.log('✅ Converted products:', convertedProducts.length)
        
        setProducts(convertedProducts)
        setError(null)
        console.log('🎉 Products successfully loaded!')
      } catch (err) {
        console.error('❌ Error fetching products:', err)
        setError(`Erreur lors du chargement des produits: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBrand = !brandFilter || brandFilter === "all" || 
      product.brand.toLowerCase() === brandFilter.toLowerCase()
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || 
      product.category === categoryFilter
    
    return matchesSearch && matchesBrand && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'brand':
        return a.brand.localeCompare(b.brand)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des produits...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Notre Boutique</h1>
          <p className="text-gray-600">Découvrez notre large gamme de pneumatiques</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtrer les produits</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="camionnette">Camionnette</SelectItem>
                <SelectItem value="utilitaire">Utilitaire</SelectItem>
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes marques</SelectItem>
                <SelectItem value="continental">Continental</SelectItem>
                <SelectItem value="pirelli">Pirelli</SelectItem>
                <SelectItem value="kleber">Kleber</SelectItem>
                <SelectItem value="tigar">Tigar</SelectItem>
                <SelectItem value="michelin">Michelin</SelectItem>
                <SelectItem value="bridgestone">Bridgestone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
                <SelectItem value="price-low">Prix (croissant)</SelectItem>
                <SelectItem value="price-high">Prix (décroissant)</SelectItem>
                <SelectItem value="brand">Marque</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setBrandFilter("all")
                setCategoryFilter("all")
                setPriceFilter("")
                setSortBy("name")
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun produit trouvé avec ces critères</p>
            <Button 
              onClick={() => {
                setSearchTerm("")
                setBrandFilter("all")
                setCategoryFilter("all")
                setPriceFilter("")
                setSortBy("name")
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
