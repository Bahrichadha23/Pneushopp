"use client"

import { useCart } from "../contexts/CartContext"
import { useFavorites } from "../contexts/FavoritesContext"

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()

  const handleAddToCart = async () => {
    const result = await addToCart(product.id)
    if (result.success) {
      // Optionally show success message
    }
  }

  const handleToggleFavorite = async () => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id)
    } else {
      await addToFavorites(product.id)
    }
  }

  return (
    <div className="product-card">
      <img
        src={product.image || "/placeholder.svg?height=200&width=280"}
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3 className="product-title">
          {product.brand} {product.name}
        </h3>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          {product.size} -{" "}
          {product.season === "summer" ? "Été" : product.season === "winter" ? "Hiver" : "Toutes saisons"}
        </p>

        <div className="product-price">
          <span className="current-price">{product.price}€</span>
          {product.old_price && (
            <>
              <span className="old-price">{product.old_price}€</span>
              <span className="discount">-{product.discount_percentage}%</span>
            </>
          )}
        </div>

        <div className="product-actions">
          <button onClick={handleAddToCart} className="btn-add-cart">
            Ajouter au panier
          </button>
          <button onClick={handleToggleFavorite} className={`btn-favorite ${isFavorite(product.id) ? "active" : ""}`}>
            ❤️
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
