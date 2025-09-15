"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

// Mock data pour demo académique
const mockPendingOrders = [
  {
    id: "CMD-2024-001",
    client: "Ahmed Ben Ali",
    email: "ahmed@email.com",
    total: 450.00,
    items: 3,
    date: "2024-09-14",
    urgence: "normale"
  },
  {
    id: "CMD-2024-002", 
    client: "Fatima Trabelsi",
    email: "fatima@email.com",
    total: 680.00,
    items: 2,
    date: "2024-09-14",
    urgence: "haute"
  },
  {
    id: "CMD-2024-003",
    client: "Mohamed Gharbi",
    email: "mohamed@email.com", 
    total: 320.00,
    items: 4,
    date: "2024-09-13",
    urgence: "normale"
  }
]

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState(mockPendingOrders)
  const [searchTerm, setSearchTerm] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount)
  }

  const handleApprove = (orderId: string) => {
    alert(`Commande ${orderId} approuvée (demo)`)
  }

  const handleReject = (orderId: string) => {
    alert(`Commande ${orderId} rejetée (demo)`)
  }

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes en attente</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredOrders.length} commandes
        </Badge>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total en attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Haute priorité</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.urgence === "haute").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <span className="h-4 w-4 text-green-500">€</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par ID ou nom client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes à traiter</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.client}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>{order.items} articles</TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge variant={order.urgence === "haute" ? "destructive" : "secondary"}>
                      {order.urgence}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApprove(order.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReject(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
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