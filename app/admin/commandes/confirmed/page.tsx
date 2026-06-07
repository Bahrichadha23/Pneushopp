"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Search, Eye, X } from "lucide-react";
import { API_URL } from "@/lib/config";

type ConfirmedOrderItem = {
  productName: string;
  specifications: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

type ConfirmedOrder = {
  id: string;
  numericId: number;
  client: string;
  email: string;
  phone: string;
  total: number;
  items: number;
  date: string;
  status: string;
  // Détails complets pour l'aperçu (modale "œil")
  detailedItems: ConfirmedOrderItem[];
  deliveryCost: number;
  trackingNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    region: string;
    country: string;
  };
};

export default function ConfirmedOrdersPage() {
  const [orders, setOrders] = useState<ConfirmedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingOrder, setViewingOrder] = useState<ConfirmedOrder | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin");
    return null;
  }

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchConfirmedOrders();
        setOrders(data);
      } catch (err) {
        setError("Impossible de charger les commandes.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  async function fetchConfirmedOrders() {
    const token = localStorage.getItem("access_token");

    // Fetch all active statuses: confirmed, processing, shipped, delivered
    const statuses = ["confirmed", "processing", "shipped", "delivered"];
    const allOrders: ConfirmedOrder[] = [];

    for (const status of statuses) {
      const res = await fetch(`${API_URL}/orders/?status=${status}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const mapped = (data.results || []).map((o: any) => ({
        id: o.order_number,
        numericId: o.id,
        client:
          (o.shipping_address?.first_name || o.shipping_address?.firstName || "") +
          " " +
          (o.shipping_address?.last_name || o.shipping_address?.lastName || ""),
        email: o.user?.email || "",
        phone: o.shipping_address?.phone || "",
        total: parseFloat(o.total_amount),
        items: o.items?.length || 0,
        date: new Date(o.created_at).toLocaleDateString("fr-FR"),
        status: o.status,
        // Détails complets — utilisés uniquement par la modale d'aperçu (œil)
        detailedItems: (o.items || []).map((item: any) => ({
          productName: item.product_name || "—",
          specifications: item.specifications || "",
          unitPrice: parseFloat(item.unit_price || 0),
          quantity: item.quantity || 0,
          totalPrice: parseFloat(item.total_price || 0),
        })),
        deliveryCost: parseFloat(o.delivery_cost || 0),
        trackingNumber: o.tracking_number || "",
        paymentMethod: o.payment_method || "",
        paymentStatus: o.payment_status || "",
        shippingAddress: {
          street: o.shipping_address?.address || "",
          city: o.shipping_address?.city || "",
          postalCode: o.shipping_address?.postal_code || "",
          region: o.shipping_address?.region || "",
          country: o.shipping_address?.country || "",
        },
      }));
      allOrders.push(...mapped);
    }

    // Sort by date desc
    return allOrders.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " DT";
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Chargement des commandes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Commandes actives
        </h1>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-sm">
          {filteredOrders.length} commandes
        </Badge>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher une commande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total commandes
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-[#FF8C00]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus confirmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredOrders.reduce((sum, order) => sum + order.total, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Articles vendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.reduce((sum, order) => sum + order.items, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes actives (confirmées, en cours, expédiées, livrées)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Aperçu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.client}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {order.email}
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge className={{
                      confirmed: "bg-[#0066CC] text-white",
                      processing: "bg-yellow-500 text-white",
                      shipped: "bg-[#0F1729] text-white",
                      delivered: "bg-black text-white",
                    }[order.status] || "bg-gray-500 text-white"}>
                      {{
                        confirmed: "Confirmée",
                        processing: "En cours",
                        shipped: "Expédiée",
                        delivered: "Livrée",
                      }[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingOrder(order)}
                      title="Aperçu des détails de la commande"
                      className="text-[#0066CC] hover:text-[#004E9E] hover:bg-[#E3F0FF]"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modale d'aperçu des détails de la commande (icône œil) */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Aperçu de la commande #{viewingOrder.id}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{viewingOrder.date}</p>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge className={{
                    confirmed: "bg-[#0066CC] text-white",
                    processing: "bg-yellow-500 text-white",
                    shipped: "bg-[#0F1729] text-white",
                    delivered: "bg-black text-white",
                  }[viewingOrder.status] || "bg-gray-500 text-white"}>
                    {{
                      confirmed: "Confirmée",
                      processing: "En cours",
                      shipped: "Expédiée",
                      delivered: "Livrée",
                    }[viewingOrder.status] || viewingOrder.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base border-b pb-2 text-gray-900">
                      Informations client
                    </h4>
                    <p className="text-sm"><strong>Nom :</strong> {viewingOrder.client.trim() || "—"}</p>
                    <p className="text-sm"><strong>Email :</strong> {viewingOrder.email || "—"}</p>
                    <p className="text-sm"><strong>Téléphone :</strong> {viewingOrder.phone || "—"}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-base border-b pb-2 text-gray-900">
                      Adresse de livraison
                    </h4>
                    <p className="text-sm"><strong>Adresse :</strong> {viewingOrder.shippingAddress.street || "—"}</p>
                    <p className="text-sm"><strong>Ville :</strong> {viewingOrder.shippingAddress.city || "—"}</p>
                    <p className="text-sm"><strong>Code postal :</strong> {viewingOrder.shippingAddress.postalCode || "—"}</p>
                    <p className="text-sm"><strong>Région :</strong> {viewingOrder.shippingAddress.region || "—"}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-base border-b pb-2 text-gray-900">
                      Livraison & suivi
                    </h4>
                    <p className="text-sm"><strong>Numéro de suivi :</strong> {viewingOrder.trackingNumber || "Non renseigné"}</p>
                    <p className="text-sm"><strong>Frais de livraison :</strong> {formatCurrency(viewingOrder.deliveryCost)}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-base border-b pb-2 text-gray-900">
                      Paiement
                    </h4>
                    <p className="text-sm">
                      <strong>Méthode :</strong>{" "}
                      {({
                        card: "Carte bancaire",
                        especes: "Espèces",
                        bank_transfer: "Virement bancaire",
                        cash_on_delivery: "TPE à la livraison",
                        cri: "CRI",
                        cheque: "Chèque",
                        lettre_de_change: "Lettre de change",
                        mixed: "Multi-modalités",
                      } as Record<string, string>)[viewingOrder.paymentMethod] || viewingOrder.paymentMethod || "—"}
                    </p>
                    <p className="text-sm"><strong>Statut paiement :</strong> {viewingOrder.paymentStatus || "—"}</p>
                  </div>
                </div>

                {/* Articles */}
                <div className="pt-2">
                  <h4 className="font-semibold text-base border-b pb-2 mb-3 text-gray-900">
                    Articles commandés
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingOrder.detailedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.specifications || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                        {viewingOrder.deliveryCost > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-900">Frais de livraison :</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(viewingOrder.deliveryCost)}</td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total commande :</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(viewingOrder.total + viewingOrder.deliveryCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                <Button
                  onClick={() => setViewingOrder(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
