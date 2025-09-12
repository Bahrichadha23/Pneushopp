"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ProductCard from "../components/ProductCard"

const Boutique = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    season: "",
    search: "",
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filters])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.category) params.append("category", filters.category)
      if (filters.brand) params.append("brand", filters.brand)
      if (filters.season) params.append("season", filters.season)
      if (filters.search) params.append("search", filters.search)

      const response = await axios.get(`/api/products/?${params}`)
      setProducts(response.data.results || response.data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/products/categories/")
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", margin: "2rem 0", color: "#333" }}>Notre Boutique</h1>

      {/* Filters */}
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "10px",
          marginBottom: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Rechercher</label>
          <input
            type="text"
            placeholder="Rechercher un pneu..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Catégorie</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Saison</label>
          <select
            value={filters.season}
            onChange={(e) => handleFilterChange("season", e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <option value="">Toutes saisons</option>
            <option value="summer">Été</option>
            <option value="winter">Hiver</option>
            <option value="all_season">Toutes saisons</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Marque</label>
          <input
            type="text"
            placeholder="Marque..."
            value={filters.brand}
            onChange={(e) => handleFilterChange("brand", e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Chargement des produits...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Aucun produit trouvé</h3>
          <p>Essayez de modifier vos filtres de recherche.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "1rem", color: "#666" }}>
            {products.length} produit{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""}
          </div>
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Boutique
