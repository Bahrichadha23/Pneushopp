import apiClient from "@/lib/api-client";
import type { Livraison } from "@/types/livraison";

export const fetchDeliveries = async (): Promise<Livraison[]> => {
  const { data } = await apiClient.get("/orders/deliveries/");
  return data.results ?? data;
};

export const updateDeliveryStatus = async (
  id: string,
  statut: "prepare" | "en_route" | "livre"
): Promise<Livraison> => {
  const { data } = await apiClient.patch(`/orders/deliveries/${id}/`, { statut });
  return data;
};
