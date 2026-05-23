export interface Article {
  nom: string
  quantite: number
  prixUnitaire: number
}

export type StatutBon = "en_attente" | "confirmé" | "livré"
export type PrioriteBon = "normale" | "urgent"

export interface BonCommande {
  id: number | string
  order_id: number | null
  order: number | null
  fournisseur: string
  dateCommande: string
  dateLivraisonPrevue: string
  articles: Article[]
  totalHT: number
  totalTTC: number
  statut: StatutBon
  priorite: PrioriteBon
  // Enriched from serializer
  order_number: string | null
  client_name: string | null
  client_email: string | null
  tracking_number: string | null
  delivery_cost: number
  total_with_delivery: number
}
