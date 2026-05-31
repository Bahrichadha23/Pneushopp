"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Package, AlertTriangle, Loader2, MapPin, ChevronRight, Info } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";

interface DotBatch {
  id: number;
  product_id: number;
  product_name: string;
  product_brand: string;
  product_size: string;
  quantity: number;
  dot: string;
  dot_date: string | null;
  emplacement: string;
  created_at: string;
}

function dotAge(dotDate: string | null): { text: string; months: number; level: "ok" | "warn" | "danger" } {
  if (!dotDate) return { text: "Date inconnue", months: 0, level: "ok" };
  const months = Math.floor((Date.now() - new Date(dotDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const text =
    months < 12
      ? `${months} mois`
      : `${Math.floor(months / 12)} an(s) ${months % 12} mois`;
  return {
    text,
    months,
    level: months >= 48 ? "danger" : months >= 36 ? "warn" : "ok",
  };
}

export default function DotStatePage() {
  const [batches, setBatches] = useState<DotBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API_URL}/admin/stock-movements/?type=dot_batches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => setBatches(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError("Impossible de charger les lots DOT."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = batches.filter(
    (b) =>
      !search ||
      b.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.product_brand?.toLowerCase().includes(search.toLowerCase()) ||
      b.dot?.includes(search) ||
      b.emplacement?.toLowerCase().includes(search.toLowerCase())
  );

  const danger = filtered.filter((b) => dotAge(b.dot_date).level === "danger").length;
  const warn = filtered.filter((b) => dotAge(b.dot_date).level === "warn").length;
  const total = filtered.reduce((s, b) => s + b.quantity, 0);

  // Group by product for "1er à vendre" logic
  const seenProducts = new Set<number>();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold">État du stock DOT</h1>
          <p className="text-gray-500 text-sm">
            Vue globale de tous les lots par date de fabrication — ordre FEFO (First Expired, First Out)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-700">{filtered.length}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Lots DOT</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unités totales</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{warn}</p>
          <p className="text-xs text-yellow-600 mt-0.5">À surveiller (+3 ans)</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-300">
          <p className="text-2xl font-bold text-gray-800">{danger}</p>
          <p className="text-xs text-gray-600 mt-0.5">Priorité absolue (+4 ans)</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Les lots apparaissent ici automatiquement à chaque achat fournisseur.
          Pour vendre depuis un lot spécifique, allez dans{" "}
          <button
            className="font-semibold underline"
            onClick={() => router.push("/admin/stock")}
          >
            Gestion du stock
          </button>{" "}
          → cliquez sur le bouton <span className="font-semibold">DOT</span> du produit concerné.
        </p>
      </div>

      <Input
        placeholder="Rechercher par produit, marque, DOT ou emplacement…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Chargement des lots DOT…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun lot DOT enregistré</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
              Les lots apparaissent ici automatiquement à chaque achat fournisseur avec un DOT renseigné.
            </p>
            <Button
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => router.push("/admin/achats")}
            >
              Aller aux achats
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Produit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Taille</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">DOT</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Âge</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Qté</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Emplacement</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Priorité</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((batch) => {
                const age = dotAge(batch.dot_date);
                const isFirstForProduct = !seenProducts.has(batch.product_id);
                if (isFirstForProduct) seenProducts.add(batch.product_id);

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      age.level === "danger"
                        ? "bg-red-50"
                        : age.level === "warn"
                        ? "bg-yellow-50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{batch.product_name}</p>
                      <p className="text-xs text-gray-400">{batch.product_brand}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {batch.product_size || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">
                      {batch.dot || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          age.level === "danger"
                            ? "bg-red-100 text-red-700"
                            : age.level === "warn"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {age.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900">{batch.quantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      {batch.emplacement ? (
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {batch.emplacement}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isFirstForProduct ? (
                        <Badge className="bg-orange-500 text-white text-[10px] whitespace-nowrap">
                          1ᵉʳ à vendre
                        </Badge>
                      ) : age.level === "danger" ? (
                        <Badge className="bg-red-500 text-white text-[10px]">Urgent</Badge>
                      ) : age.level === "warn" ? (
                        <Badge className="bg-yellow-500 text-white text-[10px]">À surveiller</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-gray-500">
                          OK
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/admin/stock?dot=${batch.product_id}`)}
                        className="inline-flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 font-medium"
                        title="Voir dans Gestion du stock"
                      >
                        Vendre
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
