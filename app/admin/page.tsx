// Page principale du tableau de bord administrateur
"use client";
import { useState, useEffect } from "react";
import DashboardStatsComponent from "@/components/admin/dashboard-stats";
import { adminService } from "@/lib/services/admin";
import type { AdminStats, AnalyticsData } from "@/lib/services/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAnalytics()
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        setError(
          statsResponse.error || "Erreur lors du chargement des statistiques"
        );
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }
    } catch (err: any) {
      setError("Erreur de connexion au serveur");
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          onClick={fetchStats}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Row */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">
            Vue d'ensemble de votre activité PNEU SHOP
          </p>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <DashboardStatsComponent stats={stats} analytics={analytics || undefined} />
    </div>
  );
}
