import { apiClient } from '@/lib/api-client'

export interface AdminStats {
  total_products: number
  active_products: number
  total_categories: number
  total_customers: number
  low_stock_products: number
  featured_products: number
  recent_products: number
  products_by_category: Array<{
    name: string
    product_count: number
  }>
  top_stock_products: Array<{
    id: number
    name: string
    brand: string
    stock: number
    price: string
  }>
  low_stock_details: Array<{
    id: number
    name: string
    brand: string
    stock: number
    price: string
  }>
  price_stats: {
    avg_price: number
    min_price: number
    max_price: number
  }
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  description: string
  price: string
  old_price?: string
  category: number
  category_name: string
  image?: string
  brand: string
  size: string
  season: 'summer' | 'winter' | 'all_season'
  season_display: string
  stock: number
  is_featured: boolean
  is_active: boolean
  is_on_sale: boolean
  discount_percentage: number
  created_at: string
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
  description: string
  product_count: number
  created_at: string
}

export interface ProductCreateData {
  name: string
  slug: string
  description: string
  price: number
  old_price?: number
  category: number
  brand: string
  size: string
  season: 'summer' | 'winter' | 'all_season'
  stock: number
  is_featured: boolean
  is_active: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const adminService = {
  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<AdminStats>> {
    try {
      const response = await apiClient.get('/admin/stats/')
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des statistiques'
      }
    }
  },

  // Products CRUD
  async getProducts(params?: Record<string, any>): Promise<ApiResponse<{results: AdminProduct[], count: number}>> {
    try {
      const response = await apiClient.get('/admin/products/', { params })
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

  async getProduct(id: number): Promise<ApiResponse<AdminProduct>> {
    try {
      const response = await apiClient.get(`/admin/products/${id}/`)
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

  async createProduct(data: ProductCreateData): Promise<ApiResponse<AdminProduct>> {
    try {
      const response = await apiClient.post('/admin/products/', data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create product'
      
      if (error.response?.data) {
        // Handle field-specific errors
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
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  },

  async updateProduct(id: number, data: Partial<ProductCreateData>): Promise<ApiResponse<AdminProduct>> {
    try {
      const response = await apiClient.patch(`/admin/products/${id}/`, data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      let errorMessage = 'Failed to update product'
      
      if (error.response?.data) {
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
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  },

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/admin/products/${id}/`)
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete product'
      }
    }
  },

  async bulkUpdateProducts(productIds: number[], updates: Record<string, any>): Promise<ApiResponse<{message: string, updated_count: number}>> {
    try {
      const response = await apiClient.post('/admin/products/bulk-update/', {
        product_ids: productIds,
        updates
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to bulk update products'
      }
    }
  },

  // Categories CRUD
  async getCategories(): Promise<ApiResponse<AdminCategory[]>> {
    try {
      const response = await apiClient.get('/admin/categories/')
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

  async createCategory(data: {name: string, slug: string, description: string}): Promise<ApiResponse<AdminCategory>> {
    try {
      const response = await apiClient.post('/admin/categories/', data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create category'
      }
    }
  },

  async updateCategory(id: number, data: Partial<{name: string, slug: string, description: string}>): Promise<ApiResponse<AdminCategory>> {
    try {
      const response = await apiClient.patch(`/admin/categories/${id}/`, data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update category'
      }
    }
  },

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/admin/categories/${id}/`)
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete category'
      }
    }
  }
}