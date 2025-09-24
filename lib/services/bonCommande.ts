import { API_URL } from "@/lib/config"
import type { BonCommande } from "@/types/bonCommande"
import axios from "axios";

export async function fetchBonsCommande(): Promise<BonCommande[]> {
  try {
    const res = await axios.get(`${API_URL}/purchase-orders/`);
    return res.data; // axios already parses JSON
  } catch (error) {
    console.error("Failed to fetch bons de commande:", error);
    throw error;
  }
}
