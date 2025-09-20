"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, Search, MapPin, Package } from "lucide-react"

// Mock data
const mockDeliveries = [
  {
    id: "LIV-2024-001",
    commande: "CMD-2024-005",
    client: "Salon Auto Tunis",
    adresse: "Avenue Habib Bourguiba, Tunis",
    transporteur: "Rapid Delivery",
    statut: "en_route",
    dateExpedition: "2024-09-13",
    dateLivraison: "2024-09-15",
    colis: 2
  },
  {
    id: "LIV-2024-002", 
    commande: "CMD-2024-006",
    client: "Garage Central Sfax",
    adresse: "Route de Tunis, Sfax",
    transporteur: "Tunisia Express",
    statut: "livre",
    dateExpedition: "2024-09-12",
    dateLivraison: "2024-09-14",
    colis: 1
  },
  {
    id: "LIV-2024-003",
    commande: "CMD-2024-007",
    client: "Auto Service Sousse", 
    adresse: "Zone Industrielle, Sousse",
    transporteur: "Rapid Delivery",
    statut: "prepare",
    dateExpedition: "2024-09-14",
    dateLivraison: "2024-09-16",
    colis: 3
  }
]

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState(mockDeliveries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "prepare":
        return <Badge variant="secondary">En préparation</Badge>
      case "en_route": 
        return <Badge className="bg-blue-500 text-white">En route</Badge>
      case "livre":
        return <Badge className="bg-green-500 text-white">Livré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.commande.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "tous" || delivery.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredDeliveries.length} livraisons
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher livraison..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <select 
          className="rounded border border-gray-300 px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="tous">Tous les statuts</option>
          <option value="prepare">En préparation</option>
          <option value="en_route">En route</option>
          <option value="livre">Livré</option>
        </select>
      </div>

      {/* Mobile: Stacked cards */}
      <div className="grid gap-4 md:hidden">
        {filteredDeliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardHeader>
              <CardTitle className="text-lg">{delivery.client}</CardTitle>
              <p className="text-sm text-gray-500">{delivery.id} • {delivery.commande}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Adresse:</span> {delivery.adresse}</p>
              <p><span className="font-semibold">Transporteur:</span> {delivery.transporteur}</p>
              <p><span className="font-semibold">Statut:</span> {getStatusBadge(delivery.statut)}</p>
              <p><span className="font-semibold">Expédition:</span> {delivery.dateExpedition}</p>
              <p><span className="font-semibold">Livraison:</span> {delivery.dateLivraison}</p>
              <p><span className="font-semibold">Colis:</span> {delivery.colis}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table view */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Liste des livraisons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Livraison</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expédition</TableHead>
                <TableHead>Livraison prévue</TableHead>
                <TableHead>Colis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>{delivery.commande}</TableCell>
                  <TableCell>{delivery.client}</TableCell>
                  <TableCell className="max-w-xs truncate">{delivery.adresse}</TableCell>
                  <TableCell>{delivery.transporteur}</TableCell>
                  <TableCell>{getStatusBadge(delivery.statut)}</TableCell>
                  <TableCell>{delivery.dateExpedition}</TableCell>
                  <TableCell>{delivery.dateLivraison}</TableCell>
                  <TableCell>{delivery.colis} colis</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
