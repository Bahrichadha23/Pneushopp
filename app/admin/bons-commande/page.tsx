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
import { Calendar, Package, Truck, ShoppingCart, Check, Download } from "lucide-react";
import { API_URL } from "@/lib/config";

type ConfirmationDialog = {
  isOpen: boolean;
  bonId: number | null;
  bonNumber: string;
  orderId: number | null;
  fournisseur: string;
};

// Download Purchase Order PDF
const handleDownloadPurchaseOrder = (bon: BonCommande) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;

  let y = 30;

  // === Header ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("BON DE COMMANDE", pageWidth / 2, y, { align: "center" });
  
  y += 10;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`N° ${bon.id}`, pageWidth / 2, y, { align: "center" });

  y += 15;

  // === Info Table ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Informations de la commande", margin, y);
  
  y += 7;
  
  // Create table for information
  const tableData = [
    { label: "Date de commande", value: new Date(bon.dateCommande).toLocaleDateString("fr-FR") },
    { label: "Date de livraison prévue", value: new Date(bon.dateLivraisonPrevue).toLocaleDateString("fr-FR") },
    { label: "Priorité", value: bon.priorite === "urgent" ? "URGENT" : "Normale" },
    { label: "Statut", value: bon.statut === "en_attente" ? "En attente" : bon.statut === "confirmé" ? "Confirmé" : "Livré" },
  ];

  const colWidth1 = 60;
  const colWidth2 = 70;
  const rowHeight = 8;

  pdf.setFontSize(10);
  
  tableData.forEach((row, index) => {
    const rowY = y + (index * rowHeight);
    
    // Draw cells
    pdf.rect(margin, rowY, colWidth1, rowHeight);
    pdf.rect(margin + colWidth1, rowY, colWidth2, rowHeight);
    
    // Label (bold)
    pdf.setFont("helvetica", "bold");
    pdf.text(row.label, margin + 2, rowY + 5.5);
    
    // Value (normal)
    pdf.setFont("helvetica", "normal");
    pdf.text(row.value, margin + colWidth1 + 2, rowY + 5.5);
  });

  y += (tableData.length * rowHeight) + 10;

  // === Totals Section ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Montants", margin, y);
  
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  
  const boxX = pageWidth - 80;
  const boxY = y - 5;
  
  pdf.roundedRect(boxX, boxY, 65, 26, 2, 2, "S");
  
  pdf.text(`Total HT:`, boxX + 3, boxY + 7);
  pdf.text(`${(bon.totalHT ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND`, boxX + 60, boxY + 7, { align: "right" });
  
  // Add 3mm spacing between lines
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total TTC:`, boxX + 3, boxY + 17);
  pdf.text(`${(bon.totalTTC ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND`, boxX + 60, boxY + 17, { align: "right" });

  y += 35;

  // === Footer ===
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.text("PNEU SHOP - Bon de commande", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  // Save PDF
  pdf.save(`bon-commande-${bon.id}.pdf`);
};

export default function BonsCommandePage() {
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  const [selectedBon, setSelectedBon] = useState<BonCommande | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    bonId: null,
    bonNumber: "",
    orderId: null,
    fournisseur: "",
  });

  const handleViewBon = (bon: BonCommande) => {
    setSelectedBon(bon);
    setShowForm(true);
  };

  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/purchase-orders/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("HTTP Error:", res.status, await res.text());
          throw new Error("Erreur API");
        }

        const data = await res.json();
        console.log("📋 API Response:", data);

        const normalizedData = (data.results ?? data ?? []).map((bon: any) => {
          console.log("📋 Processing bon:", bon);
          console.log("📋 Articles from API:", bon.articles);

          return {
            id: bon.id,
            order_id: bon.order?.id ?? null, // 👈 make sure this exists
            order: bon.order?.id ?? null, // 👈 keep order in sync
            fournisseur: bon.fournisseur ?? "",
            dateCommande: bon.date_commande ?? "",
            dateLivraisonPrevue: bon.date_livraison_prevue ?? "",
            // articles: bon.articles ?? [],
            totalHT: bon.total_ht ?? 0,
            totalTTC: bon.total_ttc ?? 0,
            statut: bon.statut ?? "en_attente",
            priorite: bon.priorite ?? "normale",
          };
        });

        console.log("📋 Normalized Data:", normalizedData);
        setBonsCommande(normalizedData);
      } catch (err) {
        console.error("Erreur lors du fetch:", err);
      }
    };

    fetchData();
  }, []);

  // const handleConfirmBon = async (id: number) => {
  //   try {
  //     const token = localStorage.getItem("access_token");
  //     const res = await fetch(`${API_URL}/purchase-orders/${id}/`, {
  //       method: "PUT", // or PATCH
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ statut: "confirmé" }),
  //     });

  //     if (!res.ok) throw new Error("Erreur lors de la confirmation");

  //     // Update state
  //     setBonsCommande((prev) =>
  //       prev.map((bon) =>
  //         bon.id === id ? { ...bon, statut: "confirmé" } : bon
  //       )
  //     );
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };
  const handleConfirmBon = (
    id: number,
    bonNumber: string,
    order_id: number | null,
    fournisseur: string
  ) => {
    setConfirmation({
      isOpen: true,
      bonId: id,
      bonNumber,
      orderId: order_id,
      fournisseur,
    });
  };

  const handleConfirmDialogAction = async () => {
    if (!confirmation.bonId) return;

    const { bonId, orderId, fournisseur } = confirmation;
    console.log("🔍 Confirming:", { bonId, orderId, fournisseur });
    console.log("🔍 Request URL:", `${API_URL}/purchase-orders/${bonId}/`);
    
    try {
      const token = localStorage.getItem("access_token");

      // Prepare the request body - only include order if it's valid
      const requestBody: any = { statut: "confirmé", fournisseur };
      if (orderId && orderId > 0) {
        requestBody.order = orderId;
      }

      const res = await fetch(`${API_URL}/purchase-orders/${bonId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        console.log("🔍 Response status:", res.status);
        const errorText = await res.text();
        console.error("Error response:", errorText);
        alert("Erreur lors de la confirmation: " + errorText);
        return;
      }

      // Update the local state
      setBonsCommande((prev) =>
        prev.map((bon) =>
          bon.id === bonId ? { ...bon, statut: "confirmé" } : bon
        )
      );

      alert("Bon de commande confirmé avec succès!");
    } catch (err) {
      console.error("Error:", err);
      alert("Erreur lors de la confirmation");
    } finally {
      setConfirmation({
        isOpen: false,
        bonId: null,
        bonNumber: "",
        orderId: null,
        fournisseur: "",
      });
    }
  };

  const handleCancelDialog = () => {
    setConfirmation({
      isOpen: false,
      bonId: null,
      bonNumber: "",
      orderId: null,
      fournisseur: "",
    });
  };
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            En attente
          </Badge>
        );
      case "confirmé":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Confirmé
          </Badge>
        );
      case "livré":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Livré
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    return priorite === "urgent" ? (
      <Badge variant="destructive">Urgent</Badge>
    ) : (
      <Badge variant="outline">Normale</Badge>
    );
  };

  const filteredBons = bonsCommande.filter((bon) => {
    const idMatch = bon.id
      ? bon.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
      : false;

    const fournisseurMatch = (bon.fournisseur ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return idMatch || fournisseurMatch;
  });

  const totalCommandes = bonsCommande.length;
  const commandesEnAttente = bonsCommande.filter(
    (b) => b.statut === "en_attente"
  ).length;
  const commandesConfirmees = bonsCommande.filter(
    (b) => b.statut === "confirmé"
  ).length;
  const commandesLivrees = bonsCommande.filter(
    (b) => b.statut === "livré"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Bons de commande</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Total commandes
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommandes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {commandesEnAttente}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <Check className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {commandesConfirmees}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {commandesLivrees}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <Input
          placeholder="Rechercher un bon de commande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredBons.map((bon) => (
          <Card key={bon.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{bon.id}</div>
              {getStatutBadge(bon.statut)}
            </div>
            <div className="text-sm space-y-1">
              {/* <div><strong>Fournisseur:</strong> {bon.fournisseur}</div> */}
              <div>
                <strong>Date commande:</strong>{" "}
                {new Date(bon.dateCommande).toLocaleDateString()}
              </div>
              <div>
                <strong>Livraison prévue:</strong>{" "}
                {new Date(bon.dateLivraisonPrevue).toLocaleDateString()}
              </div>
              <div>
                <strong>Total TTC:</strong>{" "}
                {(bon.totalTTC ?? 0).toLocaleString()} DT
              </div>
              <div>
                <strong>Priorité:</strong> {getPrioriteBadge(bon.priorite)}
              </div>
            </div>
            <div className="mt-2 flex flex-nowrap justify-between gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleViewBon(bon)}
              >
                Voir
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleDownloadPurchaseOrder(bon)}
              >
                <Download className="h-4 w-4" />
              </Button>

              {bon.statut === "en_attente" && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() =>
                    handleConfirmBon(
                      Number(bon.id),
                      bon.id.toString(),
                      bon.order_id,
                      bon.fournisseur
                    )
                  }
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Bon</TableHead>
                  {/* <TableHead>Fournisseur</TableHead> */}
                  <TableHead>Date commande</TableHead>
                  <TableHead>Livraison prévue</TableHead>
                  <TableHead>Total TTC</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBons.map((bon) => (
                  <TableRow key={bon.id}>
                    <TableCell className="font-medium">{bon.id}</TableCell>
                    {/* <TableCell>{bon.fournisseur}</TableCell> */}
                    <TableCell>
                      {new Date(bon.dateCommande).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(bon.dateLivraisonPrevue).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(bon.totalTTC ?? 0).toLocaleString()} DT
                    </TableCell>
                    <TableCell>{getPrioriteBadge(bon.priorite)}</TableCell>
                    <TableCell>{getStatutBadge(bon.statut)}</TableCell>
                    <TableCell className="flex flex-nowrap space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBon(bon)}
                      >
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
                          variant="default"
                          onClick={() =>
                            handleConfirmBon(
                              Number(bon.id),
                              bon.id.toString(),
                              bon.order_id,
                              bon.fournisseur
                            )
                          }
                        >
                          Confirmer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {showForm && selectedBon && (
        <div className="fixed inset-0 shadow-2xl flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Détails de la commande</h2>

            <div className="space-y-2">
              <div>
                <strong>N° Bon:</strong> {selectedBon!.id}
              </div>
              {/* <div>
                <strong>Fournisseur:</strong> {selectedBon!.fournisseur}
              </div> */}
              <div>
                <strong>Date commande:</strong>{" "}
                {new Date(selectedBon!.dateCommande).toLocaleDateString()}
              </div>
              <div>
                <strong>Livraison prévue:</strong>{" "}
                {new Date(
                  selectedBon!.dateLivraisonPrevue
                ).toLocaleDateString()}
              </div>
              <div>
                <strong>Total TTC:</strong>{" "}
                {(selectedBon!.totalTTC ?? 0).toLocaleString()} DT
              </div>
              <div>
                <strong>Priorité:</strong> {selectedBon!.priorite}
              </div>
              <div>
                <strong>Status:</strong> {selectedBon!.statut}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setShowForm(false)}>Fermer</Button>
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
            onClick={handleCancelDialog}
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
                Confirmer le bon de commande
              </h2>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir confirmer le bon de commande <strong>{confirmation.bonNumber}</strong> ?
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelDialog}
                  className="text-gray-600"
                >
                  Non
                </Button>
                <Button
                  onClick={handleConfirmDialogAction}
                  className="bg-green-500 hover:bg-green-600 text-white"
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
