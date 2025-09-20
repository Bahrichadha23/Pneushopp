"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, AlertTriangle, TrendingUp, Plus, Minus } from "lucide-react"

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

  const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(amount)

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "critique", color: "bg-red-500" }
    if (current <= min * 1.5) return { status: "faible", color: "bg-orange-500" }
    if (current >= max * 0.9) return { status: "élevé", color: "bg-blue-500" }
    return { status: "normal", color: "bg-green-500" }
  }

  const updateStock = (id: number, change: number) => {
    setStock(prev => prev.map(item => item.id === id ? { ...item, stock: Math.max(0, item.stock + change) } : item))
  }

  const filteredStock = stock.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.size.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = stock.filter(item => item.stock <= item.stockMin)
  const totalValue = stock.reduce((sum, item) => sum + (item.stock * item.prixAchat), 0)

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <Badge variant="secondary" className="text-sm">{filteredStock.length} produits</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stock.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Unités totales</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stock.reduce((sum, item) => sum + item.stock, 0)}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher un produit..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Responsive table or cards */}
      <div className="space-y-4">
        {filteredStock.length === 0 && <p>Aucun produit trouvé</p>}

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Produit</th>
                  <th className="px-2 py-1 text-left">Marque</th>
                  <th className="px-2 py-1 text-left">Taille</th>
                  <th className="px-2 py-1 text-left">Catégorie</th>
                  <th className="px-2 py-1 text-center">Stock</th>
                  <th className="px-2 py-1 text-left">Statut</th>
                  <th className="px-2 py-1">Min/Max</th>
                  <th className="px-2 py-1">Prix achat</th>
                  <th className="px-2 py-1">Prix vente</th>
                  <th className="px-2 py-1">Emplacement</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map(item => {
                  const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax)
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1 font-medium">{item.name}</td>
                      <td className="px-2 py-1">{item.brand}</td>
                      <td className="px-2 py-1">{item.size}</td>
                      <td className="px-2 py-1">{item.category}</td>
                      <td className="px-2 py-1 text-center font-bold">{item.stock}</td>
                      <td className="px-2 py-1"><Badge className={stockStatus.color}>{stockStatus.status}</Badge></td>
                      <td className="px-2 py-1">{item.stockMin} / {item.stockMax}</td>
                      <td className="px-2 py-1">{formatCurrency(item.prixAchat)}</td>
                      <td className="px-2 py-1">{formatCurrency(item.prixVente)}</td>
                      <td className="px-2 py-1">{item.emplacement}</td>
                      <td className="px-2 py-1">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => updateStock(item.id, -1)} disabled={item.stock <= 0}><Minus className="h-3 w-3"/></Button>
                          <Button size="sm" variant="outline" onClick={() => updateStock(item.id, 1)}><Plus className="h-3 w-3"/></Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredStock.map(item => {
            const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax)
            return (
              <Card key={item.id}>
                <CardContent className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{item.brand} {item.name}</p>
                    <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Taille: {item.size} | Catégorie: {item.category}</p>
                  <p className="text-sm text-gray-600">Stock: {item.stock} / {item.stockMin} - {item.stockMax}</p>
                  <p className="text-sm text-gray-600">Prix achat: {formatCurrency(item.prixAchat)} | Prix vente: {formatCurrency(item.prixVente)}</p>
                  <p className="text-sm text-gray-600">Emplacement: {item.emplacement}</p>
                  <div className="flex space-x-2 mt-1">
                    <Button size="sm" variant="outline" onClick={() => updateStock(item.id, -1)} disabled={item.stock <= 0}><Minus className="h-3 w-3"/></Button>
                    <Button size="sm" variant="outline" onClick={() => updateStock(item.id, 1)}><Plus className="h-3 w-3"/></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
