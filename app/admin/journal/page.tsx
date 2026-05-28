"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Loader2, RefreshCw, AlertTriangle,
  LogIn, UserPlus, UserCog, UserX, Power, Eye, Activity,
} from "lucide-react";
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
  login:       <LogIn className="h-4 w-4" />,
  create_user: <UserPlus className="h-4 w-4" />,
  update_user: <UserCog className="h-4 w-4" />,
  delete_user: <UserX className="h-4 w-4" />,
  toggle_user: <Power className="h-4 w-4" />,
  view:        <Eye className="h-4 w-4" />,
  other:       <Activity className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  login:       "bg-blue-100 text-blue-800",
  create_user: "bg-green-100 text-green-800",
  update_user: "bg-yellow-100 text-yellow-800",
  delete_user: "bg-red-100 text-red-800",
  toggle_user: "bg-purple-100 text-purple-800",
  view:        "bg-gray-100 text-gray-700",
  other:       "bg-gray-100 text-gray-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function JournalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");

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

  const ACTIONS = [
    { value: "", label: "Toutes les actions" },
    { value: "login", label: "Connexions" },
    { value: "create_user", label: "Créations" },
    { value: "update_user", label: "Modifications" },
    { value: "delete_user", label: "Suppressions" },
    { value: "toggle_user", label: "Activations" },
  ];

  const filtered = filterAction
    ? logs.filter((l) => l.action === filterAction)
    : logs;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Journal des activités</h1>
            <p className="text-gray-500 text-sm">
              Historique des actions du back-office ({logs.length} entrées)
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {ACTIONS.map((a) => (
          <button
            key={a.value}
            onClick={() => setFilterAction(a.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterAction === a.value
                ? "bg-yellow-400 border-yellow-400 text-black"
                : "bg-white border-gray-300 text-gray-600 hover:border-yellow-400"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Erreur : {error}</span>
          <Button size="sm" variant="outline" onClick={loadLogs} className="ml-auto">Réessayer</Button>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Détails</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
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
                    <Badge className={`${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"} flex items-center gap-1 w-fit`}>
                      {ACTION_ICONS[log.action]}
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
