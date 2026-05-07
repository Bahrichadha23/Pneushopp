"use client";

// Page de confirmation de commande — Client Component (required for localStorage/token access)
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Package, Truck, CreditCard, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";

interface OrderDetail {
  id: string | number;
  orderNumber?: string;
  status: string;
  createdAt: Date;
  items: { product: { name: string; price: number }; quantity: number }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
  };
  total: number;
  trackingNumber?: string;
}

async function fetchOrderFromBackend(
  orderId: string,
  token: string
): Promise<OrderDetail | null> {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const o = await res.json();
    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      createdAt: new Date(o.created_at),
      items: (o.items || []).map((item: any) => ({
        product: {
          name: item.product_name || item.product?.name || "Produit",
          price: parseFloat(item.unit_price || item.price || 0),
        },
        quantity: item.quantity,
      })),
      shippingAddress: {
        firstName: o.shipping_address?.first_name || "",
        lastName: o.shipping_address?.last_name || "",
        address: o.shipping_address?.address || "",
        city: o.shipping_address?.city || "",
        postalCode: o.shipping_address?.postal_code || "",
      },
      total: parseFloat(o.total_amount),
      trackingNumber: o.tracking_number || undefined,
    };
  } catch {
    return null;
  }
}

function getOrderFromLocalStorage(orderId: string): OrderDetail | null {
  try {
    const savedOrders = localStorage.getItem("pneushop-orders");
    if (!savedOrders) return null;
    const orders = JSON.parse(savedOrders);
    const localOrder = orders.find((o: any) => o.id === orderId);
    if (!localOrder) return null;
    return {
      id: localOrder.id,
      status: localOrder.status,
      createdAt: new Date(localOrder.createdAt),
      items: localOrder.items || [],
      shippingAddress: {
        firstName: localOrder.shippingAddress?.first_name || localOrder.shippingAddress?.firstName || "",
        lastName: localOrder.shippingAddress?.last_name || localOrder.shippingAddress?.lastName || "",
        address: localOrder.shippingAddress?.address || "",
        city: localOrder.shippingAddress?.city || "",
        postalCode: localOrder.shippingAddress?.postal_code || localOrder.shippingAddress?.postalCode || "",
      },
      total: localOrder.total,
      trackingNumber: `TRK-LOCAL-${localOrder.id.slice(-6)}`,
    };
  } catch {
    return null;
  }
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");

        if (token) {
          const backendOrder = await fetchOrderFromBackend(orderId, token);
          if (backendOrder) {
            setOrder(backendOrder);
            setLoading(false);
            return;
          }
        }

        // Fallback: try localStorage (for offline/legacy orders)
        const localOrder = getOrderFromLocalStorage(orderId);
        setOrder(localOrder);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-500">Chargement de votre commande…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <CheckCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">
          Commande confirmée !
        </h1>
        <p className="text-gray-600 mb-2">
          Votre commande <strong>#{orderId}</strong> a été créée avec succès.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Les détails seront disponibles dans votre espace client.
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-yellow-600 mb-2">
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
                <span className="font-semibold">Numéro de commande :</span>
                <span className="font-mono">{order.orderNumber || `#${order.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date :</span>
                <span>{order.createdAt.toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Statut :</span>
                <span className="text-yellow-600 font-semibold">Confirmée</span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="font-semibold">Numéro de suivi :</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              )}
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
            <div className="text-sm space-y-1">
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
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>
                    {(item.product.price * item.quantity).toFixed(3)} DT
                  </span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total :</span>
                  <span>{order.total.toFixed(3)} DT</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
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
