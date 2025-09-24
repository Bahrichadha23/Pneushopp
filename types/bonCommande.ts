export interface Article {
  nom: string
  quantite: number
  prixUnitaire: number
}

export type StatutBon = "en_attente" | "confirmé" | "livré"
export type PrioriteBon = "normale" | "urgent"

export interface BonCommande {
  id: number | string              // allow number or string
  order_id: number          // new field to link to Order, can be null
  order: number | null         // new field to link to Order, can be null
  fournisseur: string
  dateCommande: string
  dateLivraisonPrevue: string
  articles: Article[]
  totalHT: number
  totalTTC: number
  statut: StatutBon
  priorite: PrioriteBon
}
