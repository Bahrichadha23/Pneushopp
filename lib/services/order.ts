import type { Order as AdminOrder } from "@/types/admin";
import apiClient from "@/lib/api-client";

export const fetchOrders = async (): Promise<AdminOrder[]> => {
  const { data } = await apiClient.get("/orders/");

  const results = data.results ?? data;

  return results.map((o: any) => ({
    id: o.id.toString(),
    orderNumber: o.order_number,
    customerId: o.user?.id?.toString() || "",
    customerName: o.shipping_address
      ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() || o.user?.email || "—"
      : o.user?.email || "—",
    customerEmail: o.user?.email || "",
    customerPhone: o.shipping_address?.phone || "",

    items: (o.items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price),
      discount: parseFloat(item.discount || 0),
      specifications: item.specifications || "",
    })),

    totalAmount: parseFloat(o.total_amount),
    deliveryCost: parseFloat(o.delivery_cost || 0),
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,

    shippingAddress: {
      street: o.shipping_address?.address || "",
      city: o.shipping_address?.city || "",
      postalCode: o.shipping_address?.postal_code || "",
      region: "",
      country: o.shipping_address?.country || "",
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
    commercial: o.commercial || "",

    paymentDetails: {
      especesAmountPaid: parseFloat(o.especes_amount_paid || 0),
      especesRemaining: parseFloat(o.especes_remaining || 0),
      especesRemarque: o.especes_remarque || "",
      criAmountPaid: parseFloat(o.cri_amount_paid || 0),
      criRemaining: parseFloat(o.cri_remaining || 0),
      criRemarque: o.cri_remarque || "",
      transferAmountPaid: parseFloat(o.transfer_amount_paid || 0),
      transferRemaining: parseFloat(o.transfer_remaining || 0),
      transferNumber: o.transfer_number || "",
      transferHolderName: o.transfer_holder_name || "",
      transferBankName: o.transfer_bank_name || "",
      transferRemarque: o.transfer_remarque || "",
      lettreAmountPaid: parseFloat(o.lettre_amount_paid || 0),
      lettreRemaining: parseFloat(o.lettre_remaining || 0),
      lettreNumber: o.lettre_number || "",
      lettreDate: o.lettre_date || "",
      lettreName: o.lettre_name || "",
      lettreBankName: o.lettre_bank_name || "",
      lettreRib: o.lettre_rib || "",
      lettreLieu: o.lettre_lieu || "",
      lettreRemarque: o.lettre_remarque || "",
      chequeAmountPaid: parseFloat(o.cheque_amount_paid || 0),
      chequeRemaining: parseFloat(o.cheque_remaining || 0),
      chequeNumber: o.cheque_number || "",
      chequeDate: o.cheque_date || "",
      chequeName: o.cheque_name || "",
      chequeBankName: o.cheque_bank_name || "",
      chequeRemarque: o.cheque_remarque || "",
      codAmountPaid: parseFloat(o.cod_amount_paid || 0),
      codRemaining: parseFloat(o.cod_remaining || 0),
      codAuthorizationNumber: o.cod_authorization_number || "",
      codBankName: o.cod_bank_name || "",
      codRemarque: o.cod_remarque || "",
    },

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
