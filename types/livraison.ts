// types/livraison.ts
export interface Livraison {
  id: string
  commande: string
  client: string
  adresse: string
  transporteur: string
  statut: "prepare" | "en_route" | "livre"
  dateExpedition: string | null
  dateLivraison: string | null
  colis: number
}
