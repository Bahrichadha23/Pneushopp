"use client"

import { useCart } from "../contexts/CartContext"
import { Link } from "react-router-dom"

const CartModal = ({ onClose }) => {
  const { cart, loading, updateCartItem, removeFromCart } = useCart()

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId)
    } else {
      await updateCartItem(itemId, newQuantity)
    }
  }

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Mon Panier</h2>

        {loading ? (
          <div className="text-center">Chargement...</div>
        ) : cart.items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛍️</div>
            <div
              style={{
                background: "#ffd700",
                color: "#333",
                padding: "1rem",
                borderRadius: "5px",
                marginBottom: "2rem",
              }}
            >
              ⚠️ Votre panier est actuellement vide.
            </div>
            <Link to="/boutique" className="btn" onClick={onClose}>
              Retour à la boutique
            </Link>
          </div>
        ) : (
          <>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <img
                    src={item.product.image || "/placeholder.svg?height=60&width=60"}
                    alt={item.product.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "5px",
                      marginRight: "1rem",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4>{item.product.name}</h4>
                    <p style={{ color: "#666" }}>{item.product.brand}</p>
                    <p style={{ fontWeight: "bold" }}>{item.product.price}€</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      style={{
                        background: "#f0f0f0",
                        border: "none",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      style={{
                        background: "#f0f0f0",
                        border: "none",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: "#ff4444",
                        color: "white",
                        border: "none",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        marginLeft: "0.5rem",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "2px solid #333",
                padding: "1rem 0",
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <strong>Total: {cart.total_price}€</strong>
                <span>({cart.total_items} articles)</span>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Procéder au paiement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CartModal
