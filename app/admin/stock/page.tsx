"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package, AlertTriangle, TrendingUp, Plus, Minus, X,
  Calendar, ChevronRight, Loader2, AlertCircle, FileDown, Printer,
  ClipboardList, Check, Search, RefreshCw,
} from "lucide-react";
import ExcelJS from "exceljs";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/config";

/* ─── Types ─────────────────────────────────────────────── */
type StockVariant = "default" | "secondary" | "destructive" | "outline";

interface StockStatus { status: string; variant: StockVariant; }
const getStockStatus = (current: number, min = 5, max = 100): StockStatus => {
  if (current <= 0) return { status: "Rupture de stock", variant: "destructive" };
  if (current <= min) return { status: "Stock faible", variant: "secondary" };
  if (current < max) return { status: "En stock", variant: "default" };
  return { status: "Stock élevé", variant: "outline" };
};

interface AdminProduct {
  id: number; name: string; brand: string; size: string; category: string;
  stock: number; stockMin: number; stockMax: number;
  prixAchat: number; prixVente: number; emplacement: string;
  isOnSale: boolean; discountPct: number;
}

interface DotBatch {
  id: number; quantity: number; dot: string; dot_date: string | null;
  emplacement: string; notes: string; created_at: string;
}

/* ─── Types client ───────────────────────────────────────── */
interface Customer { id: number; name: string; email: string; phone: string; }

/* ─── Composant panneau DOT ──────────────────────────────── */
function DotPanel({
  product, onClose, onStockChanged,
}: {
  product: AdminProduct;
  onClose: () => void;
  onStockChanged: (productId: number, newStock: number) => void;
}) {
  const [batches, setBatches] = useState<DotBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* sell-form state (one at a time, keyed by batchId) */
  const [sellBatchId, setSellBatchId] = useState<number | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellDiscount, setSellDiscount] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<Customer[]>([]);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [showSugg, setShowSugg] = useState(false);
  const [selling, setSelling] = useState(false);
  const [sellMsg, setSellMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [lastSale, setLastSale] = useState<{
    batch: DotBatch; qty: number; discount: number; clientName: string; deliveryCost: number;
  } | null>(null);

  /* delivery cost state */
  const [sellDeliveryCost, setSellDeliveryCost] = useState(0);

  /* add-batch state */
  const [showAdd, setShowAdd] = useState(false);
  const [addDot, setAddDot] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addEmplacement, setAddEmplacement] = useState("");
  const [adding, setAdding] = useState(false);

  /* adjust-batch (correction +/-) state */
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustError, setAdjustError] = useState("");

  const token = () => localStorage.getItem("access_token");

  /* ── load batches ── */
  const loadBatches = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_URL}/admin/products/${product.id}/dot-batches/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setBatches(await r.json());
    } catch (e: any) {
      setError(`Impossible de charger les lots DOT (${e.message})`);
    } finally { setLoading(false); }
  }, [product.id]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  /* ── client search debounce ── */
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) { setClientSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/admin/customers/?q=${encodeURIComponent(clientSearch)}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (r.ok) setClientSuggestions(await r.json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);

  /* ── open/close sell form ── */
  function openSell(batch: DotBatch) {
    setSellBatchId(batch.id);
    setSellQty(1);
    setSellDiscount(0);
    setSellDeliveryCost(0);
    setClientSearch("");
    setSelectedClient(null);
    setClientSuggestions([]);
    setSellMsg(null);
    setLastSale(null);
  }
  function closeSell() {
    setSellBatchId(null);
    setSellDiscount(0);
    setSellDeliveryCost(0);
    setClientSearch("");
    setSelectedClient(null);
    setClientSuggestions([]);
    setSellMsg(null);
    setLastSale(null);
  }

  /* ── sell ── */
  async function handleSell(batch: DotBatch) {
    if (sellQty < 1 || sellQty > batch.quantity) return;
    setSelling(true); setSellMsg(null);
    try {
      const clientName = selectedClient?.name || clientSearch || "";
      const r = await fetch(`${API_URL}/admin/products/${product.id}/consume-dot-batch/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batch.id,
          quantity: sellQty,
          reason: "vente",
          client_name: clientName,
          client_id: selectedClient?.id || null,
          discount_pct: sellDiscount,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      setSellMsg({ text: `✓ ${sellQty} pneu(s) vendu(s) — DOT ${batch.dot}.`, ok: true });
      setLastSale({ batch, qty: sellQty, discount: sellDiscount, clientName, deliveryCost: sellDeliveryCost });
      onStockChanged(product.id, data.new_stock ?? (totalStock - sellQty));
      await loadBatches();
      // No auto-close — user clicks "Imprimer facture" or X manually
    } catch (e: any) {
      setSellMsg({ text: e.message, ok: false });
    } finally { setSelling(false); }
  }

  /* ── generate sale invoice ── */
  function generateDotSaleInvoice() {
    if (!lastSale) return;
    const { batch, qty, discount, clientName, deliveryCost } = lastSale;
    const tvaRate = 19;
    const unitTTC = product.prixVente;
    const unitHT = unitTTC / (1 + tvaRate / 100);
    const remiseRate = discount / 100;
    const unitHTNet = unitHT * (1 - remiseRate);
    const montantHT = unitHTNet * qty;
    const montantTVA = montantHT * (tvaRate / 100);
    const remiseAmt = unitHT * remiseRate * qty;
    const netHT = montantHT;
    const totalTTC = netHT + montantTVA + 1 + (deliveryCost || 0); // 1 = timbre fiscal
    const today = new Date().toLocaleDateString("fr-FR");
    const invoiceNum = `FPS${Date.now().toString().slice(-8)}`;

    const remiseRowHTML = discount > 0
      ? `<tr><td>TOTAL REMISE</td><td style="text-align:right;border:1px solid #000;padding:3px 6px">${remiseAmt.toFixed(3)}</td></tr>`
      : "";

    const deliveryRowHTML = deliveryCost > 0
      ? `<tr><td>FRAIS DE LIVRAISON</td><td style="text-align:right;border:1px solid #000;padding:3px 6px">${deliveryCost.toFixed(3)}</td></tr>`
      : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture ${invoiceNum}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:10pt;margin:15mm;color:#000}
      h2{margin:0;font-size:14pt}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #000;padding:4px 6px;font-size:9pt}
      th{background:#f0f0f0;text-align:center}
      .right{text-align:right} .center{text-align:center}
      .totals-table{width:220px;float:right;margin-top:12px}
      .totals-table td{border:1px solid #000;padding:3px 6px;font-size:9pt}
      .totals-table .bold{font-weight:bold}
      .header-info{display:flex;justify-content:space-between;margin-bottom:12px}
      @media print{body{margin:10mm}}
    </style></head><body>
    <div style="text-align:center;margin-bottom:14px;border-bottom:2px solid #000;padding-bottom:8px">
      <h2>FACTURE</h2>
      <div style="font-size:12pt;font-weight:bold">${invoiceNum}</div>
    </div>
    <div class="header-info">
      <div>
        <div><b>Client :</b> ${clientName || "—"}</div>
        <div><b>Date :</b> ${today}</div>
      </div>
    </div>
    <table style="margin-bottom:16px">
      <thead><tr>
        <th>REF.</th><th>DÉSIGNATION</th><th>QTÉ</th>
        <th>PU HT</th><th>TVA %</th><th>REM %</th>
        <th>Mnt HT</th><th>Mnt TTC</th>
      </tr></thead>
      <tbody><tr>
        <td class="center">${product.size}</td>
        <td>${product.brand} ${product.name}</td>
        <td class="center">${qty}</td>
        <td class="right">${unitHT.toFixed(3)}</td>
        <td class="center">${tvaRate}</td>
        <td class="center">${discount}</td>
        <td class="right">${montantHT.toFixed(3)}</td>
        <td class="right">${(totalTTC - 1 - (deliveryCost || 0)).toFixed(3)}</td>
      </tr></tbody>
    </table>
    <table class="totals-table">
      <tr><td>TOTAL HT</td><td class="right">${(unitHT * qty).toFixed(3)}</td></tr>
      ${remiseRowHTML}
      <tr><td>TOTAL NET HT</td><td class="right">${netHT.toFixed(3)}</td></tr>
      <tr><td>TOTAL T.V.A (${tvaRate}%)</td><td class="right">${montantTVA.toFixed(3)}</td></tr>
      ${deliveryRowHTML}
      <tr><td>Timbre</td><td class="right">1.000</td></tr>
      <tr class="bold"><td><b>TOTAL T.T.C</b></td><td class="right"><b>${totalTTC.toFixed(3)}</b></td></tr>
    </table>
    <div style="clear:both;margin-top:40px;border-top:1px solid #ccc;padding-top:8px;font-size:8pt;text-align:center;color:#666">
      Cachet et Signature
    </div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  /* ── add batch ── */
  async function handleAddBatch() {
    if (!addDot || addQty < 1) return;
    setAdding(true);
    try {
      const r = await fetch(`${API_URL}/admin/products/${product.id}/add-dot-batch/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dot: addDot, quantity: addQty, emplacement: addEmplacement }),
      });
      if (!r.ok) throw new Error("Erreur ajout");
      const data = await r.json();
      onStockChanged(product.id, data.new_stock ?? (totalStock + addQty));
      setAddDot(""); setAddQty(1); setAddEmplacement(""); setShowAdd(false);
      await loadBatches();
    } catch (e: any) { alert(e.message); }
    finally { setAdding(false); }
  }

  /* ── adjust batch quantity (correction +/-) ── */
  async function handleAdjust(batch: DotBatch, delta: number) {
    if (delta < 0 && batch.quantity + delta < 0) return;
    setAdjustingId(batch.id); setAdjustError("");
    try {
      const r = await fetch(`${API_URL}/admin/products/${product.id}/adjust-dot-batch/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batch.id, delta }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      onStockChanged(product.id, data.new_stock ?? (totalStock + delta));
      await loadBatches();
    } catch (e: any) {
      setAdjustError(e.message);
    } finally { setAdjustingId(null); }
  }

  function dotAge(dotDate: string | null) {
    if (!dotDate) return null;
    const months = Math.floor((Date.now() - new Date(dotDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) return `${months} mois`;
    return `${Math.floor(months / 12)} an(s) ${months % 12} mois`;
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-yellow-50">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-gold" />
            Gestion DOT — Lots de stock
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.brand} · {product.name} · {product.size}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Résumé */}
        <div className="flex gap-3">
          <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-brand-gold">{totalStock}</p>
            <p className="text-xs text-brand-gold">unités en stock</p>
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{batches.length}</p>
            <p className="text-xs text-gray-500">lots DOT</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chargement des lots…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-brand-red rounded-lg p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        {adjustError && (
          <div className="bg-red-50 border border-red-200 text-brand-red rounded-lg p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{adjustError}
          </div>
        )}

        {/* Lot list */}
        {!loading && !error && batches.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun lot DOT enregistré</p>
            <p className="text-xs mt-1">Ajoutez un lot manuellement ci-dessous</p>
          </div>
        )}

        {!loading && batches.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Lots du plus ancien au plus récent — sélectionnez lequel vendre
            </p>

            {batches.map((batch, idx) => {
              const isSelling = sellBatchId === batch.id;
              const isFirst = idx === 0;
              return (
                <div
                  key={batch.id}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${
                    isSelling
                      ? "border-yellow-500 shadow-md"
                      : isFirst
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Batch header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* DOT info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-gray-900">
                          DOT {batch.dot || "—"}
                        </span>
                        {isFirst && (
                          <span className="text-[10px] font-bold bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                            PRIORITÉ DOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                        {batch.dot_date && (
                          <p>
                            Fabriqué&nbsp;: {new Date(batch.dot_date).toLocaleDateString("fr-FR")}
                            {" · "}Âge&nbsp;: {dotAge(batch.dot_date)}
                          </p>
                        )}
                        {batch.emplacement && <p>Emplacement&nbsp;: <span className="font-medium">{batch.emplacement}</span></p>}
                      </div>
                    </div>

                    {/* Quantity + correction +/- */}
                    <div className="text-right flex-shrink-0 mr-2">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleAdjust(batch, -1)}
                          disabled={adjustingId === batch.id || batch.quantity <= 0}
                          title="Diminuer la quantité de ce lot"
                          className="w-6 h-6 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`text-xl font-bold ${isFirst ? "text-brand-gold" : "text-gray-700"}`}>
                          {batch.quantity}
                        </span>
                        <button
                          onClick={() => handleAdjust(batch, 1)}
                          disabled={adjustingId === batch.id}
                          title="Augmenter la quantité de ce lot"
                          className="w-6 h-6 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">unité(s)</p>
                    </div>

                    {/* Actions */}
                    {!isSelling ? (
                      <button
                        onClick={() => openSell(batch)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-white transition-colors shadow-sm"
                      >
                        <Minus className="h-3 w-3" /> Vendre
                      </button>
                    ) : (
                      <button
                        onClick={closeSell}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Inline sell form */}
                  {isSelling && (
                    <div className="border-t-2 border-yellow-300 bg-yellow-50 px-4 py-4 space-y-3">
                      <p className="text-xs font-semibold text-brand-gold">
                        Vente depuis DOT {batch.dot} — {batch.quantity} unité(s) disponible(s)
                      </p>

                      {/* Quantity */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Quantité</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                            className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-sm font-bold"
                          >−</button>
                          <input
                            type="number" min={1} max={batch.quantity} value={sellQty}
                            onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setSellQty(Math.min(batch.quantity, Math.max(1, v))); }}
                            className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <button
                            onClick={() => setSellQty((q) => Math.min(batch.quantity, q + 1))}
                            className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-sm font-bold"
                          >+</button>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="relative">
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Client <span className="text-gray-400 font-normal">(nom, email ou téléphone)</span>
                        </label>
                        <input
                          type="text"
                          value={selectedClient ? selectedClient.name : clientSearch}
                          onChange={(e) => {
                            setSelectedClient(null);
                            setClientSearch(e.target.value);
                            setShowSugg(true);
                          }}
                          onFocus={() => setShowSugg(true)}
                          onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                          placeholder="Nom, email ou téléphone…"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        {selectedClient && (
                          <div className="mt-1 flex items-center gap-2 text-xs bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1.5">
                            <span className="font-medium text-brand-gold">{selectedClient.name}</span>
                            <span className="text-brand-gold">{selectedClient.email}</span>
                            <button onClick={() => { setSelectedClient(null); setClientSearch(""); }} className="ml-auto text-brand-gold hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Suggestions dropdown */}
                        {showSugg && clientSuggestions.length > 0 && !selectedClient && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                            {clientSuggestions.map((c) => (
                              <button
                                key={c.id}
                                className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-sm border-b border-gray-100 last:border-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedClient(c);
                                  setClientSearch("");
                                  setShowSugg(false);
                                }}
                              >
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-gray-500 ml-2">{c.email}</span>
                                {c.phone && <span className="text-xs text-gray-400 ml-2">{c.phone}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remise */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Remise (%)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={100} value={sellDiscount}
                            onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setSellDiscount(Math.min(100, Math.max(0, v))); else setSellDiscount(0); }}
                            className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        {sellDiscount > 0 && (
                          <span className="text-xs text-brand-gold font-semibold ml-1">
                            − {(product.prixVente * sellDiscount / 100 * sellQty).toFixed(3)} DT
                          </span>
                        )}
                      </div>

                      {/* Frais de livraison */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Livraison (DT)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} step={0.001} value={sellDeliveryCost}
                            onChange={(e) => { const v = parseFloat(e.target.value); setSellDeliveryCost(isNaN(v) ? 0 : Math.max(0, v)); }}
                            className="w-20 text-center border border-gray-300 rounded px-1 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="0.000"
                          />
                          <span className="text-xs text-gray-400">DT</span>
                        </div>
                        {sellDeliveryCost > 0 && (
                          <span className="text-xs text-brand-gold font-semibold ml-1">
                            + {sellDeliveryCost.toFixed(3)} DT livraison
                          </span>
                        )}
                      </div>

                      {/* Submit */}
                      {sellMsg && (
                        <p className={`text-xs font-medium text-center py-1 rounded ${sellMsg.ok ? "text-brand-gold bg-yellow-50" : "text-gray-700 bg-gray-100"}`}>
                          {sellMsg.text}
                        </p>
                      )}
                      {sellMsg?.ok && lastSale && (
                        <Button
                          onClick={generateDotSaleInvoice}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm"
                        >
                          <Printer className="h-4 w-4 mr-2" /> Imprimer et Valider
                        </Button>
                      )}
                      {!sellMsg?.ok && (
                        <Button
                          onClick={() => handleSell(batch)}
                          disabled={selling || sellQty > batch.quantity}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm"
                        >
                          {selling
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Traitement…</>
                            : <><Minus className="h-4 w-4 mr-2" />Vendre {sellQty} pneu{sellQty > 1 ? "s" : ""} — DOT {batch.dot}</>}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ajouter un nouveau lot DOT */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Ajouter un nouveau pneu (DOT / emplacement / quantité)
            </button>
          ) : (
            <div className="p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nouveau lot</p>
                <button onClick={() => { setShowAdd(false); setAddDot(""); setAddQty(1); setAddEmplacement(""); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">DOT</label>
                <input
                  type="text" value={addDot}
                  onChange={(e) => setAddDot(e.target.value)}
                  placeholder="ex: 2324"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Emplacement</label>
                <input
                  type="text" value={addEmplacement}
                  onChange={(e) => setAddEmplacement(e.target.value)}
                  placeholder="ex: Dépôt A"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Quantité</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-sm font-bold"
                  >−</button>
                  <input
                    type="number" min={1} value={addQty}
                    onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setAddQty(Math.max(1, v)); }}
                    className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    onClick={() => setAddQty((q) => q + 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-sm font-bold"
                  >+</button>
                </div>
              </div>

              <Button
                onClick={handleAddBatch}
                disabled={adding || !addDot || addQty < 1}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold shadow-sm"
              >
                {adding
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Ajout…</>
                  : <><Plus className="h-4 w-4 mr-2" />Ajouter ce lot</>}
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Fixed validation button at bottom right — always visible */}
      <div className="flex-shrink-0 border-t border-yellow-200 bg-yellow-50 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-brand-gold">
          {sellMsg?.ok
            ? "✓ Vente enregistrée — imprimez la facture ou fermez"
            : sellBatchId !== null
            ? `DOT sélectionné — ${sellQty} pneu(s) à vendre${sellDiscount > 0 ? ` · remise ${sellDiscount}%` : ""}`
            : "Cliquez sur « Vendre » pour sélectionner un lot"}
        </span>
        {sellMsg?.ok && lastSale ? (
          <Button
            onClick={generateDotSaleInvoice}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm px-6"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimer et Valider
          </Button>
        ) : (
          <Button
            onClick={() => {
              const batch = batches.find(b => b.id === sellBatchId);
              if (batch) handleSell(batch);
            }}
            disabled={selling || sellBatchId === null || sellQty < 1 || (() => {
              const b = batches.find(x => x.id === sellBatchId);
              return b ? sellQty > b.quantity : false;
            })()}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm px-6 disabled:opacity-40"
          >
            {selling
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Traitement…</>
              : <><Minus className="h-4 w-4 mr-2" />Valider la vente</>}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Types pour le panneau préparation commande ─────────── */
interface PrepItem {
  itemIndex: number;
  productId: string;
  productName: string;
  needed: number;
  batchId: number | null;
  batchDot: string | null;
  qty: number;
  discount: number;
  confirmed: boolean;
}

interface PrepOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  deliveryCost: number;
  createdAt: string;
}

/* ─── Panneau préparation commande ───────────────────────── */
function OrderPrepPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [orders, setOrders] = useState<PrepOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PrepOrder | null>(null);
  const [assignments, setAssignments] = useState<PrepItem[]>([]);
  const [batchesByProduct, setBatchesByProduct] = useState<Record<string, DotBatch[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);

  const token = () => localStorage.getItem("access_token");
  const fpsNum = (n: string) => (n || "").replace(/^CPS/i, "FPS");
  const [deliveryCostInput, setDeliveryCostInput] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      setLoadingOrders(true);
      try {
        const r = await fetch(`${API_URL}/orders/?no_pagination=true`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        const raw: any[] = data.results ?? data;
        setOrders(raw.map((o: any) => ({
          id: String(o.id),
          orderNumber: o.order_number || "",
          customerName: o.shipping_address
            ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() || o.user?.email || "—"
            : o.user?.email || "—",
          customerPhone: o.shipping_address?.phone || "",
          items: (o.items || []).map((it: any) => ({
            productId: String(it.product_id || ""),
            productName: it.product_name || "",
            quantity: it.quantity,
            unitPrice: parseFloat(it.unit_price || 0),
          })),
          totalAmount: parseFloat(o.total_amount || 0),
          deliveryCost: parseFloat(o.delivery_cost || 0),
          createdAt: o.created_at || "",
        })));
      } catch {}
      finally { setLoadingOrders(false); }
    };
    load();
  }, []);

  const selectOrder = async (order: PrepOrder) => {
    setSelectedOrder(order);
    setDeliveryCostInput(order.deliveryCost || 0);
    setLoadingBatches(true);

    const init: PrepItem[] = order.items.map((item, idx) => ({
      itemIndex: idx,
      productId: item.productId,
      productName: item.productName,
      needed: item.quantity,
      batchId: null,
      batchDot: null,
      qty: item.quantity,
      discount: 0,
      confirmed: false,
    }));

    // Restore saved state
    try {
      const saved = localStorage.getItem(`order_prep_${order.id}`);
      if (saved) {
        const savedArr: PrepItem[] = JSON.parse(saved);
        savedArr.forEach(sa => {
          const a = init.find(x => x.itemIndex === sa.itemIndex);
          if (a) Object.assign(a, { batchId: sa.batchId, batchDot: sa.batchDot, qty: sa.qty, discount: sa.discount, confirmed: sa.confirmed });
        });
      }
    } catch {}

    setAssignments(init);

    // Load DOT batches for all products
    const productIds = [...new Set(order.items.map(i => i.productId).filter(Boolean))];
    const batchMap: Record<string, DotBatch[]> = {};
    await Promise.all(productIds.map(async (pid) => {
      try {
        const r = await fetch(`${API_URL}/admin/products/${pid}/dot-batches/`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        batchMap[pid] = r.ok ? await r.json() : [];
      } catch { batchMap[pid] = []; }
    }));
    setBatchesByProduct(batchMap);
    setLoadingBatches(false);
  };

  const save = (orderId: string, next: PrepItem[]) =>
    localStorage.setItem(`order_prep_${orderId}`, JSON.stringify(next));

  const updateItem = (idx: number, updates: Partial<PrepItem>) => {
    setAssignments(prev => {
      const next = prev.map(a => a.itemIndex === idx ? { ...a, ...updates } : a);
      if (selectedOrder) save(selectedOrder.id, next);
      return next;
    });
  };

  const allDone = assignments.length > 0 && assignments.every(a => a.confirmed);
  const doneCount = assignments.filter(a => a.confirmed).length;

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n) + " DT";

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-yellow-50">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand-gold" />
            Préparer une commande
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Assignez les lots DOT avant confirmation</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Order selector */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
            Commande
          </label>
          {loadingOrders ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aucune commande en attente</p>
          ) : (
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={selectedOrder?.id ?? ""}
              onChange={(e) => {
                const o = orders.find(o => o.id === e.target.value);
                if (o) selectOrder(o);
                else { setSelectedOrder(null); setAssignments([]); }
              }}
            >
              <option value="">— Sélectionner une commande —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  #{fpsNum(o.orderNumber)} · {o.customerName} · {o.items.length} art.
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedOrder && (
          <>
            {/* Order summary */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">N° commande</span>
                <span className="font-mono font-bold text-brand-gold">#{fpsNum(selectedOrder.orderNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-semibold">{selectedOrder.customerName}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Téléphone</span>
                  <span>{selectedOrder.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("fr-FR") : "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Frais de livraison</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={0.001}
                    value={deliveryCostInput}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDeliveryCostInput(isNaN(v) ? 0 : Math.max(0, v));
                    }}
                    className="w-24 text-right border border-yellow-300 rounded px-2 py-0.5 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-xs text-gray-400">DT</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-yellow-200 pt-1.5">
                <span className="text-gray-500 font-semibold">Total TTC</span>
                <span className="font-bold text-brand-gold">{fmtCurrency(selectedOrder.totalAmount + deliveryCostInput)}</span>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produits à préparer</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  allDone ? "bg-yellow-100 text-brand-gold" : "bg-yellow-200 text-yellow-800"
                }`}>
                  {doneCount}/{assignments.length} prêts
                </span>
              </div>

              {loadingBatches ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement des lots DOT…
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((asgn) => {
                    const batches = batchesByProduct[asgn.productId] || [];
                    const selBatch = batches.find(b => b.id === asgn.batchId);
                    return (
                      <div
                        key={asgn.itemIndex}
                        className={`rounded-xl border-2 overflow-hidden transition-all ${
                          asgn.confirmed ? "border-yellow-500 bg-yellow-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Item header */}
                        <div className="flex items-start gap-3 px-4 py-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            asgn.confirmed ? "border-yellow-500 bg-yellow-500" : "border-gray-300"
                          }`}>
                            {asgn.confirmed && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 leading-snug">{asgn.productName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qté commandée : <span className="font-bold text-gray-700">{asgn.needed}</span>
                            </p>
                            {asgn.confirmed && selBatch && (
                              <p className="text-xs text-brand-gold mt-1 font-medium">
                                ✓ DOT {selBatch.dot} · {asgn.qty} unité(s)
                                {asgn.discount > 0 ? ` · Remise ${asgn.discount}%` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Assignment form */}
                        {!asgn.confirmed && (
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2.5">
                            {/* Batch */}
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1">Lot DOT</label>
                              {batches.length === 0 ? (
                                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
                                  Aucun lot dispo — ajoutez du stock via Gestion DOT
                                </p>
                              ) : (
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  value={asgn.batchId ?? ""}
                                  onChange={(e) => {
                                    const b = batches.find(b => b.id === parseInt(e.target.value));
                                    updateItem(asgn.itemIndex, { batchId: b?.id ?? null, batchDot: b?.dot ?? null });
                                  }}
                                >
                                  <option value="">— Sélectionner un lot —</option>
                                  {batches.map(b => (
                                    <option key={b.id} value={b.id} disabled={b.quantity < 1}>
                                      DOT {b.dot} · {b.quantity} dispo{b.quantity < asgn.needed ? " ⚠ insuffisant" : ""}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Qty */}
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Quantité</label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateItem(asgn.itemIndex, { qty: Math.max(1, asgn.qty - 1) })}
                                  className="w-6 h-6 rounded border border-gray-300 bg-white flex items-center justify-center text-xs font-bold hover:bg-gray-100"
                                >−</button>
                                <input
                                  type="number" min={1} max={selBatch?.quantity ?? asgn.needed}
                                  value={asgn.qty}
                                  onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    if (!isNaN(v)) updateItem(asgn.itemIndex, { qty: Math.max(1, v) });
                                  }}
                                  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                  onClick={() => {
                                    const mx = selBatch?.quantity ?? asgn.needed;
                                    updateItem(asgn.itemIndex, { qty: Math.min(mx, asgn.qty + 1) });
                                  }}
                                  className="w-6 h-6 rounded border border-gray-300 bg-white flex items-center justify-center text-xs font-bold hover:bg-gray-100"
                                >+</button>
                              </div>
                            </div>

                            {/* Discount */}
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Remise (%)</label>
                              <input
                                type="number" min={0} max={100} value={asgn.discount}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value);
                                  updateItem(asgn.itemIndex, { discount: isNaN(v) ? 0 : Math.min(100, Math.max(0, v)) });
                                }}
                                className="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>

                            {/* Validate */}
                            {asgn.batchId && selBatch && asgn.qty > selBatch.quantity && (
                              <p className="text-xs text-brand-red bg-red-50 border border-red-200 rounded px-2 py-1">
                                ⚠ Quantité demandée ({asgn.qty}) supérieure au stock disponible ({selBatch.quantity})
                              </p>
                            )}
                            <button
                              onClick={() => {
                                if (!asgn.batchId) return;
                                updateItem(asgn.itemIndex, { confirmed: true });
                              }}
                              disabled={!asgn.batchId || (!!selBatch && asgn.qty > selBatch.quantity)}
                              className="w-full py-1.5 rounded-lg text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="h-3.5 w-3.5" /> Valider ce produit
                            </button>
                          </div>
                        )}

                        {/* Edit confirmed */}
                        {asgn.confirmed && (
                          <div className="border-t border-yellow-200 px-4 py-2 flex justify-end">
                            <button
                              onClick={() => updateItem(asgn.itemIndex, { confirmed: false })}
                              className="text-xs text-gray-400 hover:text-gray-700 underline"
                            >
                              Modifier
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 border-t border-yellow-200 bg-yellow-50 px-5 py-3 flex items-center justify-between gap-3">
        <span className="text-xs text-brand-gold flex-1">
          {!selectedOrder
            ? "Sélectionnez une commande pour commencer"
            : allDone
            ? "✓ Tous les produits sont prêts — allez confirmer"
            : `${doneCount}/${assignments.length} produit(s) assigné(s)`}
        </span>
        {selectedOrder && (
          <Button
            onClick={() => {
              // Persiste les frais de livraison pour que la modal de confirmation les récupère
              localStorage.setItem(`order_delivery_${selectedOrder.id}`, String(deliveryCostInput));
              router.push("/admin/commandes");
              onClose();
            }}
            disabled={!allDone}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm disabled:opacity-40 whitespace-nowrap"
          >
            Confirmer dans Commandes →
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page principale
═══════════════════════════════════════════════════════════ */
export default function StockManagementPage() {
  const [stock, setStock] = useState<AdminProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [dotPanel, setDotPanel] = useState<AdminProduct | null>(null);

  const [statusPanel, setStatusPanel] = useState<{
    isOpen: boolean; product: AdminProduct | null; minStock: number; maxStock: number;
  }>({ isOpen: false, product: null, minStock: 5, maxStock: 100 });

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [showOrderPrep, setShowOrderPrep] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); return null;
  }

  // Debounce search term for server-side query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 and brand filter when search changes
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  // Auto-open DOT panel when ?dot=productId is in URL (coming from DOT state page)
  useEffect(() => {
    const dotProductId = searchParams.get("dot");
    if (!dotProductId || stock.length === 0) return;
    const product = stock.find((p) => p.id === parseInt(dotProductId));
    if (product) {
      setDotPanel(product);
      // Remove the query param without navigating
      router.replace("/admin/stock");
    }
  }, [searchParams, stock]);

  // Refetch when:
  // 1. Tab becomes visible (browser bfcache restore or tab switch)
  // 2. Catalog page signals a stock update via localStorage (cross-tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshKey((k) => k + 1);
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "stock_updated_at") {
        setRefreshKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Fetch products (server-side search + pagination)
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
        const response = await fetch(
          `${API_URL}/admin/products/?page=${pagination.page}&limit=${pagination.limit}${searchParam}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`, "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setPagination((prev) => ({ ...prev, total: data.count ?? data.results?.length ?? 0 }));
        setStock((data.results || data).map((item: any) => ({
          id: item.id, name: item.name, brand: item.brand, size: item.size,
          category: item.category_name || item.category?.name || "-",
          stock: item.stock, stockMin: item.stock_min ?? 5, stockMax: item.stock_max ?? 100,
          prixAchat: parseFloat(item.purchase_price || item.old_price || "0"),
          prixVente: parseFloat(item.price || "0"),
          emplacement: item.location || "-", isOnSale: item.is_on_sale || false,
          discountPct: item.discount_percentage || 0,
        })));
      } catch (err) { console.error("Erreur chargement stock :", err); }
    };
    fetchStock();
  }, [pagination.page, debouncedSearch, refreshKey]);

  const handleDotStockChanged = (productId: number, newStock: number) => {
    setStock((prev) => prev.map((p) => p.id === productId ? { ...p, stock: newStock } : p));
    // Met aussi à jour le produit dans le panneau DOT si ouvert
    setDotPanel((prev) => prev && prev.id === productId ? { ...prev, stock: newStock } : prev);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " DT";

  const handleExportStock = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("État Stock");

    ws.columns = [
      { header: "Produit", key: "name", width: 40 },
      { header: "Marque", key: "brand", width: 16 },
      { header: "Taille", key: "size", width: 14 },
      { header: "Catégorie", key: "category", width: 18 },
      { header: "Stock actuel", key: "stock", width: 14 },
      { header: "Stock Min", key: "stockMin", width: 12 },
      { header: "Stock Max", key: "stockMax", width: 12 },
      { header: "Statut", key: "status", width: 16 },
      { header: "Prix Achat (DT)", key: "prixAchat", width: 16 },
      { header: "Prix Vente (DT)", key: "prixVente", width: 16 },
      { header: "Valeur Stock (DT)", key: "valeur", width: 18 },
      { header: "Emplacement", key: "emplacement", width: 18 },
    ];

    ws.getRow(1).font = { bold: true };

    stock.forEach((item) => {
      const statusLabel = getStockStatus(item.stock, item.stockMin, item.stockMax).status;
      ws.addRow({
        name: item.name,
        brand: item.brand,
        size: item.size,
        category: item.category,
        stock: item.stock,
        stockMin: item.stockMin,
        stockMax: item.stockMax,
        status: statusLabel,
        prixAchat: Number(item.prixAchat).toFixed(3),
        prixVente: Number(item.prixVente).toFixed(3),
        valeur: Number(item.stock * item.prixVente).toFixed(3),
        emplacement: item.emplacement || "",
      });
    });

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const filename = `Etat_Stock_${date}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const openStatusPanel = (item: AdminProduct) =>
    setStatusPanel({ isOpen: true, product: item, minStock: item.stockMin, maxStock: item.stockMax });

  const closeStatusPanel = () =>
    setStatusPanel({ isOpen: false, product: null, minStock: 5, maxStock: 100 });

  const handleStatusPanelConfirm = async () => {
    if (!statusPanel.product) return;
    const { id } = statusPanel.product;
    const { minStock, maxStock } = statusPanel;
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ stock_min: minStock, stock_max: maxStock }),
      });
      if (!response.ok) throw new Error("Erreur");
      setStock((prev) => prev.map((p) => p.id === id ? { ...p, stockMin: minStock, stockMax: maxStock } : p));
      closeStatusPanel();
    } catch (err) { console.error("Échec mise à jour seuils:", err); }
  };


  // Unique brands extracted from loaded page (for quick-filter chips)
  const brands = useMemo(() => [...new Set(stock.map(i => i.brand).filter(Boolean))].sort(), [stock]);

  // Instant local filter (brand + status + search term) applied immediately on loaded page
  // Server search (debouncedSearch) handles cross-page results
  const filteredStock = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return stock.filter((item) => {
      const matchesStatus = !statusFilter ||
        getStockStatus(item.stock, item.stockMin, item.stockMax).status === statusFilter;
      const matchesBrand = !brandFilter ||
        item.brand.toLowerCase() === brandFilter.toLowerCase();
      const matchesSearch = !term ||
        item.name.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        item.size.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);
      return matchesStatus && matchesBrand && matchesSearch;
    });
  }, [stock, statusFilter, brandFilter, searchTerm]);

  const lowStockItems = stock.filter((item) => item.stock > 0 && item.stock <= item.stockMin);
  const totalValue = stock.reduce((sum, item) => sum + item.stock * item.prixVente, 0);

  return (
    <div className="space-y-2 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">{pagination.total} produits</Badge>
          <Button
            size="sm"
            className="gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-0"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Actualiser le stock"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0"
            onClick={() => setShowOrderPrep(true)}
          >
            <ClipboardList className="h-4 w-4" />
            Préparer une commande
          </Button>
          <Button size="sm" className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0" onClick={handleExportStock}>
            <FileDown className="h-4 w-4" />
            Exporter l'historique (Excel)
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardHeader className="flex justify-between items-center pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">Produits en stock</CardTitle>
            <div className="p-2 bg-[#E3F0FF] rounded-lg"><Package className="h-4 w-4 text-[#0066CC]" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{stock.length}</div><p className="text-xs text-gray-400">produits</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex justify-between items-center pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">Stock faible</CardTitle>
            <div className="p-2 bg-yellow-50 rounded-lg"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-700">{lowStockItems.length}</div><p className="text-xs text-gray-400">produits</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#A68823]">
          <CardHeader className="flex justify-between items-center pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">Valeur stock</CardTitle>
            <div className="p-2 bg-[#FBF5E0] rounded-lg"><TrendingUp className="h-4 w-4 text-[#A68823]" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-[#A68823]">{formatCurrency(totalValue)}</div><p className="text-xs text-gray-400">valeur totale</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#0066CC]">
          <CardHeader className="flex justify-between items-center pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">Unités totales</CardTitle>
            <div className="p-2 bg-[#E3F0FF] rounded-lg"><Package className="h-4 w-4 text-[#0066CC]" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{stock.reduce((s, i) => s + i.stock, 0)}</div><p className="text-xs text-gray-400">unités</p></CardContent>
        </Card>
      </div>

      {/* Search bar — full width, prominent */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
        <Input
          placeholder="Rechercher par nom, marque, taille, catégorie…"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setBrandFilter(null); }}
          className="pl-10 pr-10 h-11 text-sm"
          autoFocus={false}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters row: status + brand chips */}
      <div className="space-y-2">
        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 mr-1">Statut :</span>
          {[
            { label: "Tous", value: null },
            { label: "En stock", value: "En stock" },
            { label: "Stock faible", value: "Stock faible" },
            { label: "Rupture", value: "Rupture de stock" },
          ].map(({ label, value }) => {
            const isActive = value === null ? statusFilter === null : statusFilter === value;
            const count = value ? stock.filter(i => getStockStatus(i.stock, i.stockMin, i.stockMax).status === value).length : null;
            const activeColor = value === null ? "bg-gray-800 text-white border-gray-800"
              : value === "En stock" ? "bg-[#0066CC] text-white border-[#0066CC]"
              : value === "Stock faible" ? "bg-yellow-500 text-white border-yellow-500"
              : "bg-[#9B2226] text-white border-[#9B2226]";
            const idleColor = value === null ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              : value === "En stock" ? "border-[#0066CC]/30 bg-white text-[#0066CC] hover:bg-[#E3F0FF]"
              : value === "Stock faible" ? "border-yellow-300 bg-white text-yellow-800 hover:bg-yellow-50"
              : "border-[#9B2226]/30 bg-white text-[#9B2226] hover:bg-red-50";
            return (
              <button key={label} onClick={() => setStatusFilter(value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isActive ? activeColor : idleColor}`}>
                {label}{count !== null && <span className="ml-1 opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Brand chips — only shown when brands are loaded */}
        {brands.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 mr-1">Marque :</span>
            <button
              onClick={() => setBrandFilter(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                !brandFilter ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Toutes
            </button>
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => { setBrandFilter(brandFilter === brand ? null : brand); setSearchTerm(""); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  brandFilter === brand
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                {brand}
                <span className="ml-1 opacity-75">
                  ({stock.filter(i => i.brand.toLowerCase() === brand.toLowerCase()).length})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Active filters summary */}
        {(searchTerm || brandFilter || statusFilter) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{filteredStock.length} résultat{filteredStock.length !== 1 ? "s" : ""}</span>
            <button
              onClick={() => { setSearchTerm(""); setBrandFilter(null); setStatusFilter(null); }}
              className="text-red-500 hover:text-brand-red underline"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="space-y-4">
        {filteredStock.length === 0 && <p className="text-gray-500 text-sm">Aucun produit trouvé</p>}

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Produit</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Marque</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Taille</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Stock</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-600">Statut</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-600">Min/Max</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-600">Prix vente</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Stock DOT</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax);
                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 font-medium text-sm min-w-[220px] leading-snug">{item.name}</td>
                    <td className="px-2 py-2 text-sm whitespace-nowrap">{item.brand}</td>
                    <td className="px-2 py-2 text-sm whitespace-nowrap">{item.size}</td>
                    <td className="px-2 py-2 text-center font-bold text-sm">{item.stock}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        onClick={() => openStatusPanel(item)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity
                          ${stockStatus.status === "Rupture de stock" ? "bg-[#9B2226] text-white" :
                            stockStatus.status === "Stock faible" ? "bg-yellow-500 text-white" :
                            stockStatus.status === "En stock" ? "bg-emerald-600 text-white" :
                            "bg-[#0066CC] text-white"}`}
                      >
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500 whitespace-nowrap">{item.stockMin}/{item.stockMax}</td>
                    <td className="px-2 py-2 text-sm font-semibold text-[#A68823] whitespace-nowrap">{formatCurrency(item.prixVente)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setDotPanel(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-[#0066CC] border border-[#0066CC]/40 hover:bg-[#E3F0FF] transition-colors"
                      >
                        <Calendar className="h-3 w-3" /> Modifier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panneau Préparer commande */}
        <AnimatePresence>
          {showOrderPrep && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setShowOrderPrep(false)}
              />
              <OrderPrepPanel onClose={() => setShowOrderPrep(false)} />
            </>
          )}
        </AnimatePresence>

        {/* Panneau DOT/FEFO */}
        <AnimatePresence>
          {dotPanel && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setDotPanel(null)}
              />
              <DotPanel
                product={dotPanel}
                onClose={() => setDotPanel(null)}
                onStockChanged={handleDotStockChanged}
              />
            </>
          )}
        </AnimatePresence>

        {/* Status Panel */}
        <AnimatePresence>
          {statusPanel.isOpen && statusPanel.product && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={closeStatusPanel}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold">Seuils Min / Max</h2>
                  <button onClick={closeStatusPanel}><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Produit</span><span className="font-semibold text-right max-w-[60%]">{statusPanel.product.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Stock actuel</span><span className="font-bold text-brand-gold">{statusPanel.product.stock} unité(s)</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum</label>
                    <input type="number" min={0} value={statusPanel.minStock}
                      onChange={(e) => setStatusPanel((p) => ({ ...p, minStock: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum</label>
                    <input type="number" min={0} value={statusPanel.maxStock}
                      onChange={(e) => setStatusPanel((p) => ({ ...p, maxStock: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={closeStatusPanel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">Annuler</Button>
                  <Button onClick={handleStatusPanelConfirm} className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Confirmer</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 disabled:opacity-40" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Précédent</Button>
          <span className="text-gray-700 text-sm">Page {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.limit))}</span>
          <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 disabled:opacity-40" disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Suivant</Button>
        </div>
      </div>
    </div>
  );
}