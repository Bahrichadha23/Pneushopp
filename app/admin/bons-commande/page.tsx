"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Package, Truck, ShoppingCart, Check } from "lucide-react"

// Mock data
const mockBonsCommande = [
  {
    id: "BC001",
    fournisseur: "Michelin Tunisie",
    dateCommande: "2024-01-15",
    dateLivraisonPrevue: "2024-01-20",
    articles: [
      { nom: "Michelin Energy Saver 195/65R15", quantite: 50, prixUnitaire: 85 },
      { nom: "Michelin Pilot Sport 225/45R17", quantite: 30, prixUnitaire: 120 },
    ],
    totalHT: 7650,
    totalTTC: 9198,
    statut: "confirmé",
    priorite: "normale",
  },
  {
    id: "BC002",
    fournisseur: "Continental Distribution",
    dateCommande: "2024-01-16",
    dateLivraisonPrevue: "2024-01-19",
    articles: [
      { nom: "Continental EcoContact 205/55R16", quantite: 40, prixUnitaire: 95 },
      { nom: "Continental WinterContact 195/65R15", quantite: 25, prixUnitaire: 110 },
    ],
    totalHT: 6550,
    totalTTC: 7871,
    statut: "en_attente",
    priorite: "urgent",
  },
  {
    id: "BC003",
    fournisseur: "Pirelli Maghreb",
    dateCommande: "2024-01-17",
    dateLivraisonPrevue: "2024-01-24",
    articles: [
      { nom: "Pirelli P Zero 245/40R18", quantite: 20, prixUnitaire: 180 },
      { nom: "Pirelli Cinturato P7 225/50R17", quantite: 35, prixUnitaire: 140 },
    ],
    totalHT: 8500,
    totalTTC: 10200,
    statut: "livré",
    priorite: "normale",
  },
]

export default function BonsCommandePage() {
  const [bonsCommande] = useState(mockBonsCommande)
  const [searchTerm, setSearchTerm] = useState("")

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case "confirmé":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmé</Badge>
      case "livré":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Livré</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  const getPrioriteBadge = (priorite: string) => {
    return priorite === "urgent" ? 
      <Badge variant="destructive">Urgent</Badge> : 
      <Badge variant="outline">Normale</Badge>
  }

  const filteredBons = bonsCommande.filter(
    (bon) =>
      bon.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bon.fournisseur.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCommandes = bonsCommande.length
  const commandesEnAttente = bonsCommande.filter((b) => b.statut === "en_attente").length
  const commandesConfirmees = bonsCommande.filter((b) => b.statut === "confirmé").length
  const commandesLivrees = bonsCommande.filter((b) => b.statut === "livré").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Bons de commande</h1>
        <Button className="flex items-center">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommandes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{commandesEnAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <Check className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{commandesConfirmees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{commandesLivrees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <Input
          placeholder="Rechercher un bon de commande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredBons.map((bon) => (
          <Card key={bon.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{bon.id}</div>
              {getStatutBadge(bon.statut)}
            </div>
            <div className="text-sm space-y-1">
              <div><strong>Fournisseur:</strong> {bon.fournisseur}</div>
              <div><strong>Date commande:</strong> {new Date(bon.dateCommande).toLocaleDateString()}</div>
              <div><strong>Livraison prévue:</strong> {new Date(bon.dateLivraisonPrevue).toLocaleDateString()}</div>
              <div>
                <strong>Articles:</strong>
                {bon.articles.map((article, idx) => (
                  <div key={idx}>{article.quantite}x {article.nom}</div>
                ))}
              </div>
              <div><strong>Total TTC:</strong> {bon.totalTTC.toLocaleString()} DT</div>
              <div><strong>Priorité:</strong> {getPrioriteBadge(bon.priorite)}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline">Voir</Button>
              {bon.statut === "en_attente" && <Button size="sm" variant="default">Confirmer</Button>}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Liste des bons de commande</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Bon</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date commande</TableHead>
                  <TableHead>Livraison prévue</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total TTC</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBons.map((bon) => (
                  <TableRow key={bon.id}>
                    <TableCell className="font-medium">{bon.id}</TableCell>
                    <TableCell>{bon.fournisseur}</TableCell>
                    <TableCell>{new Date(bon.dateCommande).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(bon.dateLivraisonPrevue).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {bon.articles.map((article, idx) => (
                          <div key={idx} className="text-sm">{article.quantite}x {article.nom}</div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{bon.totalTTC.toLocaleString()} DT</TableCell>
                    <TableCell>{getPrioriteBadge(bon.priorite)}</TableCell>
                    <TableCell>{getStatutBadge(bon.statut)}</TableCell>
                    <TableCell className="space-x-2 flex flex-wrap">
                      <Button size="sm" variant="outline">Voir</Button>
                      {bon.statut === "en_attente" && <Button size="sm" variant="default">Confirmer</Button>}
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
