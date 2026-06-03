"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "@/components/header";
import {
  Package, Truck, CheckCircle, Clock, X,
  ChevronDown, ChevronRight, Loader2, AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";

/* ─── Statuts ───────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_LABEL: Record<string, string> = {
  pending:    "En attente",
  confirmed:  "Confirmée",
  processing: "En préparation",
  shipped:    "Expédiée",
  delivered:  "Livrée",
  cancelled:  "Annulée",
};

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed:  "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-orange-100 text-orange-800 border-orange-200",
  shipped:    "bg-purple-100 text-purple-800 border-purple-200",
  delivered:  "bg-green-100 text-green-800 border-green-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock className="h-3 w-3" />,
  confirmed:  <CheckCircle className="h-3 w-3" />,
  processing: <Package className="h-3 w-3" />,
  shipped:    <Truck className="h-3 w-3" />,
  delivered:  <CheckCircle className="h-3 w-3" />,
  cancelled:  <X className="h-3 w-3" />,
};

/* ═══════════════════════════════════════════════════════════ */
export default function CommandesPage() {
  const { user } = useAuth();
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [expanded, setExpanded]     = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setLoading(true);
    fetch(`${API_URL}/orders/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        // Tri antéchronologique
        list.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(list);
      })
      .catch((err) => setError(err.message || "Impossible de charger vos commandes."))
      .finally(() => setLoading(false));
  }, [user]);

  /* ─── Garde non connecté ─────────────────────────────── */
  if (!user) return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Connexion requise</h1>
        <p className="text-gray-600 mb-8">Vous devez être connecté pour voir vos commandes.</p>
        <Button asChild><Link href="/auth/login">Se connecter</Link></Button>
      </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>

        {/* Chargement */}
        {loading && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Chargement de vos commandes…</p>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Aucune commande */}
        {!loading && !error && orders.length === 0 && (
          <Card>
            <CardContent className="text-center py-14">
              <Package className="h-14 w-14 mx-auto mb-4 text-gray-300" />
              <h2 className="text-lg font-semibold mb-2">Aucune commande</h2>
              <p className="text-gray-500 text-sm mb-6">Vous n'avez pas encore passé de commande.</p>
              <Button asChild><Link href="/boutique">Découvrir nos produits</Link></Button>
            </CardContent>
          </Card>
        )}

        {/* Liste des commandes */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status: OrderStatus = order.status || "pending";
              const isOpen = expanded === order.id;
              const items: any[] = order.items || [];
              const addr = order.shipping_address || {};
              const total = parseFloat(order.total_amount || "0");

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* En-tête cliquable */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{total.toFixed(3)} DT</span>
                      <Badge className={`inline-flex items-center gap-1 border text-xs ${STATUS_COLOR[status]}`}>
                        {STATUS_ICON[status]}
                        {STATUS_LABEL[status] || status}
                      </Badge>
                      {isOpen
                        ? <ChevronDown className="h-4 w-4 text-gray-400" />
                        : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* Détail déplié */}
                  {isOpen && (
                    <div className="border-t bg-gray-50 px-5 py-4 space-y-4">
                      {/* Articles */}
                      {items.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Articles</p>
                          <div className="space-y-1.5">
                            {items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm bg-white border border-gray-100 rounded-md px-3 py-2">
                                <span className="text-gray-700">
                                  {item.product_name}
                                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {parseFloat(item.total_price || "0").toFixed(3)} DT
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Adresse livraison */}
                      {(addr.first_name || addr.address) && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Livraison</p>
                          <p className="text-sm text-gray-600">
                            {[addr.first_name, addr.last_name].filter(Boolean).join(" ")}
                            {addr.address && <><br />{addr.address}</>}
                            {addr.city && <><br />{addr.city}</>}
                          </p>
                        </div>
                      )}

                      {/* Suivi */}
                      {order.tracking_number && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">N° de suivi</p>
                          <p className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 inline-block">
                            {order.tracking_number}
                          </p>
                        </div>
                      )}

                      {/* Total récap */}
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-sm text-gray-500">Total commande</span>
                        <span className="font-bold text-lg">{total.toFixed(3)} DT</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
