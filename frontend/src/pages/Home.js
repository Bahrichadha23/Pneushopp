"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ProductCard from "../components/ProductCard"

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get("/api/products/featured/")
      setFeaturedProducts(response.data)
    } catch (error) {
      console.error("Error fetching featured products:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section
        style={{ padding: "4rem 0", textAlign: "center", background: "white", borderRadius: "10px", margin: "2rem 0" }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#333" }}>PNEU SHOP</h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>Vos pneumatiques en un seul clic</p>
        <p style={{ fontSize: "1rem", color: "#999", maxWidth: "600px", margin: "0 auto" }}>
          Trouvez les pneus parfaits pour votre véhicule. Qualité garantie, prix compétitifs et livraison rapide partout
          en Tunisie.
        </p>
      </section>

      {/* Featured Products */}
      <section style={{ padding: "2rem 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", color: "#333" }}>Pneus Populaires</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>Chargement des produits...</div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Aucun produit en vedette pour le moment.</p>
          </div>
        ) : (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section style={{ padding: "4rem 0", background: "white", borderRadius: "10px", margin: "2rem 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚚</div>
            <h3>Livraison Rapide</h3>
            <p>Livraison en 2-5 jours ouvrables partout en Tunisie</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h3>Qualité Garantie</h3>
            <p>Pneus de marques reconnues avec garantie constructeur</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💰</div>
            <h3>Prix Compétitifs</h3>
            <p>Les meilleurs prix du marché tunisien</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔧</div>
            <h3>Installation</h3>
            <p>Service d'installation disponible</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
