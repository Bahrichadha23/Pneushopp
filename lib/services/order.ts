import type { Order as AdminOrder } from "@/types/admin";
import apiClient from "@/lib/api-client";

export const fetchOrders = async (): Promise<AdminOrder[]> => {
  const { data } = await apiClient.get("/orders/");

  const results = data.results ?? data;

  return results.map((o: any) => ({
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
    deliveryCost: parseFloat(o.delivery_cost || 0),
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

    warrantyInfo: o.warranty_accepted
      ? {
          accepted: o.warranty_accepted,
          clientName: o.warranty_client_name || "",
          vehicleRegistration: o.warranty_vehicle_registration || "",
          vehicleMileage: o.warranty_vehicle_mileage || "",
        }
      : undefined,
  }));
};
