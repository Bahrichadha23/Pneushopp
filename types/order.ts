// // Types pour la gestion des commandes et paiements
// export interface ShippingAddress {
//   firstName: string
//   lastName: string
//   company?: string
//   address: string
//   city: string
//   postalCode: string
//   country: string
//   phone: string
// }

// export interface PaymentMethod {
//   type: "card" | "paypal" | "bank_transfer" | "cash_on_delivery"
//   cardNumber?: string
//   expiryDate?: string
//   cvv?: string
//   holderName?: string
// }

// export interface Order {

//   id: string
//   numericId: number
//   userId?: string
//   items: CartItem[]
//   shippingAddress: ShippingAddress
//   paymentMethod: PaymentMethod
//   subtotal: number
//   shippingCost: number
//   tax: number
//   total: number
//   status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
//   createdAt: Date
//   updatedAt: Date
//   trackingNumber?: string
//   notes?: string
//   client: string
//   email?: string
//   date?: string
//   urgence?: "normale" | "haute"


// }
// // lib/services/order.ts


// interface CreateOrderData {
//   items: Array<{
//     product_id: string | number;
//     product_name: string;
//     quantity: number;
//     unit_price: number;
//     total_price: number;
//     specifications?: any;
//   }>;
//   shipping_address: {
//     first_name: string;
//     last_name: string;
//     address: string;
//     city: string;
//     postal_code: string;
//     country: string;
//     phone: string;
//     company?: string;
//   };
//   payment_method: string;
//   notes?: string;
// }

// export const createOrder = async (orderData: CreateOrderData) => {
//   const token = localStorage.getItem("access_token");
//   if (!token) throw new Error("No auth token found");

//   const response = await fetch(`${API_URL}/api/orders/`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(orderData),
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.detail || "Failed to create order");
//   }

//   return response.json();
// };
// export interface OrderContextType {
//   currentOrder: Order | null
//   createOrder: (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<string>
//   getOrder: (orderId: string) => Order | null
//   updateOrderStatus: (orderId: string, status: Order["status"]) => void
//   getAllOrders: () => Order[]
// }

// import { API_URL } from "@/lib/config"
// import type { CartItem } from "./product"




import type { Order as AdminOrder } from "@/types/admin";
import { API_URL } from "@/lib/config";
// Interface for order items
export interface OrderItem {
  product_id: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
}

// Interface for shipping address
export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  company?: string;
}

// Interface for creating an order
export interface CreateOrderData {
  items: OrderItem[];
  shipping_address: Omit<ShippingAddress, 'company'>;
  payment_method: string;
  notes?: string;
}

// Create a new order
export const createOrder = async (orderData: CreateOrderData) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token found");

  try {
    const response = await fetch(`${API_URL}/api/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...orderData,
        // Ensure items is always an array
        items: orderData.items || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData); // Log the full error response
      throw new Error(errorData.detail || errorData.message || "Failed to create order");
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

// Fetch all orders (existing function)
export const fetchOrders = async (): Promise<AdminOrder[]> => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token found");

  const res = await fetch(`${API_URL}/orders/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`);
  }

  const data = await res.json();

  return data.results.map((o: any) => ({
    id: o.id.toString(),
    orderNumber: o.order_number,
    customerId: o.user?.id?.toString() || "",
    customerName: `${o.shipping_address.first_name} ${o.shipping_address.last_name}`,
    customerEmail: o.user?.email || "",
    customerPhone: o.shipping_address.phone,

    items: o.items.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price),
      specifications: item.specifications || "",
    })),

    totalAmount: parseFloat(o.total_amount),
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,

    shippingAddress: {
      street: o.shipping_address.address,
      city: o.shipping_address.city,
      postalCode: o.shipping_address.postal_code,
      region: "",
      country: o.shipping_address.country,
    },
    billingAddress: {
      street: o.billing_address?.address || "",
      city: o.billing_address?.city || "",
      postalCode: o.billing_address?.postal_code || "",
      region: "",
      country: o.billing_address?.country || "",
    },

    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    trackingNumber: o.tracking_number,
    notes: o.notes || "",
  }));
};