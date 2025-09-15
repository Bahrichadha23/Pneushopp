// Products API service
import { apiClient, API_ENDPOINTS } from '@/lib/api-client'
import type { Product, FilterOptions } from '@/types/product'

export interface ProductsResponse {
  results: Product[]
  count: number
  next: string | null
  previous: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const productService = {
  // Get all products with pagination and filters
  async getProducts(
    page: number = 1,
    filters?: FilterOptions
  ): Promise<ApiResponse<ProductsResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','))
            } else {
              params.append(key, value.toString())
            }
          }
        })
      }
      
      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}?${params}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch products'
      }
    }
  },

  // Get single product by ID
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCT_DETAIL(id))
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch product'
      }
    }
  },

  // Search products
  async searchProducts(
    query: string,
    filters?: FilterOptions
  ): Promise<ApiResponse<ProductsResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','))
            } else {
              params.append(key, value.toString())
            }
          }
        })
      }
      
      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_SEARCH}?${params}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Search failed'
      }
    }
  },

  // Get product categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch categories'
      }
    }
  },

  // Create product (admin only)
  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PRODUCTS, productData)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create product'
      }
    }
  },

  // Update product (admin only)
  async updateProduct(id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.PRODUCT_DETAIL(id), productData)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update product'
      }
    }
  },

  // Delete product (admin only)
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(API_ENDPOINTS.PRODUCT_DETAIL(id))
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete product'
      }
    }
  }
}

export default productService