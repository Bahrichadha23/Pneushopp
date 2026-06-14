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
import { Download, Search, FileText, FileDown, CreditCard, Printer, FilePlus, Eye, X } from "lucide-react";
import ExcelJS from "exceljs";
import PayerFactureModal, { PAYMENT_LABELS } from "@/components/admin/payer-facture-modal";
import SaisirFactureModal from "@/components/admin/saisir-facture-modal";
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

// Statut de paiement affiché : Payée / Non payée
const isPaid = (order: Order) => order.paymentStatus === "paid";

// Montant total payé, en agrégeant tous les modes pour les paiements multi-modalités
const getPaidAmount = (order: Order): number => {
  const total = order.totalAmount + (order.deliveryCost || 0);
  const pd = order.paymentDetails;
  if (!pd) return isPaid(order) ? total : 0;

  if (order.paymentMethod === "mixed") {
    return (
      (pd.especesAmountPaid || 0) +
      (pd.criAmountPaid || 0) +
      (pd.transferAmountPaid || 0) +
      (pd.chequeAmountPaid || 0) +
      (pd.lettreAmountPaid || 0) +
      (pd.codAmountPaid || 0)
    );
  }
  if (order.paymentMethod === "cri") return pd.criAmountPaid || 0;
  if (order.paymentMethod === "bank_transfer") return pd.transferAmountPaid || 0;
  if (order.paymentMethod === "lettre_de_change") return pd.lettreAmountPaid || 0;
  if (order.paymentMethod === "cheque" || order.paymentMethod === "check") return pd.chequeAmountPaid || 0;
  if (order.paymentMethod === "cash_on_delivery") return pd.codAmountPaid || 0;
  if (order.paymentMethod === "especes") return pd.especesAmountPaid || total;
  return isPaid(order) ? total : 0;
};

const getRemainingAmount = (order: Order): number =>
  Math.max(order.totalAmount + (order.deliveryCost || 0) - getPaidAmount(order), 0);

const fps = (n: string) => (n || "").replace(/^CPS/i, "FPS");

export default function FacturesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchClient, setSearchClient] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchPaymentStatus, setSearchPaymentStatus] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [showSaisirFacture, setShowSaisirFacture] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Role guard
  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user]);

  const loadOrders = () => {
    setLoading(true);
    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
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

      const matchesInvoice =
        searchInvoice === "" ||
        fps(o.orderNumber).toLowerCase().includes(searchInvoice.toLowerCase());

      const matchesPaymentStatus =
        searchPaymentStatus === "" ||
        (searchPaymentStatus === "paid" ? isPaid(o) : !isPaid(o));

      return matchesClient && matchesDate && matchesInvoice && matchesPaymentStatus;
    });
  }, [orders, searchClient, searchDate, searchInvoice, searchPaymentStatus]);

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

  const [printing, setPrinting] = useState<string | null>(null);

  const handlePrint = async (order: Order) => {
    setPrinting(order.id);
    try {
      await handleDownloadInvoice(order, "print");
    } finally {
      setPrinting(null);
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
      { header: "Mode de paiement", key: "payment_method", width: 20 },
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
          payment: isPaid(order) ? "Payée" : "Non payée",
          payment_method: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "",
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
            payment: idx === 0 ? (isPaid(order) ? "Payée" : "Non payée") : "",
            payment_method: idx === 0 ? (PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "") : "",
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
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowSaisirFacture(true)} className="gap-2 bg-[#FF8C00] hover:bg-[#E67E00] text-white border-0">
            <FilePlus className="h-4 w-4" />
            Saisir une facture
          </Button>
          <Button onClick={handleExportExcel} className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0">
            <FileDown className="h-4 w-4" />
            Exporter l'historique (Excel)
          </Button>
        </div>
      </div>

      {/* Search filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
            placeholder="N° facture..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            className="w-full sm:w-40"
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
        <div>
          <select
            value={searchPaymentStatus}
            onChange={(e) => setSearchPaymentStatus(e.target.value)}
            className="w-full sm:w-44 h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="paid">Payée</option>
            <option value="unpaid">Non payée</option>
          </select>
        </div>
        {(searchClient || searchDate || searchInvoice || searchPaymentStatus) && (
          <Button
            variant="ghost"
            onClick={() => { setSearchClient(""); setSearchDate(""); setSearchInvoice(""); setSearchPaymentStatus(""); }}
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
                  <TableHead>Mode de paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—"}
                    </TableCell>
                    <TableCell>
                      {isPaid(order) ? (
                        <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                          Payée
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-50 text-[#FF8C00] border border-orange-200 hover:bg-orange-50">
                          Non payée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingOrder(order)}
                          className="gap-2"
                          title="Voir les détails de la facture et du paiement"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(order)}
                          disabled={downloading === order.id}
                          className="gap-2 bg-[#FF8C00] hover:bg-[#E67E00] text-white border-0"
                        >
                          {downloading === order.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(order)}
                          disabled={printing === order.id}
                          className="gap-2"
                        >
                          {printing === order.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Printer className="w-4 h-4" />
                          )}
                          Imprimer
                        </Button>
                        {!isPaid(order) && (
                          <Button
                            size="sm"
                            onClick={() => setPayingOrder(order)}
                            className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0"
                          >
                            <CreditCard className="w-4 h-4" />
                            Payer
                          </Button>
                        )}
                      </div>
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
                  {isPaid(order) ? (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                      Payée
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-50 text-[#FF8C00] border border-orange-200 hover:bg-orange-50">
                      Non payée
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                <p className="text-xs text-gray-500">
                  Mode : {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—"}
                </p>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingOrder(order)}
                      className="gap-2"
                      title="Voir les détails de la facture et du paiement"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(order)}
                      disabled={printing === order.id}
                      className="gap-2"
                    >
                      {printing === order.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      Imprimer
                    </Button>
                    {!isPaid(order) && (
                      <Button
                        size="sm"
                        onClick={() => setPayingOrder(order)}
                        className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0"
                      >
                        <CreditCard className="w-4 h-4" />
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewingOrder && (() => {
        const pd = viewingOrder.paymentDetails;
        const total = viewingOrder.totalAmount + (viewingOrder.deliveryCost || 0);
        const paid = getPaidAmount(viewingOrder);
        const remaining = getRemainingAmount(viewingOrder);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-2xl text-xs">
              <div className="sticky top-0 flex items-center justify-between border-b bg-slate-800 px-4 py-2.5">
                <h2 className="text-sm font-semibold text-white">
                  Facture #{fps(viewingOrder.orderNumber)}
                </h2>
                <button onClick={() => setViewingOrder(null)} className="text-slate-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded border border-slate-200">
                    <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Facture</div>
                    <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                      <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">N° Facture :</span><span>{fps(viewingOrder.orderNumber)}</span></div>
                      <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Date :</span><span>{formatDate(viewingOrder.createdAt)}</span></div>
                      <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Méthode :</span><span>{PAYMENT_LABELS[viewingOrder.paymentMethod] || viewingOrder.paymentMethod || "-"}</span></div>
                      <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Statut :</span><span>{isPaid(viewingOrder) ? "Payée" : "Non payée"}</span></div>
                      {viewingOrder.commercial && (
                        <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Commercial :</span><span>{viewingOrder.commercial}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="rounded border border-slate-200">
                    <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Client</div>
                    <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                      <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Nom :</span><span>{viewingOrder.customerName || "-"}</span></div>
                      <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Tél :</span><span>{viewingOrder.customerPhone || "-"}</span></div>
                      <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Email :</span><span>{viewingOrder.customerEmail || "-"}</span></div>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Désignation</th>
                        <th className="px-2 py-1.5 text-right font-semibold w-14">Qté</th>
                        <th className="px-2 py-1.5 text-right font-semibold w-24">P.U. TTC</th>
                        <th className="px-2 py-1.5 text-right font-semibold w-24">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingOrder.items || []).length === 0 ? (
                        <tr><td colSpan={5} className="px-2 py-3 text-center text-slate-400">Aucun article</td></tr>
                      ) : (
                        viewingOrder.items.map((item, index) => (
                          <tr key={`${viewingOrder.id}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-2 py-1 text-slate-500">{index + 1}</td>
                            <td className="px-2 py-1">{item.productName}</td>
                            <td className="px-2 py-1 text-right">{item.quantity}</td>
                            <td className="px-2 py-1 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-2 py-1 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Détails paiement */}
                  <div className="rounded border border-slate-200">
                    <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Détails Paiement</div>
                    <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                      {!pd ? (
                        <div className="text-slate-400 italic">Aucune information de paiement</div>
                      ) : viewingOrder.paymentMethod === "mixed" ? (
                        <>
                          {pd.especesAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">Espèces</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.especesAmountPaid)}</div>
                            {pd.especesRemarque && <div><span className="font-semibold">Remarque :</span> {pd.especesRemarque}</div>}
                          </>)}
                          {pd.codAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">TPE à la livraison</div>
                            <div><span className="font-semibold">N° Auth :</span> {pd.codAuthorizationNumber || "-"}</div>
                            <div><span className="font-semibold">Banque :</span> {pd.codBankName || "-"}</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.codAmountPaid)}</div>
                          </>)}
                          {pd.transferAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">Virement</div>
                            <div><span className="font-semibold">N° Virement :</span> {pd.transferNumber || "-"}</div>
                            <div><span className="font-semibold">Banque :</span> {pd.transferBankName || "-"}</div>
                            <div><span className="font-semibold">Titulaire :</span> {pd.transferHolderName || "-"}</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.transferAmountPaid)}</div>
                          </>)}
                          {pd.chequeAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">Chèque</div>
                            <div><span className="font-semibold">N° Chèque :</span> {pd.chequeNumber || "-"}</div>
                            <div><span className="font-semibold">Date :</span> {pd.chequeDate || "-"}</div>
                            <div><span className="font-semibold">Banque :</span> {pd.chequeBankName || "-"}</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.chequeAmountPaid)}</div>
                          </>)}
                          {pd.lettreAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">Lettre de change</div>
                            <div><span className="font-semibold">N° Lettre :</span> {pd.lettreNumber || "-"}</div>
                            <div><span className="font-semibold">Date :</span> {pd.lettreDate || "-"}</div>
                            <div><span className="font-semibold">Banque :</span> {pd.lettreBankName || "-"}</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.lettreAmountPaid)}</div>
                          </>)}
                          {pd.criAmountPaid > 0 && (<>
                            <div className="font-semibold text-slate-500 mt-1">CRI</div>
                            <div><span className="font-semibold">Montant :</span> {formatCurrency(pd.criAmountPaid)}</div>
                            {pd.criRemarque && <div><span className="font-semibold">Remarque :</span> {pd.criRemarque}</div>}
                          </>)}
                        </>
                      ) : viewingOrder.paymentMethod === "bank_transfer" ? (
                        <>
                          <div><span className="font-semibold">N° Virement :</span> {pd.transferNumber || "-"}</div>
                          <div><span className="font-semibold">Banque :</span> {pd.transferBankName || "-"}</div>
                          <div><span className="font-semibold">Titulaire :</span> {pd.transferHolderName || "-"}</div>
                        </>
                      ) : viewingOrder.paymentMethod === "lettre_de_change" ? (
                        <>
                          <div><span className="font-semibold">N° Lettre :</span> {pd.lettreNumber || "-"}</div>
                          <div><span className="font-semibold">Date :</span> {pd.lettreDate || "-"}</div>
                          <div><span className="font-semibold">Banque :</span> {pd.lettreBankName || "-"}</div>
                          <div><span className="font-semibold">RIB :</span> {pd.lettreRib || "-"}</div>
                          <div><span className="font-semibold">Lieu :</span> {pd.lettreLieu || "-"}</div>
                        </>
                      ) : (viewingOrder.paymentMethod === "cheque" || viewingOrder.paymentMethod === "check") ? (
                        <>
                          <div><span className="font-semibold">N° Chèque :</span> {pd.chequeNumber || "-"}</div>
                          <div><span className="font-semibold">Date :</span> {pd.chequeDate || "-"}</div>
                          <div><span className="font-semibold">Banque :</span> {pd.chequeBankName || "-"}</div>
                        </>
                      ) : viewingOrder.paymentMethod === "cash_on_delivery" ? (
                        <>
                          <div><span className="font-semibold">N° Autorisation :</span> {pd.codAuthorizationNumber || "-"}</div>
                          <div><span className="font-semibold">Banque :</span> {pd.codBankName || "-"}</div>
                        </>
                      ) : viewingOrder.paymentMethod === "cri" ? (
                        <div><span className="font-semibold">Remarque :</span> {pd.criRemarque || "-"}</div>
                      ) : viewingOrder.paymentMethod === "especes" ? (
                        <div>Paiement en espèces{pd.especesRemarque ? ` — ${pd.especesRemarque}` : ""}</div>
                      ) : (
                        <div>{PAYMENT_LABELS[viewingOrder.paymentMethod] || viewingOrder.paymentMethod || "-"}</div>
                      )}
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="rounded border border-slate-200">
                    <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Totaux</div>
                    <div className="px-2 py-1.5 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Montant Facture</span>
                        <span className="font-semibold">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span>Montant Payé</span>
                        <span className="font-semibold">{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 text-slate-700">
                        <span className="font-semibold">Reste à payer</span>
                        <span className="font-bold">{formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-2">
                  <Button size="sm" onClick={() => setViewingOrder(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">Fermer</Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {payingOrder && (
        <PayerFactureModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={() => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payingOrder.id ? { ...o, paymentStatus: "paid" } : o
              )
            );
            setPayingOrder(null);
          }}
        />
      )}

      {showSaisirFacture && (
        <SaisirFactureModal
          onClose={() => setShowSaisirFacture(false)}
          onCreated={() => {
            setShowSaisirFacture(false);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}