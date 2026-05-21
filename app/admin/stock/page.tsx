"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package, AlertTriangle, TrendingUp, Plus, Minus, X,
  Calendar, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
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

/* ─── Composant panneau DOT/FEFO ────────────────────────── */
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

  // Consommation FEFO
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumeReason, setConsumeReason] = useState("vente");
  const [consuming, setConsuming] = useState(false);
  const [consumeMsg, setConsumeMsg] = useState("");

  // Ajout manuel
  const [showAdd, setShowAdd] = useState(false);
  const [addDot, setAddDot] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addEmplacement, setAddEmplacement] = useState("");
  const [adding, setAdding] = useState(false);

  const token = () => localStorage.getItem("access_token");

  const loadBatches = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_URL}/admin/products/${product.id}/dot-batches/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error("Erreur chargement");
      setBatches(await r.json());
    } catch { setError("Impossible de charger les lots DOT."); }
    finally { setLoading(false); }
  }, [product.id]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);

  async function handleConsume() {
    if (consumeQty < 1) return;
    setConsuming(true); setConsumeMsg("");
    try {
      const r = await fetch(`${API_URL}/admin/products/${product.id}/consume-dot-batch/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: consumeQty, reason: consumeReason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      setConsumeMsg(`✓ ${consumeQty} pneu(s) consommé(s) depuis le lot le plus ancien.`);
      setConsumeQty(1);
      onStockChanged(product.id, data.new_stock ?? (totalStock - consumeQty));
      await loadBatches();
    } catch (e: any) {
      setConsumeMsg(`✗ ${e.message}`);
    } finally { setConsuming(false); }
  }

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
      setAddDot(""); setAddQty(1); setAddEmplacement("");
      setShowAdd(false);
      await loadBatches();
    } catch (e: any) {
      alert(e.message);
    } finally { setAdding(false); }
  }

  function formatDot(dot: string, dotDate: string | null) {
    if (!dotDate) return dot || "—";
    const d = new Date(dotDate);
    return `${dot} (sem. ${dot.split(".")[0]} / ${d.getFullYear()})`;
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
      className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
        <div>
          <h2 className="font-bold text-gray-900">Gestion DOT — FEFO</h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.brand} · {product.name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Résumé */}
        <div className="flex gap-3">
          <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalStock}</p>
            <p className="text-xs text-blue-500">unités totales</p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{batches.length}</p>
            <p className="text-xs text-orange-400">lots DOT</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chargement des lots…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Liste des lots FEFO */}
        {!loading && batches.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun lot DOT enregistré</p>
            <p className="text-xs mt-1">Ajoutez un lot manuellement ci-dessous</p>
          </div>
        )}

        {!loading && batches.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Lots par ordre FEFO (plus ancien en premier)
            </p>
            {batches.map((batch, idx) => (
              <div
                key={batch.id}
                className={`rounded-lg border-2 p-3 ${
                  idx === 0
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        DOT {batch.dot || "—"}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                          À VENDRE EN 1ᵉʳ
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      {batch.dot_date && (
                        <p>Fabriqué : {new Date(batch.dot_date).toLocaleDateString("fr-FR")} · Âge : {dotAge(batch.dot_date)}</p>
                      )}
                      {batch.emplacement && <p>Emplacement : {batch.emplacement}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-bold ${idx === 0 ? "text-orange-600" : "text-gray-700"}`}>
                      {batch.quantity}
                    </span>
                    <p className="text-xs text-gray-400">unité(s)</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zone FEFO : consommer */}
        {!loading && batches.length > 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-orange-500" />
              Consommer (FEFO automatique)
            </p>
            <p className="text-xs text-gray-500">
              Le système prend automatiquement du lot avec le DOT le plus ancien.
            </p>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600 w-16 flex-shrink-0">Quantité</label>
              <input
                type="number" min={1} max={totalStock} value={consumeQty}
                onChange={(e) => setConsumeQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600 w-16 flex-shrink-0">Motif</label>
              <select
                value={consumeReason}
                onChange={(e) => setConsumeReason(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="vente">Vente</option>
                <option value="retour">Retour / Échange</option>
                <option value="perte">Perte / Casse</option>
                <option value="ajustement">Ajustement inventaire</option>
              </select>
            </div>
            <Button
              onClick={handleConsume}
              disabled={consuming || consumeQty > totalStock}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {consuming
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Traitement…</>
                : <><Minus className="h-4 w-4 mr-2" />Consommer {consumeQty} pneu(s)</>}
            </Button>
            {consumeMsg && (
              <p className={`text-xs text-center font-medium ${consumeMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                {consumeMsg}
              </p>
            )}
          </div>
        )}

        {/* Ajout manuel d'un lot */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" /> Ajouter un lot manuellement
            </span>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showAdd ? "rotate-90" : ""}`} />
          </button>
          {showAdd && (
            <div className="px-4 py-3 space-y-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    DOT <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal"> (ex: 15.24)</span>
                  </label>
                  <input
                    type="text" value={addDot} onChange={(e) => setAddDot(e.target.value)}
                    placeholder="semaine.année"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantité <span className="text-red-500">*</span></label>
                  <input
                    type="number" min={1} value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Emplacement</label>
                <input
                  type="text" value={addEmplacement} onChange={(e) => setAddEmplacement(e.target.value)}
                  placeholder="ex: Rayon A3"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <Button
                onClick={handleAddBatch} disabled={!addDot || addQty < 1 || adding}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {adding
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Ajout…</>
                  : <><Plus className="h-4 w-4 mr-2" />Ajouter ce lot</>}
              </Button>
            </div>
          )}
        </div>
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dotPanel, setDotPanel] = useState<AdminProduct | null>(null);

  const [statusPanel, setStatusPanel] = useState<{
    isOpen: boolean; product: AdminProduct | null; minStock: number; maxStock: number;
  }>({ isOpen: false, product: null, minStock: 5, maxStock: 100 });

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean; productId: number | null; change: number; productName: string;
  }>({ isOpen: false, productId: null, change: 0, productName: "" });

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); return null;
  }

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(
          `${API_URL}/admin/products/?page=${pagination.page}&limit=${pagination.limit}`,
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
  }, [pagination.page]);

  const handleDotStockChanged = (productId: number, newStock: number) => {
    setStock((prev) => prev.map((p) => p.id === productId ? { ...p, stock: newStock } : p));
    // Met aussi à jour le produit dans le panneau DOT si ouvert
    setDotPanel((prev) => prev && prev.id === productId ? { ...prev, stock: newStock } : prev);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " DT";

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

  const openConfirmation = (id: number, change: number) => {
    const item = stock.find((p) => p.id === id);
    if (!item) return;
    setConfirmation({ isOpen: true, productId: id, change, productName: item.name });
  };

  const updateStock = async (id: number, change: number) => {
    const item = stock.find((p) => p.id === id);
    if (!item) return;
    const newStock = Math.max(0, Number(item.stock) + change);
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!response.ok) throw new Error("Erreur");
      setStock((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
    } catch (err) { console.error("❌ Échec:", err); }
  };

  const filteredStock = stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter
      ? getStockStatus(item.stock, item.stockMin, item.stockMax).status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = stock.filter((item) => item.stock > 0 && item.stock <= item.stockMin);
  const totalValue = stock.reduce((sum, item) => sum + item.stock * item.prixVente, 0);

  return (
    <div className="space-y-2 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <Badge variant="secondary" className="text-sm">{filteredStock.length} produits</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex justify-between items-center"><CardTitle className="text-sm font-medium">Produits en stock</CardTitle><Package className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stock.length}</div></CardContent></Card>
        <Card><CardHeader className="flex justify-between items-center"><CardTitle className="text-sm font-medium">Stock faible</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div></CardContent></Card>
        <Card><CardHeader className="flex justify-between items-center"><CardTitle className="text-sm font-medium">Valeur stock</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div></CardContent></Card>
        <Card><CardHeader className="flex justify-between items-center"><CardTitle className="text-sm font-medium">Unités totales</CardTitle><Package className="h-4 w-4 text-gray-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stock.reduce((s, i) => s + i.stock, 0)}</div></CardContent></Card>
      </div>

      {/* Search */}
      <Input placeholder="Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-700 mr-1">Filtrer :</span>
        {[
          { label: "Tous", value: null, cls: "border-gray-300 bg-white text-gray-700 hover:bg-gray-100" },
          { label: "En stock", value: "En stock", cls: "border-blue-500 bg-white text-blue-700 hover:bg-blue-50" },
          { label: "Stock faible", value: "Stock faible", cls: "border-yellow-400 bg-white text-yellow-700 hover:bg-yellow-50" },
          { label: "Rupture", value: "Rupture de stock", cls: "border-red-400 bg-white text-red-700 hover:bg-red-50" },
        ].map(({ label, value, cls }) => {
          const isActive = value === null ? statusFilter === null : statusFilter === value;
          return (
            <button key={label} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${isActive
                ? value === null ? "bg-gray-800 text-white border-gray-800"
                  : value === "En stock" ? "bg-blue-600 text-white border-blue-600"
                  : value === "Stock faible" ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-red-500 text-white border-red-500"
                : cls}`}>
              {label}
              {value && <span className="ml-1 text-xs opacity-75">({stock.filter((i) => getStockStatus(i.stock, i.stockMin, i.stockMax).status === value).length})</span>}
            </button>
          );
        })}
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
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">DOT</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax);
                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 font-medium text-sm max-w-[180px] truncate">{item.name}</td>
                    <td className="px-2 py-2 text-sm">{item.brand}</td>
                    <td className="px-2 py-2 text-sm">{item.size}</td>
                    <td className="px-2 py-2 text-center font-bold text-sm">{item.stock}</td>
                    <td className="px-2 py-2">
                      <Badge variant={stockStatus.variant} className="cursor-pointer hover:opacity-75"
                        onClick={() => openStatusPanel(item)}>
                        {stockStatus.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500">{item.stockMin}/{item.stockMax}</td>
                    <td className="px-2 py-2 text-sm">{formatCurrency(item.prixVente)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setDotPanel(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200 transition-colors"
                      >
                        <Calendar className="h-3 w-3" /> DOT
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openConfirmation(item.id, -1)} disabled={item.stock <= 0}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openConfirmation(item.id, 1)} disabled={item.stock >= item.stockMax}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
                  <div className="flex justify-between"><span className="text-gray-500">Stock actuel</span><span className="font-bold text-blue-700">{statusPanel.product.stock} unité(s)</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum</label>
                    <input type="number" min={0} value={statusPanel.minStock}
                      onChange={(e) => setStatusPanel((p) => ({ ...p, minStock: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum</label>
                    <input type="number" min={0} value={statusPanel.maxStock}
                      onChange={(e) => setStatusPanel((p) => ({ ...p, maxStock: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={closeStatusPanel}>Annuler</Button>
                  <Button onClick={handleStatusPanelConfirm} className="bg-black text-white">Confirmer</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmation.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setConfirmation({ isOpen: false, productId: null, change: 0, productName: "" })}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Confirmer</h2>
                  <button onClick={() => setConfirmation({ isOpen: false, productId: null, change: 0, productName: "" })}><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <p className="text-gray-600 mb-4">
                  {confirmation.change > 0 ? "Augmenter" : "Diminuer"} le stock de <strong>{confirmation.productName}</strong> de <strong>{Math.abs(confirmation.change)}</strong> unité(s) ?
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setConfirmation({ isOpen: false, productId: null, change: 0, productName: "" })}>Non</Button>
                  <Button onClick={async () => { await updateStock(confirmation.productId!, confirmation.change); setConfirmation({ isOpen: false, productId: null, change: 0, productName: "" }); }}
                    className="bg-green-500 hover:bg-green-600 text-white">Oui</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button variant="outline" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Précédent</Button>
          <span className="text-gray-700 text-sm">Page {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.limit))}</span>
          <Button variant="outline" disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Suivant</Button>
        </div>
      </div>
    </div>
  );
}
