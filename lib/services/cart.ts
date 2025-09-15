// Cart API service
import { apiClient, API_ENDPOINTS } from '@/lib/api-client'
import type { Product, CartItem } from '@/types/product'

export interface CartResponse {
  id: string
  items: CartItem[]
  total_price: number
  total_items: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const cartService = {
  // Get user's cart
  async getCart(): Promise<ApiResponse<CartResponse>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CART)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch cart'
      }
    }
  },

  // Add item to cart
  async addToCart(productId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CART, {
        product_id: productId,
        quantity
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to add to cart'
      }
    }
  },

  // Update cart item quantity
  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.CART_ITEM(itemId), {
        quantity
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update cart item'
      }
    }
  },

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART_ITEM(itemId))
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to remove from cart'
      }
    }
  },

  // Clear entire cart
  async clearCart(): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART)
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to clear cart'
      }
    }
  }
}

export default cartService