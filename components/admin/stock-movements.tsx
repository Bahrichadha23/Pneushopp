"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, RotateCcw, Search } from "lucide-react"
import type { StockMovement } from "@/types/admin"

interface StockMovementsProps {
  movements: StockMovement[]
  onAddMovement: (movement: Omit<StockMovement, "id" | "createdAt">) => void
}

export default function StockMovements({ movements, onAddMovement }: StockMovementsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMovement, setNewMovement] = useState({
    productId: "",
    productName: "",
    type: "in" as StockMovement["type"],
    quantity: 0,
    reason: "",
    reference: "",
  })

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)

  const getMovementIcon = (type: StockMovement["type"]) => {
    switch (type) {
      case "in": return <TrendingUp className="h-4 w-4 text-green-500" />
      case "out": return <TrendingDown className="h-4 w-4 text-red-500" />
      case "adjustment": return <RotateCcw className="h-4 w-4 text-blue-500" />
    }
  }

  const getMovementLabel = (type: StockMovement["type"]) => {
    switch (type) {
      case "in": return "Entrée"
      case "out": return "Sortie"
      case "adjustment": return "Ajustement"
    }
  }

  const getMovementVariant = (type: StockMovement["type"]) => {
    switch (type) {
      case "in": return "default" as const
      case "out": return "destructive" as const
      case "adjustment": return "secondary" as const
    }
  }

  const filteredMovements = movements.filter((m) =>
    (m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === "all" || m.type === typeFilter)
  )

  const handleSubmitMovement = () => {
    if (newMovement.productName && newMovement.quantity > 0 && newMovement.reason) {
      onAddMovement({ ...newMovement, createdBy: "Admin" })
      setNewMovement({ productId: "", productName: "", type: "in", quantity: 0, reason: "", reference: "" })
      setShowAddForm(false)
    }
  }

  const totalIn = movements.filter(m => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = movements.filter(m => m.type === "out").reduce((sum, m) => sum + m.quantity, 0)
  const totalAdjustments = movements.filter(m => m.type === "adjustment").length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Entrées totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIn}</div>
            <p className="text-xs text-muted-foreground">Unités ajoutées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Sorties totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOut}</div>
            <p className="text-xs text-muted-foreground">Unités sorties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Ajustements</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalAdjustments}</div>
            <p className="text-xs text-muted-foreground">Corrections</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par produit ou raison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type de mouvement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="in">Entrées</SelectItem>
              <SelectItem value="out">Sorties</SelectItem>
              <SelectItem value="adjustment">Ajustements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
          Nouveau mouvement
        </Button>
      </div>

      {/* Add movement form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un mouvement de stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                value={newMovement.productName}
                onChange={(e) => setNewMovement(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Nom du produit"
              />
              <Select value={newMovement.type} onValueChange={(v) => setNewMovement(prev => ({ ...prev, type: v as StockMovement["type"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrée</SelectItem>
                  <SelectItem value="out">Sortie</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={newMovement.quantity || ""}
                onChange={(e) => setNewMovement(prev => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                placeholder="Quantité"
                min={1}
              />
              <Input
                value={newMovement.reference}
                onChange={(e) => setNewMovement(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Référence (optionnel)"
              />
            </div>
            <Input
              value={newMovement.reason}
              onChange={(e) => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Raison du mouvement"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button onClick={handleSubmitMovement} className="bg-yellow-500 hover:bg-yellow-600 text-black">Ajouter</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsive Movements list */}
      <div className="space-y-4">
        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {filteredMovements.map(m => (
            <Card key={m.id} className="p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">{formatDate(m.createdAt)}</span>
                <Badge variant={getMovementVariant(m.type)} className="flex items-center gap-1">
                  {getMovementIcon(m.type)}
                  {getMovementLabel(m.type)}
                </Badge>
              </div>
              <div className="font-medium">{m.productName}</div>
              <div className="text-sm text-gray-700">{m.reason}</div>
              <div className="text-sm text-gray-500 flex justify-between mt-1">
                <span>{m.reference || "-"}</span>
                <span>{m.createdBy}</span>
              </div>
              <div className={`text-right font-bold ${m.type === "in" ? "text-green-600" : m.type === "out" ? "text-red-600" : "text-blue-600"}`}>
                {m.type === "in" ? "+" : m.type === "out" ? "-" : "±"}{m.quantity}
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{formatDate(m.createdAt)}</TableCell>
                      <TableCell className="font-medium">{m.productName}</TableCell>
                      <TableCell>
                        <Badge variant={getMovementVariant(m.type)} className="flex items-center gap-1">
                          {getMovementIcon(m.type)}
                          {getMovementLabel(m.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={m.type === "in" ? "text-green-600" : m.type === "out" ? "text-red-600" : "text-blue-600"}>
                        {m.type === "in" ? "+" : m.type === "out" ? "-" : "±"}{m.quantity}
                      </TableCell>
                      <TableCell>{m.reason}</TableCell>
                      <TableCell>{m.reference || "-"}</TableCell>
                      <TableCell>{m.createdBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredMovements.length === 0 && <div className="text-center py-8 text-gray-500">Aucun mouvement trouvé.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
