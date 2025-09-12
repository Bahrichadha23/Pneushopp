"use client"

import { useFavorites } from "../contexts/FavoritesContext"
import { useCart } from "../contexts/CartContext"
import { Link } from "react-router-dom"

const FavoritesModal = ({ onClose }) => {
  const { favorites, loading, removeFromFavorites } = useFavorites()
  const { addToCart } = useCart()

  const handleRemoveFromFavorites = async (productId) => {
    await removeFromFavorites(productId)
  }

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId)
    if (result.success) {
      // Optionally show success message
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Mes Favoris</h2>

        {loading ? (
          <div className="text-center">Chargement...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❤️</div>
            <div
              style={{
                background: "#ffd700",
                color: "#333",
                padding: "1rem",
                borderRadius: "5px",
                marginBottom: "2rem",
              }}
            >
              ⚠️ Vos favoris sont vides.
            </div>
            <Link to="/boutique" className="btn" onClick={onClose}>
              Retour à la boutique
            </Link>
          </div>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "1rem",
                  borderBottom: "1px solid #eee",
                }}
              >
                <img
                  src={favorite.product.image || "/placeholder.svg?height=60&width=60"}
                  alt={favorite.product.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "5px",
                    marginRight: "1rem",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h4>{favorite.product.name}</h4>
                  <p style={{ color: "#666" }}>{favorite.product.brand}</p>
                  <p style={{ fontWeight: "bold" }}>{favorite.product.price}€</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleAddToCart(favorite.product.id)}
                    className="btn-add-cart"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                  >
                    Ajouter au panier
                  </button>
                  <button
                    onClick={() => handleRemoveFromFavorites(favorite.product.id)}
                    style={{
                      background: "#ff4444",
                      color: "white",
                      border: "none",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesModal
