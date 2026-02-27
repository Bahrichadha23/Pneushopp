import { API_URL } from "../config";

export const createPurchaseOrder = async (order: any) => {
    try {
        const token = localStorage.getItem("access_token");
        if (!token) return { success: false, message: "Token manquant" };

        // Validate order ID
        if (!order.id || isNaN(parseInt(order.id))) {
            return { success: false, message: "ID de commande invalide" };
        }

        console.log("📦 Creating Purchase Order for order:", order);
        console.log("📦 Order items:", order.items);

        const items = (order.items || []).map((item: any) => ({
            nom: item.productName || "N/A",
            quantite: item.quantity || 0,
            prix_unitaire: Number(item.unitPrice || 0),
            reference: item.productId || "N/A"
        }));

        console.log("📦 Mapped articles:", items);

        const total_ht = Number((Number(order.totalAmount || 0) / 1.19).toFixed(2));
        const total_ttc = Number(Number(order.totalAmount || 0).toFixed(2));

        const payload = {
            order: parseInt(order.id),
            date_commande: new Date(order.createdAt || Date.now()).toISOString().split("T")[0],
            date_livraison_prevue: new Date(Date.now() + 7*24*60*60*1000)
                .toISOString().split("T")[0],
            total_ht,
            total_ttc,
            statut: "en_attente",
            priorite: "normale",
            articles: items
        };

        console.log("📦 Payload being sent:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_URL}/orders/purchase-orders/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log("📦 Response status:", response.status);

        if (response.ok) {
            const responseData = await response.json();
            console.log("📦 Response data:", responseData);
            return { success: true, message: "Bon de commande créé avec succès!" };
        } else {
            const errorData = await response.json();
            console.error("❌ Erreur serveur:", errorData);
            console.error("❌ Payload envoyé:", payload);
            throw new Error("Erreur serveur");
        }
    } catch (error) {
        console.error("Erreur:", error);
        return { success: false, message: "Erreur lors de la création du bon de commande" };
    }
};
