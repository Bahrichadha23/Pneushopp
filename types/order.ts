import type { Order as AdminOrder } from "@/types/admin";
import { API_URL } from "@/lib/config";

// Interface for warranty information
export interface WarrantyInfo {
  accepted: boolean;
  clientName?: string;
  vehicleRegistration?: string;
  vehicleMileage?: string;
}

// Interface for order items
export interface OrderItem {
  product_id: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
}
export type PaymentMethod = {
  type: "card" | "cash_on_delivery" | "paypal" | "bank_transfer";
  details?: string;
};

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
  warranty?: WarrantyInfo;
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