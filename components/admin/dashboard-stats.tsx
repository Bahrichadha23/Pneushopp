import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Package, Users, AlertTriangle, Star, Plus, Shield, Clock, CheckCircle, XCircle } from "lucide-react"
import type { AdminStats } from "@/lib/services/admin"
import SalesChart from "./charts/sales-chart"
import TopProductsChart from "./charts/top-products-chart"
import TopClientsChart from "./charts/top-clients-chart"

interface DashboardStatsProps {
  stats: AdminStats
  analytics?: {
    stats_ventes: {
      ventes_jour: number
      ventes_hebdo: number
      ventes_mensuel: number
      commandes_jour: number
      commandes_hebdo: number
      commandes_mensuel: number
      clients_actifs: number
      produits_vendus: number
    }
    ventes_par_mois: Array<{
      mois: string
      ventes: number
      commandes: number
    }>
    ventes_par_semaine: Array<{
      semaine: string
      ventes: number
      commandes: number
    }>
    top_produits: Array<{
      nom: string
      ventes: number
      chiffre: number
    }>
    top_clients: Array<{
      nom: string
      commandes: number
      total: number
    }>
  }
}

export default function DashboardStatsComponent({ stats, analytics }: DashboardStatsProps) {
  if (!stats) return null

  const getBrandName = (brand: any): string => {
    if (!brand) return ''
    if (typeof brand === 'string') return brand
    if (typeof brand === 'object' && brand.name) return brand.name
    return String(brand)
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount) + " DT"
  }

  return (
    <div className="space-y-6">
      {/* Charts Section - Sales Trends */}
      {analytics && (
        <>
          {analytics.ventes_par_semaine && analytics.ventes_par_semaine.length > 0 && (
            <SalesChart 
              data={analytics.ventes_par_semaine.map(item => ({
                mois: item.semaine,
                ventes: item.ventes,
                commandes: item.commandes
              }))} 
              title="Ventes hebdomadaires (8 dernières semaines)"
            />
          )}
          {analytics.ventes_par_mois && analytics.ventes_par_mois.length > 0 && (
            <SalesChart 
              data={analytics.ventes_par_mois} 
              title="Ventes mensuelles (6 derniers mois)"
            />
          )}
        </>
      )}

      {/* Charts Section - Top Products and Clients */}
      {analytics && (analytics.top_produits?.length > 0 || analytics.top_clients?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analytics.top_produits && analytics.top_produits.length > 0 && (
            <TopProductsChart data={analytics.top_produits} />
          )}
          {analytics.top_clients && analytics.top_clients.length > 0 && (
            <TopClientsChart data={analytics.top_clients} />
          )}
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_products} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Total des clients enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.low_stock_products}</div>
            <p className="text-xs text-muted-foreground">
              Produits nécessitant un réapprovisionnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits vedettes</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.featured_products}</div>
            <p className="text-xs text-muted-foreground">
              Produits mis en avant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produits par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.products_by_category || []).map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary">{category.product_count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock élevé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.top_stock_products || []).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getBrandName(product.brand)} {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {product.stock} unités
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes stock faible */}
      {(stats.low_stock_details || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Produits à réapprovisionner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(stats.low_stock_details || []).map((product) => (
                <div key={product.id} className="p-3 border rounded-lg bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{getBrandName(product.brand)}</h4>
                    <Badge variant="destructive" className="text-xs">
                      {product.stock} restant
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{product.name}</p>
                  <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques des prix */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des prix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Prix moyen</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.price_stats?.avg_price || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Prix minimum</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.price_stats?.min_price || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Prix maximum</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(stats.price_stats?.max_price || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SAV — Service Après Vente */}
      {stats.sav_stats && (() => {
        const sav = stats.sav_stats!;
        const resolutionRate = sav.total > 0 ? Math.round((sav.resolved / sav.total) * 100) : 0;
        const segments = [
          { label: "En attente",    value: sav.pending,    color: "bg-amber-400",   pct: sav.total > 0 ? (sav.pending    / sav.total) * 100 : 0 },
          { label: "En traitement", value: sav.processing, color: "bg-blue-400",    pct: sav.total > 0 ? (sav.processing / sav.total) * 100 : 0 },
          { label: "Résolus",       value: sav.resolved,   color: "bg-emerald-500", pct: sav.total > 0 ? (sav.resolved   / sav.total) * 100 : 0 },
          { label: "Rejetés",       value: sav.rejected,   color: "bg-red-400",     pct: sav.total > 0 ? (sav.rejected   / sav.total) * 100 : 0 },
        ];
        return (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                  <Shield className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Service Après Vente</p>
                  <p className="text-xs text-gray-400">Suivi des réclamations clients</p>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <p className="text-[11px] text-gray-400 mb-0.5">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{sav.total}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                  <p className="text-[11px] text-emerald-600 font-medium mb-0.5">Résolution</p>
                  <p className="text-2xl font-bold text-emerald-700">{resolutionRate}<span className="text-base">%</span></p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <p className="text-[11px] text-amber-600 font-medium mb-0.5">En cours</p>
                  <p className="text-2xl font-bold text-amber-700">{sav.pending + sav.processing}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                {segments.map((s) => s.pct > 0 && (
                  <div key={s.label} className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.color}`} />
                      <span className="text-xs text-gray-500">{s.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  )
}
