export const dynamicParams = true; // allow unknown params
export const dynamic = "force-dynamic";

// ✅ Added only this small function at the top (no other changes)
// export async function generateStaticParams() {
//   // This lets Next.js build at least one dummy page during static export
//   // You can add more sample IDs if needed
//   return [{ orderId: "sample-order" }];
// }
// Page de confirmation de commande avec détails et suivi
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react";
import { API_URL } from "@/lib/config";

async function getOrder(orderId: string) {
  try {
    // First try to get from backend API
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (token && !orderId.startsWith("ORD-")) {
      // This looks like a backend order ID (numeric)
      const res = await fetch(`${API_URL}/orders/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const o = await res.json();
        console.log("✅ Found backend order:", o);

        return {
          id: o.id,
          status: o.status,
          createdAt: new Date(o.created_at),
          items: o.items.map((item: any) => ({
            product: {
              name: item.product_name || item.product?.name,
              price: parseFloat(item.unit_price || item.price),
            },
            quantity: item.quantity,
          })),
          shippingAddress: {
            firstName: o.shipping_address.first_name,
            lastName: o.shipping_address.last_name,
            address: o.shipping_address.address,
            city: o.shipping_address.city,
            postalCode: o.shipping_address.postal_code,
          },
          total: parseFloat(o.total_amount),
          trackingNumber: o.tracking_number || `TRK-${o.id}`,
        };
      }
    }

    // Fallback to localStorage for local orders
    console.log("⚠️ Checking localStorage for order:", orderId);
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("pneushop-orders");
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const localOrder = orders.find((order: any) => order.id === orderId);

        if (localOrder) {
          console.log("✅ Found localStorage order:", localOrder);
          return {
            id: localOrder.id,
            status: localOrder.status,
            createdAt: new Date(localOrder.createdAt),
            items: localOrder.items,
            shippingAddress: localOrder.shippingAddress,
            total: localOrder.total,
            trackingNumber: `TRK-LOCAL-${localOrder.id.slice(-6)}`,
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await getOrder(params.orderId);

  // if (!order) {
  //   notFound();
  // }
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Commande confirmée !
        </h1>
        <p className="text-gray-600">
          Votre commande a été créée avec succès, mais les détails ne sont pas
          disponibles pour le moment.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/boutique">Continuer vos achats</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Vous recevrez un email de confirmation
            sous peu.
          </p>
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
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
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
              {order.items.map(
                (
                  item: {
                    product: { name: string; price: number };
                    quantity: number;
                  },
                  index: number
                ) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>
                      {(item.product.price * item.quantity).toFixed(2)} DT
                    </span>
                  </div>
                )
              )}

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
  );
}
