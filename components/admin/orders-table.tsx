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
import { Eye, Edit, Truck, Search, Package, Download, X } from "lucide-react";
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

  let y = 30;
  let page = 1;

  // === Header ===
  const addHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(`FACTURE ${order.orderNumber || ""}`, margin, y);
    pdf.setFontSize(10);
    pdf.text(
      ` ${new Date(order.createdAt).toLocaleDateString("fr-FR")}`,
      margin,
      y + 6
    );

    // Client box (rounded)
    const boxX = pageWidth - 70;
    const boxY = 15;
    const boxW = 60;
    const boxH = 40; // increased height
    pdf.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "S");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Client", boxX + 2, boxY + 6);

    pdf.setFont("helvetica", "normal");
    pdf.text(order.customerName || "-", boxX + 20, boxY + 6);
    pdf.text(`Id. Fiscale : ${order.id || "-"}`, boxX + 2, boxY + 12);
    pdf.text(`Tel : ${order.customerPhone || "-"}`, boxX + 2, boxY + 18);
    pdf.text(
      `Matricule : ${order.warrantyInfo?.vehicleRegistration || "-"}`,
      boxX + 2,
      boxY + 24
    );
    pdf.text(
      `Kilométrage: ${order.warrantyInfo?.vehicleMileage || "-"}`,
      boxX + 2,
      boxY + 30
    );
    pdf.text(`Page ${page}`, margin, pageHeight - 10);
    y += 35;
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
    pdf.setFontSize(9);
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

  // === Table Rows ===
  let totalHT = 0,
    totalRemise = 0,
    totalTVA = 0;
  const maxRowsPerPage = 12;
  let currentRow = 0;

  const addRow = (item?: any, isEmpty = false) => {
    let x = margin;
    let h = 8; 
    if (!isEmpty && item) {
      const unitTTC = Number(item.unitPrice || 0); // backend price already includes TVA
      const qty = Number(item.quantity || 1);
      const remise = Number(item.discount || 0);
      const tvaRate = 19;

      // 1. Extract HT (before TVA)
      const unitHT = unitTTC / (1 + tvaRate / 100);

      // 2. Apply discount
      const unitHTAfterRemise = unitHT * (1 - remise / 100);

      // 3. Calculate totals
      const montantHT = unitHTAfterRemise * qty;
      const montantTVA = montantHT * (tvaRate / 100);

      // 4. Final TTC = backend TTC price * quantity
      const montantTTC = unitTTC * qty;

      totalHT += montantHT;
      totalRemise += (unitHT - unitHTAfterRemise) * qty;
      totalTVA += montantTVA;

      // Wrap product name text to fit within column width
      const productName = item.productName || "-";
      const maxWidth = headers[1].width - 4; // Leave 2mm padding on each side
      const wrappedText = pdf.splitTextToSize(productName, maxWidth);
      const lineHeight = 4;
      const textHeight = wrappedText.length * lineHeight;
      
      // Adjust row height if text needs more space
      if (textHeight > h) {
        h = textHeight + 2; // Add some padding
      }

      // Use specifications (tire size) as reference
      pdf.text(item.specifications || "-", x + 2, y + 5);
      x += headers[0].width;
      
      // Draw wrapped product name
      wrappedText.forEach((line: string, index: number) => {
        pdf.text(line, x + 2, y + 5 + (index * lineHeight));
      });
      x += headers[1].width;
      
      pdf.text(qty.toFixed(2), x + headers[2].width / 2, y + 5, {
        align: "center",
      });
      x += headers[2].width;
      // Show HT price in PU column (price without TVA)
      pdf.text(unitHT.toFixed(3), x + headers[3].width - 2, y + 5, {
        align: "right",
      });
      x += headers[3].width;
      pdf.text(tvaRate.toFixed(0), x + headers[4].width / 2, y + 5, {
        align: "center",
      });
      x += headers[4].width;
      pdf.text(remise.toFixed(0), x + headers[5].width / 2, y + 5, {
        align: "center",
      });
      x += headers[5].width;
      pdf.text((montantHT || 0).toFixed(3), x + headers[6].width - 2, y + 5, {
        align: "right",
      });
      x += headers[6].width;
      pdf.text((montantTTC || 0).toFixed(3), x + headers[7].width - 2, y + 5, {
        align: "right",
      });
    }

    // Draw borders
    x = margin;
    headers.forEach((h) => {
      drawCell(x, y, h.width, 8, {
        top: currentRow === 0,
        left: true,
        right: true,
      });
      x += h.width;
    });

    y += h;
    currentRow++;
  };

  order.items?.forEach((item: any) => addRow(item));
  while (currentRow < maxRowsPerPage) addRow(undefined, true); // Fill empty rows

  const tableWidth = headers.reduce((sum, h) => sum + h.width, 0);
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, margin + tableWidth, y);

  y += 10; // space after last row

  const netHT = totalHT - totalRemise;
  const totalTTC = netHT + totalTVA + 1;

  // === Inline “QUATRE CENT …” + Vertical Totals ===
  const boxY = y + 5;
  const boxH = 14;
  const totalRowH = 7;
  const totalTableX = pageWidth - 85;

  // Left side QUATRE CENT box
  const leftBoxW = totalTableX - margin - 5;
  drawCell(margin, boxY, leftBoxW, boxH, {
    top: true,
    bottom: true,
    left: true,
    right: true,
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(
    `QUATRE CENT ${Math.floor(totalTTC)} Dinar(s) Tunisien ${Math.round(
      (totalTTC % 1) * 1000
    )} Millime(s)`,
    margin + 3,
    boxY + 8
  );

  // === Vertical Totals table (right side, inline with QUATRE box) ===
  const totals = [
    ["TOTAL HT", totalHT.toFixed(3)],
    ["TOTAL REMISE", totalRemise.toFixed(3)],
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

  // === Horizontal Totals box (below QUATRE box, aligned left) ===
  const tvaBoxY = boxY + boxH + 3; // small gap below QUATRE box
  const colW = leftBoxW / 3;
  const labels = ["Base TVA", "Taux", "TOTAL TVA"];
  const values = [netHT.toFixed(3), "19.00", totalTVA.toFixed(3)];

  pdf.setFont("helvetica", "bold");
  labels.forEach((label, i) => {
    const x = margin + i * colW;
    drawCell(x, tvaBoxY, colW, 7, {
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
    pdf.text(label, x + 2, tvaBoxY + 5);
  });

  pdf.setFont("helvetica", "normal");
  const valY = tvaBoxY + 7;
  values.forEach((val, i) => {
    const x = margin + i * colW;
    drawCell(x, valY, colW, 7, {
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
    pdf.text(val, x + colW - 2, valY + 5, { align: "right" });
  });

  // === Signature ===
  pdf.setFont("helvetica", "italic");
  pdf.text("Cachet et Signature", margin + 5, pageHeight - 20);

  pdf.save(`facture-${order.orderNumber}.pdf`);
}

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

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 2,
    }).format(numAmount);
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
    const variants = {
      pending: "destructive",
      confirmed: "outline",
      processing: "secondary",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    } as const;

    const labels = {
      pending: "En attente",
      confirmed: "Confirmée",
      processing: "En cours",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPaymentStatusBadge = (status: Order["paymentStatus"]) => {
    const variants = {
      pending: "outline",
      paid: "default",
      failed: "destructive",
      refunded: "secondary",
    } as const;

    const labels = {
      pending: "En attente",
      paid: "Payé",
      failed: "Échec",
      refunded: "Remboursé",
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
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
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {order.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

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
                                  ? "text-green-500"
                                  : ""
                              }`}
                            />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(order)}
                        className="flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
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
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">#{order.orderNumber}</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-gray-500">{order.customerEmail}</p>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Date: {formatDate(order.createdAt)}</p>
                <p>Montant: {formatCurrency(order.totalAmount)}</p>
                <p>Paiement: {getPaymentStatusBadge(order.paymentStatus)}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

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
                            ? "text-green-500"
                            : ""
                        }`}
                      />
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadInvoice(order)}
                  className="flex items-center justify-center"
                >
                  <Download className="w-4 h-4" />
                </Button>
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
                    Détails de la commande #{selectedOrder.orderNumber}
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
                      <strong>Numéro:</strong> {selectedOrder.orderNumber}
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
                      {selectedOrder.paymentMethod === "card" ? "Carte" : "À la livraison"}
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
                        <tr className="bg-gray-50">
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                          >
                            Total commande:
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(selectedOrder.totalAmount)}
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
                  variant="outline"
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
