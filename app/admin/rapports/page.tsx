"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, LineChart, TrendingUp, DollarSign, Package, Users, Calendar } from "lucide-react"

// Mock data pour demo académique
const mockStatsVentes = {
  ventesJour: 2850,
  ventesHebdo: 18500,
  ventesMensuel: 78000,
  commandesJour: 12,
  commandesHebdo: 85,
  commandesMensuel: 340,
  clientsActifs: 156,
  produitsVendus: 245
}

const mockVentesParMois = [
  { mois: "Jan", ventes: 65000, commandes: 280 },
  { mois: "Fév", ventes: 72000, commandes: 310 },
  { mois: "Mar", ventes: 68000, commandes: 295 },
  { mois: "Avr", ventes: 78000, commandes: 340 },
  { mois: "Mai", ventes: 85000, commandes: 365 },
  { mois: "Juin", ventes: 92000, commandes: 390 }
]

const mockTopProduits = [
  { nom: "Michelin Energy Saver 195/65R15", ventes: 45, chiffre: 3825 },
  { nom: "Continental EcoContact 205/55R16", ventes: 38, chiffre: 3610 },
  { nom: "Pirelli P Zero 245/40R18", ventes: 25, chiffre: 4500 },
  { nom: "Bridgestone Turanza T005 225/50R17", ventes: 32, chiffre: 4160 },
  { nom: "Goodyear EfficientGrip 205/60R16", ventes: 28, chiffre: 2520 }
]

const mockClientsTop = [
  { nom: "Garage Central", commandes: 15, total: 12500 },
  { nom: "Auto Service Plus", commandes: 12, total: 9800 },
  { nom: "Mécanik Express", commandes: 8, total: 7200 },
  { nom: "Station Shell Menzah", commandes: 10, total: 8500 },
  { nom: "Garage Moderne", commandes: 6, total: 5400 }
]

export default function RapportsPage() {
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState("mois")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
        <div className="flex space-x-2">
          <Button variant={periodeSelectionnee === "jour" ? "default" : "outline"} 
                  onClick={() => setPeriodeSelectionnee("jour")}>
            Jour
          </Button>
          <Button variant={periodeSelectionnee === "semaine" ? "default" : "outline"}
                  onClick={() => setPeriodeSelectionnee("semaine")}>
            Semaine
          </Button>
          <Button variant={periodeSelectionnee === "mois" ? "default" : "outline"}
                  onClick={() => setPeriodeSelectionnee("mois")}>
            Mois
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes du mois</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockStatsVentes.ventesMensuel.toLocaleString()} DT
            </div>
            <p className="text-xs text-green-600 mt-1">+12% vs mois précédent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockStatsVentes.commandesMensuel}
            </div>
            <p className="text-xs text-blue-600 mt-1">+8% vs mois précédent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockStatsVentes.clientsActifs}
            </div>
            <p className="text-xs text-purple-600 mt-1">+15% vs mois précédent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(mockStatsVentes.ventesMensuel / mockStatsVentes.commandesMensuel)} DT
            </div>
            <p className="text-xs text-orange-600 mt-1">+3% vs mois précédent</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Évolution des ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVentesParMois.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.mois}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(data.ventes / 100000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-20 text-right">
                      {data.ventes.toLocaleString()} DT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2" />
              Évolution des commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVentesParMois.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.mois}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(data.commandes / 400) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {data.commandes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top produits et clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top produits vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>CA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopProduits.map((produit, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{produit.nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{produit.ventes}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {produit.chiffre.toLocaleString()} DT
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClientsTop.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{client.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.commandes}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-blue-600">
                      {client.total.toLocaleString()} DT
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