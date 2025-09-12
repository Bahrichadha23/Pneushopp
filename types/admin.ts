// Types de données pour l'interface d'administration et ERP
export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod: "card" | "cash" | "transfer" | "check"
  shippingAddress: Address
  billingAddress: Address
  createdAt: Date
  updatedAt: Date
  deliveryDate?: Date
  trackingNumber?: string
  notes?: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specifications: string
}

export interface Address {
  street: string
  city: string
  postalCode: string
  region: string
  country: string
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: Date
  addresses: Address[]
  totalOrders: number
  totalSpent: number
  lastOrderDate?: Date
  status: "active" | "inactive" | "blocked"
  createdAt: Date
  loyaltyPoints: number
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: Address
  products: string[] // Product IDs
  paymentTerms: string
  status: "active" | "inactive"
  rating: number
  createdAt: Date
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  reference?: string // Order ID, Purchase Order ID, etc.
  createdAt: Date
  createdBy: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  items: PurchaseOrderItem[]
  totalAmount: number
  status: "draft" | "sent" | "confirmed" | "received" | "cancelled"
  createdAt: Date
  expectedDelivery?: Date
  actualDelivery?: Date
  notes?: string
}

export interface PurchaseOrderItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  lowStockProducts: number
  revenueGrowth: number
  orderGrowth: number
  topSellingProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  recentOrders: Order[]
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}
