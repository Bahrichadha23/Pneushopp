"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchDeliveries, updateDelivery } from "@/lib/services/deliveries";
import type { Livraison, DeliveryUpdate } from "@/types/livraison";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Truck, Search, Package, CheckCircle2, Clock, Navigation,
  X, Edit3, Save, RotateCcw, MapPin, Hash, CalendarDays,
  StickyNote, ChevronRight, Phone, ShoppingBag, DollarSign,
} from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR");
};
const toInputDate = (d: string | null | undefined) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};
const fmtMoney = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("fr-TN", { minimumFractionDigits: 3 }) + " DT";

// ── status ───────────────────────────────────────────────────────────────────
const STATUS_STEPS: { key: Livraison["statut"]; label: string; icon: React.ReactNode }[] = [
  { key: "prepare",  label: "En préparation", icon: <Clock className="h-4 w-4" /> },
  { key: "en_route", label: "En route",        icon: <Navigation className="h-4 w-4" /> },
  { key: "livre",    label: "Livré",           icon: <CheckCircle2 className="h-4 w-4" /> },
];
const STATUS_IDX: Record<Livraison["statut"], number> = { prepare: 0, en_route: 1, livre: 2 };

const statusBadge = (statut: Livraison["statut"]) => {
  const cfg = {
    prepare:  { cls: "bg-amber-50   text-amber-700   border border-amber-300",       label: "En préparation" },
    en_route: { cls: "bg-purple-100 text-purple-700  border border-purple-300",      label: "En route" },
    livre:    { cls: "bg-emerald-100 text-emerald-700 border border-emerald-300",    label: "Livré" },
  } as const;
  const c = cfg[statut] ?? { cls: "bg-gray-100 text-gray-600", label: statut };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
};

// ── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ delivery, onClose, onSaved }: {
  delivery: Livraison;
  onClose: () => void;
  onSaved: (updated: Livraison) => void;
}) {
  const [form, setForm] = useState<DeliveryUpdate>({
    statut:         delivery.statut,
    transporteur:   delivery.transporteur,
    colis:          delivery.colis,
    dateExpedition: toInputDate(delivery.dateExpedition) || undefined,
    dateLivraison:  toInputDate(delivery.dateLivraison)  || undefined,
    numeroSuivi:    delivery.numeroSuivi ?? "",
    notes:          delivery.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k: keyof DeliveryUpdate, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const payload: DeliveryUpdate = {
        ...form,
        dateExpedition: form.dateExpedition || null as any,
        dateLivraison:  form.dateLivraison  || null as any,
        numeroSuivi:    form.numeroSuivi    || null as any,
        notes:          form.notes          || null as any,
      };
      const updated = await updateDelivery(delivery.id, payload);
      onSaved(updated);
    } catch (e: any) {
      console.error("Erreur livraison:", e);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const curIdx = STATUS_IDX[form.statut as Livraison["statut"]] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900 px-6 py-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">
              Livraison #{delivery.id}
            </p>
            <h2 className="text-white font-semibold text-lg leading-tight">{delivery.client}</h2>
            <p className="text-yellow-400 text-sm font-mono">{delivery.commande}</p>
          </div>
          <div className="text-right">
            {delivery.total_amount != null && (
              <p className="text-white font-bold text-lg">{fmtMoney(delivery.total_amount)}</p>
            )}
            {delivery.numeroSuivi && (
              <p className="text-gray-400 text-xs font-mono mt-0.5">{delivery.numeroSuivi}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-3 divide-x bg-gray-50 border-b text-center text-xs py-2">
          <div className="px-3">
            <p className="text-gray-400">Articles</p>
            <p className="font-semibold text-gray-800">{delivery.articles_count ?? delivery.colis}</p>
          </div>
          <div className="px-3">
            <p className="text-gray-400">Colis</p>
            <p className="font-semibold text-gray-800">{delivery.colis}</p>
          </div>
          <div className="px-3">
            <p className="text-gray-400">Téléphone</p>
            <p className="font-semibold text-gray-800">{delivery.client_phone || "—"}</p>
          </div>
        </div>

        {/* Status stepper */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Statut de livraison</p>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done    = i < curIdx;
              const current = i === curIdx;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => set("statut", step.key)}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center ${
                      current ? "bg-brand-orange text-black font-semibold shadow"
                      : done   ? "text-black hover:bg-yellow-50"
                               : "text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`rounded-full p-1.5 ${current ? "bg-black/10" : done ? "bg-yellow-100" : "bg-gray-100"}`}>
                      {step.icon}
                    </span>
                    <span className="text-xs whitespace-nowrap">{step.label}</span>
                  </button>
                  {i < STATUS_STEPS.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-1 flex-shrink-0 ${done ? "text-yellow-500" : "text-gray-300"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[45vh] overflow-y-auto">
          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <Truck className="h-3.5 w-3.5" /> Transporteur
            </Label>
            <Input value={form.transporteur ?? ""} onChange={(e) => set("transporteur", e.target.value)}
              placeholder="Ex: TNT, DHL, Transporteur local..." className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <Package className="h-3.5 w-3.5" /> Nb colis
              </Label>
              <Input type="number" min={1} value={form.colis ?? 1}
                onChange={(e) => set("colis", parseInt(e.target.value) || 1)} className="h-9" />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <Hash className="h-3.5 w-3.5" /> N° de suivi
              </Label>
              <Input value={form.numeroSuivi ?? ""} onChange={(e) => set("numeroSuivi", e.target.value)}
                placeholder="Ex: TRK-001234" className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <CalendarDays className="h-3.5 w-3.5" /> Date d'expédition
              </Label>
              <Input type="date" value={form.dateExpedition ?? ""}
                onChange={(e) => set("dateExpedition", e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <CalendarDays className="h-3.5 w-3.5" /> Livraison prévue
              </Label>
              <Input type="date" value={form.dateLivraison ?? ""}
                onChange={(e) => set("dateLivraison", e.target.value)} className="h-9" />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <MapPin className="h-3.5 w-3.5" /> Adresse livraison
            </Label>
            <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 leading-snug">
              {delivery.adresse || "—"}
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <StickyNote className="h-3.5 w-3.5" /> Notes internes
            </Label>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              placeholder="Notes pour le livreur, instructions spéciales..." rows={2}
              className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {error && <p className="text-xs text-brand-red bg-red-50 rounded px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition">
            <RotateCcw className="h-4 w-4" /> Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-brand-orange hover:bg-brand-orange text-black transition disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DeliveriesPage() {
  const { user } = useAuth();
  const router   = useRouter();

  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin");
    return null;
  }

  const [deliveries,   setDeliveries]   = useState<Livraison[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState<"tous" | Livraison["statut"]>("tous");
  const [editTarget,   setEditTarget]   = useState<Livraison | null>(null);
  const [toast,        setToast]        = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    try {
      const data = await fetchDeliveries();
      setDeliveries(data);
    } catch (e) {
      console.error("Erreur fetch livraisons:", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated: Livraison) => {
    setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    showToast("✅ Livraison mise à jour avec succès");
    // Force full reload to ensure fresh data
    load();
  };

  const total    = deliveries.length;
  const nPrepare = deliveries.filter((d) => d.statut === "prepare").length;
  const nEnRoute = deliveries.filter((d) => d.statut === "en_route").length;
  const nLivre   = deliveries.filter((d) => d.statut === "livre").length;

  const filtered = deliveries.filter((d) => {
    const q = searchTerm.toLowerCase();
    const match =
      (d.commande      || "").toLowerCase().includes(q) ||
      (d.client        || "").toLowerCase().includes(q) ||
      (d.transporteur  || "").toLowerCase().includes(q) ||
      (d.numeroSuivi   || "").toLowerCase().includes(q) ||
      (d.order_number  || "").toLowerCase().includes(q);
    return match && (statusFilter === "tous" || d.statut === statusFilter);
  });

  const FILTER_TABS = [
    { key: "tous"     as const, label: "Toutes",         count: total    },
    { key: "prepare"  as const, label: "En préparation", count: nPrepare },
    { key: "en_route" as const, label: "En route",       count: nEnRoute },
    { key: "livre"    as const, label: "Livrées",        count: nLivre   },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-brand-orange text-black px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {editTarget && (
        <EditModal delivery={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi et mise à jour des expéditions clients</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {total} livraison{total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { n: nPrepare, label: "En préparation", icon: <Clock className="h-6 w-6 text-amber-600" />,   bg: "bg-amber-50",   border: "border-l-amber-400"   },
          { n: nEnRoute, label: "En route",        icon: <Truck className="h-6 w-6 text-purple-600" />, bg: "bg-purple-50",  border: "border-l-purple-400"  },
          { n: nLivre,   label: "Livrées",         icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />, bg: "bg-emerald-50", border: "border-l-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`rounded-xl ${s.bg} p-3`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.n}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher (commande, client, suivi...)"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTER_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              {tab.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? "bg-brand-orange text-black" : "bg-gray-200 text-gray-600"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 md:hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucune livraison trouvée</p>
        ) : filtered.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-start border-b">
              <div>
                <p className="font-semibold text-sm text-gray-900">{d.commande}</p>
                <p className="text-xs text-gray-500">{d.client}</p>
                {d.client_phone && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />{d.client_phone}
                  </p>
                )}
              </div>
              <div className="text-right">
                {statusBadge(d.statut)}
                {d.total_amount != null && (
                  <p className="text-xs font-bold text-gray-800 mt-1">{fmtMoney(d.total_amount)}</p>
                )}
              </div>
            </div>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Transporteur</span>
                <span className="font-medium">{d.transporteur || <span className="text-orange-500 italic text-xs">À assigner</span>}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">N° suivi</span>
                <span className="font-mono text-xs">{d.numeroSuivi || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Colis / Articles</span>
                <span>{d.colis} colis · {d.articles_count ?? "?"} art.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison prévue</span>
                <span>{fmt(d.dateLivraison)}</span>
              </div>
              <button onClick={() => setEditTarget(d)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange text-black text-sm font-semibold transition">
                <Edit3 className="h-4 w-4" /> Modifier
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <CardHeader className="border-b bg-gray-50 py-3 px-6">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Liste des livraisons ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-600 text-xs uppercase pl-6">Commande</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Client</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Transporteur</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">Colis</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">N° Suivi</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Expédition</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Liv. prévue</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Montant</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">Statut</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-400">
                    Chargement des livraisons...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-400">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucune livraison trouvée
                  </TableCell>
                </TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id} className="hover:bg-yellow-50/40 transition-colors">
                  {/* Commande */}
                  <TableCell className="pl-6">
                    <p className="font-semibold text-sm text-gray-900">{d.commande}</p>
                    {d.order_number && d.order_number !== d.commande && (
                      <p className="text-xs text-gray-400 font-mono">{d.order_number}</p>
                    )}
                  </TableCell>
                  {/* Client */}
                  <TableCell>
                    <p className="font-medium text-sm text-gray-900">{d.client}</p>
                    {d.client_phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />{d.client_phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 max-w-[140px] truncate" title={d.adresse}>
                      <MapPin className="inline h-2.5 w-2.5 mr-0.5" />{d.adresse || "—"}
                    </p>
                  </TableCell>
                  {/* Transporteur */}
                  <TableCell>
                    {d.transporteur ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Truck className="h-3.5 w-3.5 text-gray-400" />{d.transporteur}
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500 italic">À assigner</span>
                    )}
                  </TableCell>
                  {/* Colis */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Package className="h-3.5 w-3.5 text-gray-400" />{d.colis}
                      </span>
                      {d.articles_count != null && d.articles_count !== d.colis && (
                        <span className="text-[10px] text-gray-400">{d.articles_count} art.</span>
                      )}
                    </div>
                  </TableCell>
                  {/* N° Suivi */}
                  <TableCell>
                    {d.numeroSuivi ? (
                      <span className="font-mono text-xs bg-gray-100 rounded px-2 py-0.5">{d.numeroSuivi}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                  {/* Expédition */}
                  <TableCell className="text-sm text-gray-700">{fmt(d.dateExpedition)}</TableCell>
                  {/* Livraison prévue */}
                  <TableCell className="text-sm text-gray-700">{fmt(d.dateLivraison)}</TableCell>
                  {/* Montant */}
                  <TableCell>
                    <span className="text-sm font-semibold text-gray-800">
                      {fmtMoney(d.total_amount)}
                    </span>
                  </TableCell>
                  {/* Statut */}
                  <TableCell className="text-center">{statusBadge(d.statut)}</TableCell>
                  {/* Action */}
                  <TableCell className="text-center pr-6">
                    <button onClick={() => setEditTarget(d)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-orange hover:bg-brand-orange text-black transition">
                      <Edit3 className="h-3.5 w-3.5" /> Modifier
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}