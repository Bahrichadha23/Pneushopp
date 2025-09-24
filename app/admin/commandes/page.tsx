// Page de gestion des commandes
"use client";
import { useEffect, useState } from "react";
import OrdersTable from "@/components/admin/orders-table";
import type { Order } from "@/types/admin";
import { fetchOrders } from "@/lib/services/order";
import { API_URL } from "@/lib/config";
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders(); // fetchOrders should return your raw order array

        // map raw orders to admin.Order type
        const mappedOrders: Order[] = data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerId: o.userId,
          customerName:
            o.shippingAddress.firstName + " " + o.shippingAddress.lastName,
          customerEmail: o.shippingAddress.email || "",
          customerPhone: o.shippingAddress.phone,
          items: o.items.map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            productImage: i.image,
            quantity: i.quantity,
            unitPrice: i.price,
            totalPrice: i.price * i.quantity,
            specifications: i.specifications || "",
          })),
          totalAmount: o.total,
          status: o.status,
          paymentStatus: "pending", // adjust based on backend
          paymentMethod: o.paymentMethod.type,
          shippingAddress: {
            street: o.shippingAddress.address,
            city: o.shippingAddress.city,
            postalCode: o.shippingAddress.postalCode,
            region: "",
            country: o.shippingAddress.country,
          },
          billingAddress: {
            street: o.shippingAddress.address,
            city: o.shippingAddress.city,
            postalCode: o.shippingAddress.postalCode,
            region: "",
            country: o.shippingAddress.country,
          },
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
          trackingNumber: o.trackingNumber,
          notes: o.notes,
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    loadOrders();
  }, []);

  const handleViewOrder = (orderId: string) => {
    console.log("Voir commande:", orderId);
  };

  const handleEditOrder = (orderId: string) => {
    console.log("Modifier commande:", orderId);
  };

  const handleUpdateStatus = async (
    orderId: string,
    status: Order["status"]
  ) => {
    if (!API_URL) return;

    try {
      await fetch(`${API_URL}/orders/${orderId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date() }
            : order
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Gestion des commandes
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Gérez toutes les commandes de votre boutique
        </p>
      </div>

      <OrdersTable
        orders={orders}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
