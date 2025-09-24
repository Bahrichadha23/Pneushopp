import { API_URL } from "@/lib/config"
import type { Livraison } from "@/types/livraison"

export const fetchDeliveries = async (): Promise<Livraison[]> => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token found");

  const res = await fetch(`${API_URL}/deliveries/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch deliveries: ${res.status}`);
  }

  const data = await res.json();

  // If backend returns paginated data
  if (data.results) {
    return data.results;
  }

  return data;
};


export const updateDeliveryStatus = async (
  id: string,
  statut: "prepare" | "en_route" | "livre"
) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token found");

  const res = await fetch(`${API_URL}/deliveries/${id}/`, {
    method: "PATCH", // PATCH for partial updates
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ statut }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update delivery: ${res.status}`);
  }

  return res.json();
};
