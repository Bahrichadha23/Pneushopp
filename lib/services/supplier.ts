import axios from "axios"
import { API_URL } from "@/lib/config"
import type { Supplier } from "@/types/supplier"

export async function fetchSuppliers(token: string): Promise<Supplier[]> {
  try {
    const res = await axios.get(`${API_URL}/suppliers/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // If paginated response, return the "results" array
    if (Array.isArray(res.data)) {
      return res.data
    } else if (res.data && Array.isArray(res.data.results)) {
      return res.data.results
    } else {
      console.error("Unexpected suppliers API format:", res.data)
      return []
    }
  } catch (error) {
    console.error("Failed to fetch suppliers:", error)
    throw error
  }
}



export async function createSupplier(data: Supplier): Promise<Supplier> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}/suppliers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur création fournisseur");
  return res.json();
}

export async function updateSupplier(
  id: number,
  data: Partial<Supplier>
): Promise<Supplier> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}/suppliers/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur mise à jour fournisseur");
  return res.json();
}

export async function deleteSupplier(id: number): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}/suppliers/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erreur suppression fournisseur");
}
