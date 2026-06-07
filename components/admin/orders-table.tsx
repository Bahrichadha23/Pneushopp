"use client";

import React from "react";
import { useState, useEffect } from "react";
import type { Order } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, Truck, Search, Package, Download, X, Check, Ban, Loader2, Calendar } from "lucide-react";
import { API_URL } from "@/lib/config";
import { createPurchaseOrder } from "@/lib/services/purchase-order";
import { motion, AnimatePresence } from "framer-motion";
interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  onEditOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: Order["status"]) => void;
}
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import ReactDOMServer from "react-dom/server";

export async function handleDownloadInvoice(order: any) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;

  // === Utility: Draw cell with flexible borders ===
  const drawCell = (
    x: number,
    y: number,
    w: number,
    h: number,
    options: {
      top?: boolean;
      bottom?: boolean;
      left?: boolean;
      right?: boolean;
    } = {}
  ) => {
    const { top = false, bottom = false, left = true, right = true } = options;
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.1);
    if (top) pdf.line(x, y, x + w, y);
    if (bottom) pdf.line(x, y + h, x + w, y + h);
    if (left) pdf.line(x, y, x, y + h);
    if (right) pdf.line(x + w, y, x + w, y + h);
  };

  let y = 50.8; // 2 inches top margin (1 inch = 25.4 mm)
  let page = 1;

  // === Header ===
  const addHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(`FACTURE FPS${order.orderNumber?.replace(/^CPS/, '') || ""}`, margin, y);
    pdf.setFontSize(8);
    pdf.text(
      ` ${new Date(order.createdAt).toLocaleDateString("fr-FR")}`,
      margin,
      y + 5
    );

    // Client box (rounded)
    const boxX = pageWidth - 68;
    const boxY = y - 12;
    const boxW = 58;
    const hasWarranty = !!order.warrantyInfo?.accepted;
    const boxH = hasWarranty ? 44 : 36;
    pdf.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "S");

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Client", boxX + 2, boxY + 5);

    pdf.setFont("helvetica", "normal");
    pdf.text(order.customerName || "-", boxX + 18, boxY + 5);
    pdf.text(`Id. Fiscale : ${order.id || "-"}`, boxX + 2, boxY + 10);
    pdf.text(`Tel : ${order.customerPhone || "-"}`, boxX + 2, boxY + 15);
    pdf.text(
      `Matricule : ${order.warrantyInfo?.vehicleRegistration || "-"}`,
      boxX + 2,
      boxY + 20
    );
    pdf.text(
      `Kilométrage: ${order.warrantyInfo?.vehicleMileage || "-"}`,
      boxX + 2,
      boxY + 25
    );

    // Warranty badge at the bottom of the client box
    if (hasWarranty) {
      pdf.setFillColor(220, 220, 220);
      pdf.roundedRect(boxX + 2, boxY + 29, boxW - 4, 9, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("AVEC GARANTIE", boxX + boxW / 2, boxY + 35, { align: "center" });
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
    }
    pdf.setFontSize(7);
    pdf.text(`Page ${page}`, margin, pageHeight - 10);
    // Ensure table starts AFTER the client box (boxY + boxH + margin)
    const boxBottom = boxY + boxH + 8;
    y = Math.max(y + 30, boxBottom);
    pdf.setFont("helvetica", "bold");
  };

  addHeader();

  // === Table Headers ===
  const headers = [
    { text: "REF.", width: 20 },
    { text: "DESIGNATION", width: 50 },
    { text: "QTE", width: 15 },
    { text: "PU", width: 20 },
    { text: "TVA (%)", width: 18 },
    { text: "REM (%)", width: 18 },
    { text: "Mnt HT", width: 22 },
    { text: "Mnt TTC", width: 22 },
  ];

  const drawTableHeader = () => {
    let x = margin;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    headers.forEach((h) => {
      pdf.text(h.text, x + 2, y);
      drawCell(x, y - 5, h.width, 8, {
        top: true,
        bottom: true,
        left: true,
        right: true,
      });
      x += h.width;
    });
    y += 8;
  };

  drawTableHeader();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  // === Table Rows ===
  let totalHT = 0,
    totalRemise = 0,
    totalTVA = 0;
  let currentRow = 0;

  const addRow = (item?: any, isEmpty = false) => {
    let h = 8;
    let wrappedText: string[] = [];
    let tireSpec = "-";
    let unitHT = 0, montantHT = 0, montantTVA = 0, montantTTC = 0;
    let qty = 1, remise = 0;
    const tvaRate = 19;
    const lineHeight = 4;

    // === Pre-calculate row height and values BEFORE any drawing ===
    if (!isEmpty && item) {
      const unitTTC = Number(item.unitPrice || 0);
      qty = Number(item.quantity || 1);
      remise = Number(item.discount || 0);

      unitHT = unitTTC / (1 + tvaRate / 100);
      const unitHTAfterRemise = unitHT * (1 - remise / 100);
      montantHT = unitHTAfterRemise * qty;
      montantTVA = montantHT * (tvaRate / 100);
      montantTTC = unitTTC * qty;

      const productName = item.productName || "-";
      const maxWidth = headers[1].width - 4;
      wrappedText = pdf.splitTextToSize(productName, maxWidth);
      const textHeight = wrappedText.length * lineHeight;
      if (textHeight > h) h = textHeight + 2;

      // Extract tire specification
      const tireSpecMatch = productName.match(/(\d{3}\/\d{2}\s+R\s*\d{1,2}[A-Z]*)/i);
      if (tireSpecMatch) {
        tireSpec = tireSpecMatch[1].replace(/\s+/g, ' ').trim();
      } else if (item.specifications && /\d+\/\d+\s+R\s*\d+[A-Z]*/.test(item.specifications)) {
        tireSpec = item.specifications;
      } else {
        tireSpec = item.specifications || "-";
      }
    }

    // === Page break check BEFORE drawing anything ===
    if (y + h > pageHeight - 50) {
      pdf.addPage();
      page++;
      y = 20;
      addHeader();
      drawTableHeader();
      pdf.setFont("helvetica", "normal");
      currentRow = 0;
    }

    // === Now draw text and borders at correct y position ===
    if (!isEmpty && item) {
      totalHT += montantHT;
      totalRemise += (unitHT - unitHT * (1 - remise / 100)) * qty;
      totalTVA += montantTVA;

      let x = margin;
      pdf.text(tireSpec, x, y + 5);
      x += headers[0].width;

      wrappedText.forEach((line: string, index: number) => {
        pdf.text(line, x + 2, y + 5 + (index * lineHeight));
      });
      x += headers[1].width;

      pdf.text(qty.toFixed(2), x + headers[2].width / 2, y + 5, { align: "center" });
      x += headers[2].width;

      pdf.text(unitHT.toFixed(3), x + headers[3].width - 2, y + 5, { align: "right" });
      x += headers[3].width;

      pdf.text(tvaRate.toFixed(0), x + headers[4].width / 2, y + 5, { align: "center" });
      x += headers[4].width;

      pdf.text(remise.toFixed(0), x + headers[5].width / 2, y + 5, { align: "center" });
      x += headers[5].width;

      pdf.text((montantHT || 0).toFixed(3), x + headers[6].width - 2, y + 5, { align: "right" });
      x += headers[6].width;

      pdf.text((montantTTC || 0).toFixed(3), x + headers[7].width - 2, y + 5, { align: "right" });
    }

    // Draw borders
    let x = margin;
    headers.forEach((hdr) => {
      drawCell(x, y, hdr.width, h, {
        top: currentRow === 0,
        left: true,
        right: true,
      });
      x += hdr.width;
    });

    y += h;
    currentRow++;
  };

  order.items?.forEach((item: any) => addRow(item));
  // Fill at least 8 rows minimum on the last page
  const minRowsOnLastPage = 8;
  while (currentRow < minRowsOnLastPage) addRow(undefined, true);

  const tableWidth = headers.reduce((sum, h) => sum + h.width, 0);
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, margin + tableWidth, y);

  y += 10; // space after last row

  const deliveryCost = Number(order.deliveryCost || 0);
  const netHT = totalHT - totalRemise + deliveryCost;
  const totalTTC = netHT + totalTVA + 1;

  // === Inline “QUATRE CENT …” + Vertical Totals ===
  const boxY = y + 5;
  const boxH = 14;
  const totalRowH = 7;
  const totalTableX = pageWidth - 85;


  // === Vertical Totals table (right side, inline with QUATRE box) ===
  const totals: [string, string][] = [
    ["TOTAL HT", totalHT.toFixed(3)],
    ...(totalRemise > 0.001 ? [["TOTAL REMISE", totalRemise.toFixed(3)] as [string, string]] : []),
    ["FRAIS LIVRAISON", deliveryCost.toFixed(3)],
    ["TOTAL NET HT", netHT.toFixed(3)],
    ["TOTAL T.V.A", totalTVA.toFixed(3)],
    ["Timbre", "1.000"],
    ["TOTAL T.T.C", totalTTC.toFixed(3)],
  ];

  let totalY = boxY;
  totals.forEach(([label, val]) => {
    const isBold = label.includes("TOTAL T.T.C");
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    drawCell(totalTableX, totalY, 40, totalRowH, {
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
    drawCell(totalTableX + 40, totalY, 40, totalRowH, {
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
    pdf.text(label, totalTableX + 2, totalY + 5);
    pdf.text(val, totalTableX + 78, totalY + 5, { align: "right" });
    totalY += totalRowH;
  });

  pdf.setFont("helvetica", "italic");
  pdf.text("Cachet et Signature", margin + 5, pageHeight - 20);

  const invoiceFileName = `fps${(order.orderNumber || "").replace(/^CPS/i, "")}.pdf`;
  pdf.save(invoiceFileName);
}

interface DotBatch {
  id: number;
  quantity: number;
  dot: string;
  dot_date: string | null;
  emplacement: string;
  notes: string;
}

/** Convert stored CPS prefix → display FPS prefix */
const fps = (n: string) => (n || "").replace(/^CPS/i, "FPS");

export default function OrdersTable({
  orders,
  onViewOrder,
  onEditOrder,
  onUpdateStatus,
}: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // DOT confirmation modal state
  const [dotConfirmOrder, setDotConfirmOrder] = useState<Order | null>(null);
  const [dotBatches, setDotBatches] = useState<Record<string, DotBatch[]>>({});
  const [dotSelections, setDotSelections] = useState<Record<number, { batchId: number; qty: number; discount?: number }>>({});
  const [loadingDotBatches, setLoadingDotBatches] = useState(false);
  const [confirmingDot, setConfirmingDot] = useState(false);
  const [dotConfirmError, setDotConfirmError] = useState<string | null>(null);
  const [preFilledFromPrep, setPreFilledFromPrep] = useState(false);
  const [creatingPurchaseOrder, setCreatingPurchaseOrder] = useState<
    string | null
  >(null);
  const [purchaseOrderCreated, setPurchaseOrderCreated] = useState<Set<string>>(
    () => {
      // Load from localStorage on initial mount
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("purchaseOrderCreated");
        if (saved) {
          try {
            return new Set(JSON.parse(saved));
          } catch (e) {
            return new Set();
          }
        }
      }
      return new Set();
    }
  );

  // Save to localStorage whenever purchaseOrderCreated changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "purchaseOrderCreated",
        JSON.stringify(Array.from(purchaseOrderCreated))
      );
    }
  }, [purchaseOrderCreated]);

  const handleCreatePurchaseOrder = async (order: Order) => {
    if (creatingPurchaseOrder) return;

    setCreatingPurchaseOrder(order.id);

    try {
      const result = await createPurchaseOrder(order);
      if (result.success) {
        alert(result.message);
        // Mark this order as having a purchase order created
        setPurchaseOrderCreated((prev) => new Set(prev).add(order.id));
      } else {
        alert(result.message || "Erreur lors de la création");
      }
    } catch (error) {
      alert("Erreur lors de la création du bon de commande");
    } finally {
      setCreatingPurchaseOrder(null);
    }
  };

  const handleOpenDotConfirm = async (order: Order) => {
    setDotConfirmOrder(order);
    setDotConfirmError(null);
    setLoadingDotBatches(true);

    // Check for pre-assigned DOTs from OrderPrepPanel
    let preSelections: Record<number, { batchId: number; qty: number; discount?: number }> = {};
    let hasPrepData = false;
    try {
      const saved = localStorage.getItem(`order_prep_${order.id}`);
      if (saved) {
        const savedArr: Array<{ itemIndex: number; batchId: number | null; qty: number; discount: number; confirmed: boolean }> = JSON.parse(saved);
        savedArr.forEach(sa => {
          if (sa.confirmed && sa.batchId) {
            preSelections[sa.itemIndex] = { batchId: sa.batchId, qty: sa.qty, discount: sa.discount };
            hasPrepData = true;
          }
        });
      }
    } catch {}

    // Read delivery cost saved from OrderPrepPanel
    try {
      const savedDelivery = localStorage.getItem(`order_delivery_${order.id}`);
      if (savedDelivery !== null) {
        const dv = parseFloat(savedDelivery);
        if (!isNaN(dv)) {
          // Store on the order object for use in handleDotConfirm
          (order as any)._prepDeliveryCost = dv;
        }
      }
    } catch {}

    setDotSelections(preSelections);
    setPreFilledFromPrep(hasPrepData);

    const batchMap: Record<string, DotBatch[]> = {};
    const uniqueProductIds = [...new Set(order.items.map((item) => item.productId).filter(Boolean))];

    await Promise.all(
      uniqueProductIds.map(async (productId) => {
        try {
          const token = localStorage.getItem("access_token");
          const res = await fetch(`${API_URL}/admin/products/${productId}/dot-batches/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          batchMap[productId] = res.ok ? await res.json() : [];
        } catch {
          batchMap[productId] = [];
        }
      })
    );

    setDotBatches(batchMap);
    setLoadingDotBatches(false);
  };

  const handleDotConfirm = async () => {
    if (!dotConfirmOrder) return;
    setConfirmingDot(true);
    setDotConfirmError(null);

    try {
      const token = localStorage.getItem("access_token");
      const dot_assignments = dotConfirmOrder.items.map((item, idx) => {
        const sel = dotSelections[idx];
        return {
          product_id: parseInt(item.productId) || item.productId,
          batch_id: sel?.batchId,
          quantity: sel?.qty ?? item.quantity,
          discount: sel?.discount ?? 0,
        };
      });

      const prepDeliveryCost = (dotConfirmOrder as any)._prepDeliveryCost;
      const body: Record<string, any> = { dot_assignments };
      if (prepDeliveryCost !== undefined) {
        body.delivery_cost = prepDeliveryCost;
      }

      const res = await fetch(`${API_URL}/orders/${dotConfirmOrder.id}/confirm-with-dot/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la confirmation");
      }

      // Clear prep data from localStorage
      localStorage.removeItem(`order_prep_${dotConfirmOrder.id}`);
      localStorage.removeItem(`order_delivery_${dotConfirmOrder.id}`);

      setDotConfirmOrder(null);
      setPreFilledFromPrep(false);
      // Notify parent to refresh orders (status is now confirmed server-side)
      onUpdateStatus(dotConfirmOrder.id, "confirmed");
    } catch (err: any) {
      setDotConfirmError(err.message);
    } finally {
      setConfirmingDot(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount) + " DT";
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const getStatusBadge = (status: Order["status"]) => {
    const styles: Record<string, string> = {
      pending:    "bg-amber-500    text-white",   // Ambre — en attente
      confirmed:  "bg-[#0066CC]   text-white",   // Bleu  — confirmée
      processing: "bg-[#FF8C00]   text-white",   // Orange — en cours
      shipped:    "bg-gray-500    text-white",   // Gris  — expédiée
      delivered:  "bg-[#A68823]   text-white",   // Or    — livrée
      cancelled:  "bg-[#9B2226]   text-white",   // Rouge — annulée
    };

    const labels: Record<string, string> = {
      pending:    "En attente",
      confirmed:  "Confirmée",
      processing: "En cours",
      shipped:    "Expédiée",
      delivered:  "Livrée",
      cancelled:  "Annulée",
    };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-gray-500 text-white"}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: Order["paymentStatus"]) => {
    const styles: Record<string, string> = {
      pending:  "bg-amber-500  text-white",
      paid:     "bg-[#A68823]  text-white",
      failed:   "bg-[#9B2226]  text-white",
      refunded: "bg-gray-500   text-white",
    };
    const labels: Record<string, string> = {
      pending:  "En attente",
      paid:     "Payé",
      failed:   "Échec",
      refunded: "Remboursé",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-gray-500 text-white"}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  // Get unique years from orders
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    orders.forEach(order => {
      const year = new Date(order.createdAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // descending order
  }, [orders]);

  // Filtrage
  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = searchTerm.replace(/^fps/i, "CPS");
    const matchesSearch =
      fps(order.orderNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesYear =
      yearFilter === "all" || new Date(order.createdAt).getFullYear().toString() === yearFilter;
    return matchesSearch && matchesStatus && matchesYear;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro, client, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>


        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b border-gray-200">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Numéro</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow key={order.id}>
                  <TableCell className="font-bold text-[#0066CC]">
                    #{fps(order.orderNumber)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400">
                        {order.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="font-bold text-[#A68823]">
                    {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                        title="Voir détails"
                        className="text-[#0066CC] hover:text-[#004E9E] hover:bg-[#E3F0FF]"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {["pending", "processing"].includes(order.status) && (
                        <Button
                          size="sm"
                          className="bg-[#FF8C00] hover:bg-[#CC7000] text-white h-7 px-3 text-xs gap-1 border-0"
                          onClick={() => handleOpenDotConfirm(order)}
                          title="Confirmer la commande"
                        >
                          <Check className="h-3 w-3" /> Confirmer
                        </Button>
                      )}

                      {["pending", "confirmed", "processing"].includes(order.status) && (
                        <Button
                          size="sm"
                          className="bg-[#9B2226] hover:bg-[#730019] text-white h-7 px-3 text-xs gap-1 border-0"
                          onClick={() => onUpdateStatus(order.id, "cancelled")}
                          title="Annuler la commande"
                        >
                          <Ban className="h-3 w-3" /> Annuler
                        </Button>
                      )}

                      {order.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateStatus(order.id, "shipped")}
                          title="Marquer comme expédiée"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      )}

                      {order.status === "processing" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCreatePurchaseOrder(order)}
                          disabled={
                            creatingPurchaseOrder === order.id ||
                            purchaseOrderCreated.has(order.id)
                          }
                          title={
                            purchaseOrderCreated.has(order.id)
                              ? "Bon de commande déjà créé"
                              : "Créer bon de commande"
                          }
                        >
                          {creatingPurchaseOrder === order.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Package
                              className={`h-4 w-4 ${
                                purchaseOrderCreated.has(order.id)
                                  ? "text-brand-gold"
                                  : ""
                              }`}
                            />
                          )}
                        </Button>
                      )}

                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {filteredOrders.map((order) => (
          <React.Fragment key={order.id}>
            <div
              key={order.id}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[#0066CC]">#{fps(order.orderNumber)}</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-xs text-gray-400">{order.customerEmail}</p>
              </div>
              <div className="mt-2 text-sm text-gray-500 space-y-0.5">
                <p>Date: {formatDate(order.createdAt)}</p>
                <p>Montant: <span className="font-bold text-[#A68823]">{formatCurrency(order.totalAmount + (order.deliveryCost || 0))}</span></p>
                <p>Paiement: {getPaymentStatusBadge(order.paymentStatus)}</p>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrder(order)}
                  className="text-[#0066CC] hover:text-[#004E9E] hover:bg-[#E3F0FF]"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {["pending", "processing"].includes(order.status) && (
                  <Button
                    size="sm"
                    className="bg-[#FF8C00] hover:bg-[#CC7000] text-white h-7 px-3 text-xs gap-1 border-0"
                    onClick={() => onUpdateStatus(order.id, "confirmed")}
                  >
                    <Check className="h-3 w-3" /> Confirmer
                  </Button>
                )}

                {["pending", "confirmed", "processing"].includes(order.status) && (
                  <Button
                    size="sm"
                    className="bg-[#9B2226] hover:bg-[#730019] text-white h-7 px-3 text-xs gap-1 border-0"
                    onClick={() => onUpdateStatus(order.id, "cancelled")}
                  >
                    <Ban className="h-3 w-3" /> Annuler
                  </Button>
                )}

                {order.status === "confirmed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateStatus(order.id, "shipped")}
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                )}

                {order.status === "processing" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCreatePurchaseOrder(order)}
                    disabled={
                      creatingPurchaseOrder === order.id ||
                      purchaseOrderCreated.has(order.id)
                    }
                    title={
                      purchaseOrderCreated.has(order.id)
                        ? "Bon de commande déjà créé"
                        : "Créer bon de commande"
                    }
                  >
                    {creatingPurchaseOrder === order.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Package
                        className={`h-4 w-4 ${
                          purchaseOrderCreated.has(order.id)
                            ? "text-brand-gold"
                            : ""
                        }`}
                      />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune commande trouvée avec les critères sélectionnés.
        </div>
      )}

      {/* DOT Confirmation Modal */}
      <AnimatePresence>
        {dotConfirmOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => { if (!confirmingDot) { setDotConfirmOrder(null); setPreFilledFromPrep(false); } }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-gold" />
                    Assignation DOT — Confirmer la commande
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    #{fps(dotConfirmOrder.orderNumber)} · {dotConfirmOrder.customerName}
                  </p>
                </div>
                <button
                  onClick={() => { if (!confirmingDot) { setDotConfirmOrder(null); setPreFilledFromPrep(false); } }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {preFilledFromPrep && (
                  <div className="text-sm text-brand-gold bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-gold flex-shrink-0" />
                    Lots DOT pré-assignés depuis la préparation stock. Vérifiez et confirmez.
                  </div>
                )}
                <div className="text-sm text-brand-gold bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  Sélectionnez un lot DOT pour chaque article. Le stock sera décrémenté automatiquement à la confirmation.
                </div>

                {loadingDotBatches ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-yellow-500" />
                    <p className="text-sm text-gray-400 mt-2">Chargement des lots DOT…</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dotConfirmOrder.items.map((item, idx) => {
                      const batches = dotBatches[item.productId] || [];
                      const selection = dotSelections[idx];
                      const selectedBatch = batches.find((b) => b.id === selection?.batchId);
                      const isAssigned = !!selection;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border-2 p-4 transition-colors ${
                            isAssigned ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{item.productName}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Quantité commandée : <strong>{item.quantity}</strong>
                              </p>
                            </div>
                            {isAssigned ? (
                              <span className="text-xs font-bold text-brand-gold bg-yellow-100 px-2 py-1 rounded-full whitespace-nowrap">
                                ✓ DOT assigné
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full whitespace-nowrap">
                                ⚠ Requis
                              </span>
                            )}
                          </div>

                          {batches.length === 0 ? (
                            <p className="text-xs text-brand-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              Aucun lot DOT disponible pour ce produit — ajoutez du stock via la gestion DOT.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <select
                                value={selection?.batchId ?? ""}
                                onChange={(e) => {
                                  const batchId = parseInt(e.target.value);
                                  const batch = batches.find((b) => b.id === batchId);
                                  if (batch) {
                                    setDotSelections((prev) => ({
                                      ...prev,
                                      [idx]: {
                                        batchId: batch.id,
                                        qty: Math.min(item.quantity, batch.quantity),
                                        discount: prev[idx]?.discount ?? 0,
                                      },
                                    }));
                                  } else {
                                    setDotSelections((prev) => {
                                      const n = { ...prev };
                                      delete n[idx];
                                      return n;
                                    });
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                              >
                                <option value="">— Choisir un lot DOT —</option>
                                {batches.map((b) => (
                                  <option key={b.id} value={b.id} disabled={b.quantity < 1}>
                                    DOT {b.dot} — {b.quantity} unité(s)
                                    {b.emplacement ? ` — ${b.emplacement}` : ""}
                                  </option>
                                ))}
                              </select>

                              {selection && selectedBatch && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {selectedBatch.quantity} unité(s) disponible(s) dans ce lot
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {dotConfirmError && (
                  <div className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {dotConfirmError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <span className="text-sm text-gray-500">
                  {Object.keys(dotSelections).length} / {dotConfirmOrder.items.length} article(s) assigné(s)
                </span>
                <div className="flex gap-3">
                  <Button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                    onClick={() => setDotConfirmOrder(null)}
                    disabled={confirmingDot}
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={handleDotConfirm}
                    disabled={
                      confirmingDot ||
                      loadingDotBatches ||
                      dotConfirmOrder.items.some((_, idx) => !dotSelections[idx])
                    }
                    className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0"
                  >
                    {confirmingDot ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Confirmation…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Confirmer la commande
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Détails de la commande #{fps(selectedOrder.orderNumber)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Statut:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Paiement:</span>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                </div>

                {/* Customer and Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Informations client */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2 text-gray-900">
                      Informations client
                    </h4>
                    <p className="text-sm">
                      <strong>Nom complet:</strong> {selectedOrder.customerName}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {selectedOrder.customerEmail}
                    </p>
                    <p className="text-sm">
                      <strong>Téléphone:</strong> {selectedOrder.customerPhone}
                    </p>
                  </div>

                  {/* Détails commande */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2 text-gray-900">
                      Détails commande
                    </h4>
                    <p className="text-sm">
                      <strong>Numéro:</strong> {fps(selectedOrder.orderNumber)}
                    </p>
                    <p className="text-sm">
                      <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                    </p>
                    <p className="text-sm">
                      <strong>Numéro de suivi:</strong>{" "}
                      {selectedOrder.trackingNumber || "N/A"}
                    </p>
                    <p className="text-sm">
                      <strong>Méthode de paiement:</strong>{" "}
                      {({
                        card: "Carte bancaire",
                        especes: "Espèces",
                        bank_transfer: "Virement bancaire",
                        cash_on_delivery: "TPE à la livraison",
                        cri: "CRI",
                        cheque: "Chèque",
                        lettre_de_change: "Lettre de change",
                        mixed: "Multi-modalités",
                      } as Record<string, string>)[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || "N/A"}
                    </p>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2 text-gray-900">
                      Adresse de livraison
                    </h4>
                    <p className="text-sm">
                      <strong>Adresse:</strong> {selectedOrder.shippingAddress?.street}
                    </p>
                    <p className="text-sm">
                      <strong>Ville:</strong> {selectedOrder.shippingAddress?.city}
                    </p>
                    <p className="text-sm">
                      <strong>Code postal:</strong> {selectedOrder.shippingAddress?.postalCode}
                    </p>
                    <p className="text-sm">
                      <strong>Région:</strong> {selectedOrder.shippingAddress?.region}
                    </p>
                    <p className="text-sm">
                      <strong>Pays:</strong> {selectedOrder.shippingAddress?.country}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="pt-4">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-4 text-gray-900">
                    Articles commandés
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Référence
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix unitaire
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qté
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.productName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.specifications}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                        {selectedOrder.deliveryCost && selectedOrder.deliveryCost > 0 && (
                          <tr className="bg-gray-50">
                            <td
                              colSpan={4}
                              className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                            >
                              Sous-total produits:
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              {formatCurrency(selectedOrder.totalAmount)}
                            </td>
                          </tr>
                        )}
                        {selectedOrder.deliveryCost && selectedOrder.deliveryCost > 0 && (
                          <tr className="bg-gray-50">
                            <td
                              colSpan={4}
                              className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                            >
                              Frais de livraison:
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              {formatCurrency(selectedOrder.deliveryCost)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-right text-sm font-bold text-gray-900"
                          >
                            Total commande:
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(selectedOrder.totalAmount + (selectedOrder.deliveryCost || 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                <Button
                  onClick={() => setSelectedOrder(null)}
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