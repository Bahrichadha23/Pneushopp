// types/livraison.ts
export interface Livraison {
  id: string
  commande: string
  order_number: string | null
  client: string
  client_phone: string | null
  adresse: string
  transporteur: string
  statut: "prepare" | "en_route" | "livre"
  dateExpedition: string | null
  dateLivraison: string | null
  colis: number
  articles_count: number
  numeroSuivi: string | null
  notes: string | null
  total_amount: number | null
  purchase_order: number | null
  order: number | null
}

export type DeliveryUpdate = Partial<Pick<
  Livraison,
  'statut' | 'transporteur' | 'colis' | 'dateExpedition' | 'dateLivraison' | 'numeroSuivi' | 'notes'
>>
