"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types/order";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    fetchPendingOrders().then(setOrders);
  }, []);

  async function fetchPendingOrders() {
    const token = localStorage.getItem("access_token"); // 👈 store this on login

    const res = await fetch(`${API_URL}/orders/?status=pending`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 add token here
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    // map backend data to frontend Order type
    return data.map((o: any) => ({
      id: o.id,
      client: o.shippingAddress.firstName + " " + o.shippingAddress.lastName,
      email: o.shippingAddress.email || "",
      total: o.total,
      items: o.items.length,
      date: new Date(o.createdAt).toLocaleDateString("fr-FR"),
      urgence: o.urgence || "normale",
    }));
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount);
  };

  const handleApprove = (orderId: string) => {
    alert(`Commande ${orderId} approuvée (demo)`);
  };

  const handleReject = (orderId: string) => {
    alert(`Commande ${orderId} rejetée (demo)`);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Commandes en attente
        </h1>
        <Badge variant="secondary" className="text-sm">
          {filteredOrders.length} commandes
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total en attente
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Haute priorité
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders.filter((o) => o.urgence === "haute").length}
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
              {formatCurrency(
                orders.reduce((sum, order) => sum + order.total, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par ID ou nom client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{order.id}</span>
                <Badge
                  variant={
                    order.urgence === "haute" ? "destructive" : "secondary"
                  }
                >
                  {order.urgence}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">{order.client}</p>
                <p className="text-xs text-gray-500 truncate">{order.email}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>{order.items.length} articles</span>
                <span className="font-medium">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{order.date}</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(order.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(order.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view: Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Commandes à traiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[800px]">
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
                    <TableCell className="truncate max-w-[150px]">
                      {order.email}
                    </TableCell>
                    <TableCell>{order.items.length} articles</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.urgence === "haute"
                            ? "destructive"
                            : "secondary"
                        }
                      >
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
