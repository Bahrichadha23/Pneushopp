"use client"
// Contexte d'authentification avec intégration API Django
import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { User, AuthContextType, RegisterData } from "@/types/auth"
import { authService, type LoginCredentials } from "@/lib/services/auth"

// Actions pour le reducer d'authentification
type AuthAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_USER"; user: User | null }
  | { type: "UPDATE_USER"; userData: Partial<User> }
  | { type: "LOGOUT" }

interface AuthState {
  user: User | null
  isLoading: boolean
}

// Reducer pour gérer l'état d'authentification
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.loading }
    case "SET_USER":
      return { ...state, user: action.user, isLoading: false }
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.userData } : null,
      }
    case "LOGOUT":
      return { user: null, isLoading: false }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
  })

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: "SET_LOADING", loading: true })

      if (authService.isAuthenticated()) {
        try {
          const response = await authService.getProfile()
          if (response.success && response.data) {
            dispatch({ type: "SET_USER", user: response.data })
          } else {
            // Token invalide, nettoyer
            authService.logout()
            dispatch({ type: "LOGOUT" })
          }
        } catch (error) {
          authService.logout()
          dispatch({ type: "LOGOUT" })
        }
      } else {
        dispatch({ type: "SET_LOADING", loading: false })
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", loading: true })

    try {
      const credentials: LoginCredentials = { email, password }
      const response = await authService.login(credentials)
      
      if (response.success && response.data) {
        dispatch({ type: "SET_USER", user: response.data.user })
        return { success: true, user: response.data.user }
      } else {
        dispatch({ type: "SET_LOADING", loading: false })
        return { success: false, error: response.error || "Erreur de connexion" }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", loading: false })
      return { success: false, error: "Erreur de connexion" }
    }
  }

  const register = async (userData: RegisterData) => {
    dispatch({ type: "SET_LOADING", loading: true })

    try {
      const response = await authService.register(userData)
      
      if (response.success && response.data) {
        // Après inscription, connecter automatiquement l'utilisateur
        const loginResponse = await authService.login({
          email: userData.email,
          password: userData.password
        })
        
        if (loginResponse.success && loginResponse.data) {
          dispatch({ type: "SET_USER", user: loginResponse.data.user })
          return { success: true }
        } else {
          dispatch({ type: "SET_LOADING", loading: false })
          return { success: true, message: "Inscription réussie. Veuillez vous connecter." }
        }
      } else {
        dispatch({ type: "SET_LOADING", loading: false })
        return { success: false, error: response.error || "Erreur lors de l'inscription" }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", loading: false })
      return { success: false, error: "Erreur lors de l'inscription" }
    }
  }

  const logout = () => {
    authService.logout()
    dispatch({ type: "LOGOUT" })
  }

  const updateProfile = async (userData: Partial<User>) => {
    if (!state.user) return { success: false, error: "Non connecté" }

    try {
      const response = await authService.updateProfile(userData)
      
      if (response.success && response.data) {
        dispatch({ type: "UPDATE_USER", userData: response.data })
        return { success: true }
      } else {
        return { success: false, error: response.error || "Erreur lors de la mise à jour" }
      }
    } catch (error) {
      return { success: false, error: "Erreur lors de la mise à jour" }
    }
  }

  // Note: Address management will need separate API endpoints
  const addAddress = async (address: any) => {
    // TODO: Implement with Django API
    return { success: false, error: "Fonction non implémentée" }
  }

  const updateAddress = async (addressId: string, addressData: any) => {
    // TODO: Implement with Django API
    return { success: false, error: "Fonction non implémentée" }
  }

  const deleteAddress = async (addressId: string) => {
    // TODO: Implement with Django API
    return { success: false, error: "Fonction non implémentée" }
  }

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}
