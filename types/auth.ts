// Types de données pour l'authentification et gestion des utilisateurs
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: Date
  role: "customer" | "admin"
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  addresses: UserAddress[]
  preferences: UserPreferences
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
}

export interface UserAddress {
  id: string
  type: "shipping" | "billing"
  isDefault: boolean
  firstName: string
  lastName: string
  company?: string
  street: string
  city: string
  postalCode: string
  region: string
  country: string
  phone?: string
}

export interface UserPreferences {
  newsletter: boolean
  smsNotifications: boolean
  emailNotifications: boolean
  language: "fr" | "ar"
  currency: "TND"
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string; message?: string; userId?: string }>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>
  addAddress: (address: Omit<UserAddress, "id">) => Promise<{ success: boolean; error?: string }>
  updateAddress: (addressId: string, address: Partial<UserAddress>) => Promise<{ success: boolean; error?: string }>
  deleteAddress: (addressId: string) => Promise<{ success: boolean; error?: string }>
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  acceptTerms: boolean
  newsletter?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}
