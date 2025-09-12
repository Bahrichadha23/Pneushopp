"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { useFavorites } from "../contexts/FavoritesContext"
import AuthModal from "./AuthModal"
import CartModal from "./CartModal"
import FavoritesModal from "./FavoritesModal"

const Header = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const { user } = useAuth()
  const { cart } = useCart()
  const { favorites } = useFavorites()

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <div className="logo-icon">🛞</div>
              PNEU SHOP
              <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "10px" }}>
                Vos pneumatiques en un seul clic
              </span>
            </Link>

            <nav>
              <ul className="nav-menu">
                <li>
                  <Link to="/">ACCUEIL</Link>
                </li>
                <li>
                  <Link to="/boutique">BOUTIQUE</Link>
                </li>
                <li>
                  <Link to="/contact">CONTACTEZ-NOUS</Link>
                </li>
                <li>
                  <Link to="/a-propos">À PROPOS</Link>
                </li>
              </ul>
            </nav>

            <div className="header-icons">
              <button className="icon-btn" title="Rechercher">
                🔍
              </button>

              <button className="icon-btn" onClick={() => setShowFavoritesModal(true)} title="Favoris">
                ❤️
                {favorites.length > 0 && <span className="cart-badge">{favorites.length}</span>}
              </button>

              <button
                className="icon-btn"
                onClick={() => setShowAuthModal(true)}
                title={user ? "Profil" : "Se connecter"}
              >
                👤
              </button>

              <button className="icon-btn" onClick={() => setShowCartModal(true)} title="Panier">
                🛍️
                {cart.total_items > 0 && <span className="cart-badge">{cart.total_items}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showCartModal && <CartModal onClose={() => setShowCartModal(false)} />}
      {showFavoritesModal && <FavoritesModal onClose={() => setShowFavoritesModal(false)} />}
    </>
  )
}

export default Header
