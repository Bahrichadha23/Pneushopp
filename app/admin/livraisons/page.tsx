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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Navigation,
  X,
  Edit3,
  Save,
  RotateCcw,
  MapPin,
  Hash,
  CalendarDays,
  StickyNote,
  ChevronRight,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────
const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-FR");
};

const toInputDate = (d: string | null | undefined) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

// ── status config ──────────────────────────────────────────────────────────
const STATUS_STEPS: { key: Livraison["statut"]; label: string; icon: React.ReactNode }[] = [
  { key: "prepare",  label: "En préparation", icon: <Clock className="h-4 w-4" /> },
  { key: "en_route", label: "En route",        icon: <Navigation className="h-4 w-4" /> },
  { key: "livre",    label: "Livré",           icon: <CheckCircle2 className="h-4 w-4" /> },
];

const STATUS_IDX: Record<Livraison["statut"], number> = {
  prepare: 0,
  en_route: 1,
  livre: 2,
};

const statusBadge = (statut: Livraison["statut"]) => {
  const cfg = {
    prepare:  { cls: "bg-orange-100 text-orange-700 border border-orange-200", label: "En préparation" },
    en_route: { cls: "bg-blue-100 text-blue-700 border border-blue-200",       label: "En route" },
    livre:    { cls: "bg-green-100 text-green-700 border border-green-200",    label: "Livré" },
  } as const;
  const c = cfg[statut] ?? { cls: "bg-gray-100 text-gray-600", label: statut };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
};

// ── EditModal ──────────────────────────────────────────────────────────────
function EditModal({
  delivery,
  onClose,
  onSaved,
}: {
  delivery: Livraison;
  onClose: () => void;
  onSaved: (updated: Livraison) => void;
}) {
  const [form, setForm] = useState<DeliveryUpdate>({
    statut:        delivery.statut,
    transporteur:  delivery.transporteur,
    colis:         delivery.colis,
    dateExpedition: toInputDate(delivery.dateExpedition) || undefined,
    dateLivraison:  toInputDate(delivery.dateLivraison)  || undefined,
    numeroSuivi:   delivery.numeroSuivi ?? "",
    notes:         delivery.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k: keyof DeliveryUpdate, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
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
      onClose();
    } catch (e: any) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const curIdx = STATUS_IDX[form.statut as Livraison["statut"]] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900 px-6 py-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Livraison #{delivery.id}</p>
            <h2 className="text-white font-semibold text-lg">{delivery.client}</h2>
            <p className="text-gray-400 text-sm">{delivery.commande}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
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
                      current
                        ? "bg-yellow-400 text-black font-semibold shadow"
                        : done
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`rounded-full p-1.5 ${
                      current ? "bg-black/10" : done ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {step.icon}
                    </span>
                    <span className="text-xs whitespace-nowrap">{step.label}</span>
                  </button>
                  {i < STATUS_STEPS.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-1 flex-shrink-0 ${done ? "text-green-500" : "text-gray-300"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Transporteur */}
          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <Truck className="h-3.5 w-3.5" /> Transporteur
            </Label>
            <Input
              value={form.transporteur ?? ""}
              onChange={(e) => set("transporteur", e.target.value)}
              placeholder="Ex: TNT, DHL, Transporteur local..."
              className="h-9"
            />
          </div>

          {/* Colis + N° suivi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <Package className="h-3.5 w-3.5" /> Nb colis
              </Label>
              <Input
                type="number"
                min={1}
                value={form.colis ?? 1}
                onChange={(e) => set("colis", parseInt(e.target.value) || 1)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <Hash className="h-3.5 w-3.5" /> N° de suivi
              </Label>
              <Input
                value={form.numeroSuivi ?? ""}
                onChange={(e) => set("numeroSuivi", e.target.value)}
                placeholder="Ex: TRK-001234"
                className="h-9"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <CalendarDays className="h-3.5 w-3.5" /> Date d'expédition
              </Label>
              <Input
                type="date"
                value={form.dateExpedition ?? ""}
                onChange={(e) => set("dateExpedition", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                <CalendarDays className="h-3.5 w-3.5" /> Livraison prévue
              </Label>
              <Input
                type="date"
                value={form.dateLivraison ?? ""}
                onChange={(e) => set("dateLivraison", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Adresse (readonly info) */}
          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <MapPin className="h-3.5 w-3.5" /> Adresse
            </Label>
            <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 leading-snug">
              {delivery.adresse || "—"}
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              <StickyNote className="h-3.5 w-3.5" /> Notes internes
            </Label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notes pour le livreur, instructions spéciales..."
              rows={2}
              className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            <RotateCcw className="h-4 w-4" /> Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black transition disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    try {
      const data = await fetchDeliveries();
      setDeliveries(data);
    } catch (e) {
      console.error("Erreur fetch livraisons:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated: Livraison) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    showToast("✅ Livraison mise à jour avec succès");
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const total      = deliveries.length;
  const nPrepare   = deliveries.filter((d) => d.statut === "prepare").length;
  const nEnRoute   = deliveries.filter((d) => d.statut === "en_route").length;
  const nLivre     = deliveries.filter((d) => d.statut === "livre").length;

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = deliveries.filter((d) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (d.commande   || "").toLowerCase().includes(q) ||
      (d.client     || "").toLowerCase().includes(q) ||
      (d.transporteur || "").toLowerCase().includes(q) ||
      (d.numeroSuivi  || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "tous" || d.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const FILTER_TABS: { key: "tous" | Livraison["statut"]; label: string; count: number }[] = [
    { key: "tous",     label: "Toutes",         count: total    },
    { key: "prepare",  label: "En préparation", count: nPrepare },
    { key: "en_route", label: "En route",       count: nEnRoute },
    { key: "livre",    label: "Livrées",        count: nLivre   },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          delivery={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
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
        <Card className="border-l-4 border-l-orange-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-orange-50 p-3">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{nPrepare}</p>
              <p className="text-xs text-gray-500">En préparation</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <Truck className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{nEnRoute}</p>
              <p className="text-xs text-gray-500">En route</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{nLivre}</p>
              <p className="text-xs text-gray-500">Livrées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher (commande, client, suivi...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === tab.key
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? "bg-yellow-400 text-black" : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
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
        ) : (
          filtered.map((delivery) => (
            <Card key={delivery.id} className="overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{delivery.commande}</p>
                  <p className="text-xs text-gray-500">{delivery.client}</p>
                </div>
                {statusBadge(delivery.statut)}
              </div>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transporteur</span>
                  <span className="font-medium">{delivery.transporteur || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Colis</span>
                  <span className="font-medium">{delivery.colis}</span>
                </div>
                {delivery.numeroSuivi && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">N° suivi</span>
                    <span className="font-mono text-xs font-medium">{delivery.numeroSuivi}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Expédition</span>
                  <span>{formatDate(delivery.dateExpedition)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison prévue</span>
                  <span>{formatDate(delivery.dateLivraison)}</span>
                </div>
                <button
                  onClick={() => setEditTarget(delivery)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold transition"
                >
                  <Edit3 className="h-4 w-4" /> Modifier
                </button>
              </CardContent>
            </Card>
          ))
        )}
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
                <TableHead className="font-semibold text-gray-600 text-xs uppercase">Livraison prévue</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center">Statut</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs uppercase text-center pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    Chargement des livraisons...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucune livraison trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((delivery) => (
                  <TableRow key={delivery.id} className="hover:bg-yellow-50/40 transition-colors">
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{delivery.commande}</p>
                        {delivery.order_number && delivery.order_number !== delivery.commande && (
                          <p className="text-xs text-gray-400">Cmd: {delivery.order_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{delivery.client}</p>
                        <p className="text-xs text-gray-400 max-w-[160px] truncate" title={delivery.adresse}>
                          {delivery.adresse || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {delivery.transporteur ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {delivery.transporteur}
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 italic">À assigner</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {delivery.colis}
                      </span>
                    </TableCell>
                    <TableCell>
                      {delivery.numeroSuivi ? (
                        <span className="font-mono text-xs bg-gray-100 rounded px-2 py-0.5">{delivery.numeroSuivi}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{formatDate(delivery.dateExpedition)}</TableCell>
                    <TableCell className="text-sm text-gray-700">{formatDate(delivery.dateLivraison)}</TableCell>
                    <TableCell className="text-center">{statusBadge(delivery.statut)}</TableCell>
                    <TableCell className="text-center pr-6">
                      <button
                        onClick={() => setEditTarget(delivery)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Modifier
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
