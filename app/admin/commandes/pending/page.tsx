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
  Eye,
  X as XIcon,
  FileDown,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import ExcelJS from "exceljs";

type PendingOrder = {
  id: string;
  numericId: number;
  client: string;
  email: string;
  phone: string;
  address: string;
  company: string;
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
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    orderId: null,
    orderName: "",
    action: null,
    deliveryCost: 0,
  });
  const [confirming, setConfirming] = useState(false);
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
        (o.shipping_address?.first_name || o.shipping_address?.firstName || "") +
        " " +
        (o.shipping_address?.last_name || o.shipping_address?.lastName || ""),
      email: o.shipping_address?.email || o.user?.email || "",
      phone: o.shipping_address?.phone || "",
      address: [o.shipping_address?.address, o.shipping_address?.city, o.shipping_address?.postal_code]
        .filter(Boolean)
        .join(", "),
      company: o.shipping_address?.company || "",
      total: parseFloat(o.total_amount), // convert to number
      items: o.items || [], // keep as array
      date: new Date(o.created_at).toLocaleDateString("fr-FR"),
      urgence: o.urgence || "normale",
    }));
  }

  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat("fr-FR", {
  //     style: "decimal",
  //     currency: "TND",
  //   }).format(amount) + " DT";
  // };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " DT";
  };

  const handleApprove = (numericId: number, orderName: string) => {
    setConfirmation({
      isOpen: true,
      orderId: numericId,
      orderName: orderName || `#${numericId}`,
      action: "approve",
    });
  };

  const handleReject = (numericId: number, orderName: string) => {
    setConfirmation({
      isOpen: true,
      orderId: numericId,
      orderName: orderName || `#${numericId}`,
      action: "reject",
    });
  };

  const handleConfirm = async () => {
    if (!confirmation.orderId || !confirmation.action || confirming) return;

    setConfirming(true);
    try {
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
    } finally {
      setConfirming(false);
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

  const exportColumns = [
    { header: "ID Commande", key: "id", width: 18 },
    { header: "Client", key: "client", width: 25 },
    { header: "Email", key: "email", width: 28 },
    { header: "Téléphone", key: "phone", width: 16 },
    { header: "Adresse", key: "address", width: 35 },
    { header: "Entreprise", key: "company", width: 20 },
    { header: "Articles", key: "items", width: 10 },
    { header: "Total", key: "total", width: 14 },
    { header: "Date", key: "date", width: 14 },
  ];

  const buildExportRows = () =>
    filteredOrders.map((order) => ({
      id: order.id,
      client: order.client,
      email: order.email,
      phone: order.phone,
      address: order.address,
      company: order.company,
      items: order.items.length,
      total: order.total,
      date: order.date,
    }));

  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Commandes en attente");
    ws.columns = exportColumns;
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

    buildExportRows().forEach((row) => ws.addRow(row));

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Commandes_en_attente_${date}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = exportColumns.map((c) => c.header);
    const rows = buildExportRows().map((row) =>
      exportColumns.map((c) => `"${String((row as any)[c.key] ?? "").replace(/"/g, '""')}"`).join(";")
    );
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    a.href = url; a.download = `Commandes_en_attente_${date}.csv`; a.click();
    URL.revokeObjectURL(url);
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
        delivery_cost: Math.round(deliveryCost).toString()
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Commandes en attente
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredOrders.length} commandes
          </Badge>
          <Button size="sm" onClick={handleExportExcel} className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0">
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
          <Button size="sm" onClick={handleExportCsv} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            CSV
          </Button>
        </div>
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
            <div className="text-2xl font-bold text-brand-red">
              {orders.filter((o) => o.urgence === "haute").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <span className="h-4 w-4 text-yellow-500">DT</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gold">
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
                    onClick={() => setSelectedOrder(order)}
                    className="bg-[#0066CC] hover:bg-[#004E9E] text-white border-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(order.numericId, order.id)}
                    className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReject(order.numericId, order.id)}
                    className="bg-[#9B2226] hover:bg-[#730019] text-white border-0"
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
                    <TableCell>{order.items.length} articles</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          title="Voir les détails"
                          className="bg-[#0066CC] hover:bg-[#004E9E] text-white border-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(order.numericId, order.id)}
                          className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(order.numericId, order.id)}
                          className="bg-[#9B2226] hover:bg-[#730019] text-white border-0"
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

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-800 px-5 py-3">
              <h2 className="text-white font-semibold text-sm">
                Commande {selectedOrder.id}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-300 hover:text-white text-xl leading-none">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Infos client */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Client</p>
                  <p className="font-medium text-gray-800">{selectedOrder.client || "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedOrder.email}</p>
                  {selectedOrder.company && (
                    <p className="text-xs text-gray-500 truncate">{selectedOrder.company}</p>
                  )}
                </div>
                <div className="rounded-lg border bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Date</p>
                  <p className="font-medium text-gray-800">{selectedOrder.date}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.items.length} article{selectedOrder.items.length > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-3 py-2 col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Téléphone</p>
                  <p className="font-medium text-gray-800">{selectedOrder.phone || "—"}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-3 py-2 col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Adresse</p>
                  <p className="font-medium text-gray-800">{selectedOrder.address || "—"}</p>
                </div>
              </div>

              {/* Articles */}
              {selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-2">Articles</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Désignation</th>
                          <th className="px-3 py-2 text-center font-semibold">Qté</th>
                          <th className="px-3 py-2 text-right font-semibold">P.U.</th>
                          <th className="px-3 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-1.5">{item.product_name || item.productName || "—"}</td>
                            <td className="px-3 py-1.5 text-center">{item.quantity}</td>
                            <td className="px-3 py-1.5 text-right">{parseFloat(item.unit_price || item.unitPrice || "0").toFixed(3)} DT</td>
                            <td className="px-3 py-1.5 text-right font-medium">{parseFloat(item.total_price || item.totalPrice || "0").toFixed(3)} DT</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-500">Montant total</span>
                <span className="text-lg font-bold text-brand-gold">{formatCurrency(selectedOrder.total)}</span>
              </div>

              {/* Actions rapides depuis le modal */}
              <div className="flex gap-2 justify-end border-t pt-3">
                <Button size="sm" onClick={() => setSelectedOrder(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">Fermer</Button>
                <Button size="sm"
                  className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0"
                  onClick={() => { setSelectedOrder(null); handleApprove(selectedOrder.numericId, selectedOrder.id); }}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approuver
                </Button>
                <Button size="sm"
                  className="bg-[#9B2226] hover:bg-[#730019] text-white border-0"
                  onClick={() => { setSelectedOrder(null); handleReject(selectedOrder.numericId, selectedOrder.id); }}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    Frais de livraison (DT)
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={!confirmation.deliveryCost ? "" : String(confirmation.deliveryCost)}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".");
                      setConfirmation((prev) => ({
                        ...prev,
                        deliveryCost: val === "" ? 0 : parseFloat(val) || 0,
                      }));
                    }}
                    placeholder="Ex: 15.000"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Sera ajouté au montant total de la commande et inclus dans la facture.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={handleCancel}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                >
                  Non
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className={
                    confirmation.action === "approve"
                      ? "bg-brand-orange hover:bg-brand-orange-dark text-black font-semibold"
                      : "bg-brand-red hover:bg-brand-red text-white"
                  }
                >
                  {confirming ? "..." : "Oui"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}