"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Tag, Search, Percent, X, CheckSquare, Square, TrendingDown, Package, Euro, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  brand: string;
  size: string;
  price: string;
  old_price: string | null;
  stock: number;
  is_on_sale: boolean;
  discount_percentage: number;
  promotion_label: string | null;
  promotion_end_date: string | null;
  image: string | null;
  reference: string;
}

const LABELS = ["SOLDES", "PROMO", "DÉSTOCKAGE", "OFFRE SPÉCIALE", "NOUVEAUTÉ", "TOP AFFAIRE"];
const DISCOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function PromotionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"gestion" | "actives">("actives");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [discount, setDiscount] = useState(20);
  const [label, setLabel] = useState("PROMO");
  const [endDate, setEndDate] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) router.push("/admin");
  }, [user]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/products/?page_size=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const activePromos = products.filter(p => p.is_on_sale);
  const displayed = products.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.size.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q);
    if (tab === "actives") return p.is_on_sale && match;
    return !p.is_on_sale && match && p.stock > 0;
  });

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(displayed.map(p => p.id)));
  const clearAll = () => setSelected(new Set());

  const applyPromotion = async (remove = false) => {
    if (selected.size === 0) { toast.error("Sélectionnez au moins un produit"); return; }
    if (!remove && discount <= 0) { toast.error("Entrez un % de remise valide"); return; }
    setApplying(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/products/set-promotion/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product_ids: Array.from(selected),
          discount_percentage: discount,
          promotion_label: label,
          promotion_end_date: endDate || null,
          remove,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(remove ? `${data.updated} promotion(s) retirée(s)` : `${data.updated} produit(s) mis en promotion`);
      setSelected(new Set());
      loadProducts();
    } catch { toast.error("Erreur lors de l'application"); }
    finally { setApplying(false); }
  };

  const totalStock = activePromos.reduce((s, p) => s + p.stock, 0);
  const avgDiscount = activePromos.length ? Math.round(activePromos.reduce((s, p) => s + p.discount_percentage, 0) / activePromos.length) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez des produits du stock et appliquez des remises</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "En promotion", value: activePromos.length, icon: Tag, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Stock en promo", value: totalStock, icon: Package, color: "text-gray-700", bg: "bg-gray-100" },
          { label: "Remise moyenne", value: `${avgDiscount}%`, icon: Percent, color: "text-black font-bold", bg: "bg-gray-50" },
          { label: "Produits dispo", value: products.filter(p => !p.is_on_sale && p.stock > 0).length, icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Config panel (only in gestion tab) */}
      {tab === "gestion" && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Percent className="h-4 w-4 text-orange-600" /> Paramètres de la promotion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Discount */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Remise (%)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DISCOUNTS.map(d => (
                  <button key={d} onClick={() => setDiscount(d)}
                    className={`px-3 py-1 rounded-full text-sm font-bold border transition ${discount === d ? "bg-yellow-500 text-black border-yellow-500" : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"}`}>
                    -{d}%
                  </button>
                ))}
              </div>
              <input type="number" min={1} max={99} value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-300"
                placeholder="ou saisir un %..." />
            </div>

            {/* Label */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Label affiché</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {LABELS.map(l => (
                  <button key={l} onClick={() => setLabel(l)}
                    className={`px-2 py-1 rounded text-xs font-bold border transition ${label === l ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-600 border-gray-300 hover:border-yellow-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-300"
                placeholder="ou texte personnalisé..." />
            </div>

            {/* End date */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date de fin (optionnel)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-300"
                min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: "actives", label: `✅ Promotions actives (${activePromos.length})` },
            { key: "gestion", label: `🛒 Ajouter des produits` },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key as any); setSelected(new Set()); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher marque, taille, ref..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-300" />
        </div>
      </div>

      {/* Action bar */}
      {selected.size > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${tab === "actives" ? "bg-gray-100 border-gray-300" : "bg-yellow-50 border-yellow-200"}`}>
          <span className="text-sm font-medium">{selected.size} produit(s) sélectionné(s)</span>
          <div className="flex gap-2">
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border bg-white">Désélectionner</button>
            {tab === "actives" ? (
              <button onClick={() => applyPromotion(true)} disabled={applying}
                className="px-4 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 disabled:opacity-50">
                {applying ? "..." : "🗑 Retirer la promotion"}
              </button>
            ) : (
              <button onClick={() => applyPromotion(false)} disabled={applying}
                className="px-4 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                {applying ? "..." : `✅ Appliquer -${discount}% (${label})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Select all */}
      {tab === "gestion" && displayed.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button onClick={selected.size === displayed.length ? clearAll : selectAll}
            className="flex items-center gap-1.5 hover:text-gray-900 font-medium">
            {selected.size === displayed.length ? <CheckSquare className="h-4 w-4 text-yellow-600" /> : <Square className="h-4 w-4" />}
            {selected.size === displayed.length ? "Tout désélectionner" : `Tout sélectionner (${displayed.length})`}
          </button>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Aucun produit trouvé</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map(product => {
            const isSelected = selected.has(product.id);
            const originalPrice = parseFloat(product.old_price || product.price);
            const currentPrice = parseFloat(product.price);
            return (
              <div key={product.id}
                onClick={() => (tab === "gestion" || tab === "actives") && toggleSelect(product.id)}
                className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden bg-white hover:shadow-md ${isSelected ? "border-yellow-500 shadow-md ring-2 ring-yellow-200" : "border-gray-200 hover:border-gray-400"}`}>
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  {isSelected ? <CheckSquare className="h-5 w-5 text-yellow-600 bg-white rounded" /> : <Square className="h-5 w-5 text-gray-400 bg-white rounded" />}
                </div>

                {/* Promo badge */}
                {product.is_on_sale && (
                  <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {product.promotion_label || `-${product.discount_percentage}%`}
                  </div>
                )}

                {/* Image */}
                <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide">{product.brand}</p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{product.size}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-base font-bold text-gray-900">{currentPrice.toFixed(3)} DT</span>
                      {product.is_on_sale && (
                        <span className="text-xs text-gray-400 line-through ml-1">{originalPrice.toFixed(3)}</span>
                      )}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${product.stock > 5 ? "bg-yellow-100 text-yellow-700" : product.stock > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-600"}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  {product.promotion_end_date && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Fin: {new Date(product.promotion_end_date).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
