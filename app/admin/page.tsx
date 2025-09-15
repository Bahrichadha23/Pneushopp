// Page principale du tableau de bord administrateur
"use client"
import { useState, useEffect } from "react"
import DashboardStatsComponent from "@/components/admin/dashboard-stats"
import { adminService } from "@/lib/services/admin"
import type { AdminStats } from "@/lib/services/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const fetchStats = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await adminService.getDashboardStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || "Erreur lors du chargement des statistiques")
      }
    } catch (err: any) {
      setError("Erreur de connexion au serveur")
      console.error("Dashboard stats error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
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
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité PNEU SHOP</p>
      </div>

      <DashboardStatsComponent stats={stats} />
    </div>
  )
}
