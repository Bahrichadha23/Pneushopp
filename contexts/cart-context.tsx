"use client"
// Contexte global pour la gestion du panier d'achat
import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Product, CartItem, CartContextType } from "@/types/product"

// Actions pour le reducer du panier
type CartAction =
  | { type: "ADD_TO_CART"; product: Product; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[] }

// Reducer pour gérer les actions du panier
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.find((item) => item.product.id === action.product.id)
      if (existingItem) {
        return state.map((item) =>
          item.product.id === action.product.id ? { ...item, quantity: item.quantity + action.quantity } : item,
        )
      }
      return [...state, { product: action.product, quantity: action.quantity }]
    }
    case "REMOVE_FROM_CART":
      return state.filter((item) => item.product.id !== action.productId)
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return state.filter((item) => item.product.id !== action.productId)
      }
      return state.map((item) => (item.product.id === action.productId ? { ...item, quantity: action.quantity } : item))
    case "CLEAR_CART":
      return []
    case "LOAD_CART":
      return action.items
    default:
      return state
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem("pneushop-cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", items: parsedCart })
      } catch (error) {
        console.error("Erreur lors du chargement du panier:", error)
      }
    }
  }, [])

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem("pneushop-cart", JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity = 1) => {
    dispatch({ type: "ADD_TO_CART", product, quantity })
  }

  const removeFromCart = (productId: string) => {
    dispatch({ type: "REMOVE_FROM_CART", productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart doit être utilisé dans un CartProvider")
  }
  return context
}
