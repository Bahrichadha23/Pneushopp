"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, FileText, Loader2, RotateCcw, Printer, FileDown } from "lucide-react";
import { API_URL } from "@/lib/config";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

interface OrderItem {
  id: number;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  return_quantity: number;
}

interface FoundOrder {
  id: number;
  order_number: string;
  created_at: string;
  total_amount: string;
  client_name: string;
  client_email: string;
  items: OrderItem[];
}

interface AvoirItem {
  product_id: string | null;
  product_name: string;
  product_reference: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SavedAvoir {
  id: number;
  avoir_number: string;
  original_invoice_number: string;
  total_amount: string;
  created_at: string;
  items: AvoirItem[];
  reason: string;
}

const fps = (n: string) => (n || "").replace(/^CPS/i, "FPS");

export default function AvoirPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin");
    return null;
  }

  const [searchInvoice, setSearchInvoice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<FoundOrder | null>(null);
  const [searchError, setSearchError] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAvoir, setSavedAvoir] = useState<SavedAvoir | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});

  // Historique des avoirs
  const [avoirHistory, setAvoirHistory] = useState<SavedAvoir[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/orders/avoirs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAvoirHistory(Array.isArray(data) ? data : data.results ?? []);
        }
      } catch {}
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, [savedAvoir]); // refresh when a new avoir is created

  const handleExportAvoirs = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Historique Avoirs");

    ws.columns = [
      { header: "N° Avoir", key: "avoir_number", width: 18 },
      { header: "Facture d'origine", key: "original_invoice_number", width: 20 },
      { header: "Date", key: "date", width: 14 },
      { header: "Motif", key: "reason", width: 30 },
      { header: "Article", key: "product", width: 35 },
      { header: "Quantité", key: "qty", width: 10 },
      { header: "Prix Unit. (DT)", key: "unit_price", width: 16 },
      { header: "Total (DT)", key: "total", width: 14 },
      { header: "Total Avoir (DT)", key: "avoir_total", width: 16 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

    avoirHistory.forEach((avoir) => {
      const items = Array.isArray(avoir.items) ? avoir.items : [];
      if (items.length === 0) {
        ws.addRow({
          avoir_number: avoir.avoir_number,
          original_invoice_number: avoir.original_invoice_number,
          date: new Date(avoir.created_at).toLocaleDateString("fr-FR"),
          reason: avoir.reason || "",
          product: "",
          qty: 0,
          unit_price: "",
          total: "",
          avoir_total: Number(avoir.total_amount || 0).toFixed(3),
        });
      } else {
        items.forEach((item: any, idx: number) => {
          ws.addRow({
            avoir_number: idx === 0 ? avoir.avoir_number : "",
            original_invoice_number: idx === 0 ? avoir.original_invoice_number : "",
            date: idx === 0 ? new Date(avoir.created_at).toLocaleDateString("fr-FR") : "",
            reason: idx === 0 ? (avoir.reason || "") : "",
            product: item.product_name || "",
            qty: item.quantity || 0,
            unit_price: Number(item.unit_price || 0).toFixed(3),
            total: Number(item.total_price || 0).toFixed(3),
            avoir_total: idx === 0 ? Number(avoir.total_amount || 0).toFixed(3) : "",
          });
        });
      }
    });

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Historique_Avoirs_${date}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSearch = async () => {
    if (!searchInvoice.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setFoundOrder(null);
    setReturnQuantities({});
    try {
      const token = localStorage.getItem("access_token");
      // Convert FPS prefix to CPS for backend search (DB stores CPS)
      const backendQuery = searchInvoice.trim().replace(/^FPS/i, "CPS");
      const res = await fetch(`${API_URL}/orders/avoirs/search/?q=${encodeURIComponent(backendQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setSearchError("Commande introuvable.");
        return;
      }
      const data = await res.json();
      // Initialize return quantities to 0
      const qties: Record<number, number> = {};
      data.items.forEach((item: OrderItem) => { qties[item.id] = 0; });
      setReturnQuantities(qties);
      setFoundOrder(data);
    } catch {
      setSearchError("Erreur de connexion.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectedItems = foundOrder?.items.filter(
    (item) => (returnQuantities[item.id] || 0) > 0
  ) || [];

  const totalAvoir = selectedItems.reduce((sum, item) => {
    const qty = returnQuantities[item.id] || 0;
    return sum + qty * parseFloat(item.unit_price);
  }, 0);

  const handleCreateAvoir = async () => {
    if (!foundOrder || selectedItems.length === 0) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const items_data = selectedItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_reference: "",
        quantity: returnQuantities[item.id],
        unit_price: parseFloat(item.unit_price),
      }));

      const res = await fetch(`${API_URL}/orders/avoirs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          original_invoice_number: fps(foundOrder.order_number),
          original_order: foundOrder.id,
          reason,
          notes,
          items_data,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Erreur: " + JSON.stringify(err));
        return;
      }

      const data = await res.json();
      setSavedAvoir(data);
    } catch (e) {
      alert("Erreur de connexion.");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    if (!savedAvoir) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, pageW, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AVOIR", pageW / 2, 18, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${savedAvoir.avoir_number}`, pageW / 2, 28, { align: "center" });

    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const date = new Date(savedAvoir.created_at).toLocaleDateString("fr-FR");
    doc.text(`Date : ${date}`, 14, 48);
    doc.text(`Facture d'origine : ${fps(savedAvoir.original_invoice_number)}`, 14, 56);
    if (savedAvoir.reason) doc.text(`Motif : ${savedAvoir.reason}`, 14, 64);

    // Table header
    let y = 80;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 6, pageW - 28, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Désignation", 16, y);
    doc.text("Qté", 130, y, { align: "right" });
    doc.text("Prix Unit.", 160, y, { align: "right" });
    doc.text("Total HT", pageW - 14, y, { align: "right" });
    y += 10;

    // Items
    doc.setFont("helvetica", "normal");
    savedAvoir.items.forEach((item: any) => {
      doc.text(String(item.product_name || ""), 16, y);
      doc.text(String(item.quantity), 130, y, { align: "right" });
      doc.text(`${parseFloat(item.unit_price).toFixed(3)} DT`, 160, y, { align: "right" });
      doc.text(`${parseFloat(item.total_price).toFixed(3)} DT`, pageW - 14, y, { align: "right" });
      y += 10;
    });

    // Total
    y += 5;
    doc.setDrawColor(0);
    doc.line(14, y, pageW - 14, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL AVOIR :", 130, y, { align: "right" });
    doc.text(`${parseFloat(savedAvoir.total_amount).toFixed(3)} DT`, pageW - 14, y, { align: "right" });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("PneuShop — Document généré automatiquement", pageW / 2, 280, { align: "center" });

    doc.save(`AVOIR_${savedAvoir.avoir_number}.pdf`);
  };

  // ── If avoir created → show result ────────────────────────────────────────
  if (savedAvoir) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RotateCcw className="h-7 w-7 text-brand-gold" />
            Avoir créé
          </h1>
          <div className="flex gap-2">
            <Button onClick={generatePDF} className="bg-[#0066CC] hover:bg-[#004E9E] text-white border-0">
              <Printer className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button onClick={() => {
              setSavedAvoir(null);
              setFoundOrder(null);
              setSearchInvoice("");
              setReason("");
              setNotes("");
              setReturnQuantities({});
            }} className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0">
              Nouvel avoir
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Avoir header */}
            <div className="bg-gray-900 text-white text-center py-4 rounded-lg">
              <div className="text-2xl font-bold">AVOIR</div>
              <div className="text-sm opacity-80">N° {savedAvoir.avoir_number}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-bold">Date :</span> {new Date(savedAvoir.created_at).toLocaleDateString("fr-FR")}</div>
              <div><span className="font-bold">Facture d'origine :</span> {fps(savedAvoir.original_invoice_number)}</div>
              {savedAvoir.reason && <div className="col-span-2"><span className="font-bold">Motif :</span> {savedAvoir.reason}</div>}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix Unit.</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedAvoir.items.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{parseFloat(item.unit_price).toFixed(3)} DT</TableCell>
                    <TableCell className="text-right">{parseFloat(item.total_price).toFixed(3)} DT</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="text-xl font-bold">
                Total Avoir : {parseFloat(savedAvoir.total_amount).toFixed(3)} DT
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RotateCcw className="h-7 w-7 text-brand-gold" />
          Avoir / Retour
        </h1>
        <Button className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0" onClick={handleExportAvoirs} disabled={avoirHistory.length === 0}>
          <FileDown className="h-4 w-4" />
          Exporter l'historique (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Search */}
        <Card>
          <CardHeader><CardTitle>Rechercher la facture</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="N° facture (ex: CPS26000001)"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchError && <p className="text-red-500 text-sm">{searchError}</p>}

            {foundOrder && (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div><span className="font-bold">Facture :</span> {fps(foundOrder.order_number)}</div>
                  <div><span className="font-bold">Client :</span> {foundOrder.client_name}</div>
                  <div><span className="font-bold">Date :</span> {new Date(foundOrder.created_at).toLocaleDateString("fr-FR")}</div>
                  <div><span className="font-bold">Total :</span> {parseFloat(foundOrder.total_amount).toFixed(3)} DT</div>
                </div>

                <Label className="font-bold">Articles à retourner</Label>
                <div className="space-y-2">
                  {foundOrder.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.product_name}</span>
                        <span className="text-xs text-gray-500">{parseFloat(item.unit_price).toFixed(3)} DT × {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500 w-24">Qté retour :</Label>
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={returnQuantities[item.id] || 0}
                          onChange={(e) => setReturnQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.min(parseInt(e.target.value) || 0, item.quantity),
                          }))}
                          className="w-20 text-center"
                        />
                        <span className="text-xs text-gray-400">/ {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — Avoir summary */}
        <Card>
          <CardHeader><CardTitle>Récapitulatif de l'avoir</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Motif du retour</Label>
              <Input
                placeholder="Produit défectueux, erreur de commande..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {selectedItems.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product_name}</TableCell>
                        <TableCell className="text-right">{returnQuantities[item.id]}</TableCell>
                        <TableCell className="text-right">
                          {(returnQuantities[item.id] * parseFloat(item.unit_price)).toFixed(3)} DT
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right text-xl font-bold">
                  Total : {totalAvoir.toFixed(3)} DT
                </div>
              </>
            )}

            {selectedItems.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                Sélectionnez les articles à retourner
              </div>
            )}

            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-100 disabled:bg-yellow-500"
              disabled={selectedItems.length === 0 || isSaving}
              onClick={handleCreateAvoir}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Créer l'Avoir + Remettre en stock
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Historique des avoirs ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Historique des avoirs
            {!loadingHistory && (
              <span className="ml-2 text-sm font-normal text-gray-500">({avoirHistory.length} avoir{avoirHistory.length !== 1 ? "s" : ""})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-gray-400" />
              <span className="text-gray-400 text-sm">Chargement…</span>
            </div>
          ) : avoirHistory.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Aucun avoir enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Avoir</TableHead>
                    <TableHead>Facture origine</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead className="text-right">Total (DT)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avoirHistory.map((avoir) => (
                    <TableRow key={avoir.id}>
                      <TableCell className="font-mono text-sm font-semibold">{avoir.avoir_number}</TableCell>
                      <TableCell className="font-mono text-sm">{fps(avoir.original_invoice_number)}</TableCell>
                      <TableCell className="text-sm">{new Date(avoir.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-sm text-gray-600">{avoir.reason || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {Array.isArray(avoir.items) && avoir.items.length > 0
                          ? avoir.items.map((it: any) => `${it.product_name} (×${it.quantity})`).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-brand-red">
                        {parseFloat(avoir.total_amount).toFixed(3)} DT
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}