"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Mail, Phone, MapPin, Star } from "lucide-react"

// Mock data
const mockClients = [
  {
    id: 1,
    nom: "Ahmed Ben Ali",
    email: "ahmed@garage-tunis.tn",
    telephone: "+216 98 123 456",
    adresse: "Avenue Habib Bourguiba, Tunis",
    type: "professionnel",
    dateInscription: "2024-01-15",
    derniereCommande: "2024-09-10",
    totalCommandes: 12,
    montantTotal: 2450.0,
    statut: "actif",
  },
  {
    id: 2,
    nom: "Fatima Trabelsi",
    email: "fatima.trabelsi@email.com",
    telephone: "+216 22 987 654",
    adresse: "Rue de la République, Sfax",
    type: "particulier",
    dateInscription: "2024-03-22",
    derniereCommande: "2024-09-08",
    totalCommandes: 5,
    montantTotal: 850.0,
    statut: "actif",
  },
  {
    id: 3,
    nom: "Garage Central SARL",
    email: "contact@garage-central.tn",
    telephone: "+216 71 456 789",
    adresse: "Zone Industrielle, Sousse",
    type: "professionnel",
    dateInscription: "2023-11-10",
    derniereCommande: "2024-08-15",
    totalCommandes: 28,
    montantTotal: 8750.0,
    statut: "actif",
  },
]

export default function ClientsPage() {
  const [clients] = useState(mockClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("tous")

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(amount)

  const getClientTypeBadge = (type: string) =>
    type === "professionnel" ? <Badge className="bg-blue-500">Professionnel</Badge> : <Badge variant="secondary">Particulier</Badge>

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "tous" || client.type === typeFilter
    return matchesSearch && matchesType
  })

  const professionnels = clients.filter((c) => c.type === "professionnel").length
  const particuliers = clients.filter((c) => c.type === "particulier").length
  const totalCA = clients.reduce((sum, client) => sum + client.montantTotal, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
        <Badge variant="secondary" className="text-sm">{filteredClients.length} clients</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Professionnels</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{professionnels}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{particuliers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <span className="h-4 w-4 text-green-500">€</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCA)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          className="rounded border border-gray-300 px-3 py-2"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="tous">Tous les types</option>
          <option value="professionnel">Professionnels</option>
          <option value="particulier">Particuliers</option>
        </select>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{client.nom}</div>
              {getClientTypeBadge(client.type)}
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" /> {client.email}
              </div>
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" /> {client.telephone}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" /> <span className="truncate">{client.adresse}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Inscription: {client.dateInscription}</span>
                <span>Commandes: {client.totalCommandes}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>CA: {formatCurrency(client.montantTotal)}</span>
                <span>Dernière: {client.derniereCommande}</span>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button size="sm" variant="outline">Voir détails</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom/Entreprise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>CA Total</TableHead>
                  <TableHead>Dernière commande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.nom}</TableCell>
                    <TableCell>{getClientTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm space-y-1">
                        <div className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {client.email}</div>
                        <div className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {client.telephone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center text-sm"><MapPin className="h-3 w-3 mr-1" /> <span className="truncate">{client.adresse}</span></div>
                    </TableCell>
                    <TableCell>{client.dateInscription}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{client.totalCommandes}</Badge></TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(client.montantTotal)}</TableCell>
                    <TableCell>{client.derniereCommande}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">Voir détails</Button>
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
