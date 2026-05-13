"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, Store, Bell, Shield, Database, Users,
  Loader2, Check, Phone, Mail, MapPin, Clock,
  FileDown, RotateCcw, AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

type Tab = "boutique" | "notifications" | "securite" | "systeme";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "boutique",       label: "Boutique",       icon: Store },
  { id: "notifications",  label: "Notifications",  icon: Bell },
  { id: "securite",       label: "Sécurité",        icon: Shield },
  { id: "systeme",        label: "Système",         icon: Database },
];

export default function ParametresPage() {
  const [parametres, setParametres] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>("boutique");
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/admin");
  }, [user]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch settings
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/products/site-settings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          setParametres({
            boutique: {
              nom:         d.nom_boutique   || "",
              description: d.description    || "",
              adresse:     d.adresse        || "",
              telephone:   d.telephone      || "",
              email:       d.email          || "",
              horaires:    d.horaires       || "",
            },
            notifications: {
              emailCommandes: d.email_commandes ?? true,
              emailStock:     d.email_stock     ?? true,
            },
            securite: {
              sessionTimeout:  d.session_timeout   || 60,
              motDePasseForce: d.mot_de_passe_force ?? false,
              journalisation:  d.journalisation     ?? false,
            },
            systeme: {
              maintenanceMode: d.maintenance_mode  ?? false,
              sauvegaudeAuto:  d.sauvegarde_auto   ?? false,
              languePrincipale: d.langue_principale || "fr",
            },
          });
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!parametres) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const body = {
        nom_boutique:       parametres.boutique.nom,
        description:        parametres.boutique.description,
        adresse:            parametres.boutique.adresse,
        telephone:          parametres.boutique.telephone,
        email:              parametres.boutique.email,
        horaires:           parametres.boutique.horaires,
        email_commandes:    parametres.notifications.emailCommandes,
        email_stock:        parametres.notifications.emailStock,
        session_timeout:    parametres.securite.sessionTimeout,
        mot_de_passe_force: parametres.securite.motDePasseForce,
        journalisation:     parametres.securite.journalisation,
        maintenance_mode:   parametres.systeme.maintenanceMode,
        sauvegarde_auto:    parametres.systeme.sauvegaudeAuto,
        langue_principale:  parametres.systeme.languePrincipale,
      };
      const res = await fetch(`${API_URL}/products/site-settings/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) showToast("Paramètres enregistrés avec succès.");
      else showToast("Erreur lors de la sauvegarde.", false);
    } catch { showToast("Erreur de connexion.", false); }
    finally { setSaving(false); }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/admin/backup/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `backup_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Sauvegarde téléchargée.");
      } else showToast("Sauvegarde indisponible.", false);
    } catch { showToast("Erreur de connexion.", false); }
  };

  const handleExportCustomers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/admin/export-customers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `clients_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Export clients téléchargé.");
      } else showToast("Export indisponible.", false);
    } catch { showToast("Erreur de connexion.", false); }
  };

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!parametres) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        Impossible de charger les paramètres
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const setB = (key: string, val: any) =>
    setParametres((p: any) => ({ ...p, boutique:       { ...p.boutique,       [key]: val } }));
  const setN = (key: string, val: any) =>
    setParametres((p: any) => ({ ...p, notifications:  { ...p.notifications,  [key]: val } }));
  const setS = (key: string, val: any) =>
    setParametres((p: any) => ({ ...p, securite:       { ...p.securite,       [key]: val } }));
  const setSy = (key: string, val: any) =>
    setParametres((p: any) => ({ ...p, systeme:        { ...p.systeme,        [key]: val } }));

  const ToggleRow = ({
    label, desc, checked, onChange,
  }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const Field = ({
    id, label, icon: Icon, children,
  }: { id: string; label: string; icon?: React.ComponentType<any>; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        {label}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg text-white transition-all
          ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="border-b bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configuration générale de la boutique</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white hover:bg-gray-800 gap-2 px-5"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
              : <><Check className="h-4 w-4" /> Enregistrer</>}
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="mt-6 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-8 max-w-4xl space-y-6">

        {/* ── BOUTIQUE ── */}
        {activeTab === "boutique" && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-3">
                  <Store className="h-4 w-4" /> Informations générales
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field id="nom" label="Nom de la boutique" icon={Store}>
                    <Input id="nom" value={parametres.boutique.nom}
                      onChange={(e) => setB("nom", e.target.value)}
                      placeholder="PneuShop" />
                  </Field>
                  <Field id="telephone" label="Téléphone" icon={Phone}>
                    <Input id="telephone" value={parametres.boutique.telephone}
                      onChange={(e) => setB("telephone", e.target.value)}
                      placeholder="+216 XX XXX XXX" />
                  </Field>
                </div>

                <Field id="email" label="Email de contact" icon={Mail}>
                  <Input id="email" type="email" value={parametres.boutique.email}
                    onChange={(e) => setB("email", e.target.value)}
                    placeholder="contact@pneushop.tn" />
                </Field>

                <Field id="horaires" label="Horaires d'ouverture" icon={Clock}>
                  <Input id="horaires" value={parametres.boutique.horaires}
                    onChange={(e) => setB("horaires", e.target.value)}
                    placeholder="Lun–Sam : 08h–18h" />
                </Field>

                <Field id="description" label="Description">
                  <Textarea id="description" value={parametres.boutique.description}
                    onChange={(e) => setB("description", e.target.value)}
                    rows={3} placeholder="Description courte de la boutique…" />
                </Field>

                <Field id="adresse" label="Adresse complète" icon={MapPin}>
                  <Textarea id="adresse" value={parametres.boutique.adresse}
                    onChange={(e) => setB("adresse", e.target.value)}
                    rows={2} placeholder="Rue, Ville, Code postal" />
                </Field>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-3">
                <Bell className="h-4 w-4" /> Alertes et notifications
              </div>
              <ToggleRow
                label="Notifications nouvelles commandes"
                desc="Recevoir un e-mail à chaque nouvelle commande client"
                checked={parametres.notifications.emailCommandes}
                onChange={(v) => setN("emailCommandes", v)}
              />
              <ToggleRow
                label="Alertes stock bas"
                desc="Notification quand un article passe en dessous du seuil minimum"
                checked={parametres.notifications.emailStock}
                onChange={(v) => setN("emailStock", v)}
              />
            </CardContent>
          </Card>
        )}

        {/* ── SÉCURITÉ ── */}
        {activeTab === "securite" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-3">
                <Shield className="h-4 w-4" /> Sécurité et accès
              </div>

              <Field id="timeout" label="Durée de session (minutes)">
                <Input id="timeout" type="number" min={5} max={1440}
                  value={parametres.securite.sessionTimeout}
                  onChange={(e) => setS("sessionTimeout", parseInt(e.target.value) || 60)}
                  className="w-40" />
              </Field>

              <ToggleRow
                label="Mot de passe fort obligatoire"
                desc="Exiger majuscules, chiffres et caractères spéciaux"
                checked={parametres.securite.motDePasseForce}
                onChange={(v) => setS("motDePasseForce", v)}
              />
              <ToggleRow
                label="Journal des activités"
                desc="Enregistrer toutes les actions effectuées par les administrateurs"
                checked={parametres.securite.journalisation}
                onChange={(v) => setS("journalisation", v)}
              />
            </CardContent>
          </Card>
        )}

        {/* ── SYSTÈME ── */}
        {activeTab === "systeme" && (
          <div className="space-y-5">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-3">
                  <Settings className="h-4 w-4" /> Configuration système
                </div>

                <ToggleRow
                  label="Mode maintenance"
                  desc="Mettre la boutique hors ligne pour les clients (accès admin uniquement)"
                  checked={parametres.systeme.maintenanceMode}
                  onChange={(v) => setSy("maintenanceMode", v)}
                />
                <ToggleRow
                  label="Sauvegarde automatique"
                  desc="Sauvegarder automatiquement la base de données chaque nuit"
                  checked={parametres.systeme.sauvegaudeAuto}
                  onChange={(v) => setSy("sauvegaudeAuto", v)}
                />

                <Field id="langue" label="Langue principale">
                  <select
                    id="langue"
                    value={parametres.systeme.languePrincipale}
                    onChange={(e) => setSy("languePrincipale", e.target.value)}
                    className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">Arabe</option>
                    <option value="en">Anglais</option>
                  </select>
                </Field>
              </CardContent>
            </Card>

            {/* Actions système */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-3">
                  <Database className="h-4 w-4" /> Actions de maintenance
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleBackup}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-400 hover:shadow-sm transition-all"
                  >
                    <div className="rounded-lg bg-blue-50 p-2.5">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Sauvegarde BD</p>
                      <p className="text-xs text-gray-500">Télécharger un snapshot JSON</p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCustomers}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-400 hover:shadow-sm transition-all"
                  >
                    <div className="rounded-lg bg-green-50 p-2.5">
                      <FileDown className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Exporter clients</p>
                      <p className="text-xs text-gray-500">Fichier CSV des comptes clients</p>
                    </div>
                  </button>
                </div>

                {/* Danger zone */}
                <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2.5">
                      <RotateCcw className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Réinitialiser le système</p>
                      <p className="text-xs text-red-600">Cette action est irréversible</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" disabled className="text-xs">
                    Désactivé
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
