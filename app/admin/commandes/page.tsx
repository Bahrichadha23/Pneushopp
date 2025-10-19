"use client";
import { useEffect, useState } from "react";
import OrdersTable from "@/components/admin/orders-table";
import type { Order } from "@/types/admin"; // keep this if table expects admin Order type
import { fetchOrders } from "@/lib/services/order";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
// import ProtectedRoute from '@/components/protected-route';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin or purchasing
  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders(); // now returns [] of mapped orders
        setOrders(data as unknown as Order[]); // cast if type mismatch
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false); // ✅ must stop loading
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return <div>Chargement des commandes...</div>;
  }

  const handleViewOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const details = `
  Commande: ${order.orderNumber}
  Client: ${order.customerName}
  Email: ${order.customerEmail}
  Total: ${order.totalAmount}
  Statut: ${order.status}
  Date: ${order.createdAt.toLocaleDateString()}
  Articles: ${order.items.length} produit(s)
      `;
      alert(details);
    }
  };
  const createPurchaseOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order: parseInt(orderId),
          fournisseur: "Fournisseur par défaut",
          date_commande: new Date().toISOString().split("T")[0],
          date_livraison_prevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          total_ht: 0,
          total_ttc: 0,
          statut: "en_attente",
          priorite: "normale",
        }),
      });

      if (response.ok) {
        alert("Bon de commande créé avec succès!");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`, // ✅ Add this line
        },
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
