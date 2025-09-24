// types/livraison.ts
export interface Livraison {
  id: string
  commande: string
  client: string
  adresse: string
  transporteur: string
  statut: "prepare" | "en_route" | "livre"
  dateExpedition: string
  dateLivraison: string
  colis: number
}
