// types/livraison.ts
export interface Livraison {
  id: string
  commande: string
  order_number: string | null
  client: string
  adresse: string
  transporteur: string
  statut: "prepare" | "en_route" | "livre"
  dateExpedition: string | null
  dateLivraison: string | null
  colis: number
  numeroSuivi: string | null
  notes: string | null
  purchase_order: number | null
  order: number | null
}

export type DeliveryUpdate = Partial<Pick<
  Livraison,
  'statut' | 'transporteur' | 'colis' | 'dateExpedition' | 'dateLivraison' | 'numeroSuivi' | 'notes'
>>
