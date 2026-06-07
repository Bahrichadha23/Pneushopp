"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { fetchOrders } from "@/lib/services/order";
import { handleDownloadInvoice } from "@/components/admin/orders-table";
import type { Order } from "@/types/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText, FileDown } from "lucide-react";
import ExcelJS from "exceljs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_VARIANTS: Record<Order["status"], "default" | "secondary" | "outline" | "destructive"> = {
  pending: "destructive",
  confirmed: "outline",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

const STATUS_CLASSES: Partial<Record<Order["status"], string>> = {
  confirmed: "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-50",
};

const fps = (n: string) => (n || "").replace(/^CPS/i, "FPS");

export default function FacturesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchClient, setSearchClient] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user]);

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setLoading(false));
  }, []);

  // Seules les commandes confirmées après assignation DOT apparaissent ici
  const FACTURE_STATUSES = ["confirmed", "shipped", "delivered"];

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Exclure commandes non confirmées (pending, processing, cancelled)
      if (!FACTURE_STATUSES.includes(o.status)) return false;

      const matchesClient =
        searchClient === "" ||
        o.customerName.toLowerCase().includes(searchClient.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchClient.toLowerCase());

      const matchesDate =
        searchDate === "" ||
        (() => {
          const d = new Date(o.createdAt);
          const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return local === searchDate;
        })();

      return matchesClient && matchesDate;
    });
  }, [orders, searchClient, searchDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " DT";

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const handleDownload = async (order: Order) => {
    setDownloading(order.id);
    try {
      await handleDownloadInvoice(order);
    } finally {
      setDownloading(null);
    }
  };

  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Factures");
    ws.columns = [
      { header: "N° Facture", key: "num", width: 18 },
      { header: "Date", key: "date", width: 14 },
      { header: "Client", key: "client", width: 25 },
      { header: "Email", key: "email", width: 28 },
      { header: "Téléphone", key: "phone", width: 16 },
      { header: "Produit", key: "product", width: 40 },
      { header: "Qté", key: "qty", width: 8 },
      { header: "Prix Unit. TTC (DT)", key: "unit_price", width: 18 },
      { header: "Total Produit (DT)", key: "total_product", width: 18 },
      { header: "Total Commande TTC (DT)", key: "total", width: 22 },
      { header: "Statut", key: "status", width: 14 },
      { header: "Paiement", key: "payment", width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    filtered.forEach((order) => {
      const items = order.items || [];
      const orderTotal = (order.totalAmount + (order.deliveryCost || 0)).toFixed(3);
      if (items.length === 0) {
        ws.addRow({
          num: fps(order.orderNumber),
          date: formatDate(order.createdAt),
          client: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone || "",
          product: "",
          qty: "",
          unit_price: "",
          total_product: "",
          total: orderTotal,
          status: STATUS_LABELS[order.status] || order.status,
          payment: order.paymentStatus,
        });
      } else {
        items.forEach((item, idx) => {
          ws.addRow({
            num: idx === 0 ? fps(order.orderNumber) : "",
            date: idx === 0 ? formatDate(order.createdAt) : "",
            client: idx === 0 ? order.customerName : "",
            email: idx === 0 ? order.customerEmail : "",
            phone: idx === 0 ? (order.customerPhone || "") : "",
            product: item.productName || "",
            qty: item.quantity,
            unit_price: Number(item.unitPrice || 0).toFixed(3),
            total_product: Number(item.totalPrice || 0).toFixed(3),
            total: idx === 0 ? orderTotal : "",
            status: idx === 0 ? (STATUS_LABELS[order.status] || order.status) : "",
            payment: idx === 0 ? order.paymentStatus : "",
          });
        });
      }
    });

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Factures_${date}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
            <p className="text-sm text-gray-500">
              Consultez et téléchargez toutes les factures clients
            </p>
          </div>
        </div>
        <Button onClick={handleExportExcel} className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0">
          <FileDown className="h-4 w-4" />
          Exporter l'historique (Excel)
        </Button>
      </div>

      {/* Search filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par client ou email..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            className="pl-10"
          />
        </div>
        <div>
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
        {(searchClient || searchDate) && (
          <Button
            variant="ghost"
            onClick={() => { setSearchClient(""); setSearchDate(""); }}
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Stats */}
      <p className="text-sm text-gray-500">
        {filtered.length} facture{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucune facture trouvée.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Télécharger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{fps(order.orderNumber)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerEmail}</p>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status]} className={STATUS_CLASSES[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(order)}
                        disabled={downloading === order.id}
                        className="gap-2 bg-[#0066CC] hover:bg-[#004E9E] text-white border-0"
                      >
                        {downloading === order.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">#{fps(order.orderNumber)}</span>
                  <Badge variant={STATUS_VARIANTS[order.status]} className={STATUS_CLASSES[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(order)}
                    disabled={downloading === order.id}
                    className="gap-2"
                  >
                    {downloading === order.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}