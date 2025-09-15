"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      // Verify token and get user info
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      setError(null)
      const response = await api.get("/api/auth/user/")
      setUser(response.data)
    } catch (error) {
      console.error("Error fetching user:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      delete api.defaults.headers.common["Authorization"]
      setError("Session expirée")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await api.post("/api/auth/login/", {
        email,
        password,
      })

      const { access, refresh, user } = response.data

      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`

      setUser(user)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur de connexion"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await api.post("/api/auth/register/", userData, { timeout: 30000 })
      return { success: true, data: response.data }
    } catch (error) {
      const errorMessage = error.response?.data || "Erreur d'inscription"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("cart")
    localStorage.removeItem("favorites")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
    setError(null)
  }

  const verifyEmail = async (userId, code) => {
    try {
      setError(null)
      const response = await api.post("/api/auth/verify-email/", {
        user_id: userId,
        code,
      })
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Code incorrect"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      const response = await api.post("/api/auth/forgot-password/", { email })
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Email non trouvé"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async (email, code, newPassword) => {
    try {
      setError(null)
      const response = await api.post("/api/auth/reset-password/", {
        email,
        code,
        new_password: newPassword,
      })
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erreur lors de la réinitialisation"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    fetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
