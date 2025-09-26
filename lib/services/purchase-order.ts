import { API_URL } from "../config";

export const createPurchaseOrder = async (orderId: string) => {
    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/purchase-orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                order: parseInt(orderId),
                fournisseur: 'Fournisseur par défaut',
                date_commande: new Date().toISOString().split('T')[0],
                date_livraison_prevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                total_ht: 0,
                total_ttc: 0,
                statut: 'en_attente',
                priorite: 'normale',
                articles: [
                    {
                        nom: 'Article par défaut',
                        quantite: 1,
                        prix_unitaire: 0
                    }
                ]
            })
        });

        if (response.ok) {
            return { success: true, message: 'Bon de commande créé avec succès!' };
        } else {
            throw new Error('Erreur lors de la création');
        }
    } catch (error) {
        console.error('Erreur:', error);
        return { success: false, message: 'Erreur lors de la création du bon de commande' };
    }
};