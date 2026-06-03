"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  LineChart,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Loader2,
  Euro,
  FileDown,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import ExcelJS from "exceljs";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

// Types for the data
interface StatsVentes {
  ventes_jour: number;
  ventes_hebdo: number;
  ventes_mensuel: number;
  commandes_jour: number;
  commandes_hebdo: number;
  commandes_mensuel: number;
  clients_actifs: number;
  produits_vendus: number;
  ventes_total: number;
  commandes_total: number;
  panier_moyen: number;
}

interface VentesParMois {
  mois: string;
  ventes: number;
  commandes: number;
}

interface TopProduit {
  nom: string;
  ventes: number;
  chiffre: number;
}

interface TopClient {
  nom: string;
  commandes: number;
  total: number;
}

interface SavStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  rejected: number;
  this_month: number;
}

interface ReportsData {
  stats_ventes: StatsVentes;
  ventes_par_mois: VentesParMois[];
  top_produits: TopProduit[];
  top_clients: TopClient[];
  sav_stats?: SavStats;
}

export default function RapportsPage() {
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState("mois");
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin or sales
  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  // Fetch reports data from backend
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/reports/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const data = await response.json();
      console.log("API Response:", data);
      setReportsData(data);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      setError(
        "Erreur lors du chargement des données. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReportsData}>Réessayer</Button>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const stats_ventes   = reportsData.stats_ventes   ?? {} as StatsVentes;
  const ventes_par_mois = reportsData.ventes_par_mois ?? [];
  const top_produits    = reportsData.top_produits    ?? [];
  const top_clients     = reportsData.top_clients     ?? [];

  // Check if we have any real data
  const hasData =
    (stats_ventes.commandes_mensuel ?? 0) > 0 ||
    top_produits.length > 0 ||
    top_clients.length > 0;

  const handleExportRapports = async () => {
    const workbook = new ExcelJS.Workbook();
    const date = new Date().toLocaleDateString("fr-FR");

    // Sheet 1 — KPIs
    const wsKpi = workbook.addWorksheet("KPIs");
    wsKpi.columns = [
      { header: "Indicateur", key: "label", width: 30 },
      { header: "Valeur", key: "value", width: 20 },
    ];
    wsKpi.getRow(1).font = { bold: true };
    [
      { label: "Ventes totales (DT)", value: stats_ventes.ventes_total ?? 0 },
      { label: "Commandes totales", value: stats_ventes.commandes_total ?? 0 },
      { label: "Clients actifs", value: stats_ventes.clients_actifs ?? 0 },
      { label: "Panier moyen (DT)", value: stats_ventes.panier_moyen ?? 0 },
      { label: "Ventes du jour (DT)", value: stats_ventes.ventes_jour ?? 0 },
      { label: "Ventes semaine (DT)", value: stats_ventes.ventes_hebdo ?? 0 },
      { label: "Ventes mois (DT)", value: stats_ventes.ventes_mensuel ?? 0 },
      { label: "Commandes du jour", value: stats_ventes.commandes_jour ?? 0 },
      { label: "Produits vendus", value: stats_ventes.produits_vendus ?? 0 },
    ].forEach((row) => wsKpi.addRow(row));

    // Sheet 2 — Ventes par mois
    const wsMois = workbook.addWorksheet("Ventes par mois");
    wsMois.columns = [
      { header: "Mois", key: "mois", width: 14 },
      { header: "Ventes (DT)", key: "ventes", width: 16 },
      { header: "Commandes", key: "commandes", width: 14 },
    ];
    wsMois.getRow(1).font = { bold: true };
    ventes_par_mois.forEach((row) => wsMois.addRow(row));

    // Sheet 3 — Top produits
    const wsProd = workbook.addWorksheet("Top Produits");
    wsProd.columns = [
      { header: "Produit", key: "nom", width: 35 },
      { header: "Quantité vendue", key: "ventes", width: 16 },
      { header: "CA (DT)", key: "chiffre", width: 14 },
    ];
    wsProd.getRow(1).font = { bold: true };
    top_produits.forEach((row) => wsProd.addRow(row));

    // Sheet 4 — Top clients
    const wsCli = workbook.addWorksheet("Top Clients");
    wsCli.columns = [
      { header: "Client", key: "nom", width: 30 },
      { header: "Commandes", key: "commandes", width: 14 },
      { header: "Total (DT)", key: "total", width: 14 },
    ];
    wsCli.getRow(1).font = { bold: true };
    top_clients.forEach((row) => wsCli.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rapports_${date.replace(/\//g, "-")}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Rapports & Analyses
        </h1>
        <Button variant="outline" className="gap-2" onClick={handleExportRapports}>
          <FileDown className="h-4 w-4" />
          Exporter Excel
        </Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventes totales
            </CardTitle>
            <p className="h-4 w-4 text-yellow-500 font-bold">DT</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(stats_ventes.ventes_total ?? 0).toLocaleString()} DT
            </div>
            <p className="text-xs text-gray-500 mt-1">Toutes périodes confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats_ventes.commandes_total ?? 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Toutes périodes confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clients actifs
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {stats_ventes.clients_actifs ?? 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Données en temps réel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats_ventes.panier_moyen ?? 0).toLocaleString()} DT
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Évolution des ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventes_par_mois.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.mois}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (data.ventes /
                              Math.max(
                                ...ventes_par_mois.map((d) => d.ventes)
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-20 text-right">
                      {data.ventes.toLocaleString()} DT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2" />
              Évolution des commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventes_par_mois.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.mois}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (data.commandes /
                              Math.max(
                                ...ventes_par_mois.map((d) => d.commandes)
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {data.commandes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SAV Stats */}
      {reportsData.sav_stats && (() => {
        const sav = reportsData.sav_stats!;
        const resolutionRate = sav.total > 0 ? Math.round((sav.resolved / sav.total) * 100) : 0;
        const activeRate     = sav.total > 0 ? Math.round(((sav.pending + sav.processing) / sav.total) * 100) : 0;
        const segments = [
          { label: "En attente",    value: sav.pending,    color: "bg-amber-400",  pct: sav.total > 0 ? (sav.pending    / sav.total) * 100 : 0 },
          { label: "En traitement", value: sav.processing, color: "bg-blue-400",   pct: sav.total > 0 ? (sav.processing / sav.total) * 100 : 0 },
          { label: "Résolus",       value: sav.resolved,   color: "bg-emerald-500",pct: sav.total > 0 ? (sav.resolved   / sav.total) * 100 : 0 },
          { label: "Rejetés",       value: sav.rejected,   color: "bg-red-400",    pct: sav.total > 0 ? (sav.rejected   / sav.total) * 100 : 0 },
        ];
        return (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                    <Shield className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Service Après Vente</p>
                    <p className="text-xs text-gray-400">Suivi des réclamations clients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Ce mois</p>
                  <p className="text-lg font-bold text-gray-800">
                    +{sav.this_month}
                    <span className="text-xs font-normal text-gray-400 ml-1">nouvelle{sav.this_month > 1 ? "s" : ""}</span>
                  </p>
                </div>
              </div>

              {/* KPIs row */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Total réclamations</p>
                  <p className="text-3xl font-bold text-gray-900">{sav.total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">depuis le début</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <p className="text-xs text-emerald-600 mb-1 font-medium">Taux de résolution</p>
                  <p className="text-3xl font-bold text-emerald-700">{resolutionRate}<span className="text-lg">%</span></p>
                  <p className="text-xs text-emerald-500 mt-0.5">{sav.resolved} cas résolus</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs text-amber-600 mb-1 font-medium">En cours de traitement</p>
                  <p className="text-3xl font-bold text-amber-700">{sav.pending + sav.processing}</p>
                  <p className="text-xs text-amber-500 mt-0.5">{activeRate}% du total</p>
                </div>
              </div>

              {/* Stacked progress bar */}
              <div className="mb-3">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  {segments.map((s) => s.pct > 0 && (
                    <div key={s.label} className={`${s.color} h-full transition-all`} style={{ width: `${s.pct}%` }} />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {s.value}
                        <span className="text-xs font-normal text-gray-400 ml-1">
                          ({s.pct.toFixed(0)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Top produits et clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top produits vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>CA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_produits.map((produit, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{produit.nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{produit.ventes}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-yellow-600">
                      {produit.chiffre.toLocaleString()} DT
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_clients.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{client.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.commandes}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-800">
                      {client.total.toLocaleString()} DT
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
