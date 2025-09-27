"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, LineChart, TrendingUp, DollarSign, Package, Users, Calendar, Loader2 } from "lucide-react"
import { API_URL } from "@/lib/config"


// Types for the data
interface StatsVentes {
  ventes_jour: number
  ventes_hebdo: number
  ventes_mensuel: number
  commandes_jour: number
  commandes_hebdo: number
  commandes_mensuel: number
  clients_actifs: number
  produits_vendus: number
}

interface VentesParMois {
  mois: string
  ventes: number
  commandes: number
}

interface TopProduit {
  nom: string
  ventes: number
  chiffre: number
}

interface TopClient {
  nom: string
  commandes: number
  total: number
}

interface ReportsData {
  stats_ventes: StatsVentes
  ventes_par_mois: VentesParMois[]
  top_produits: TopProduit[]
  top_clients: TopClient[]
}

export default function RapportsPage() {
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState("mois")
  const [loading, setLoading] = useState(true)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports data from backend
  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_URL}/admin/reports/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données")
      }

      const data = await response.json()
      console.log("API Response:", data)
      setReportsData(data)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      setError("Erreur lors du chargement des données. Vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReportsData}>Réessayer</Button>
        </div>
      </div>
    )
  }

  if (!reportsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Aucune donnée disponible</p>
      </div>
    )
  }

  const { stats_ventes, ventes_par_mois, top_produits, top_clients } = reportsData

  // Check if we have any real data
  const hasData = stats_ventes.commandes_mensuel > 0 || top_produits.length > 0 || top_clients.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
        {/* <div className="flex space-x-2">
          <Button variant={periodeSelectionnee === "jour" ? "default" : "outline"}
            onClick={() => setPeriodeSelectionnee("jour")}>
            Jour
          </Button>
          <Button variant={periodeSelectionnee === "semaine" ? "default" : "outline"}
            onClick={() => setPeriodeSelectionnee("semaine")}>
            Semaine
          </Button>
          <Button variant={periodeSelectionnee === "mois" ? "default" : "outline"}
            onClick={() => setPeriodeSelectionnee("mois")}>
            Mois
          </Button>
          <Button variant="outline" onClick={fetchReportsData}>
            <Calendar className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div> */}
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Aucune donnée de vente disponible
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Il semble qu'il n'y ait pas encore de commandes terminées dans la base de données.
                  Les rapports s'afficheront automatiquement dès qu'il y aura des données de vente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes du mois</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats_ventes.ventes_mensuel.toLocaleString()} DT
            </div>
            <p className="text-xs text-green-600 mt-1">Données en temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats_ventes.commandes_mensuel}
            </div>
            <p className="text-xs text-blue-600 mt-1">Données en temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats_ventes.clients_actifs}
            </div>
            <p className="text-xs text-purple-600 mt-1">Données en temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats_ventes.commandes_mensuel > 0
                ? Math.round(stats_ventes.ventes_mensuel / stats_ventes.commandes_mensuel)
                : 0} DT
            </div>
            <p className="text-xs text-orange-600 mt-1">Données en temps réel</p>
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
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(data.ventes / Math.max(...ventes_par_mois.map(d => d.ventes))) * 100}%` }}
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
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(data.commandes / Math.max(...ventes_par_mois.map(d => d.commandes))) * 100}%` }}
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
                    <TableCell className="font-bold text-green-600">
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
                    <TableCell className="font-bold text-blue-600">
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
  )
}