"use client";
// Contexte pour la gestion des commandes
import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
// import type { Order, OrderContextType } from "@/types/order"
import { OrderItem } from "@/types/admin";
import { PaymentMethod, WarrantyInfo } from "@/types/order";
import { ShippingAddress } from "@/types/order";
import { API_URL } from "@/lib/config";

const OrderContext = createContext<OrderContextType | undefined>(undefined);
interface Order {
  id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  warranty?: WarrantyInfo;
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
interface OrderContextType {
  currentOrder: Order | null;
  createOrder: (
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  getOrder: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  getAllOrders: () => Order[];
}
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Charger les commandes depuis localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem("pneushop-orders");
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));
        setOrders(parsedOrders);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
      }
    }
  }, []);

  // Sauvegarder les commandes dans localStorage
  useEffect(() => {
    localStorage.setItem("pneushop-orders", JSON.stringify(orders));
  }, [orders]);

  const createOrder = async (
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    try {
      // Get auth token
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      if (token) {
        // Call backend API to create order
        const response = await fetch(`${API_URL}/orders/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            // Remove order_number - let backend generate it with PS{YY}{NNNNNN} format
            items: orderData.items.map((item) => ({
              product_id: parseInt(item.productId),
              quantity: item.quantity,
              unit_price: parseFloat(item.unitPrice.toFixed(2)), // Ensure 2 decimal places
              total_price: parseFloat(
                (item.unitPrice * item.quantity).toFixed(2)
              ), // Add total_price
              product_name: item.productName,
              specifications: item.specifications,
              // specifications: `${item.product.specifications.width}/${item.product.specifications.height} R${item.product.specifications.diameter}`
              // Remove 'order' field - it will be set by Django automatically
            })),
            shipping_address: {
              first_name: orderData.shippingAddress.first_name,
              last_name: orderData.shippingAddress.last_name,
              address: orderData.shippingAddress.address,
              city: orderData.shippingAddress.city,
              postal_code: orderData.shippingAddress.postal_code,
              country: orderData.shippingAddress.country,
              phone: orderData.shippingAddress.phone,
            },
            billing_address: {
              first_name: orderData.shippingAddress.first_name,
              last_name: orderData.shippingAddress.last_name,
              address: orderData.shippingAddress.address,
              city: orderData.shippingAddress.city,
              postal_code: orderData.shippingAddress.postal_code,
              country: orderData.shippingAddress.country,
              phone: orderData.shippingAddress.phone,
            },
            payment_method: orderData.paymentMethod.type,
            total_amount: parseFloat(orderData.total.toFixed(2)), // Fix decimal places
            // Use per-method private amounts (_criMontant etc.) for both single and multi-modal
            // CRI payment fields
            ...((orderData.paymentMethod as any)._criMontant > 0 ? {
              cri_amount_paid: parseFloat(((orderData.paymentMethod as any)._criMontant || 0).toFixed(2)),
              cri_remaining: parseFloat(((orderData.paymentMethod as any)._criReste || 0).toFixed(2)),
              cri_remarque: orderData.paymentMethod.remarque || "",
            } : {}),
            // Bank Transfer (Virement) fields
            ...((orderData.paymentMethod as any)._bankMontant > 0 ? {
              transfer_amount_paid: parseFloat(((orderData.paymentMethod as any)._bankMontant || 0).toFixed(2)),
              transfer_remaining: parseFloat(((orderData.paymentMethod as any)._bankReste || 0).toFixed(2)),
              transfer_number: orderData.paymentMethod.transferNumber || "",
              transfer_holder_name: orderData.paymentMethod.transferHolderName || "",
              transfer_bank_name: orderData.paymentMethod.bankName || "",
              transfer_image_name: orderData.paymentMethod.transferImageName || "",
              transfer_remarque: orderData.paymentMethod.remarque || "",
            } : {}),
            // Letter of Change (Lettre de change) fields
            ...((orderData.paymentMethod as any)._lettreMontant > 0 ? {
              lettre_amount_paid: parseFloat(((orderData.paymentMethod as any)._lettreMontant || 0).toFixed(2)),
              lettre_remaining: parseFloat(((orderData.paymentMethod as any)._lettreReste || 0).toFixed(2)),
              lettre_number: orderData.paymentMethod.lettreNumber || "",
              lettre_date: orderData.paymentMethod.lettreDate || "",
              lettre_name: orderData.paymentMethod.lettreName || "",
              lettre_bank_name: orderData.paymentMethod.lettreBankName || "",
              lettre_rib: orderData.paymentMethod.lettreRIB || "",
              lettre_lieu: orderData.paymentMethod.lettreLieu || "",
              lettre_image_name: orderData.paymentMethod.lettreImageName || "",
              lettre_remarque: (orderData.paymentMethod as any).lettreRemarque || orderData.paymentMethod.remarque || "",
            } : {}),
            // Check (Chèque) fields
            ...((orderData.paymentMethod as any)._chequeMontant > 0 ? {
              cheque_amount_paid: parseFloat(((orderData.paymentMethod as any)._chequeMontant || 0).toFixed(2)),
              cheque_remaining: parseFloat(((orderData.paymentMethod as any)._chequeReste || 0).toFixed(2)),
              cheque_number: orderData.paymentMethod.chequeNumber || "",
              cheque_date: orderData.paymentMethod.chequeDate || "",
              cheque_name: orderData.paymentMethod.chequeName || "",
              cheque_bank_name: orderData.paymentMethod.chequeBankName || "",
              cheque_image_name: orderData.paymentMethod.chequeImageName || "",
              cheque_remarque: (orderData.paymentMethod as any).chequeRemarque || orderData.paymentMethod.remarque || "",
            } : {}),
            // Cash on Delivery (TPE à la livraison) fields
            ...((orderData.paymentMethod as any)._codMontant > 0 ? {
              cod_amount_paid: parseFloat(((orderData.paymentMethod as any)._codMontant || 0).toFixed(2)),
              cod_remaining: parseFloat(((orderData.paymentMethod as any)._codReste || 0).toFixed(2)),
              cod_authorization_number: orderData.paymentMethod.authorizationNumber || "",
              cod_bank_name: (orderData.paymentMethod as any).codBankName || orderData.paymentMethod.bankName || "",
              cod_remarque: (orderData.paymentMethod as any).codRemarque || orderData.paymentMethod.remarque || "",
            } : {}),
            // Warranty information (if provided)
            ...(orderData.warranty &&
              orderData.warranty.accepted && {
                warranty_accepted: true,
                warranty_client_name: orderData.warranty.clientName || "",
                warranty_vehicle_registration:
                  orderData.warranty.vehicleRegistration || "",
                warranty_vehicle_mileage:
                  orderData.warranty.vehicleMileage || "",
              }),
          }),
        });
        console.log("📡 API Response status:", response.status);
        console.log(
          "📡 API Response headers:",
          Object.fromEntries(response.headers.entries())
        );
        if (response.ok) {
          const backendOrder = await response.json();
          console.log("✅ Order created in backend:", backendOrder);

          // Upload payment image if provided
          const pm = orderData.paymentMethod as any;
          const imageUploadMap: { type: string; file: File | undefined }[] = [
            { type: "transfer", file: pm._transferImageFile },
            { type: "cheque",   file: pm._chequeImageFile },
            { type: "lettre",   file: pm._lettreImageFile },
          ];
          for (const { type, file } of imageUploadMap) {
            if (file) {
              try {
                const imgForm = new FormData();
                imgForm.append("image_type", type);
                imgForm.append("image", file);
                await fetch(`${API_URL}/orders/${backendOrder.id}/upload-payment-image/`, {
                  method: "POST",
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                  body: imgForm,
                });
                console.log(`✅ Uploaded ${type} image`);
              } catch (imgErr) {
                console.warn(`⚠️ Image upload failed for ${type}:`, imgErr);
              }
            }
          }

          // Also save to localStorage as backup
          const localOrder: Order = {
            ...orderData,
            id: backendOrder.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "pending",
          };

          setOrders((prev) => [...prev, localOrder]);
          setCurrentOrder(localOrder);

          return backendOrder.id.toString();
        } else {
          // Log the error response
          const errorText = await response.text();
          console.error("❌ Backend API error:", response.status, errorText);
          throw new Error(
            `Backend API error: ${response.status} - ${errorText}`
          );
        }
      }

      // Fallback to localStorage if backend fails or no auth
      console.log("⚠️ Falling back to localStorage order");
      const orderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "pending",
      };

      setOrders((prev) => [...prev, newOrder]);
      setCurrentOrder(newOrder);
      return orderId;
    } catch (error) {
      console.error("❌ Error creating order:", error);

      // Fallback to localStorage on error
      const orderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "pending",
      };

      setOrders((prev) => [...prev, newOrder]);
      setCurrentOrder(newOrder);
      return orderId;
    }
  };

  const getOrder = (orderId: string): Order | null => {
    return orders.find((order) => order.id === orderId) || null;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
  };

  const getAllOrders = (): Order[] => {
    return orders;
  };

  const value: OrderContextType = {
    currentOrder,
    createOrder,
    getOrder,
    updateOrderStatus,
    getAllOrders,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder doit être utilisé dans un OrderProvider");
  }
  return context;
}
