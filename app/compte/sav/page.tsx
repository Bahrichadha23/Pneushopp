"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Shield,
  Package,
  ChevronDown,
  ChevronRight,
  Upload,
  Video,
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ClipboardList,
  PlusCircle,
  Clock,
  RefreshCw,
  XCircle,
  Image,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/config";

/* ─── Types ─────────────────────────────────────────────── */
interface OrderItemApi {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
}

interface OrderApi {
  id: number;
  order_number: string;
  created_at: string;
  total_amount: string;
  warranty_accepted: boolean;
  warranty_vehicle_mileage?: string;
  items: OrderItemApi[];
  shipping_address?: { first_name?: string; last_name?: string };
  user?: { email?: string; first_name?: string; last_name?: string };
}

interface ClaimApi {
  id: number;
  order_ref: string;
  order_item_name: string;
  description: string;
  mileage_at_purchase: string;
  current_mileage: string;
  status: "pending" | "processing" | "resolved" | "rejected";
  status_label: string;
  admin_notes: string;
  invoice_photo_url: string | null;
  tire_video_url: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Helpers ───────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "En attente",     color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "En traitement",  color: "bg-blue-100 text-blue-800 border-blue-200",       icon: <RefreshCw className="h-3 w-3" /> },
  resolved:   { label: "Résolu",         color: "bg-green-100 text-green-800 border-green-200",    icon: <CheckCircle className="h-3 w-3" /> },
  rejected:   { label: "Rejeté",         color: "bg-red-100 text-red-800 border-red-200",          icon: <XCircle className="h-3 w-3" /> },
};

/* ═══════════════════════════════════════════════════════════
   Composant : liste des réclamations
═══════════════════════════════════════════════════════════ */
function ClaimsList({ refreshKey }: { refreshKey: number }) {
  const [claims, setClaims] = useState<ClaimApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoading(true);
    fetch(`${API_URL}/orders/sav/mes-reclamations/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setClaims(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError("Impossible de charger vos réclamations."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return (
    <div className="text-center py-10">
      <Loader2 className="h-7 w-7 animate-spin text-yellow-500 mx-auto mb-2" />
      <p className="text-gray-400 text-sm">Chargement…</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" /><span>{error}</span>
    </div>
  );

  if (claims.length === 0) return (
    <div className="text-center py-12">
      <ClipboardList className="h-14 w-14 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Aucune réclamation</p>
      <p className="text-gray-400 text-sm mt-1">Vos réclamations apparaîtront ici après soumission.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {claims.map((claim) => {
        const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
        const isOpen = expanded === claim.id;
        return (
          <div key={claim.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* En-tête de la réclamation */}
            <button
              onClick={() => setExpanded(isOpen ? null : claim.id)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-sm">SAV-{String(claim.id).padStart(4, "0")}</p>
                  <p className="text-xs text-gray-500">{claim.order_item_name} · {formatDate(claim.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                  {cfg.icon}{cfg.label}
                </span>
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-gray-400" />
                  : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {/* Détail */}
            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Référence facture</p>
                    <p className="font-mono font-medium">{(claim as any).invoice_number || claim.order_ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Article</p>
                    <p>{claim.order_item_name}</p>
                  </div>
                  {claim.mileage_at_purchase && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Km à l'achat</p>
                      <p>{claim.mileage_at_purchase}</p>
                    </div>
                  )}
                  {claim.current_mileage && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Km au moment de la réclamation</p>
                      <p>{claim.current_mileage}</p>
                    </div>
                  )}
                </div>

                {claim.description && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Description</p>
                    <p className="text-sm text-gray-700">{claim.description}</p>
                  </div>
                )}

                {/* Pièces jointes */}
                <div className="flex gap-2">
                  {claim.invoice_photo_url && (
                    <a href={claim.invoice_photo_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <FileText className="h-3 w-3" /> Facture
                    </a>
                  )}
                  {claim.tire_video_url && (
                    <a href={claim.tire_video_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Video className="h-3 w-3" /> Vidéo
                    </a>
                  )}
                </div>

                {/* Note admin */}
                {claim.admin_notes && (
                  <div className={`rounded-lg px-3 py-2 border text-sm ${cfg.color}`}>
                    <p className="text-xs font-semibold mb-1">Réponse de notre équipe :</p>
                    <p>{claim.admin_notes}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-right">
                  Dernière mise à jour : {formatDate(claim.updated_at)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page principale
═══════════════════════════════════════════════════════════ */
export default function SAVPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"claims" | "new">("claims");
  const [refreshKey, setRefreshKey] = useState(0);

  const [orders, setOrders] = useState<OrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<OrderApi | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItemApi | null>(null);

  const [currentMileage, setCurrentMileage] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [description, setDescription] = useState("");
  // Single combined image field: first image = invoice, rest = tire images
  const [allImages, setAllImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const allImagesInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [claimId, setClaimId] = useState<number | null>(null);

  /* ── Charger les commandes avec garantie ── */
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/orders/?no_pagination=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: OrderApi[] = Array.isArray(data) ? data : data.results || [];
        setOrders(list.filter((o) => o.warranty_accepted));
      })
      .catch(() => setFetchError("Impossible de charger vos commandes."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    setSelectedItem(null);
    setCurrentMileage("");
    setDescription("");
    setAllImages([]);
    setVideoFile(null);
    setSubmitError("");
    // Pre-fill invoice ref from selected order number
    if (selectedOrder) {
      setInvoiceRef(selectedOrder.order_number);
    }
  }, [selectedOrder]);

  function removeImage(index: number) {
    setAllImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !selectedItem) {
      setSubmitError("Veuillez sélectionner une commande et un article.");
      return;
    }
    if (!currentMileage.trim()) {
      setSubmitError("Veuillez indiquer le kilométrage actuel de votre véhicule.");
      return;
    }
    if (allImages.length === 0) {
      setSubmitError("Veuillez joindre au moins une photo (facture ou pneu).");
      return;
    }
    if (!videoFile) {
      setSubmitError("Veuillez joindre une vidéo du pneu.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const token = localStorage.getItem("access_token");
      const form = new FormData();
      form.append("order", String(selectedOrder.id));
      form.append("order_item_id", String(selectedItem.id));
      form.append("order_item_name", selectedItem.product_name);
      form.append("order_ref", selectedOrder.order_number);
      form.append("invoice_number", invoiceRef.trim());
      form.append("first_name", selectedOrder.shipping_address?.first_name || user?.first_name || "");
      form.append("last_name", selectedOrder.shipping_address?.last_name || user?.last_name || "");
      form.append("email", user?.email || "");
      form.append("mileage_at_purchase", selectedOrder.warranty_vehicle_mileage || "");
      form.append("current_mileage", currentMileage);
      form.append("description", description);
      // First image is the invoice photo; remaining are tire images
      if (allImages[0]) form.append("invoice_photo", allImages[0]);
      allImages.slice(1).forEach((f) => form.append("tire_images", f));
      form.append("tire_video", videoFile!);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 min max
      let res: Response;
      try {
        res = await fetch(`${API_URL}/orders/sav/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        if (fetchErr.name === "AbortError") throw new Error("Délai dépassé — la vidéo est peut-être trop volumineuse. Essayez une vidéo plus courte.");
        throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion.");
      }
      clearTimeout(timeout);
      if (!res.ok) {
        let errMsg = `Erreur ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = Object.entries(errData).map(([k, v]) => `${k} : ${v}`).join(" | ");
        } catch {
          errMsg = await res.text().catch(() => errMsg);
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setClaimId(data.id);
      setSubmitSuccess(true);
      setRefreshKey((k) => k + 1); // actualiser la liste
    } catch (err: any) {
      setSubmitError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSubmitSuccess(false);
    setSelectedOrder(null);
    setSelectedItem(null);
    setCurrentMileage("");
    setInvoiceRef("");
    setDescription("");
    setAllImages([]);
    setVideoFile(null);
    setTab("claims");
  }

  /* ─── Guard non connecté ─────────────────────────────── */
  if (!user) return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <Shield className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Connexion requise</h1>
        <p className="text-gray-600 mb-6">Connectez-vous pour accéder au service après vente.</p>
        <Button asChild><Link href="/auth/login">Se connecter</Link></Button>
      </div>
    </>
  );

  /* ─── Succès ─────────────────────────────────────────── */
  if (submitSuccess) return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-xl text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">Réclamation envoyée !</h1>
        <p className="text-gray-600 mb-2">
          Votre réclamation <strong>SAV-{String(claimId).padStart(4, "0")}</strong> a bien été enregistrée.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Notre équipe vous contactera à <strong>{user.email}</strong>.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={resetForm}>
            <ClipboardList className="h-4 w-4 mr-2" /> Voir mes réclamations
          </Button>
          <Button asChild>
            <Link href="/boutique">Retour à la boutique</Link>
          </Button>
        </div>
      </div>
    </>
  );

  /* ─── Rendu principal ────────────────────────────────── */
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Service après vente</h1>
            <p className="text-gray-500 text-sm">Gérez vos réclamations sous garantie</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("claims")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "claims" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Mes réclamations
          </button>
          <button
            onClick={() => setTab("new")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "new" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <PlusCircle className="h-4 w-4" /> Nouvelle réclamation
          </button>
        </div>

        {/* ── Onglet : Mes réclamations ── */}
        {tab === "claims" && (
          <ClaimsList refreshKey={refreshKey} />
        )}

        {/* ── Onglet : Nouvelle réclamation ── */}
        {tab === "new" && (
          <>
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-500">Chargement de vos commandes…</p>
              </div>
            )}

            {fetchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" /><span>{fetchError}</span>
              </div>
            )}

            {!loading && !fetchError && orders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Aucune commande avec garantie</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Le service après vente est réservé aux commandes pour lesquelles vous avez souscrit à la garantie.
                  </p>
                  <Button asChild variant="outline"><Link href="/boutique">Découvrir la boutique</Link></Button>
                </CardContent>
              </Card>
            )}

            {!loading && orders.length > 0 && (
              <>
                {/* Sélection commande */}
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" /> 1. Sélectionnez votre commande
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {orders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <div key={order.id}>
                          <button
                            onClick={() => setSelectedOrder(isSelected ? null : order)}
                            className={`w-full text-left rounded-lg border-2 px-4 py-3 flex items-center justify-between transition-colors ${
                              isSelected ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm">{order.order_number}</p>
                              <p className="text-xs text-gray-500">{formatDate(order.created_at)} · {parseFloat(order.total_amount).toFixed(3)} DT</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Garantie</Badge>
                              {isSelected ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            </div>
                          </button>

                          {isSelected && (
                            <div className="mt-2 ml-4 space-y-2">
                              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sélectionnez l'article concerné :</p>
                              {order.items.map((item) => {
                                const isItemSelected = selectedItem?.id === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setSelectedItem(isItemSelected ? null : item)}
                                    className={`w-full text-left rounded-md border px-3 py-2 flex items-center justify-between text-sm transition-colors ${
                                      isItemSelected ? "border-yellow-400 bg-yellow-100" : "border-gray-200 hover:border-yellow-300 bg-white"
                                    }`}
                                  >
                                    <span>{item.product_name} <span className="text-gray-400">× {item.quantity}</span></span>
                                    <span className="text-gray-500 text-xs">{parseFloat(item.unit_price).toFixed(3)} DT/u</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Formulaire */}
                {selectedOrder && selectedItem && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" /> 2. Formulaire de réclamation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nom / Prénom */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Prénom <span className="text-red-500">*</span></label>
                            <input readOnly value={selectedOrder.shipping_address?.first_name || user.first_name || ""}
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nom <span className="text-red-500">*</span></label>
                            <input readOnly value={selectedOrder.shipping_address?.last_name || user.last_name || ""}
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                          <input readOnly value={user.email || ""}
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                        </div>

                        {/* Réf facture + Article */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Réf. facture <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={invoiceRef}
                              onChange={(e) => setInvoiceRef(e.target.value)}
                              placeholder="ex : FAC-2024-001"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Article concerné <span className="text-red-500">*</span></label>
                            <input readOnly value={selectedItem.product_name}
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                          </div>
                        </div>

                        {/* Kilométrages */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Kilométrage à l'achat <span className="text-red-500">*</span></label>
                            <input readOnly value={selectedOrder.warranty_vehicle_mileage || "—"}
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Kilométrage actuel <span className="text-red-500">*</span></label>
                            <input type="text" value={currentMileage} onChange={(e) => setCurrentMileage(e.target.value)}
                              placeholder="ex : 42 500 km"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description du problème <span className="text-gray-400">(facultatif)</span>
                          </label>
                          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez le défaut constaté sur votre pneu…"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                        </div>

                        {/* Photos — facture + pneus (champ unique) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Photos <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(facture et photos du pneu)</span>
                          </label>
                          <input ref={allImagesInputRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                            onChange={(e) => {
                              const newFiles = Array.from(e.target.files || []);
                              setAllImages((prev) => [...prev, ...newFiles]);
                              if (allImagesInputRef.current) allImagesInputRef.current.value = "";
                            }} />
                          <button type="button" onClick={() => allImagesInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-lg px-4 py-3 flex items-center gap-3 transition-colors ${
                              allImages.length > 0 ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-yellow-400 hover:bg-yellow-50/30"
                            }`}>
                            <Upload className={`h-5 w-5 flex-shrink-0 ${allImages.length > 0 ? "text-green-500" : "text-gray-400"}`} />
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {allImages.length > 0 ? `${allImages.length} fichier(s) sélectionné(s)` : "Ajouter des photos"}
                              </p>
                              <p className="text-xs text-gray-400">JPG, PNG, PDF — cliquez pour ajouter</p>
                            </div>
                          </button>
                          {allImages.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {allImages.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5 text-sm">
                                  <Image className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                                  <span className="flex-1 truncate text-xs">{f.name}</span>
                                  <button type="button" onClick={() => removeImage(i)} className="text-gray-400 hover:text-red-500">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Vidéo pneu */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Vidéo du pneu <span className="text-red-500">*</span></label>
                          <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                            onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                          <button type="button" onClick={() => videoInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-lg px-4 py-3 flex items-center gap-3 transition-colors ${
                              videoFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-yellow-400 hover:bg-yellow-50/30"
                            }`}>
                            <Video className={`h-5 w-5 flex-shrink-0 ${videoFile ? "text-green-500" : "text-gray-400"}`} />
                            <div className="text-left">
                              <p className="text-sm font-medium">{videoFile ? videoFile.name : "Ajouter une vidéo"}</p>
                              {videoFile
                                ? <p className="text-xs text-green-600">✓ Vidéo sélectionnée</p>
                                : <p className="text-xs text-gray-400">MP4, MOV, AVI — montrez le défaut clairement</p>}
                            </div>
                            {videoFile && (
                              <button type="button" className="ml-auto text-gray-400 hover:text-red-500"
                                onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </button>
                        </div>

                        {submitError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" /><span>{submitError}</span>
                          </div>
                        )}

                        <Button type="submit" disabled={submitting}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                          {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi en cours…</>
                          ) : (
                            <><Shield className="h-4 w-4 mr-2" />Envoyer la réclamation</>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
