// Page des mouvements de stock
"use client"
import { useState } from "react"
import StockMovements from "@/components/admin/stock-movements"
import type { StockMovement } from "@/types/admin"

// Données simulées des mouvements de stock
const mockMovements: StockMovement[] = [
  {
    id: "1",
    productId: "1",
    productName: "Pirelli P Zero 225/45R17",
    type: "in",
    quantity: 20,
    reason: "Réception commande fournisseur",
    reference: "BC-2024-001",
    createdAt: new Date("2024-01-15T09:30:00"),
    createdBy: "Admin",
  },
  {
    id: "2",
    productId: "1",
    productName: "Pirelli P Zero 225/45R17",
    type: "out",
    quantity: 2,
    reason: "Vente client",
    reference: "PN-2024-001",
    createdAt: new Date("2024-01-15T14:20:00"),
    createdBy: "Système",
  },
  {
    id: "3",
    productId: "2",
    productName: "Continental EcoContact 6",
    type: "adjustment",
    quantity: 5,
    reason: "Correction inventaire",
    createdAt: new Date("2024-01-14T16:45:00"),
    createdBy: "Admin",
  },
]

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements)

  const handleAddMovement = (movementData: Omit<StockMovement, "id" | "createdAt">) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setMovements((prev) => [newMovement, ...prev])
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mouvements de stock</h1>
        <p className="text-gray-600">Suivez tous les mouvements d'inventaire</p>
      </div>

      <StockMovements movements={movements} onAddMovement={handleAddMovement} />
    </div>
  )
}
