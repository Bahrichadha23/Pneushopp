import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Package, Users, AlertTriangle, Star, Plus } from "lucide-react"
import type { AdminStats } from "@/lib/services/admin"

interface DashboardStatsProps {
  stats: AdminStats
}

export default function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 2,
    }).format(numAmount)
  }

  return (
    <div className="space-y-6">
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
              {stats.products_by_category.map((category) => (
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
              {stats.top_stock_products.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.brand} {product.name}
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
      {stats.low_stock_details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Produits à réapprovisionner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.low_stock_details.map((product) => (
                <div key={product.id} className="p-3 border rounded-lg bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{product.brand}</h4>
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
                {formatCurrency(stats.price_stats.avg_price || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Prix minimum</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.price_stats.min_price || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Prix maximum</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(stats.price_stats.max_price || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
