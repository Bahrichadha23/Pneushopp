// Page de gestion des commandes
"use client"
import { useState } from "react"
import OrdersTable from "@/components/admin/orders-table"
import type { Order } from "@/types/admin"

// Données simulées des commandes
const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "PN-2024-001",
    customerId: "c1",
    customerName: "Ahmed Ben Ali",
    customerEmail: "ahmed@email.com",
    customerPhone: "+216 20 123 456",
    items: [
      {
        productId: "1",
        productName: "Pirelli P Zero 225/45R17",
        productImage: "/images/pirelli-p-zero.jpg",
        quantity: 2,
        unitPrice: 180,
        totalPrice: 360,
        specifications: "225/45R17 91W",
      },
    ],
    totalAmount: 360,
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "card",
    shippingAddress: {
      street: "123 Rue de la République",
      city: "Tunis",
      postalCode: "1000",
      region: "Tunis",
      country: "Tunisie",
    },
    billingAddress: {
      street: "123 Rue de la République",
      city: "Tunis",
      postalCode: "1000",
      region: "Tunis",
      country: "Tunisie",
    },
    createdAt: new Date("2024-01-15T10:30:00"),
    updatedAt: new Date("2024-01-15T14:20:00"),
    trackingNumber: "TN123456789",
  },
  {
    id: "2",
    orderNumber: "PN-2024-002",
    customerId: "c2",
    customerName: "Fatma Trabelsi",
    customerEmail: "fatma@email.com",
    customerPhone: "+216 25 987 654",
    items: [
      {
        productId: "2",
        productName: "Continental EcoContact 6",
        productImage: "/images/continental-ecocontact.jpg",
        quantity: 2,
        unitPrice: 145,
        totalPrice: 290,
        specifications: "205/55R16 91V",
      },
    ],
    totalAmount: 290,
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "transfer",
    shippingAddress: {
      street: "456 Avenue Habib Bourguiba",
      city: "Sfax",
      postalCode: "3000",
      region: "Sfax",
      country: "Tunisie",
    },
    billingAddress: {
      street: "456 Avenue Habib Bourguiba",
      city: "Sfax",
      postalCode: "3000",
      region: "Sfax",
      country: "Tunisie",
    },
    createdAt: new Date("2024-01-14T15:45:00"),
    updatedAt: new Date("2024-01-15T09:15:00"),
    trackingNumber: "TN987654321",
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const handleViewOrder = (orderId: string) => {
    console.log("Voir commande:", orderId)
  }

  const handleEditOrder = (orderId: string) => {
    console.log("Modifier commande:", orderId)
  }

  const handleUpdateStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: new Date() } : order,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestion des commandes</h1>
        <p className="text-gray-600 text-sm md:text-base">
          Gérez toutes les commandes de votre boutique
        </p>
      </div>

      <OrdersTable
        orders={orders}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  )
}
