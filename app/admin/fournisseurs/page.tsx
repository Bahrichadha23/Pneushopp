"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Search, Mail, Phone, Star, Package } from "lucide-react"

// Mock data
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
    statut: "actif",
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
    statut: "actif",
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
    statut: "actif",
  },
]

export default function FournisseursPage() {
  const [fournisseurs] = useState(mockFournisseurs)
  const [searchTerm, setSearchTerm] = useState("")

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  const filteredFournisseurs = fournisseurs.filter(
    (f) =>
      f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCommandes = fournisseurs.reduce((sum, f) => sum + f.commandes, 0)
  const moyenneEvaluation =
    fournisseurs.reduce((sum, f) => sum + f.evaluation, 0) / fournisseurs.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des fournisseurs</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredFournisseurs.length} fournisseurs
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Fournisseurs actifs</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fournisseurs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCommandes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
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
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3-5 jours</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredFournisseurs.map((f) => (
          <Card key={f.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{f.nom}</div>
              <Badge variant={f.statut === "actif" ? "default" : "destructive"}>{f.statut}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" /> {f.email}
              </div>
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" /> {f.telephone}
              </div>
              <div className="flex items-center">
                <Package className="h-3 w-3 mr-1" /> {f.delaiLivraison}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {f.specialites.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="flex mt-1">{renderStars(f.evaluation)}</div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button size="sm" variant="outline">
                Commander
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
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
                {filteredFournisseurs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nom}</TableCell>
                    <TableCell>{f.contact}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-sm">
                        <div className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {f.email}</div>
                        <div className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {f.telephone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.specialites.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">{renderStars(f.evaluation)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{f.commandes}</Badge>
                    </TableCell>
                    <TableCell>{f.delaiLivraison}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">Commander</Button>
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
