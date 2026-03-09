"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/config";
import { RefreshCw, Download, Package, Check, Truck, Ban } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";

async function safeResponseJson(response: Response): Promise<{ data: any; isJson: boolean }> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json") && text.trim()) {
    try {
      return { data: JSON.parse(text), isJson: true };
    } catch {
      return { data: null, isJson: false };
    }
  }
  return { data: null, isJson: false };
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
const handleDownloadAchat = (order: any) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;

  let y = 50.8; // 2 inches top margin

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("COMMANDE D'ACHAT", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(11);
  pdf.text(`N\u00b0 ${order.order_number}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `G\u00e9n\u00e9r\u00e9 le ${new Date().toLocaleDateString("fr-FR")} \u00e0 ${new Date().toLocaleTimeString("fr-FR")}`,
    pageWidth / 2, y, { align: "center" }
  );
  y += 15;

  // Info table
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Informations de la commande", margin, y);
  y += 8;

  const infoHeaders = ["Fournisseur", "Date", "Semaine/Ann\u00e9e", "Statut"];
  const infoValues = [
    order.supplier_name || `Fournisseur ${order.supplier}`,
    order.order_date ? new Date(order.order_date).toLocaleDateString("fr-FR") : "N/A",
    order.week && order.year ? `${order.week}.${order.year}` : "N/A",
    order.status === "confirmed" ? "Confirm\u00e9e"
      : order.status === "received" ? "Re\u00e7ue"
      : order.status === "cancelled" ? "Annul\u00e9e"
      : "Brouillon",
  ];

  const colW = (pageWidth - 2 * margin) / 4;
  let cx = margin;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  infoHeaders.forEach((h) => {
    pdf.rect(cx, y, colW, 8);
    pdf.text(h, cx + colW / 2, y + 5.5, { align: "center" });
    cx += colW;
  });
  y += 8;
  pdf.setFont("helvetica", "normal");
  cx = margin;
  infoValues.forEach((v) => {
    pdf.rect(cx, y, colW, 8);
    const wrapped = pdf.splitTextToSize(v, colW - 4);
    pdf.text(wrapped[0], cx + colW / 2, y + 5.5, { align: "center" });
    cx += colW;
  });
  y += 8;

  if (order.invoice_number) {
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("N\u00b0 Facture: ", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(order.invoice_number, margin + 25, y);
  }
  y += 14;

  // Items table
  const items: any[] = order.items || [];
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Articles", margin, y);
  y += 8;

  if (items.length > 0) {
    const headers = ["R\u00e9f.", "D\u00e9signation", "Qt\u00e9", "Prix U. HT", "Remise", "Total HT"];
    const colWidths = [20, 72, 15, 25, 18, 25];
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    cx = margin;
    headers.forEach((h, i) => {
      pdf.rect(cx, y, colWidths[i], 8);
      pdf.text(h, cx + colWidths[i] / 2, y + 5.5, { align: "center" });
      cx += colWidths[i];
    });
    y += 8;
    pdf.setFont("helvetica", "normal");
    items.forEach((item: any) => {
      const ref = String(item.reference || "");
      const designation = item.designation || item.nom || item.product_name || "N/A";
      const qty = Number(item.quantity || item.quantite || 0);
      const unitPrice = Number(item.unit_price_ht || item.prix_unitaire || 0);
      const discount = Number(item.discount || 0);
      const totalHT = Number(item.total_ht || qty * unitPrice);
      const values = [
        ref,
        designation,
        qty.toString(),
        `${unitPrice.toFixed(3)} DT`,
        discount > 0 ? `${discount}%` : "-",
        `${totalHT.toFixed(3)} DT`,
      ];
      cx = margin;
      values.forEach((v, i) => {
        pdf.rect(cx, y, colWidths[i], 8);
        if (i === 1) {
          const wrapped = pdf.splitTextToSize(v, colWidths[i] - 3);
          pdf.text(wrapped[0], cx + 2, y + 5.5);
        } else {
          pdf.text(v, cx + colWidths[i] / 2, y + 5.5, { align: "center" });
        }
        cx += colWidths[i];
      });
      y += 8;
      if (y > pageHeight - 40) { pdf.addPage(); y = 20; }
    });
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.text("Aucun article disponible", margin, y);
  }
  y += 12;

  // Totals box
  const boxX = pageWidth - 80;
  const subtotal = Number(order.subtotal || order.total || 0);
  const globalDiscount = Number(order.global_discount || 0);
  const total = Number(order.total || 0);
  const boxH = globalDiscount > 0 ? 36 : 26;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.roundedRect(boxX, y, 65, boxH, 2, 2, "S");
  if (globalDiscount > 0) {
    pdf.text("Sous-total HT:", boxX + 3, y + 10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${subtotal.toFixed(3)} DT`, boxX + 62, y + 10, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(`Remise (${globalDiscount}%):`, boxX + 3, y + 20);
    pdf.setFont("helvetica", "normal");
    pdf.text(`-${(subtotal * globalDiscount / 100).toFixed(3)} DT`, boxX + 62, y + 20, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text("Total HT:", boxX + 3, y + 30);
    pdf.text(`${total.toFixed(3)} DT`, boxX + 62, y + 30, { align: "right" });
  } else {
    pdf.text("Total HT:", boxX + 3, y + 10);
    pdf.text(`${total.toFixed(3)} DT`, boxX + 62, y + 10, { align: "right" });
  }

  // Footer
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.text("PNEU SHOP - Commande d'achat fournisseur", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.text(`G\u00e9n\u00e9r\u00e9 le ${new Date().toLocaleDateString("fr-FR")} \u00e0 ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  pdf.save(`achat-${order.order_number}.pdf`);
};

export default function AchatsCommandesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "responsable_achats") {
      router.push("/admin");
    }
  }, [user]);

  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data, isJson } = await safeResponseJson(response);
      if (response.ok && isJson) {
        setOrders(Array.isArray(data) ? data : data?.results || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-yellow-400 text-black hover:bg-yellow-400 border-0">Confirmée</Badge>;
      case "received":  return <Badge className="bg-black text-white hover:bg-black border-0">Reçue</Badge>;
      case "cancelled": return <Badge className="bg-white text-black border border-black hover:bg-white">Annulée</Badge>;
      default:          return <Badge variant="outline">{status || "Brouillon"}</Badge>;
    }
  };

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      (o.order_number || "").toLowerCase().includes(term) ||
      (o.supplier_name || "").toLowerCase().includes(term)
    );
  });

  const total     = orders.length;
  const confirmed = orders.filter((o) => o.status === "confirmed").length;
  const received  = orders.filter((o) => o.status === "received").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Commandes d&apos;Achat</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-black">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <Check className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-black">{confirmed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Reçues</CardTitle>
            <Truck className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-black">{received}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
            <Ban className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-black">{cancelled}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <Input
          placeholder="Rechercher par n° commande ou fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Aucune commande trouvée.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((order) => (
              <Card key={order.id} className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-sm">{order.order_number}</div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div><strong>Fournisseur:</strong> {order.supplier_name || order.supplier}</div>
                  <div><strong>Date:</strong> {order.order_date ? new Date(order.order_date).toLocaleDateString("fr-FR") : "N/A"}</div>
                  <div><strong>Semaine/Année:</strong> <span className="text-black font-medium">{order.week && order.year ? `${order.week}.${order.year}` : "N/A"}</span></div>
                  <div><strong>Total HT:</strong> <span className="text-black font-bold">{Number(order.total || 0).toFixed(3)} DT</span></div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline" className="gap-2"
                    disabled={downloading === order.id}
                    onClick={() => { setDownloading(order.id); handleDownloadAchat(order); setDownloading(null); }}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card>
              <CardHeader>
                <CardTitle>Liste des commandes d&apos;achat</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Commande</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Semaine/Année</TableHead>
                      <TableHead>Total HT</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell className="text-black">{order.supplier_name || order.supplier}</TableCell>
                        <TableCell>{order.order_date ? new Date(order.order_date).toLocaleDateString("fr-FR") : "N/A"}</TableCell>
                        <TableCell className="text-black font-medium">{order.week && order.year ? `${order.week}.${order.year}` : "N/A"}</TableCell>
                        <TableCell className="font-bold text-black">{Number(order.total || 0).toFixed(3)} DT</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" title="Télécharger PDF"
                            disabled={downloading === order.id}
                            onClick={() => { setDownloading(order.id); handleDownloadAchat(order); setDownloading(null); }}
                          >
                            {downloading === order.id
                              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                              : <Download className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
