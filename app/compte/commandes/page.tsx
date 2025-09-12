"use client"
// Page de suivi des commandes utilisateur
import { useOrder } from "@/contexts/order-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Truck, CheckCircle, Clock, X } from "lucide-react"

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: X,
}

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  const { getAllOrders } = useOrder()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Connexion requise</h1>
        <p className="text-gray-600 mb-8">Vous devez être connecté pour voir vos commandes.</p>
        <Button asChild>
          <Link href="/auth/login">Se connecter</Link>
        </Button>
      </div>
    )
  }

  const orders = getAllOrders().filter((order) => order.userId === user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes commandes</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Aucune commande</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande.</p>
            <Button asChild>
              <Link href="/boutique">Découvrir nos produits</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const StatusIcon = statusIcons[order.status]
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Commande #{order.id}</CardTitle>
                      <p className="text-sm text-gray-600">Passée le {order.createdAt.toLocaleDateString("fr-FR")}</p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Articles commandés */}
                    <div>
                      <h4 className="font-semibold mb-2">Articles:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.product.name} x {item.quantity}
                            </span>
                            <span>{(item.product.price * item.quantity).toFixed(2)} DT</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adresse de livraison */}
                    <div>
                      <h4 className="font-semibold mb-2">Livraison:</h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        <br />
                        {order.shippingAddress.address}
                        <br />
                        {order.shippingAddress.postalCode} {order.shippingAddress.city}
                      </p>
                    </div>

                    {/* Numéro de suivi */}
                    {order.trackingNumber && (
                      <div>
                        <h4 className="font-semibold mb-2">Suivi:</h4>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">{order.trackingNumber}</p>
                      </div>
                    )}

                    {/* Total et actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <span className="font-semibold text-lg">Total: {order.total.toFixed(2)} DT</span>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/commande/confirmation/${order.id}`}>Voir détails</Link>
                        </Button>
                        {order.status === "delivered" && (
                          <Button size="sm" asChild>
                            <Link href="/boutique">Commander à nouveau</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
