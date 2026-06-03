"use client";

import { useState, useEffect } from "react";
import type { BonCommande } from "@/types/bonCommande";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Package,
  Truck,
  Check,
  Download,
  User,
  Hash,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/config";

type ConfirmationDialog = {
  isOpen: boolean;
  bonId: number | null;
  bonNumber: string;
  orderId: number | null;
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
};

const fmtMoney = (amount: number | null | undefined): string => {
  if (amount == null) return "—";
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount) + " DT"
  );
};

// Download Purchase Order PDF — uses enriched serializer data directly
const handleDownloadPurchaseOrder = async (bon: BonCommande) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;

  // Use enriched data directly from the serializer
  const orderNumber = bon.order_number || `BDC-${bon.id}`;
  const deliveryCost = bon.delivery_cost || 0;
  const clientName = bon.client_name || "—";

  let y = 50.8;

  // === Header ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("BON DE COMMANDE", pageWidth / 2, y, { align: "center" });

  y += 8;
  pdf.setFontSize(11);
  pdf.text(`N° ${bon.id}`, pageWidth / 2, y, { align: "center" });

  y += 6;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  if (bon.order_number) {
    pdf.text(`Commande client : ${bon.order_number}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (bon.tracking_number) {
    pdf.text(`Suivi : ${bon.tracking_number}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  y += 8;

  // === Client + Order Info ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Détails de la commande", margin, y);
  y += 8;

  const infoHeaders = ["Client", "Date commande", "Priorité", "Statut"];
  const infoValues = [
    clientName,
    formatDate(bon.dateCommande),
    bon.priorite === "urgent" ? "URGENT" : "Normale",
    bon.statut === "en_attente"
      ? "En attente"
      : bon.statut === "confirmé"
      ? "Confirmé"
      : "Livré",
  ];

  const colWidth = (pageWidth - 2 * margin) / 4;
  const headerHeight = 8;
  const valueHeight = 8;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  let currentX = margin;
  infoHeaders.forEach((header) => {
    pdf.rect(currentX, y, colWidth, headerHeight);
    pdf.text(header, currentX + colWidth / 2, y + 5.5, { align: "center" });
    currentX += colWidth;
  });

  y += headerHeight;
  pdf.setFont("helvetica", "normal");
  currentX = margin;
  infoValues.forEach((value) => {
    pdf.rect(currentX, y, colWidth, valueHeight);
    const truncated = value.length > 20 ? value.substring(0, 18) + "…" : value;
    pdf.text(truncated, currentX + colWidth / 2, y + 5.5, { align: "center" });
    currentX += colWidth;
  });

  y += valueHeight + 12;

  // === Articles ===
  if (bon.articles && bon.articles.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Articles commandés", margin, y);
    y += 8;

    const headers = ["Produit", "Qté", "Prix Unit.", "Total"];
    const colWidths = [90, 25, 30, 35];

    pdf.setFontSize(9);
    currentX = margin;
    headers.forEach((header, index) => {
      pdf.rect(currentX, y, colWidths[index], 8);
      pdf.text(header, currentX + colWidths[index] / 2, y + 5.5, { align: "center" });
      currentX += colWidths[index];
    });
    y += 8;

    pdf.setFont("helvetica", "normal");
    bon.articles.forEach((item: any) => {
      currentX = margin;
      const productName =
        item.product_name || item.productName || item.nom || item.name || `Article ${item.id || ""}`;
      const quantity = parseInt(item.quantity || item.quantite || 0);
      const unitPrice = parseFloat(
        item.unit_price || item.unitPrice || item.prix_unitaire || item.price || 0
      );
      const total = quantity * unitPrice;

      pdf.rect(currentX, y, colWidths[0], 8);
      const maxWidth = colWidths[0] - 4;
      const wrapped = pdf.splitTextToSize(productName, maxWidth);
      pdf.text(
        wrapped.length > 1 ? wrapped[0].substring(0, wrapped[0].length - 3) + "…" : productName,
        currentX + 2,
        y + 5.5
      );
      currentX += colWidths[0];

      pdf.rect(currentX, y, colWidths[1], 8);
      pdf.text(quantity.toString(), currentX + colWidths[1] / 2, y + 5.5, { align: "center" });
      currentX += colWidths[1];

      pdf.rect(currentX, y, colWidths[2], 8);
      pdf.text(`${unitPrice.toFixed(3)} DT`, currentX + colWidths[2] / 2, y + 5.5, { align: "center" });
      currentX += colWidths[2];

      pdf.rect(currentX, y, colWidths[3], 8);
      pdf.text(`${total.toFixed(3)} DT`, currentX + colWidths[3] / 2, y + 5.5, { align: "center" });

      y += 8;
    });
    y += 10;
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.text("Aucun article disponible", margin, y);
    y += 15;
  }

  // === Totals ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  const boxX = pageWidth - 80;
  const boxY = y;
  pdf.roundedRect(boxX, boxY, 65, 46, 2, 2, "S");

  pdf.text("Sous-total TTC :", boxX + 3, boxY + 10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `${parseFloat(String(bon.totalTTC ?? 0)).toFixed(3)} DT`,
    boxX + 62,
    boxY + 10,
    { align: "right" }
  );

  pdf.setFont("helvetica", "bold");
  pdf.text("Frais livraison :", boxX + 3, boxY + 22);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `${parseFloat(String(deliveryCost ?? 0)).toFixed(3)} DT`,
    boxX + 62,
    boxY + 22,
    { align: "right" }
  );

  pdf.setFont("helvetica", "bold");
  pdf.text("Total :", boxX + 3, boxY + 36);
  pdf.text(
    `${parseFloat(String(bon.total_with_delivery ?? bon.totalTTC ?? 0)).toFixed(3)} DT`,
    boxX + 62,
    boxY + 36,
    { align: "right" }
  );

  // === Footer ===
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.text("PNEU SHOP — Bon de commande", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  pdf.save(`bon-commande-${orderNumber}.pdf`);
};

export default function BonsCommandePage() {
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin");
    return null;
  }
  const [selectedBon, setSelectedBon] = useState<BonCommande | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    bonId: null,
    bonNumber: "",
    orderId: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/orders/purchase-orders/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Erreur API");

        const data = await res.json();
        const rows = (data.results ?? data ?? []).map((bon: any) => ({
          id: bon.id,
          order_id: bon.order ?? null,
          order: bon.order ?? null,
          fournisseur: bon.fournisseur ?? "",
          dateCommande: bon.date_commande ?? "",
          dateLivraisonPrevue: bon.date_livraison_prevue ?? "",
          articles: bon.articles ?? [],
          totalHT: bon.total_ht ?? 0,
          totalTTC: bon.total_ttc ?? 0,
          statut: bon.statut ?? "en_attente",
          priorite: bon.priorite ?? "normale",
          // Enriched fields
          order_number: bon.order_number ?? null,
          client_name: bon.client_name ?? null,
          client_email: bon.client_email ?? null,
          tracking_number: bon.tracking_number ?? null,
          delivery_cost: bon.delivery_cost ?? 0,
          total_with_delivery: bon.total_with_delivery ?? bon.total_ttc ?? 0,
        }));

        setBonsCommande(rows);
      } catch (err) {
        console.error("Erreur lors du fetch:", err);
      }
    };

    fetchData();
  }, []);

  const handleViewBon = (bon: BonCommande) => {
    setSelectedBon(bon);
    setShowForm(true);
  };

  const handleConfirmBon = (id: number, bonNumber: string, order_id: number | null) => {
    setConfirmation({ isOpen: true, bonId: id, bonNumber, orderId: order_id });
  };

  const handleConfirmDialogAction = async () => {
    if (!confirmation.bonId) return;
    const { bonId, orderId } = confirmation;

    try {
      const token = localStorage.getItem("access_token");
      const requestBody: any = { statut: "confirmé" };
      if (orderId && orderId > 0) requestBody.order = orderId;

      const res = await fetch(`${API_URL}/orders/purchase-orders/${bonId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert("Erreur lors de la confirmation: " + errorText);
        return;
      }

      setBonsCommande((prev) =>
        prev.map((bon) => (bon.id === bonId ? { ...bon, statut: "confirmé" } : bon))
      );
    } catch (err) {
      console.error("Error:", err);
      alert("Erreur lors de la confirmation");
    } finally {
      setConfirmation({ isOpen: false, bonId: null, bonNumber: "", orderId: null });
    }
  };

  const handleCancelDialog = () =>
    setConfirmation({ isOpen: false, bonId: null, bonNumber: "", orderId: null });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <Badge className="bg-yellow-100 text-brand-gold border-yellow-200">En attente</Badge>;
      case "confirmé":
        return <Badge className="bg-yellow-100 text-brand-gold border-yellow-200">Confirmé</Badge>;
      case "livré":
        return <Badge className="bg-black text-white border-black">Livré</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) =>
    priorite === "urgent" ? (
      <Badge variant="destructive">Urgent</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">Normale</Badge>
    );

  const filteredBons = bonsCommande.filter((bon) => {
    const q = searchTerm.toLowerCase();
    return (
      bon.id.toString().includes(q) ||
      (bon.order_number ?? "").toLowerCase().includes(q) ||
      (bon.client_name ?? "").toLowerCase().includes(q) ||
      (bon.client_email ?? "").toLowerCase().includes(q) ||
      (bon.tracking_number ?? "").toLowerCase().includes(q)
    );
  });

  const totalCommandes = bonsCommande.length;
  const commandesEnAttente = bonsCommande.filter((b) => b.statut === "en_attente").length;
  const commandesConfirmees = bonsCommande.filter((b) => b.statut === "confirmé").length;
  const commandesLivrees = bonsCommande.filter((b) => b.statut === "livré").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bons de commande</h1>
        <Badge variant="secondary" className="text-sm">{filteredBons.length} bons</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommandes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gold">{commandesEnAttente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <Check className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gold">{commandesConfirmees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Truck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black font-bold">{commandesLivrees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Rechercher par N° commande, client, suivi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {filteredBons.map((bon) => (
          <Card key={bon.id} className="overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div>
                <div className="font-semibold text-gray-900">BDC #{bon.id}</div>
                {bon.order_number && (
                  <div className="text-xs text-brand-gold font-medium">{bon.order_number}</div>
                )}
              </div>
              {getStatutBadge(bon.statut)}
            </div>

            {bon.client_name && (
              <div className="px-4 pb-1 flex items-center gap-1 text-sm text-gray-700">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {bon.client_name}
              </div>
            )}

            {bon.tracking_number && (
              <div className="px-4 pb-1 flex items-center gap-1 text-xs text-gray-500">
                <Navigation className="h-3 w-3" />
                {bon.tracking_number}
              </div>
            )}

            <div className="px-4 pb-3 grid grid-cols-2 gap-1 text-sm mt-1">
              <div className="text-gray-500">
                Date: <span className="text-gray-800">{formatDate(bon.dateCommande)}</span>
              </div>
              <div className="text-gray-500">
                Priorité: {getPrioriteBadge(bon.priorite)}
              </div>
              <div className="text-gray-500 col-span-2">
                Total:{" "}
                <span className="font-semibold text-gray-900">
                  {fmtMoney(bon.total_with_delivery || bon.totalTTC)}
                </span>
              </div>
            </div>

            <div className="px-4 pb-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewBon(bon)}>
                Voir
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDownloadPurchaseOrder(bon)}>
                <Download className="h-4 w-4" />
              </Button>
              {bon.statut === "en_attente" && (
                <Button
                  size="sm"
                  className="flex-1 bg-brand-orange hover:bg-brand-orange text-black font-semibold"
                  onClick={() => handleConfirmBon(Number(bon.id), bon.order_number || bon.id.toString(), bon.order_id)}
                >
                  Confirmer
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Liste des bons de commande</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>BDC / N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>N° Suivi</TableHead>
                    <TableHead>Date commande</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBons.map((bon) => (
                    <TableRow key={bon.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="font-semibold text-gray-900">BDC #{bon.id}</div>
                        {bon.order_number && (
                          <div className="text-xs text-brand-gold font-medium flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {bon.order_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {bon.client_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{bon.client_name}</div>
                            {bon.client_email && (
                              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                {bon.client_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bon.tracking_number ? (
                          <div className="flex items-center gap-1 text-sm font-mono text-gray-700">
                            <Navigation className="h-3.5 w-3.5 text-gray-400" />
                            {bon.tracking_number}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(bon.dateCommande)}</TableCell>
                      <TableCell className="font-semibold">
                        {fmtMoney(bon.total_with_delivery || bon.totalTTC)}
                        {bon.delivery_cost > 0 && (
                          <div className="text-xs text-gray-400 font-normal">
                            Livraison: {fmtMoney(bon.delivery_cost)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getPrioriteBadge(bon.priorite)}</TableCell>
                      <TableCell>{getStatutBadge(bon.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => handleViewBon(bon)}>
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPurchaseOrder(bon)}
                            title="Télécharger PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {bon.statut === "en_attente" && (
                            <Button
                              size="sm"
                              className="bg-brand-orange hover:bg-brand-orange text-black font-semibold"
                              onClick={() =>
                                handleConfirmBon(
                                  Number(bon.id),
                                  bon.order_number || bon.id.toString(),
                                  bon.order_id
                                )
                              }
                            >
                              Confirmer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showForm && selectedBon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gray-900 text-white px-6 py-4 flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold">BDC #{selectedBon.id}</div>
                  {selectedBon.order_number && (
                    <div className="text-sm text-gray-300 flex items-center gap-1 mt-0.5">
                      <Hash className="h-3.5 w-3.5" />
                      {selectedBon.order_number}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">
                    {fmtMoney(selectedBon.total_with_delivery || selectedBon.totalTTC)}
                  </div>
                  {selectedBon.tracking_number && (
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      {selectedBon.tracking_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Info strip */}
              <div className="bg-gray-50 border-b px-6 py-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Client</div>
                    <div className="font-medium text-gray-900">{selectedBon.client_name || "—"}</div>
                    {selectedBon.client_email && (
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">
                        {selectedBon.client_email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Articles</div>
                    <div className="font-medium text-gray-900">
                      {selectedBon.articles?.length ?? 0} article(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Date commande</div>
                    <div className="font-medium mt-0.5">{formatDate(selectedBon.dateCommande)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Livraison prévue</div>
                    <div className="font-medium mt-0.5">{formatDate(selectedBon.dateLivraisonPrevue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Priorité</div>
                    <div className="mt-0.5">{getPrioriteBadge(selectedBon.priorite)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Statut</div>
                    <div className="mt-0.5">{getStatutBadge(selectedBon.statut)}</div>
                  </div>
                </div>

                {/* Totals */}
                <div className="border rounded-lg p-3 bg-gray-50 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sous-total TTC</span>
                    <span className="font-medium">{fmtMoney(selectedBon.totalTTC)}</span>
                  </div>
                  {selectedBon.delivery_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frais de livraison</span>
                      <span className="font-medium">{fmtMoney(selectedBon.delivery_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{fmtMoney(selectedBon.total_with_delivery || selectedBon.totalTTC)}</span>
                  </div>
                </div>

                {/* Articles list */}
                {selectedBon.articles && selectedBon.articles.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Articles</div>
                    <div className="space-y-1.5">
                      {selectedBon.articles.map((art: any, i: number) => {
                        const name = art.nom || art.product_name || art.name || `Article ${i + 1}`;
                        const qty = art.quantite || art.quantity || 0;
                        const price = art.prix_unitaire || art.unit_price || art.price || 0;
                        return (
                          <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded px-3 py-2">
                            <div className="text-gray-800 truncate max-w-[200px]">{name}</div>
                            <div className="text-gray-500 ml-2 shrink-0">
                              {qty} × {fmtMoney(parseFloat(price))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPurchaseOrder(selectedBon)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
                <Button onClick={() => setShowForm(false)}>Fermer</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmation.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCancelDialog}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmer le bon de commande
              </h2>
              <p className="text-gray-600 mb-4">
                Confirmer le bon <strong>{confirmation.bonNumber}</strong> ? Une livraison sera automatiquement créée.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCancelDialog}>
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirmDialogAction}
                  className="bg-brand-orange hover:bg-brand-orange text-black font-semibold"
                >
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}