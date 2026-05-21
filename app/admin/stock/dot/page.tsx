"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Package, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { API_URL } from "@/lib/config";

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

function dotAge(dotDate: string | null): { text: string; level: "ok" | "warn" | "danger" } {
  if (!dotDate) return { text: "Date inconnue", level: "ok" };
  const months = Math.floor((Date.now() - new Date(dotDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const text = months < 12 ? `${months} mois` : `${Math.floor(months / 12)} an(s) ${months % 12} mois`;
  return {
    text,
    level: months >= 48 ? "danger" : months >= 36 ? "warn" : "ok",
  };
}

export default function DotStatePage() {
  const [batches, setBatches] = useState<DotBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
      .catch(() => {
        // Fallback : charger depuis les produits
        loadFromProducts(token);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadFromProducts(token: string | null) {
    try {
      const r = await fetch(`${API_URL}/admin/products/?no_pagination=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      const products = Array.isArray(data) ? data : data.results || [];
      const allBatches: DotBatch[] = [];
      await Promise.all(
        products.slice(0, 50).map(async (p: any) => {
          try {
            const rb = await fetch(`${API_URL}/admin/products/${p.id}/dot-batches/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!rb.ok) return;
            const pBatches: any[] = await rb.json();
            pBatches.forEach((b) =>
              allBatches.push({
                ...b,
                product_id: p.id,
                product_name: p.name,
                product_brand: p.brand,
                product_size: p.size,
              })
            );
          } catch {}
        })
      );
      allBatches.sort((a, b) =>
        (a.dot_date || "9999") < (b.dot_date || "9999") ? -1 : 1
      );
      setBatches(allBatches);
    } catch { setError("Impossible de charger l'état DOT."); }
  }

  const filtered = batches.filter((b) =>
    !search ||
    b.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.product_brand?.toLowerCase().includes(search.toLowerCase()) ||
    b.dot?.includes(search) ||
    b.emplacement?.toLowerCase().includes(search.toLowerCase())
  );

  const danger = filtered.filter((b) => dotAge(b.dot_date).level === "danger").length;
  const warn   = filtered.filter((b) => dotAge(b.dot_date).level === "warn").length;
  const total  = filtered.reduce((s, b) => s + b.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold">État du stock DOT</h1>
          <p className="text-gray-500 text-sm">Vue globale de tous les lots par date de fabrication</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{filtered.length}</p>
          <p className="text-xs text-blue-500">Lots DOT</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500">Unités totales</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{warn}</p>
          <p className="text-xs text-yellow-500">À surveiller (+3 ans)</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{danger}</p>
          <p className="text-xs text-red-500">Priorité absolue (+4 ans)</p>
        </div>
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
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <Card><CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Aucun lot DOT enregistré</p>
          <p className="text-gray-400 text-sm mt-1">Les lots apparaissent ici lors de la réception des commandes d'achat.</p>
        </CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Produit</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Taille</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-600">DOT</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-600">Âge</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-600">Qté</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Emplacement</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-600">Priorité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((batch, idx) => {
                const age = dotAge(batch.dot_date);
                return (
                  <tr key={batch.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      age.level === "danger" ? "bg-red-50" :
                      age.level === "warn"   ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium">{batch.product_name}</p>
                      <p className="text-xs text-gray-400">{batch.product_brand}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{batch.product_size || "—"}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold">{batch.dot || "—"}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{age.text}</td>
                    <td className="px-3 py-2 text-center font-bold">{batch.quantity}</td>
                    <td className="px-3 py-2">
                      {batch.emplacement ? (
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />{batch.emplacement}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {idx === 0 || (idx > 0 && batch.product_id === filtered[idx - 1]?.product_id && batch.dot_date !== filtered[idx - 1]?.dot_date) ? (
                        <Badge className="bg-orange-500 text-white text-[10px]">1ᵉʳ à vendre</Badge>
                      ) : age.level === "danger" ? (
                        <Badge className="bg-red-500 text-white text-[10px]">Urgent</Badge>
                      ) : age.level === "warn" ? (
                        <Badge className="bg-yellow-500 text-white text-[10px]">À surveiller</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">OK</Badge>
                      )}
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
