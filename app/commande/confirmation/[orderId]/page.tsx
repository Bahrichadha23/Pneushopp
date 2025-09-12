// Page de confirmation de commande avec détails et suivi
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react"

// Simulation de récupération de commande (à remplacer par API)
async function getOrder(orderId: string) {
  // Simulation d'une commande
  return {
    id: orderId,
    status: "confirmed",
    createdAt: new Date(),
    items: [{ product: { name: "Pneu Michelin 225/45R17", price: 120 }, quantity: 4 }],
    shippingAddress: {
      firstName: "Ahmed",
      lastName: "Ben Ali",
      address: "123 Avenue Habib Bourguiba",
      city: "Tunis",
      postalCode: "1000",
    },
    total: 480,
    trackingNumber: "TN" + Math.random().toString(36).substr(2, 9).toUpperCase(),
  }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string }
}) {
  const order = await getOrder(params.orderId)

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">Commande confirmée !</h1>
          <p className="text-gray-600">Merci pour votre commande. Vous recevrez un email de confirmation sous peu.</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-semibold">Numéro de commande:</span>
                <span>{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{order.createdAt.toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Statut:</span>
                <span className="text-green-600 font-semibold">Confirmée</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Numéro de suivi:</span>
                <span className="font-mono">{order.trackingNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-semibold">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Résumé de la commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>{(item.product.price * item.quantity).toFixed(2)} DT</span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{order.total.toFixed(2)} DT</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Vous recevrez un email de confirmation avec tous les détails de votre commande. La livraison se fera sous
            24-72h selon votre région.
          </p>

          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/boutique">Continuer vos achats</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/compte/commandes">Mes commandes</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
