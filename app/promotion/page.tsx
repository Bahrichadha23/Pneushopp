"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShoppingCart, Tag, Clock, TrendingDown, Filter, X } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";
import { API_URL } from "@/lib/config";

// ── Types ────────────────────────────────────────────────────────────────────
interface PromoProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  size: string;
  season: string;
  season_display: string;
  price: string;
  old_price: string;
  discount_percentage: number;
  promotion_label: string | null;
  promotion_end_date: string | null;
  is_on_sale: boolean;
  stock: number;
  image: string | null;
  description: string;
  reference: string;
  category: { id: number; name: string; slug: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(v: string | number) {
  return parseFloat(String(v)).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

const LABEL_COLORS: Record<string, string> = {
  SOLDES:        "bg-red-600 text-white",
  PROMO:         "bg-yellow-500 text-black",
  DÉSTOCKAGE:    "bg-orange-600 text-white",
  "OFFRE SPÉCIALE": "bg-purple-600 text-white",
  NOUVEAUTÉ:     "bg-blue-600 text-white",
  "TOP AFFAIRE": "bg-green-600 text-white",
};
const defaultLabelCls = "bg-gray-800 text-white";

const SEASON_MAP: Record<string, string> = {
  summer: "Été", winter: "Hiver", all_season: "Toutes saisons",
  été: "Été", hiver: "Hiver", "toutes-saisons": "Toutes saisons",
};

// ── Promo Card ───────────────────────────────────────────────────────────────
function PromoCard({ p }: { p: PromoProduct }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const label    = p.promotion_label || `-${p.discount_percentage}%`;
  const labelCls = LABEL_COLORS[label] ?? defaultLabelCls;
  const savings  = parseFloat(p.old_price) - parseFloat(p.price);
  const days     = daysLeft(p.promotion_end_date);
  const inStock  = p.stock > 0;

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    setAdding(true);
    // Build minimal Product object compatible with cart context
    addToCart({
      id: String(p.id),
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      model: p.name,
      price: parseFloat(p.price),
      old_price: parseFloat(p.old_price),
      is_on_sale: true,
      discount_percentage: p.discount_percentage,
      image: p.image || "/placeholder.jpg",
      images: [],
      category: "tourisme" as any,
      specifications: {
        width: 0, height: 0, diameter: 0, loadIndex: 0,
        speedRating: "", season: "été",
      },
      stock: p.stock,
      description: p.description,
      features: [],
      inStock,
    } as any);
    setTimeout(() => setAdding(false), 1500);
  };

  return (
    <Link href={`/boutique/${p.slug}`}>
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">

        {/* Discount ribbon */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className={`${labelCls} text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
            {label}
          </span>
          {p.discount_percentage > 0 && label !== `-${p.discount_percentage}%` && (
            <span className="bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{p.discount_percentage}%
            </span>
          )}
        </div>

        {/* Countdown */}
        {days !== null && days <= 7 && days > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {days}j restants
          </div>
        )}
        {days === 0 && (
          <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Expire aujourd'hui
          </div>
        )}

        {/* Image */}
        <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
          <img
            src={imgErr || !p.image ? "https://placehold.co/400x400/e5e7eb/6b7280?text=Pneu" : p.image}
            alt={p.name}
            className="max-h-44 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
          {!inStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-sm font-bold text-red-600 border border-red-300 bg-white px-3 py-1 rounded-full">Rupture de stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{p.brand}</p>
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug mt-0.5">
              {p.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            {p.size && (
              <span className="bg-gray-100 rounded px-2 py-0.5 font-mono">{p.size}</span>
            )}
            {p.season_display && (
              <span className="bg-gray-100 rounded px-2 py-0.5">
                {SEASON_MAP[p.season] || p.season_display}
              </span>
            )}
          </div>

          {/* Prices */}
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(p.price)} DT
              </span>
              <span className="text-sm text-red-400 line-through font-medium">
                {formatPrice(p.old_price)} DT
              </span>
            </div>
            {savings > 0 && (
              <p className="text-xs font-semibold text-green-600 mt-0.5 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Économie : {formatPrice(savings)} DT
              </p>
            )}
            {p.promotion_end_date && days !== null && days > 7 && (
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Jusqu'au {new Date(p.promotion_end_date).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleCart}
            disabled={!inStock || adding}
            className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-300
              ${adding
                ? "bg-green-500 text-white scale-105"
                : inStock
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black hover:-translate-y-0.5 hover:shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            <ShoppingCart className={`h-4 w-4 ${adding ? "rotate-12" : ""} transition-transform`} />
            {adding ? "Ajouté !" : inStock ? "Ajouter au panier" : "Indisponible"}
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromotionPage() {
  const [products, setProducts]     = useState<PromoProduct[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [brandFilter, setBrandFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy]         = useState("discount");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Use the dedicated promotions endpoint
        const res = await fetch(`${API_URL}/products/promotions/`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items: PromoProduct[] = Array.isArray(data) ? data : (data.results ?? []);
        setProducts(items);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Dynamic filter options from data
  const brands     = useMemo(() => ["all", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()], [products]);
  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))).sort()], [products]);

  const filtered = useMemo(() => {
    return products
      .filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.size?.includes(q);
        const matchBrand = brandFilter === "all" || p.brand === brandFilter;
        const matchCat = categoryFilter === "all" || p.category?.name === categoryFilter;
        return matchSearch && matchBrand && matchCat;
      })
      .sort((a, b) => {
        if (sortBy === "discount")    return b.discount_percentage - a.discount_percentage;
        if (sortBy === "price-low")   return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === "price-high")  return parseFloat(b.price) - parseFloat(a.price);
        if (sortBy === "savings")     return (parseFloat(b.old_price) - parseFloat(b.price)) - (parseFloat(a.old_price) - parseFloat(a.price));
        return a.name.localeCompare(b.name);
      });
  }, [products, search, brandFilter, categoryFilter, sortBy]);

  const totalSavings = filtered.reduce((s, p) => s + parseFloat(p.old_price) - parseFloat(p.price), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #facc15 0%, transparent 60%), radial-gradient(circle at 70% 50%, #ef4444 0%, transparent 60%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-4 py-1.5 text-yellow-400 text-sm font-semibold">
            <Tag className="h-4 w-4" />
            Offres en cours
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Nos <span className="text-yellow-400">Promotions</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Les meilleures remises sur nos pneus — prix barré, économies réelles, durée limitée.
          </p>
          {!loading && products.length > 0 && (
            <div className="flex gap-6 mt-2">
              <div className="text-center">
                <p className="text-3xl font-black text-yellow-400">{products.length}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Produits en promo</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">
                  {Math.max(...products.map(p => p.discount_percentage))}%
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Remise max</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-white">
                  {formatPrice(totalSavings)} DT
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Économies affichées</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Marque, nom, taille..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Brand */}
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Toutes les marques</option>
              {brands.filter(b => b !== "all").map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Toutes catégories</option>
              {categories.filter(c => c !== "all").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="discount">Remise (décroissant)</option>
              <option value="savings">Économie (décroissant)</option>
              <option value="price-low">Prix (croissant)</option>
              <option value="price-high">Prix (décroissant)</option>
              <option value="name">Nom (A-Z)</option>
            </select>

            {/* Reset */}
            {(search || brandFilter !== "all" || categoryFilter !== "all" || sortBy !== "discount") && (
              <button
                onClick={() => { setSearch(""); setBrandFilter("all"); setCategoryFilter("all"); setSortBy("discount"); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" /> Réinitialiser
              </button>
            )}
          </div>

          {/* Result count */}
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <span>
              <span className="font-semibold text-gray-900">{filtered.length}</span> promotion{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
            </span>
            {filtered.length > 0 && (
              <span className="text-green-600 font-medium">
                Économie totale affichée : {formatPrice(filtered.reduce((s, p) => s + parseFloat(p.old_price) - parseFloat(p.price), 0))} DT
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            <p className="text-gray-500">Chargement des promotions…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-700">Aucune promotion trouvée</p>
            <p className="text-gray-400 mt-1 mb-6">Essayez de modifier vos filtres ou revenez plus tard.</p>
            <Button onClick={() => { setSearch(""); setBrandFilter("all"); setCategoryFilter("all"); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => (
              <PromoCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
