"use client";

import { useEffect, useState } from "react";
import StockMovements from "@/components/admin/stock-movements";
import type { StockMovement } from "@/types/admin";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin or purchasing
  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  const handleAddMovement = async (
    movementData: Omit<StockMovement, "id" | "createdAt" | "createdBy">
  ) => {
    try {
      const response = await fetch(`${API_URL}/admin/stock-movements/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          product: movementData.productId, // ✅ backend expects "product"
          type: movementData.type,
          quantity: movementData.quantity,
          reason: movementData.reason,
          reference: movementData.reference,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData); // ✅ see backend validation errors
        throw new Error(
          `Erreur lors de la création du mouvement: ${response.status}`
        );
      }

      const newMovement: StockMovement = await response.json();

      setMovements((prev) => [newMovement, ...prev]);
    } catch (err) {
      console.error("❌ Échec de l'ajout du mouvement de stock:", err);
    }
  };

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/stock-movements/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok)
          throw new Error("Erreur lors du chargement des mouvements");
        const data = await res.json();
        setMovements(data.results || data); // adjust if your API is paginated
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Mouvements de stock
        </h1>
        <p className="text-gray-600">Suivez tous les mouvements d'inventaire</p>
      </div>

      {/* Stock movements table or cards */}
      <StockMovements movements={movements} onAddMovement={handleAddMovement} />
      {loading && <p>Chargement des mouvements...</p>}
    </div>
  );
}
