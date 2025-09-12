"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/api"
import { useAuth } from "./AuthContext"

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total_items: 0, total_price: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      // Load cart from localStorage for non-authenticated users
      const localCart = localStorage.getItem("cart")
      if (localCart) {
        try {
          setCart(JSON.parse(localCart))
        } catch (e) {
          console.error("Error parsing local cart:", e)
          localStorage.removeItem("cart")
        }
      }
    }
  }, [user])

  const fetchCart = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/api/cart/")
      setCart(response.data)
    } catch (error) {
      console.error("Error fetching cart:", error)
      setError("Erreur lors du chargement du panier")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true)
      setError(null)

      if (user) {
        const response = await api.post("/api/cart/add/", {
          product_id: productId,
          quantity,
        })
        setCart(response.data.cart)
        return { success: true, message: response.data.message }
      } else {
        // Handle local cart for non-authenticated users
        const localCart = JSON.parse(
          localStorage.getItem("cart") || '{"items": [], "total_items": 0, "total_price": 0}',
        )

        // Find existing item
        const existingItemIndex = localCart.items.findIndex((item) => item.product.id === productId)

        if (existingItemIndex >= 0) {
          localCart.items[existingItemIndex].quantity += quantity
        } else {
          // For demo purposes, we'll need to fetch product info
          try {
            const productResponse = await api.get(`/api/products/${productId}/`)
            localCart.items.push({
              id: Date.now(), // temporary ID
              product: productResponse.data,
              quantity: quantity,
              total_price: productResponse.data.price * quantity,
            })
          } catch (error) {
            return { success: false, error: "Produit non trouvé" }
          }
        }

        // Recalculate totals
        localCart.total_items = localCart.items.reduce((sum, item) => sum + item.quantity, 0)
        localCart.total_price = localCart.items.reduce((sum, item) => sum + item.total_price, 0)

        localStorage.setItem("cart", JSON.stringify(localCart))
        setCart(localCart)
        return { success: true, message: "Produit ajouté au panier" }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de l'ajout au panier"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    if (!user) return { success: false, error: "Connexion requise" }

    try {
      setLoading(true)
      setError(null)
      const response = await api.put(`/api/cart/update/${itemId}/`, {
        quantity,
      })
      setCart(response.data.cart)
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de la mise à jour"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId) => {
    if (!user) return { success: false, error: "Connexion requise" }

    try {
      setLoading(true)
      setError(null)
      const response = await api.delete(`/api/cart/remove/${itemId}/`)
      setCart(response.data.cart)
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem("cart")
      setCart({ items: [], total_items: 0, total_price: 0 })
      return { success: true, message: "Panier vidé" }
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.delete("/api/cart/clear/")
      setCart(response.data.cart)
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors du vidage du panier"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
