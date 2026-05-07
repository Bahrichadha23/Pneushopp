import apiClient from "@/lib/api-client";

export const createPurchaseOrder = async (order: any) => {
  try {
    if (!order.id || isNaN(parseInt(order.id))) {
      return { success: false, message: "ID de commande invalide" };
    }

    const items = (order.items || []).map((item: any) => ({
      nom: item.productName || "N/A",
      quantite: item.quantity || 0,
      prix_unitaire: Number(item.unitPrice || 0),
      reference: item.productId || "N/A",
    }));

    const total_ht = Number((Number(order.totalAmount || 0) / 1.19).toFixed(2));
    const total_ttc = Number(Number(order.totalAmount || 0).toFixed(2));

    const payload = {
      order: parseInt(order.id),
      date_commande: new Date(order.createdAt || Date.now())
        .toISOString()
        .split("T")[0],
      date_livraison_prevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      total_ht,
      total_ttc,
      statut: "en_attente",
      priorite: "normale",
      articles: items,
    };

    await apiClient.post("/orders/purchase-orders/", payload);
    return { success: true, message: "Bon de commande créé avec succès!" };
  } catch (error: any) {
    console.error("[PO] Error response:", error?.response?.data);
    // DRF often returns field-level errors as an object
    const data = error?.response?.data;
    let message = "Erreur lors de la création du bon de commande";
    if (data?.detail) {
      message = data.detail;
    } else if (data?.message) {
      message = data.message;
    } else if (data && typeof data === "object") {
      // e.g. { articles: [{ purchase_order: ["This field is required."] }] }
      message = JSON.stringify(data);
    }
    return { success: false, message };
  }
};
