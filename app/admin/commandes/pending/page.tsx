"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";

type PendingOrder = {
  id: string;
  numericId: number;
  client: string;
  email: string;
  total: number;
  items: any[]; // or number if you only store length
  date: string;
  urgence: string;
};

type ConfirmationDialog = {
  isOpen: boolean;
  orderId: number | null;
  orderName: string;
  action: "approve" | "reject" | null;
  deliveryCost?: number;
};

export default function PendingOrdersPage() {
  // const [orders, setOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    orderId: null,
    orderName: "",
    action: null,
    deliveryCost: 0,
  });
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin or purchasing
  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchPendingOrders();
        console.log("🔍 Pending orders fetched:", data); // Add this
        console.log("🔍 Count:", data.length); // Add this
        setOrders(data);
      } catch (err) {
        setError("Impossible de charger les commandes.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  async function fetchPendingOrders() {
    const token = localStorage.getItem("access_token"); // 👈 store this on login

    const res = await fetch(`${API_URL}/orders/?status=pending`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 add token here
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    // map backend data to frontend Order type
    return data.results.map((o: any) => ({
      id: o.order_number, // or o.id if you prefer
      numericId: o.id, // ✅ numeric backend ID for PATCH
      client:
        o.shipping_address.first_name + " " + o.shipping_address.last_name,
      email: o.user.email || "",
      total: parseFloat(o.total_amount), // convert to number
      items: o.items.length,
      date: new Date(o.created_at).toLocaleDateString("fr-FR"),
      urgence: o.urgence || "normale",
    }));
  }

  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat("fr-TN", {
  //     style: "currency",
  //     currency: "TND",
  //   }).format(amount);
  // };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = (numericId: number, orderName: string) => {
    setConfirmation({
      isOpen: true,
      orderId: numericId,
      orderName,
      action: "approve",
    });
  };

  const handleReject = (numericId: number, orderName: string) => {
    setConfirmation({
      isOpen: true,
      orderId: numericId,
      orderName,
      action: "reject",
    });
  };

  const handleConfirm = async () => {
    if (!confirmation.orderId || !confirmation.action) return;

    if (confirmation.action === "approve") {
      // When approving, send delivery_cost along with status
      await updateOrderStatusWithDelivery(
        confirmation.orderId,
        "processing",
        confirmation.deliveryCost || 0
      );
    } else {
      // When rejecting, just update status
      await updateOrderStatus(confirmation.orderId, "cancelled");
    }

    setConfirmation({
      isOpen: false,
      orderId: null,
      orderName: "",
      action: null,
      deliveryCost: 0,
    });
  };

  const handleCancel = () => {
    setConfirmation({
      isOpen: false,
      orderId: null,
      orderName: "",
      action: null,
      deliveryCost: 0,
    });
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const updateOrderStatus = async (
    numericId: number,
    status: PendingOrder["urgence"]
  ) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/orders/${numericId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.numericId !== numericId));
    }
  };

  const updateOrderStatusWithDelivery = async (
    numericId: number,
    status: string,
    deliveryCost: number
  ) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/orders/${numericId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        status,
        delivery_cost: deliveryCost.toString()
      }),
    });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.numericId !== numericId));
    }
  };

  if (loading) return <div>Chargement des commandes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Commandes en attente
        </h1>
        <Badge variant="secondary" className="text-sm">
          {filteredOrders.length} commandes
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total en attente
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Haute priorité
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders.filter((o) => o.urgence === "haute").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <span className="h-4 w-4 text-green-500">DT</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                orders.reduce((sum, order) => sum + order.total, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par ID ou nom client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{order.id}</span>
                <Badge
                  variant={
                    order.urgence === "haute" ? "destructive" : "secondary"
                  }
                >
                  {order.urgence}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">{order.client}</p>
                <p className="text-xs text-gray-500 truncate">{order.email}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>{order.items.length} articles</span>
                <span className="font-medium">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{order.date}</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(order.numericId, order.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(order.numericId, order.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view: Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Commandes à traiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.client}</TableCell>
                    <TableCell className="truncate max-w-[150px]">
                      {order.email}
                    </TableCell>
                    <TableCell>{order.items.length} articles</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(order.numericId, order.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(order.numericId, order.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmation.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-lg p-6 max-w-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmation.action === "approve"
                  ? "Approuver la commande"
                  : "Rejeter la commande"}
              </h2>
              <p className="text-gray-600 mb-4">
                {confirmation.action === "approve"
                  ? `Êtes-vous sûr de vouloir approuver la commande ${confirmation.orderName} ?`
                  : `Êtes-vous sûr de vouloir rejeter la commande ${confirmation.orderName} ?`}
              </p>

              {confirmation.action === "approve" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de livraison (TND)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirmation.deliveryCost || 0}
                    onChange={(e) =>
                      setConfirmation((prev) => ({
                        ...prev,
                        deliveryCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-gray-600"
                >
                  Non
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={
                    confirmation.action === "approve"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }
                >
                  Oui
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
