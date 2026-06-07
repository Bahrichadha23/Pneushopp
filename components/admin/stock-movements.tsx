"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, RotateCcw, Search, Plus, X,
  Download, Package, ArrowUpDown, Filter, Check, AlertTriangle,
} from "lucide-react";
import type { StockMovement } from "@/types/admin";
import { API_URL } from "@/lib/config";
import ExcelJS from "exceljs";

// ── Types ────────────────────────────────────────────────────────────────────
interface StockMovementsProps {
  movements: StockMovement[];
  onAddMovement: (m: Omit<StockMovement, "id" | "createdAt">) => Promise<void>;
}

const TYPE_CONFIG = {
  in:         { label: "Entrée",      color: "bg-brand-gold-light text-brand-gold-dark border-brand-gold", dot: "bg-brand-gold-light0",  sign: "+", textColor: "text-brand-gold-dark" },
  out:        { label: "Sortie",       color: "bg-red-100 text-brand-red border-red-200",      dot: "bg-brand-red",    sign: "−", textColor: "text-brand-red"   },
  adjustment: { label: "Ajustement",  color: "bg-blue-100 text-brand-blue border-blue-200",   dot: "bg-brand-blue",   sign: "±", textColor: "text-brand-blue"  },
  return:     { label: "Avoir/Retour",color: "bg-[#E3F0FF] text-[#0066CC] border-[#0066CC]/30", dot: "bg-[#0066CC]", sign: "+", textColor: "text-[#0066CC]" },
} as const;

type MvtType = keyof typeof TYPE_CONFIG;

const fmtDate = (d: Date | string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? "—" : new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(dt);
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StockMovements({ movements, onAddMovement }: StockMovementsProps) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // Product autocomplete
  const [products, setProducts]     = useState<{ id: string; name: string; reference?: string; stock?: number }[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDrop, setShowProductDrop] = useState(false);

  // New movement form
  const [form, setForm] = useState({
    productId: "", product_name: "",
    type: "in" as MvtType,
    quantity: "" as string | number,
    reason: "", reference: "",
  });

  // Load products for autocomplete
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/products/?page_size=500`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });
        const d = await res.json();
        setProducts((d.results || d).map((p: any) => ({
          id: String(p.id), name: p.name,
          reference: p.reference, stock: p.stock,
        })));
      } catch {}
    };
    load();
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── KPIs (fixed) ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const entrées   = movements.filter(m => m.type === "in" || (m.type as string) === "return")
                               .reduce((s, m) => s + Number(m.quantity), 0);
    const sorties   = movements.filter(m => m.type === "out")
                               .reduce((s, m) => s + Number(m.quantity), 0);
    const ajust     = movements.filter(m => m.type === "adjustment").length;
    const retours   = movements.filter(m => (m.type as string) === "return")
                               .reduce((s, m) => s + Number(m.quantity), 0);
    return { entrées, sorties, ajust, retours, net: entrées - sorties };
  }, [movements]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return movements.filter(m => {
      const name = (m.product_name || "").toLowerCase();
      const q    = search.toLowerCase();
      const matchSearch = !q || name.includes(q) || (m.reason || "").toLowerCase().includes(q) || (m.reference || "").toLowerCase().includes(q);
      const matchType   = typeFilter === "all" || m.type === typeFilter;
      let   matchDate   = true;
      if (dateFrom || dateTo) {
        const d = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt as any);
        if (dateFrom && d < new Date(dateFrom)) matchDate = false;
        if (dateTo   && d > new Date(dateTo + "T23:59:59")) matchDate = false;
      }
      return matchSearch && matchType && matchDate;
    });
  }, [movements, search, typeFilter, dateFrom, dateTo]);

  // ── Product autocomplete filtered ─────────────────────────────────────────
  const productOptions = useMemo(() => {
    if (!productSearch) return products.slice(0, 20);
    const q = productSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [products, productSearch]);

  // ── Submit form ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.productId || !form.quantity || !form.reason) {
      showToast("Produit, quantité et raison sont requis.", false);
      return;
    }
    setSaving(true);
    try {
      await onAddMovement({
        productId: form.productId,
        product_name: form.product_name,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason,
        reference: form.reference,
        createdBy: "Admin",
      });
      showToast("Mouvement enregistré avec succès.");
      setForm({ productId: "", product_name: "", type: "in", quantity: "", reason: "", reference: "" });
      setProductSearch("");
      setShowForm(false);
    } catch {
      showToast("Erreur lors de l'enregistrement.", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Mouvements Stock");
    ws.columns = [
      { header: "Date",      key: "date",    width: 20 },
      { header: "Produit",   key: "product", width: 32 },
      { header: "Type",      key: "type",    width: 16 },
      { header: "Quantité",  key: "qty",     width: 12 },
      { header: "Raison",    key: "reason",  width: 30 },
      { header: "Référence", key: "ref",     width: 18 },
    ];
    ws.getRow(1).font = { bold: true };
    filtered.forEach(m => {
      ws.addRow({
        date:    fmtDate(m.createdAt),
        product: m.product_name || "",
        type:    TYPE_CONFIG[m.type as MvtType]?.label || m.type,
        qty:     (m.type === "out" ? -1 : 1) * Number(m.quantity),
        reason:  m.reason || "",
        ref:     m.reference || "",
      });
    });
    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `mouvements_stock_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cfg = (type: string) => TYPE_CONFIG[type as MvtType] ?? TYPE_CONFIG.adjustment;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mouvements de stock</h1>
          <p className="text-gray-600">Suivez tous les mouvements d'inventaire</p>
        </div>
        <Button onClick={handleExport} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0">
          <Download className="h-4 w-4" /> Exporter un état en Excel
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg text-white
          ${toast.ok ? "bg-green-600" : "bg-brand-red"}`}>
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Entrées</p>
                <p className="text-3xl font-black text-brand-gold">+{kpis.entrées}</p>
                <p className="text-xs text-gray-400 mt-0.5">unités reçues</p>
              </div>
              <div className="rounded-xl bg-brand-gold-light p-3">
                <TrendingUp className="h-6 w-6 text-brand-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#9B2226]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sorties</p>
                <p className="text-3xl font-black text-[#9B2226]">−{kpis.sorties}</p>
                <p className="text-xs text-gray-400 mt-0.5">unités sorties</p>
              </div>
              <div className="rounded-xl bg-[#F9E5E6] p-3">
                <TrendingDown className="h-6 w-6 text-[#9B2226]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0066CC]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avoirs/Retours</p>
                <p className="text-3xl font-black text-[#0066CC]">+{kpis.retours}</p>
                <p className="text-xs text-gray-400 mt-0.5">remis en stock</p>
              </div>
              <div className="rounded-xl bg-[#E3F0FF] p-3">
                <RotateCcw className="h-6 w-6 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stock net</p>
                <p className={`text-3xl font-black ${kpis.net >= 0 ? "text-gray-900" : "text-[#9B2226]"}`}>
                  {kpis.net >= 0 ? "+" : ""}{kpis.net}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">entrées − sorties</p>
              </div>
              <div className="rounded-xl bg-[#FBF5E0] p-3">
                <Package className="h-6 w-6 text-[#A68823]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Produit, raison, référence…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="all">Tous les types</option>
          <option value="in">Entrées</option>
          <option value="out">Sorties</option>
          <option value="adjustment">Ajustements</option>
          <option value="return">Avoirs/Retours</option>
        </select>

        {/* Date range */}
        <input
          type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <span className="text-gray-400 text-sm">→</span>
        <input
          type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />

        {(search || typeFilter !== "all" || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-500 text-white hover:bg-yellow-600 gap-2"
          >
            <Plus className="h-4 w-4" /> Nouveau mouvement
          </Button>
        </div>
      </div>

      {/* ── Add movement form ──────────────────────────────────────────────── */}
      {showForm && (
        <Card className="border-2 border-yellow-500/50 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">Nouveau mouvement de stock</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product autocomplete */}
              <div className="relative md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Produit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Rechercher un produit par nom ou référence…"
                    value={form.productId ? form.product_name : productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value);
                      setForm(f => ({ ...f, productId: "", product_name: "" }));
                      setShowProductDrop(true);
                    }}
                    onFocus={() => setShowProductDrop(true)}
                  />
                  {form.productId && (
                    <button
                      onClick={() => { setForm(f => ({ ...f, productId: "", product_name: "" })); setProductSearch(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showProductDrop && !form.productId && productOptions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {productOptions.map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FFF3E0] flex items-center justify-between text-sm border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setForm(f => ({ ...f, productId: p.id, product_name: p.name }));
                          setProductSearch(p.name);
                          setShowProductDrop(false);
                        }}
                      >
                        <div>
                          <span className="font-medium text-gray-900">{p.name}</span>
                          {p.reference && <span className="ml-2 text-xs text-gray-400 font-mono">{p.reference}</span>}
                        </div>
                        {p.stock !== undefined && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? "bg-brand-gold-light text-brand-gold-dark" : "bg-red-100 text-brand-red"}`}>
                            Stock: {p.stock}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_CONFIG) as MvtType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                        ${form.type === t
                          ? `${TYPE_CONFIG[t].color} border-current`
                          : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${form.type === t ? TYPE_CONFIG[t].dot : "bg-gray-300"}`} />
                      {TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Ex: 10"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Raison <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Réception fournisseur, Inventaire…"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Référence (optionnel)
                </label>
                <Input
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="N° bon de commande, facture…"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button onClick={() => setShowForm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">Annuler</Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 gap-2"
              >
                {saving
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Enregistrement…</>
                  : <><Check className="h-4 w-4" /> Enregistrer</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Summary bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-2 text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{filtered.length}</span> mouvement{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-500">{movements.length} au total</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Quantité</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Raison</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Référence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun mouvement trouvé</p>
                    <p className="text-xs mt-1">Modifiez vos filtres ou ajoutez un mouvement</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const c = cfg(m.type);
                  return (
                    <tr key={m.id ?? i} className={`hover:bg-gray-50/80 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {fmtDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{m.product_name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {c.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-base ${c.textColor}`}>
                        {c.sign}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{m.reason || "—"}</td>
                      <td className="px-4 py-3">
                        {m.reference
                          ? <span className="font-mono text-xs bg-gray-100 rounded px-2 py-0.5">{m.reference}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
