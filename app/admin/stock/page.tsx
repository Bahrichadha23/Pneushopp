"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react"

// Mock data basé sur nos vrais produits pour cohérence
const mockStockData = [
  {
    id: 1,
    name: "P Zero",
    brand: "Pirelli", 
    size: "225/45R17",
    category: "Pneus Voiture",
    stock: 25,
    stockMin: 10,
    stockMax: 50,
    prixAchat: 150.00,
    prixVente: 180.00,
    emplacement: "A1-B3"
  },
  {
    id: 2,
    name: "EcoContact 6",
    brand: "Continental",
    size: "205/55R16", 
    category: "Pneus Voiture",
    stock: 5,
    stockMin: 15,
    stockMax: 40,
    prixAchat: 120.00,
    prixVente: 145.00,
    emplacement: "A2-C1"
  },
  {
    id: 3,
    name: "CrossClimate 2",
    brand: "Michelin",
    size: "215/60R17",
    category: "Pneus Voiture", 
    stock: 35,
    stockMin: 20,
    stockMax: 60,
    prixAchat: 135.00,
    prixVente: 165.00,
    emplacement: "B1-A2"
  }
]

export default function StockManagementPage() {
  const [stock, setStock] = useState(mockStockData)
  const [searchTerm, setSearchTerm] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency", 
      currency: "TND",
    }).format(amount)
  }

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "critique", color: "bg-red-500" }
    if (current <= min * 1.5) return { status: "faible", color: "bg-orange-500" }
    if (current >= max * 0.9) return { status: "élevé", color: "bg-blue-500" }
    return { status: "normal", color: "bg-green-500" }
  }

  const updateStock = (id: number, change: number) => {
    setStock(prevStock => 
      prevStock.map(item => 
        item.id === id 
          ? { ...item, stock: Math.max(0, item.stock + change) }
          : item
      )
    )
  }

  const filteredStock = stock.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.size.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = stock.filter(item => item.stock <= item.stockMin)
  const totalValue = stock.reduce((sum, item) => sum + (item.stock * item.prixAchat), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredStock.length} produits
        </Badge>
      </div>

      {/* Stats du stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unités totales</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.reduce((sum, item) => sum + item.stock, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table du stock */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Prix achat</TableHead>
                <TableHead>Prix vente</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-center font-bold">{item.stock}</TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.stockMin} / {item.stockMax}</TableCell>
                    <TableCell>{formatCurrency(item.prixAchat)}</TableCell>
                    <TableCell>{formatCurrency(item.prixVente)}</TableCell>
                    <TableCell>{item.emplacement}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStock(item.id, -1)}
                          disabled={item.stock <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStock(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alertes stock faible */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Produits nécessitant un réapprovisionnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.brand} {item.name}</p>
                      <p className="text-sm text-gray-600">{item.size}</p>
                    </div>
                    <Badge variant="destructive">
                      {item.stock} / {item.stockMin}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}