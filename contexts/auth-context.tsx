"use client";
// Contexte d'authentification avec gestion des sessions utilisateur
import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";
import type {
  User,
  AuthContextType,
  RegisterData,
  UserAddress,
} from "@/types/auth";
import {
  loginUser,
  registerUser,
  getUserProfile,
  refreshToken,
} from "@/lib/api";

// Actions pour le reducer d'authentification
type AuthAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_USER"; user: User | null }
  | { type: "UPDATE_USER"; userData: Partial<User> }
  | { type: "LOGOUT" };

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// Reducer pour gérer l'état d'authentification
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_USER":
      return { ...state, user: action.user, isLoading: false };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.userData } : null,
      };
    case "LOGOUT":
      return { user: null, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Django user to frontend User type
function mapDjangoUserToUser(djangoUser: any): User {
  return {
    id: djangoUser.id.toString(),
    email: djangoUser.email,
    firstName: djangoUser.first_name,
    lastName: djangoUser.last_name,
    phone: djangoUser.phone,
    role: djangoUser.is_staff ? "admin" : "customer",
    isEmailVerified: djangoUser.is_verified,
    createdAt: new Date(djangoUser.date_joined || Date.now()),
    updatedAt: new Date(djangoUser.last_login || Date.now()),
    addresses: [],
    preferences: {
      newsletter: false,
      smsNotifications: false,
      emailNotifications: true,
      language: "fr",
      currency: "TND",
    },
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
  });

  // Vérifier la session au démarrage
  useEffect(() => {
    const checkSession = async () => {
      try {
        const accessToken = localStorage.getItem("pneushop-access-token");
        const refreshTokenValue = localStorage.getItem(
          "pneushop-refresh-token"
        );

        if (accessToken) {
          try {
            // Try to get user profile with current token
            const userProfile = await getUserProfile(accessToken);
            const user = mapDjangoUserToUser(userProfile);
            dispatch({ type: "SET_USER", user });
          } catch (error) {
            // Token might be expired, try to refresh
            if (refreshTokenValue) {
              try {
                const tokenResponse = await refreshToken(refreshTokenValue);
                localStorage.setItem(
                  "pneushop-access-token",
                  tokenResponse.access
                );

                // Get user profile with new token
                const userProfile = await getUserProfile(tokenResponse.access);
                const user = mapDjangoUserToUser(userProfile);
                dispatch({ type: "SET_USER", user });
              } catch (refreshError) {
                // Refresh failed, clear tokens
                localStorage.removeItem("pneushop-access-token");
                localStorage.removeItem("pneushop-refresh-token");
                dispatch({ type: "SET_LOADING", loading: false });
              }
            } else {
              localStorage.removeItem("pneushop-access-token");
              dispatch({ type: "SET_LOADING", loading: false });
            }
          }
        } else {
          dispatch({ type: "SET_LOADING", loading: false });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
        dispatch({ type: "SET_LOADING", loading: false });
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", loading: true });

    try {
      // Call real Django API
      const response = await loginUser(email, password);

      // Store JWT tokens
      localStorage.setItem("pneushop-access-token", response.access);
      localStorage.setItem("pneushop-refresh-token", response.refresh);

      // Convert Django user to frontend User type
      const user = mapDjangoUserToUser(response.user);
      console.log("Logged in user:", user);
      dispatch({ type: "SET_USER", user });
      return { success: true, user };
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", loading: false });
      return { success: false, error: error.message || "Erreur de connexion" };
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: "SET_LOADING", loading: true });

    try {
      // Call real Django API
      const response = await registerUser({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      });

      // Store user_id for email verification
      localStorage.setItem("pneushop-pending-user-id", response.user_id);

      dispatch({ type: "SET_LOADING", loading: false });
      return {
        success: true,
        message: response.message,
        userId: response.user_id,
      };
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", loading: false });
      return {
        success: false,
        error: error.message || "Erreur lors de l'inscription",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("pneushop-access-token");
    localStorage.removeItem("pneushop-refresh-token");
    localStorage.removeItem("pneushop-pending-user-id");
    dispatch({ type: "LOGOUT" });
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!state.user) return { success: false, error: "Non connecté" };

    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 800));

      const updatedUser = { ...state.user, ...userData, updatedAt: new Date() };

      // Note: In real implementation, you'd call an API to update user profile
      // For now, we'll just update local state

      dispatch({ type: "UPDATE_USER", userData: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Erreur lors de la mise à jour" };
    }
  };

  const addAddress = async (address: Omit<UserAddress, "id">) => {
    if (!state.user) return { success: false, error: "Non connecté" };

    try {
      const newAddress: UserAddress = {
        ...address,
        id: Date.now().toString(),
      };

      const updatedAddresses = [...state.user.addresses, newAddress];
      await updateProfile({ addresses: updatedAddresses });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erreur lors de l'ajout de l'adresse" };
    }
  };

  const updateAddress = async (
    addressId: string,
    addressData: Partial<UserAddress>
  ) => {
    if (!state.user) return { success: false, error: "Non connecté" };

    try {
      const updatedAddresses = state.user.addresses.map((addr) =>
        addr.id === addressId ? { ...addr, ...addressData } : addr
      );

      await updateProfile({ addresses: updatedAddresses });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour de l'adresse",
      };
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!state.user) return { success: false, error: "Non connecté" };

    try {
      const updatedAddresses = state.user.addresses.filter(
        (addr) => addr.id !== addressId
      );
      await updateProfile({ addresses: updatedAddresses });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression de l'adresse",
      };
    }
  };

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}

// Add email verification function
export async function verifyUserEmail(userId: string, code: string) {
  try {
    const { verifyEmail } = await import("@/lib/api");
    const response = await verifyEmail(userId, code);
    return { success: true, message: response.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
