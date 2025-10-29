// Authentication API service
import { apiClient, API_ENDPOINTS } from '@/lib/api-client'
import type { User, RegisterData } from '@/types/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials)
      const { access, refresh, user } = response.data

      // Store tokens
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      return {
        success: true,
        data: { access, refresh, user }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      }
    }
  },

  // Register new user
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    try {
      // Map frontend data to Django backend format
      const djangoData = {
        username: `${userData.firstName.trim()}_${userData.lastName.trim()}`.toLowerCase().replace(/\s+/g, '_'),
        email: userData.email.trim(),
        password: userData.password,
        password_confirm: userData.password,
        phone: userData.phone?.trim() || '',
        address: '' // Optional field
      }

      console.log('🔄 Sending registration data to Django:', {
        ...djangoData,
        password: '***',
        password_confirm: '***'
      })

      const response = await apiClient.post(API_ENDPOINTS.REGISTER, djangoData)

      console.log('✅ Django registration response:', response.data)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.user || response.data
        }
      } else {
        return {
          success: false,
          error: response.data.message || 'Registration failed'
        }
      }
    } catch (error: any) {
      console.error('❌ Registration error full details:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error status:', error.response?.status)
      // Better error handling - extract field-specific errors
      let errorMessage = 'Registration failed'

      if (error.response?.data) {
        // If Django returns field-specific errors
        if (typeof error.response.data === 'object') {
          const errors = []
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`)
            } else {
              errors.push(`${field}: ${messages}`)
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('; ')
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  },

  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile'
      }
    }
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'Non authentifié' };
    }

    const response = await apiClient.patch(API_ENDPOINTS.USER_PROFILE, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    // Update localStorage with new user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...response.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return {
      success: true,
      data: response.data
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data?.error || 'Failed to update profile'
    }
  }
},

  // Logout user
  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('access_token')
  }
}

export default authService