"use client";
import { useEffect, useState } from "react";
import OrdersTable from "@/components/admin/orders-table";
import type { Order } from "@/types/admin"; // keep this if table expects admin Order type
import { fetchOrders } from "@/lib/services/order";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import ExcelJS from 'exceljs';

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

  const handleExportToExcel = async () => {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historique Commandes');

    // Define columns with headers
    worksheet.columns = [
      { header: 'Numéro Commande', key: 'orderNumber', width: 15 },
      { header: 'Date Commande', key: 'orderDate', width: 18 },
      { header: 'Client', key: 'customerName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Téléphone', key: 'phone', width: 15 },
      { header: 'Produit', key: 'product', width: 30 },
      { header: 'Référence', key: 'reference', width: 20 },
      { header: 'Quantité', key: 'quantity', width: 10 },
      { header: 'Prix Unitaire (TND)', key: 'unitPrice', width: 18 },
      { header: 'Total Produit (TND)', key: 'totalProduct', width: 18 },
      { header: 'Total Commande (TND)', key: 'totalOrder', width: 18 },
      { header: 'Statut Commande', key: 'orderStatus', width: 15 },
      { header: 'Statut Paiement', key: 'paymentStatus', width: 15 },
      { header: 'Méthode Paiement', key: 'paymentMethod', width: 18 },
      { header: 'Numéro Suivi', key: 'tracking', width: 15 },
      { header: 'Adresse Livraison', key: 'address', width: 50 },
      { header: 'Matricule Véhicule', key: 'vehicle', width: 18 },
      { header: 'Kilométrage', key: 'mileage', width: 12 },
    ];

    // Make header row bold
    worksheet.getRow(1).font = { bold: true };

    // Add data rows
    orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          worksheet.addRow({
            orderNumber: order.orderNumber,
            orderDate: new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            customerName: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone || 'N/A',
            product: item.productName,
            reference: item.specifications || 'N/A',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice).toFixed(3),
            totalProduct: Number(item.totalPrice).toFixed(3),
            totalOrder: index === 0 ? Number(order.totalAmount).toFixed(3) : '',
            orderStatus: order.status === 'pending' ? 'En attente' :
                        order.status === 'confirmed' ? 'Confirmée' :
                        order.status === 'processing' ? 'En cours' :
                        order.status === 'shipped' ? 'Expédiée' :
                        order.status === 'delivered' ? 'Livrée' : 'Annulée',
            paymentStatus: order.paymentStatus === 'pending' ? 'En attente' :
                          order.paymentStatus === 'paid' ? 'Payé' :
                          order.paymentStatus === 'failed' ? 'Échec' : 'Remboursé',
            paymentMethod: order.paymentMethod === 'card' ? 'Carte' : 'À la livraison',
            tracking: order.trackingNumber || 'N/A',
            address: order.shippingAddress ? 
              `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.region}, ${order.shippingAddress.country}` : 'N/A',
            vehicle: order.warrantyInfo?.vehicleRegistration || 'N/A',
            mileage: order.warrantyInfo?.vehicleMileage || 'N/A',
          });
        });
      } else {
        worksheet.addRow({
          orderNumber: order.orderNumber,
          orderDate: new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          customerName: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone || 'N/A',
          product: 'Aucun article',
          reference: 'N/A',
          quantity: 0,
          unitPrice: '0.000',
          totalProduct: '0.000',
          totalOrder: Number(order.totalAmount).toFixed(3),
          orderStatus: order.status === 'pending' ? 'En attente' :
                      order.status === 'confirmed' ? 'Confirmée' :
                      order.status === 'processing' ? 'En cours' :
                      order.status === 'shipped' ? 'Expédiée' :
                      order.status === 'delivered' ? 'Livrée' : 'Annulée',
          paymentStatus: order.paymentStatus === 'pending' ? 'En attente' :
                        order.paymentStatus === 'paid' ? 'Payé' :
                        order.paymentStatus === 'failed' ? 'Échec' : 'Remboursé',
          paymentMethod: order.paymentMethod === 'card' ? 'Carte' : 'À la livraison',
          tracking: order.trackingNumber || 'N/A',
          address: order.shippingAddress ? 
            `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.region}, ${order.shippingAddress.country}` : 'N/A',
          vehicle: order.warrantyInfo?.vehicleRegistration || 'N/A',
          mileage: order.warrantyInfo?.vehicleMileage || 'N/A',
        });
      }
    });

    // Generate filename with current date
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const filename = `Historique_Commandes_${date}.xlsx`;
    
    // Write to file and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestion des commandes
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Gérez toutes les commandes de votre boutique
          </p>
        </div>
        <Button 
          onClick={handleExportToExcel}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileDown className="h-4 w-4" />
          Exporter l'historique (Excel)
        </Button>
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
