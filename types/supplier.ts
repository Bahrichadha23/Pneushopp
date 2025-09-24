export interface Supplier {
  id: number
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  specialties: string[]
  rating: number
  orders_count: number
  delivery_time: string
  status: "active" | "inactive"}
