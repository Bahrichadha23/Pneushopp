"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, Loader2, AlertTriangle, FileText, Video,
  ExternalLink, ChevronDown, ChevronRight,
  Check, X, Clock, RefreshCw, Image as ImageIcon, FileDown,
} from "lucide-react";
import { API_URL } from "@/lib/config";

/* ─── Types ─────────────────────────────────────────────── */
interface Claim {
  id: number;
  order_ref: string;
  invoice_number: string;
  order_item_name: string;
  first_name: string;
  last_name: string;
  email: string;
  description: string;
  mileage_at_purchase: string;
  current_mileage: string;
  status: "pending" | "processing" | "resolved" | "rejected";
  status_label: string;
  admin_notes: string;
  created_at: string;
  invoice_photo_url: string | null;
  tire_video_url: string | null;
  tire_image_urls: string[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-50    text-amber-700   border border-amber-300",
  processing: "bg-brand-blue-light text-brand-blue border border-brand-blue",
  resolved:   "bg-brand-gold-light  text-brand-gold-dark   border border-brand-gold",
  rejected:   "bg-brand-red-light text-brand-red border border-brand-red",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:    <Clock className="h-3 w-3 mr-1" />,
  processing: <RefreshCw className="h-3 w-3 mr-1" />,
  resolved:   <Check className="h-3 w-3 mr-1" />,
  rejected:   <X className="h-3 w-3 mr-1" />,
};
const STATUS_OPTIONS = [
  { value: "",           label: "Tous les statuts" },
  { value: "pending",    label: "En attente" },
  { value: "processing", label: "En traitement" },
  { value: "resolved",   label: "Résolues" },
  { value: "rejected",   label: "Réclamations rejetées" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════ */
export default function AdminSAVPage() {
  const { user } = useAuth();
  const [claims, setClaims]         = useState<Claim[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded]     = useState<number | null>(null);

  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [exporting, setExporting]   = useState(false);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`${API_URL}/orders/sav/export/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAV_export_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  async function loadClaims() {
    setLoading(true); setFetchError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/orders/sav/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      setFetchError(err.message || "Erreur de chargement");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadClaims(); }, []);

  async function handleSaveStatus(id: number) {
    setSaving(true); setSaveError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/orders/sav/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, admin_notes: editNotes }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const updated = await res.json();
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setEditingId(null);
    } catch (err: any) {
      setSaveError(err.message || "Erreur");
    } finally { setSaving(false); }
  }

  const stats = {
    total:      claims.length,
    pending:    claims.filter((c) => c.status === "pending").length,
    processing: claims.filter((c) => c.status === "processing").length,
    resolved:   claims.filter((c) => c.status === "resolved").length,
    rejected:   claims.filter((c) => c.status === "rejected").length,
  };

  const filteredClaims = filterStatus
    ? claims.filter((c) => c.status === filterStatus)
    : claims;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Service Après Vente</h1>
            <p className="text-gray-500 text-sm">Réclamations clients sous garantie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleExportExcel} disabled={exporting || loading} className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0">
            {exporting
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <FileDown className="h-4 w-4 mr-1" />}
            Exporter (Excel)
          </Button>
          <Button size="sm" onClick={loadClaims} disabled={loading} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",           value: stats.total,      color: "bg-gray-100 text-gray-700 border border-gray-200" },
          { label: "En attente",      value: stats.pending,    color: "bg-amber-50 text-amber-700 border border-amber-200" },
          { label: "En traitement",   value: stats.processing, color: "bg-brand-blue-light text-brand-blue border border-brand-blue" },
          { label: "Résolus",         value: stats.resolved,   color: "bg-brand-gold-light text-brand-gold-dark border border-brand-gold" },
          { label: "Rejetés",         value: stats.rejected,   color: "bg-brand-red-light text-brand-red border border-brand-red" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-600">Filtrer :</span>
        {STATUS_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === opt.value
                ? "bg-brand-orange border-brand-orange text-black"
                : "bg-white border-gray-300 text-gray-600 hover:border-brand-orange"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {fetchError && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Erreur : {fetchError}</span>
          <Button size="sm" onClick={loadClaims} className="ml-auto bg-[#0066CC] hover:bg-[#004E9E] text-white border-0">Réessayer</Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      )}

      {!loading && !fetchError && filteredClaims.length === 0 && (
        <Card><CardContent className="py-12 text-center text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune réclamation{filterStatus ? " pour ce statut" : ""}</p>
        </CardContent></Card>
      )}

      {/* Liste */}
      {!loading && filteredClaims.length > 0 && (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const isExpanded = expanded === claim.id;
            const isEditing  = editingId === claim.id;
            return (
              <Card key={claim.id} className="overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : claim.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-bold text-gray-700">
                      SAV-{String(claim.id).padStart(4, "0")}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{claim.first_name} {claim.last_name}</p>
                      <p className="text-xs text-gray-500">{claim.invoice_number || claim.order_ref || "—"} · {claim.order_item_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 hidden sm:block">{formatDate(claim.created_at)}</span>
                    <Badge className={`${STATUS_COLORS[claim.status]} flex items-center text-xs`}>
                      {STATUS_ICONS[claim.status]}{claim.status_label}
                    </Badge>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-5 py-4 bg-gray-50 space-y-4">
                    {/* Infos client */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400">Email</p><p>{claim.email}</p></div>
                      <div>
                        <p className="text-xs text-gray-400">Réf. facture</p>
                        <p className="font-mono">{claim.invoice_number || claim.order_ref || "—"}</p>
                      </div>
                      <div><p className="text-xs text-gray-400">Article</p><p>{claim.order_item_name}</p></div>
                    </div>

                    {/* Kilométrages */}
                    {(claim.mileage_at_purchase || claim.current_mileage) && (
                      <div className="grid grid-cols-2 gap-3 text-sm bg-white border border-gray-200 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Kilométrage à l'achat</p>
                          <p className="font-semibold">{claim.mileage_at_purchase || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Kilométrage actuel</p>
                          <p className="font-semibold">{claim.current_mileage || "—"}</p>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {claim.description && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Description</p>
                        <p className="text-sm bg-white border border-gray-200 rounded-md px-3 py-2">{claim.description}</p>
                      </div>
                    )}

                    {/* Pièces jointes — liens rapides */}
                    <div className="flex gap-3 flex-wrap">
                      {claim.invoice_photo_url && (
                        <a href={claim.invoice_photo_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-brand-gold bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5 hover:bg-yellow-100">
                          <FileText className="h-4 w-4" /> Photo facture <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {claim.tire_video_url && (
                        <a href={claim.tire_video_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 border border-purple-200 rounded-md px-3 py-1.5 hover:bg-gray-100">
                          <Video className="h-4 w-4" /> Vidéo pneu <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {claim.tire_image_urls?.length > 0 && (
                        <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5">
                          <ImageIcon className="h-4 w-4" /> {claim.tire_image_urls.length} image{claim.tire_image_urls.length > 1 ? "s" : ""} pneu
                        </span>
                      )}
                    </div>

                    {/* Galerie images pneus */}
                    {claim.tire_image_urls?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-2">Images pneus</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {claim.tire_image_urls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-brand-orange transition-colors bg-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Pneu ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                <ExternalLink className="h-5 w-5 text-white drop-shadow" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes admin */}
                    {claim.admin_notes && !isEditing && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Notes internes</p>
                        <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">{claim.admin_notes}</p>
                      </div>
                    )}

                    {/* Zone édition */}
                    {isEditing ? (
                      <div className="space-y-3 pt-2 border-t">
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Statut</label>
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange">
                            {STATUS_OPTIONS.slice(1).map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Réponse au client</label>
                          <textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Ce message sera visible par le client dans son espace SAV…"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none" />
                        </div>
                        {saveError && <p className="text-xs text-brand-red">{saveError}</p>}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveStatus(claim.id)} disabled={saving}
                            className="bg-[#FF8C00] hover:bg-[#CC7000] text-white border-0">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                            Enregistrer
                          </Button>
                          <Button size="sm" onClick={() => setEditingId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t">
                        <Button size="sm" onClick={() => {
                          setEditingId(claim.id); setEditStatus(claim.status);
                          setEditNotes(claim.admin_notes || ""); setSaveError("");
                        }} className="bg-[#0066CC] hover:bg-[#004E9E] text-white border-0">
                          Modifier le statut / répondre
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}