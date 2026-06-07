"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/config";
import {
  RefreshCw, Download, Package, Check, Truck, Ban,
  Search, FileDown, Printer, TrendingUp, Building2,
  ChevronRight, Clock, Eye, X,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

// ── helpers ─────────────────────────────────────────────────────────────────
async function safeResponseJson(response: Response): Promise<{ data: any; isJson: boolean }> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json") && text.trim()) {
    try { return { data: JSON.parse(text), isJson: true }; }
    catch { return { data: null, isJson: false }; }
  }
  return { data: null, isJson: false };
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR");
};

const fmtCurrency = (v: number) =>
  parseFloat(String(v ?? 0)).toFixed(3) + " DT";

// ── PDF Generator ────────────────────────────────────────────────────────────
const handleDownloadAchat = (order: any) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  let y = 50.8;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("COMMANDE D'ACHAT", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(11);
  pdf.text(`N° ${order.order_number}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Informations de la commande", margin, y);
  y += 8;

  const infoHeaders = ["Fournisseur", "Date d'achat", "N° Facture", "Statut"];
  const infoValues = [
    order.supplier_name || `Fournisseur ${order.supplier}`,
    order.purchase_date ? fmtDate(order.purchase_date) : fmtDate(order.order_date),
    order.invoice_number || "—",
    STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label || order.status || "Brouillon",
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

  // Afficher N° BL si présent
  if (order.bl_number) {
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("N° BL : ", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(order.bl_number, margin + 18, y);
  }
  y += 14;

  const items: any[] = order.items || [];
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Articles", margin, y);
  y += 8;

  if (items.length > 0) {
    const headers = ["Réf.", "Désignation", "DOT", "Qté", "Prix U. HT", "Total HT"];
    const colWidths = [30, 60, 18, 12, 27, 28];
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
      const ref = String(item.reference || "—");
      const designation = item.designation || item.nom || item.product_name || "N/A";
      const dot = item.dot || "—";
      const qty = Number(item.quantity || item.quantite || 0);
      const unitPrice = Number(item.unit_price_ht || item.prix_unitaire || 0);
      const totalHT = Number(item.total_ht || qty * unitPrice);
      const values = [ref, designation, dot, qty.toString(), `${unitPrice.toFixed(3)} DT`, `${totalHT.toFixed(3)} DT`];
      cx = margin;
      values.forEach((v, i) => {
        pdf.rect(cx, y, colWidths[i], 8);
        if (i === 0 || i === 1) {
          // Ref and designation: left-aligned, clipped to column width
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

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.text("PNEU SHOP - Commande d'achat fournisseur", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  pdf.save(`achat-${order.order_number}.pdf`);
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: "Brouillon",  cls: "bg-gray-100    text-gray-600    border border-gray-200"   },
  confirmed: { label: "Confirmée",  cls: "bg-blue-100    text-blue-800    border border-blue-300"   },
  received:  { label: "Reçue",      cls: "bg-brand-gold-light text-brand-gold-dark border border-brand-gold"},
  cancelled: { label: "Annulée",    cls: "bg-brand-red-light text-brand-red border border-brand-red"},
};

const getStatusBadge = (status: string) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return (
    <span className={`inline-flex rounded-full px-3 py-0.5 text-xs ${cfg?.cls ?? "bg-gray-100 text-gray-600"}`}>
      {cfg?.label ?? status ?? "Brouillon"}
    </span>
  );
};

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const items: any[] = order.items || [];
  const total = Number(order.total || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900 px-6 py-4 shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Commande d'achat</p>
            <h2 className="text-white font-semibold text-lg">{order.order_number}</h2>
            <p className="text-gray-400 text-sm">{order.supplier_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b bg-gray-50 shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase">Fournisseur</p>
            <p className="font-semibold text-gray-900">{order.supplier_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date d'achat</p>
            <p className="font-semibold text-gray-900">
              {order.purchase_date ? fmtDate(order.purchase_date) : fmtDate(order.order_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">N° Facture</p>
            <p className="font-semibold text-gray-900">{order.invoice_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">DOT</p>
            <p className="font-semibold text-gray-900 font-mono text-sm">
              {(order.items || []).map((it: any) => it.dot).filter(Boolean).length > 0
                ? [...new Set((order.items || []).map((it: any) => it.dot).filter(Boolean))].join(" / ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Statut</p>
            {getStatusBadge(order.status)}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total HT</p>
            <p className="text-xl font-bold text-gray-900">{fmtCurrency(total)}</p>
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Articles ({items.length})
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="px-3 py-2 text-left">Réf.</th>
                <th className="px-3 py-2 text-left">Désignation</th>
                <th className="px-3 py-2 text-center">DOT</th>
                <th className="px-3 py-2 text-center">Empl.</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">P.U. HT</th>
                <th className="px-3 py-2 text-right">Fr. Livr.</th>
                <th className="px-3 py-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">Aucun article</td></tr>
              ) : items.map((item: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.reference || "—"}</td>
                  <td className="px-3 py-2">{item.designation || item.nom || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {item.dot
                      ? <span className="font-mono text-xs bg-yellow-100 text-yellow-800 rounded px-2 py-0.5 font-semibold">{item.dot}</span>
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-600">{item.emplacement || "—"}</td>
                  <td className="px-3 py-2 text-right">{item.quantity || item.quantite || 0}</td>
                  <td className="px-3 py-2 text-right">{Number(item.unit_price_ht || item.prix_unitaire || 0).toFixed(3)}</td>
                  <td className="px-3 py-2 text-right text-blue-600">{Number(item.frais_livraison || 0).toFixed(3)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(item.total_ht || 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100 transition">
            Fermer
          </button>
          <button
            onClick={() => handleDownloadAchat(order)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#FF8C00] hover:bg-[#CC7000] text-white transition"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AchatsCommandesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [detailOrder, setDetailOrder] = useState<any | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "responsable_achats") {
      router.push("/admin");
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

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

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Inline status update ──────────────────────────────────────────────────
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/purchase-orders/${orderId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`✅ Statut mis à jour : ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
    } catch {
      showToast("❌ Erreur lors de la mise à jour");
      fetchOrders();
    }
  };

  // ── Suppliers list for filter ────────────────────────────────────────────
  const suppliers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.supplier_name).filter(Boolean))).sort(),
    [orders]
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalValeur    = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const thisMonth      = new Date().getMonth();
  const thisYear       = new Date().getFullYear();
  const valeurMois     = orders
    .filter((o) => { const d = new Date(o.order_date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const nbFournisseurs = new Set(orders.map((o) => o.supplier)).size;
  const enAttente      = orders.filter((o) => o.status === "confirmed").length;

  // ── Filtered orders ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (o.order_number || "").toLowerCase().includes(term) ||
        (o.supplier_name || "").toLowerCase().includes(term) ||
        (o.invoice_number || "").toLowerCase().includes(term);

      const matchStatus = statusFilter === "tous" || o.status === statusFilter;
      const matchSupplier = !supplierFilter || o.supplier_name === supplierFilter;

      let matchDate = true;
      if (dateFrom || dateTo) {
        const d = new Date(o.order_date);
        if (dateFrom && d < new Date(dateFrom)) matchDate = false;
        if (dateTo && d > new Date(dateTo + "T23:59:59")) matchDate = false;
      }

      return matchSearch && matchStatus && matchSupplier && matchDate;
    });
  }, [orders, searchTerm, statusFilter, supplierFilter, dateFrom, dateTo]);

  const FILTER_TABS = [
    { key: "tous",      label: "Toutes",     count: orders.length },
    { key: "draft",     label: "Brouillons", count: orders.filter(o => o.status === "draft").length },
    { key: "confirmed", label: "Confirmées", count: orders.filter(o => o.status === "confirmed").length },
    { key: "received",  label: "Reçues",     count: orders.filter(o => o.status === "received").length },
    { key: "cancelled", label: "Annulées",   count: orders.filter(o => o.status === "cancelled").length },
  ];

  const totalFiltered = filtered.reduce((s, o) => s + Number(o.total || 0), 0);

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Achats Fournisseurs");

    ws.columns = [
      { header: "N° Commande",     key: "num",        width: 18 },
      { header: "Fournisseur",     key: "supplier",   width: 24 },
      { header: "Date d'achat",    key: "date",       width: 14 },
      { header: "N° Facture",      key: "invoice",    width: 18 },
      { header: "DOT",              key: "week",       width: 16 },
      { header: "Nb Articles",     key: "items",      width: 12 },
      { header: "Total HT (DT)",   key: "total",      width: 16 },
      { header: "Statut",          key: "status",     width: 14 },
    ];

    const hRow = ws.getRow(1);
    hRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    hRow.height = 20;
    hRow.alignment = { vertical: "middle", horizontal: "center" };

    filtered.forEach((o, i) => {
      const row = ws.addRow({
        num:      o.order_number,
        supplier: o.supplier_name || "",
        date:     o.purchase_date ? fmtDate(o.purchase_date) : fmtDate(o.order_date),
        invoice:  o.invoice_number || "—",
        week:     (o.items || []).map((it: any) => it.dot).filter(Boolean).length > 0
                    ? [...new Set((o.items || []).map((it: any) => it.dot).filter(Boolean))].join(" / ")
                    : "—",
        items:    (o.items || []).length,
        total:    parseFloat(Number(o.total || 0).toFixed(3)),
        status:   STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.label || o.status || "Brouillon",
      });
      if (i % 2 !== 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      row.getCell("total").font = { bold: true };
    });

    // Total row
    const totalRow = ws.addRow({ num: "TOTAL", total: parseFloat(totalFiltered.toFixed(3)) });
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };

    const dateStr = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Achats_${dateStr}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#FF8C00] text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Detail modal */}
      {detailOrder && <DetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes d'Achat</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des achats fournisseurs</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => fetchOrders(true)} disabled={refreshing} className="gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
          </Button>
          <Button size="sm" onClick={handleExportExcel} className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0">
            <FileDown className="w-4 h-4" /> Exporter l'historique (Excel)
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-gray-100 p-3">
              <TrendingUp className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmtCurrency(totalValeur)}</p>
              <p className="text-xs text-gray-500">Total achats</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmtCurrency(valeurMois)}</p>
              <p className="text-xs text-gray-500">Ce mois</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-gray-100 p-3">
              <Building2 className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{nbFournisseurs}</p>
              <p className="text-xs text-gray-500">Fournisseurs actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-orange-50 p-3">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enAttente}</p>
              <p className="text-xs text-gray-500">En attente réception</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="N° commande, fournisseur, facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Supplier */}
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les fournisseurs</option>
          {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Date range */}
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 text-sm" />
        <span className="text-gray-400 text-sm">→</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 text-sm" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              statusFilter === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? "bg-[#FF8C00] text-white" : "bg-gray-200 text-gray-600"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filtered.length}</span> commande{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
        </p>
        <p className="text-sm font-semibold text-gray-900">Total : {fmtCurrency(totalFiltered)}</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          Aucune commande trouvée
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.supplier_name}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date d'achat</span>
                    <span>{order.purchase_date ? fmtDate(order.purchase_date) : fmtDate(order.order_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facture</span>
                    <span className="font-mono text-xs">{order.invoice_number || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total HT</span>
                    <span className="font-bold">{fmtCurrency(Number(order.total || 0))}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setDetailOrder(order)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition">
                      <Eye className="h-4 w-4" /> Détail
                    </button>
                    <button onClick={() => { setDownloading(order.id); handleDownloadAchat(order); setDownloading(null); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FF8C00] hover:bg-[#CC7000] text-white text-sm font-semibold transition">
                      <Download className="h-4 w-4" /> PDF
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <CardHeader className="border-b bg-gray-50 py-3 px-6">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Liste des commandes ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase pl-6">N° Commande</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase">Fournisseur</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase">Date d'achat</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase">N° Facture</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">DOT</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">Articles</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase text-right">Total HT</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">Statut</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="hover:bg-yellow-50/40 transition-colors">
                      <TableCell className="pl-6">
                        <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{order.supplier_name || `#${order.supplier}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {order.purchase_date ? fmtDate(order.purchase_date) : fmtDate(order.order_date)}
                      </TableCell>
                      <TableCell>
                        {order.invoice_number
                          ? <span className="font-mono text-xs bg-gray-100 rounded px-2 py-0.5">{order.invoice_number}</span>
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-700 font-mono">
                        {(order.items || []).map((it: any) => it.dot).filter(Boolean).length > 0
                          ? [...new Set((order.items || []).map((it: any) => it.dot).filter(Boolean))].join(" / ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          {(order.items || []).length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {fmtCurrency(Number(order.total || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <select
                          value={order.status || "draft"}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`rounded-full px-3 py-0.5 text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                            order.status === "confirmed" ? "bg-blue-100 text-blue-800 border-blue-300" :
                            order.status === "received"  ? "bg-brand-gold-light text-brand-gold-dark border-brand-gold" :
                            order.status === "cancelled" ? "bg-brand-red-light text-brand-red border-brand-red" :
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          <option value="draft">Brouillon</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="received">Reçue</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> Voir
                          </button>
                          <button
                            onClick={() => { setDownloading(order.id); handleDownloadAchat(order); setDownloading(null); }}
                            disabled={downloading === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8C00] hover:bg-[#CC7000] text-white transition disabled:opacity-60"
                          >
                            {downloading === order.id
                              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                              : <Download className="h-3.5 w-3.5" />
                            }
                            PDF
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
