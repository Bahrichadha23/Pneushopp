"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Loader2, RefreshCw, AlertTriangle,
  LogIn, UserPlus, UserCog, UserX, Power,
  ShoppingCart, Truck, FileText, Package, Wallet, Shield, Activity,
  PlusCircle, Pencil, Trash2, DollarSign, Tag, FileDown,
} from "lucide-react";
import ExcelJS from "exceljs";
import { API_URL } from "@/lib/config";

interface ActivityLog {
  id: number;
  user_email: string;
  user_name: string;
  action: string;
  action_label: string;
  description: string;
  target_user_email: string;
  ip_address: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login:           <LogIn className="h-4 w-4" />,
  create_user:     <UserPlus className="h-4 w-4" />,
  update_user:     <UserCog className="h-4 w-4" />,
  delete_user:     <UserX className="h-4 w-4" />,
  toggle_user:     <Power className="h-4 w-4" />,
  confirm_order:   <ShoppingCart className="h-4 w-4" />,
  cancel_order:    <ShoppingCart className="h-4 w-4" />,
  create_invoice:  <FileText className="h-4 w-4" />,
  create_delivery: <Truck className="h-4 w-4" />,
  update_delivery: <Truck className="h-4 w-4" />,
  create_bon:      <FileText className="h-4 w-4" />,
  add_stock:       <Package className="h-4 w-4" />,
  adjust_stock:    <Package className="h-4 w-4" />,
  create_purchase: <Wallet className="h-4 w-4" />,
  sav_update:      <Shield className="h-4 w-4" />,
  add_product:     <PlusCircle className="h-4 w-4" />,
  update_product:  <Pencil className="h-4 w-4" />,
  delete_product:  <Trash2 className="h-4 w-4" />,
  update_price:    <DollarSign className="h-4 w-4" />,
  dot_sale:        <Tag className="h-4 w-4" />,
  other:           <Activity className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  login:           "bg-gray-100 text-gray-700",
  create_user:     "bg-yellow-100 text-yellow-800",
  update_user:     "bg-yellow-50 text-yellow-700",
  delete_user:     "bg-black text-white",
  toggle_user:     "bg-gray-200 text-gray-800",
  confirm_order:   "bg-yellow-400 text-black",
  cancel_order:    "bg-black text-white",
  create_invoice:  "bg-yellow-100 text-yellow-900",
  create_delivery: "bg-gray-100 text-gray-700",
  update_delivery: "bg-gray-50 text-gray-600",
  create_bon:      "bg-yellow-50 text-yellow-800",
  add_stock:       "bg-yellow-200 text-yellow-900",
  adjust_stock:    "bg-yellow-100 text-yellow-800",
  create_purchase: "bg-gray-100 text-gray-700",
  sav_update:      "bg-yellow-50 text-yellow-700",
  add_product:     "bg-yellow-300 text-black",
  update_product:  "bg-yellow-100 text-yellow-900",
  delete_product:  "bg-black text-white",
  update_price:    "bg-yellow-400 text-black",
  dot_sale:        "bg-yellow-200 text-yellow-900",
  other:           "bg-gray-100 text-gray-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const FILTER_GROUPS = [
  { value: "", label: "Toutes" },
  { value: "login", label: "Connexions" },
  { value: "confirm_order,cancel_order", label: "Commandes" },
  { value: "create_delivery,update_delivery", label: "Livraisons" },
  { value: "add_stock,adjust_stock,dot_sale", label: "Stock" },
  { value: "add_product,update_product,delete_product,update_price", label: "Articles" },
  { value: "create_purchase", label: "Achats" },
  { value: "sav_update", label: "SAV" },
  { value: "create_user,update_user,delete_user,toggle_user", label: "Utilisateurs" },
];

export default function JournalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/admin");
    }
  }, [user, isLoading, router]);

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/accounts/admin/journal/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") loadLogs();
  }, [user]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  const activeActions = filterGroup ? filterGroup.split(",") : [];
  const filtered = activeActions.length
    ? logs.filter((l) => activeActions.includes(l.action))
    : logs;

  async function handleExportExcel() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Journal");

    ws.columns = [
      { header: "Date",     key: "date",        width: 22 },
      { header: "Employé",  key: "employe",     width: 28 },
      { header: "Email",    key: "email",        width: 32 },
      { header: "Action",   key: "action",       width: 22 },
      { header: "Détails",  key: "details",      width: 50 },
      { header: "IP",       key: "ip",           width: 16 },
    ];

    // Style en-tête
    const hdr = ws.getRow(1);
    hdr.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    hdr.alignment = { vertical: "middle", horizontal: "center" };
    hdr.height = 20;

    filtered.forEach((log, i) => {
      const row = ws.addRow({
        date:    formatDate(log.created_at),
        employe: log.user_name,
        email:   log.user_email,
        action:  log.action_label,
        details: log.description + (log.target_user_email && log.target_user_email !== log.user_email ? ` → ${log.target_user_email}` : ""),
        ip:      log.ip_address || "—",
      });
      row.fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC" },
      };
    });

    // Lignes totales en bas
    const totalRow = ws.addRow({ date: `Total : ${filtered.length} entrée(s)` });
    totalRow.font = { bold: true, italic: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const filterLabel = filterGroup
      ? `_${FILTER_GROUPS.find((g) => g.value === filterGroup)?.label ?? "filtre"}`
      : "";
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Journal${filterLabel}_${date}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Journal des activités</h1>
            <p className="text-gray-500 text-sm">
              Actions du back-office — {logs.length} entrée{logs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={loading || filtered.length === 0}>
            <FileDown className="h-4 w-4 mr-1" />
            Exporter (Excel)
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTER_GROUPS.map((g) => (
          <button
            key={g.value}
            onClick={() => setFilterGroup(g.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterGroup === g.value
                ? "bg-yellow-400 border-yellow-400 text-black"
                : "bg-white border-gray-300 text-gray-600 hover:border-yellow-400"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Erreur : {error}</span>
          <Button size="sm" variant="outline" onClick={loadLogs} className="ml-auto">
            Réessayer
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune activité enregistrée</p>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Détails</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{log.user_name}</p>
                    <p className="text-xs text-gray-400">{log.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`${
                        ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"
                      } flex items-center gap-1 w-fit`}
                    >
                      {ACTION_ICONS[log.action] ?? <Activity className="h-4 w-4" />}
                      {log.action_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{log.description}</p>
                    {log.target_user_email && log.target_user_email !== log.user_email && (
                      <p className="text-xs text-gray-400">→ {log.target_user_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
