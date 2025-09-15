"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Search, Mail, Phone, Star, Package } from "lucide-react"

// Mock data pour demo académique
const mockFournisseurs = [
  {
    id: 1,
    nom: "Michelin Tunisie",
    contact: "Mohamed Khaled",
    email: "contact@michelin.tn",
    telephone: "+216 71 123 456",
    adresse: "Zone Industrielle, Ben Arous",
    specialites: ["Pneus voiture", "Pneus camion"],
    evaluation: 5,
    commandes: 24,
    delaiLivraison: "3-5 jours",
    statut: "actif"
  },
  {
    id: 2,
    nom: "Continental Distribution",
    contact: "Sarah Ben Ahmed", 
    email: "orders@continental-tn.com",
    telephone: "+216 70 987 654",
    adresse: "Route de Sousse, Tunis",
    specialites: ["Pneus été", "Pneus hiver"],
    evaluation: 4,
    commandes: 18,
    delaiLivraison: "2-4 jours",
    statut: "actif"
  },
  {
    id: 3,
    nom: "Pirelli Maghreb",
    contact: "Ahmed Mansouri",
    email: "info@pirelli.com.tn", 
    telephone: "+216 98 456 789",
    adresse: "Boulevard du 14 Janvier, Sfax",
    specialites: ["Pneus sport", "Pneus haut de gamme"],
    evaluation: 5,
    commandes: 12,
    delaiLivraison: "5-7 jours",
    statut: "actif"
  }
]

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState(mockFournisseurs)
  const [searchTerm, setSearchTerm] = useState("")

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fournisseur.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCommandes = fournisseurs.reduce((sum, f) => sum + f.commandes, 0)
  const moyenneEvaluation = fournisseurs.reduce((sum, f) => sum + f.evaluation, 0) / fournisseurs.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des fournisseurs</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredFournisseurs.length} fournisseurs
        </Badge>
      </div>

      {/* Stats fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs actifs</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fournisseurs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCommandes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Évaluation moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {moyenneEvaluation.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3-5 jours</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table des fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead>Spécialités</TableHead>
                <TableHead>Évaluation</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Délai livraison</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFournisseurs.map((fournisseur) => (
                <TableRow key={fournisseur.id}>
                  <TableCell className="font-medium">{fournisseur.nom}</TableCell>
                  <TableCell>{fournisseur.contact}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {fournisseur.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {fournisseur.telephone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {fournisseur.specialites.map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {renderStars(fournisseur.evaluation)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{fournisseur.commandes}</Badge>
                  </TableCell>
                  <TableCell>{fournisseur.delaiLivraison}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Commander
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}