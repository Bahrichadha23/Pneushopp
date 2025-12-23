// import type { Order as FrontendOrder } from "@/types/order";
// import { API_URL } from "../config";

// // export const fetchOrders = async (): Promise<FrontendOrder[]> => {

// // const token = localStorage.getItem("access_token");
// //   if (!token) throw new Error("No auth token found");

// //   const res = await fetch(`${API_URL}/orders/`, {
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: `Bearer ${token}`,
// //     },
// //   });

// //   if (!res.ok) {
// //     throw new Error(`Failed to fetch orders: ${res.status}`);
// //   }
// //   const data = await res.json();

// //   return data.map((o: any) => ({
// //     id: o.id.toString(),
// //     user_id: o.user?.id?.toString() || "",
// //     items: o.items.map((item: any) => ({
// //       product_id: item.product_id,
// //       product_name: item.product_name,
// //       quantity: item.quantity,
// //       unit_price: item.unit_price,
// //       total_price: item.total_price,
// //       specifications: item.specifications,
// //     })),
// //     shipping_address: {
// //       first_name: o.shipping_address.first_name || "",
// //       last_name: o.shipping_address.last_name || "",
// //       company: o.shipping_address.company || "",
// //       address: o.shipping_address.address,
// //       city: o.shipping_address.city,
// //       postal_code: o.shipping_address.postal_code,
// //       country: o.shipping_address.country,
// //       phone: o.shipping_address.phone,
// //     },
// //     payment_method: {
// //       type: o.payment_method || "card",
// //       card_number: o.card_number,
// //       expiry_date: o.expiry_date,
// //       cvv: o.cvv,
// //       holder_name: o.holder_name,
// //     },
// //     subtotal: o.total_amount, // you can calculate from items if needed
// //     shipping_cost: o.shipping_cost || 0,
// //     tax: o.tax || 0,
// //     total: o.total_amount,
// //     status: o.status,
// //     created_at: new Date(o.created_at),
// //     updated_at: new Date(o.updated_at),
// //     tracking_number: o.tracking_number,
// //     notes: o.notes,
// //   }));
// // };


// export const fetchOrders = async (): Promise<FrontendOrder[]> => {
//   const token = localStorage.getItem("access_token");
//   if (!token) throw new Error("No auth token found");

//   const res = await fetch(`${API_URL}/orders/`, {
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!res.ok) {
//     throw new Error(`Failed to fetch orders: ${res.status}`);
//   }

//   const data = await res.json();

//   // ✅ Use `results`
//   return data.results.map((o: any) => ({
//     id: o.id.toString(),
//     user_id: o.user?.id?.toString() || "",
//     items: o.items.map((item: any) => ({
//       product_id: item.product_id,
//       product_name: item.product_name,
//       quantity: item.quantity,
//       unit_price: item.unit_price,
//       total_price: item.total_price,
//       specifications: item.specifications,
//     })),
//     shipping_address: {
//       first_name: o.shipping_address.first_name || "",
//       last_name: o.shipping_address.last_name || "",
//       company: o.shipping_address.company || "",
//       address: o.shipping_address.address,
//       city: o.shipping_address.city,
//       postal_code: o.shipping_address.postal_code,
//       country: o.shipping_address.country,
//       phone: o.shipping_address.phone,
//     },
//     payment_method: {
//       type: o.payment_method || "card",
//       card_number: o.card_number,
//       expiry_date: o.expiry_date,
//       cvv: o.cvv,
//       holder_name: o.holder_name,
//     },
//     subtotal: o.total_amount,
//     shipping_cost: o.shipping_cost || 0,
//     tax: o.tax || 0,
//     total: o.total_amount,
//     status: o.status,
//     created_at: new Date(o.created_at),
//     updated_at: new Date(o.updated_at),
//     tracking_number: o.tracking_number,
//     notes: o.notes,
//   }));
// };



import type { Order as AdminOrder } from "@/types/admin";
import { API_URL } from "../config";

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
      street: o.billing_address.address,
      city: o.billing_address.city,
      postalCode: o.billing_address.postal_code,
      region: "",
      country: o.billing_address.country,
    },

    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    trackingNumber: o.tracking_number,
    notes: o.notes || "",
    
    // Map warranty information from backend
    warrantyInfo: o.warranty_accepted ? {
      accepted: o.warranty_accepted,
      clientName: o.warranty_client_name || "",
      vehicleRegistration: o.warranty_vehicle_registration || "",
      vehicleMileage: o.warranty_vehicle_mileage || "",
    } : undefined,
  }));
};
