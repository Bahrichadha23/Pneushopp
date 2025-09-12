"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/api"
import { useAuth } from "./AuthContext"

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      // Load favorites from localStorage for non-authenticated users
      const localFavorites = localStorage.getItem("favorites")
      if (localFavorites) {
        try {
          setFavorites(JSON.parse(localFavorites))
        } catch (e) {
          console.error("Error parsing local favorites:", e)
          localStorage.removeItem("favorites")
        }
      }
    }
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/api/favorites/")
      setFavorites(response.data)
    } catch (error) {
      console.error("Error fetching favorites:", error)
      setError("Erreur lors du chargement des favoris")
    } finally {
      setLoading(false)
    }
  }

  const addToFavorites = async (productId) => {
    try {
      setLoading(true)
      setError(null)

      if (user) {
        const response = await api.post("/api/favorites/add/", {
          product_id: productId,
        })
        await fetchFavorites() // Refresh favorites list
        return { success: true, message: response.data.message }
      } else {
        // Handle local favorites for non-authenticated users
        const localFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")

        if (!localFavorites.find((fav) => fav.product.id === productId)) {
          try {
            const productResponse = await api.get(`/api/products/${productId}/`)
            localFavorites.push({
              id: Date.now(), // temporary ID
              product: productResponse.data,
              created_at: new Date().toISOString(),
            })
            localStorage.setItem("favorites", JSON.stringify(localFavorites))
            setFavorites(localFavorites)
          } catch (error) {
            return { success: false, error: "Produit non trouvé" }
          }
        }
        return { success: true, message: "Produit ajouté aux favoris" }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de l'ajout aux favoris"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const removeFromFavorites = async (productId) => {
    try {
      setLoading(true)
      setError(null)

      if (user) {
        const response = await api.delete(`/api/favorites/remove/${productId}/`)
        await fetchFavorites() // Refresh favorites list
        return { success: true, message: response.data.message }
      } else {
        // Handle local favorites for non-authenticated users
        const localFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")
        const updatedFavorites = localFavorites.filter((fav) => fav.product.id !== productId)
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
        setFavorites(updatedFavorites)
        return { success: true, message: "Produit supprimé des favoris" }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (productId) => {
    if (isFavorite(productId)) {
      return await removeFromFavorites(productId)
    } else {
      return await addToFavorites(productId)
    }
  }

  const isFavorite = (productId) => {
    return favorites.some((fav) => fav.product.id === productId)
  }

  const clearFavorites = async () => {
    if (!user) {
      localStorage.removeItem("favorites")
      setFavorites([])
      return { success: true, message: "Favoris vidés" }
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.delete("/api/favorites/clear/")
      setFavorites([])
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors du vidage des favoris"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    fetchFavorites,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
