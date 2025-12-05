"use client";
// Contexte pour la gestion des commandes
import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
// import type { Order, OrderContextType } from "@/types/order"
import { OrderItem } from "@/types/admin";
import { PaymentMethod } from "@/types/order";
import { ShippingAddress } from "@/types/order";
import { API_URL } from "@/lib/config";

const OrderContext = createContext<OrderContextType | undefined>(undefined);
interface Order {
  id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
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
