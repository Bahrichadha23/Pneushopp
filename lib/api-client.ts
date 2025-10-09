// API configuration and base client
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

// API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
// apiClient.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     // Get token from localStorage
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('access_token')
//       if (token && config.headers) {
//         config.headers.Authorization = `Bearer ${token}`
//       }
//     }
//     return config
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error)
//   }
// )


// lib/api-client.ts
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          })

          const newToken = response.data.access
          localStorage.setItem('access_token', newToken)

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  REFRESH_TOKEN: '/auth/token/refresh/',
  USER_PROFILE: '/auth/user/',

  // Products
  PRODUCTS: '/products/',
  PRODUCT_DETAIL: (id: string) => `/products/${id}/`,
  PRODUCT_SEARCH: '/products/search/',

  // Categories
  CATEGORIES: '/categories/',

  // Cart
  CART: '/cart/',
  CART_ITEM: (id: string) => `/cart/items/${id}/`,

  // Orders
  ORDERS: '/orders/',
  ORDER_DETAIL: (id: string) => `/orders/${id}/`,

  // Favorites
  FAVORITES: '/favorites/',
  FAVORITE_TOGGLE: (productId: string) => `/favorites/${productId}/`,
} as const

export default apiClient