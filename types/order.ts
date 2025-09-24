// Types pour la gestion des commandes et paiements
export interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
}

export interface PaymentMethod {
  type: "card" | "paypal" | "bank_transfer" | "cash_on_delivery"
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  holderName?: string
}

export interface Order {
  id: string
  userId?: string
  items: CartItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: Date
  updatedAt: Date
  trackingNumber?: string
  notes?: string
  client: string
  email?: string
  date?: string
  urgence?: "normale" | "haute"
  
}

export interface OrderContextType {
  currentOrder: Order | null
  createOrder: (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<string>
  getOrder: (orderId: string) => Order | null
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
  getAllOrders: () => Order[]
}

import type { CartItem } from "./product"
