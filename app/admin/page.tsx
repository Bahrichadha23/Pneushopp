// Page principale du tableau de bord administrateur
import DashboardStatsComponent from "@/components/admin/dashboard-stats"
import type { DashboardStats } from "@/types/admin"

// Données simulées pour le tableau de bord
const mockStats: DashboardStats = {
  totalRevenue: 125000,
  totalOrders: 1250,
  totalCustomers: 850,
  totalProducts: 156,
  pendingOrders: 12,
  lowStockProducts: 8,
  revenueGrowth: 15.2,
  orderGrowth: 8.7,
  topSellingProducts: [
    { id: "1", name: "Pirelli P Zero 225/45R17", sales: 45, revenue: 8100 },
    { id: "2", name: "Continental EcoContact 6", sales: 38, revenue: 5510 },
    { id: "3", name: "Michelin Agilis CrossClimate", sales: 32, revenue: 5280 },
  ],
  recentOrders: [
    {
      id: "1",
      orderNumber: "PN-2024-001",
      customerId: "c1",
      customerName: "Ahmed Ben Ali",
      customerEmail: "ahmed@email.com",
      customerPhone: "+216 20 123 456",
      items: [],
      totalAmount: 360,
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: "card",
      shippingAddress: {
        street: "123 Rue de la République",
        city: "Tunis",
        postalCode: "1000",
        region: "Tunis",
        country: "Tunisie",
      },
      billingAddress: {
        street: "123 Rue de la République",
        city: "Tunis",
        postalCode: "1000",
        region: "Tunis",
        country: "Tunisie",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      orderNumber: "PN-2024-002",
      customerId: "c2",
      customerName: "Fatma Trabelsi",
      customerEmail: "fatma@email.com",
      customerPhone: "+216 25 987 654",
      items: [],
      totalAmount: 290,
      status: "shipped",
      paymentStatus: "paid",
      paymentMethod: "transfer",
      shippingAddress: {
        street: "456 Avenue Habib Bourguiba",
        city: "Sfax",
        postalCode: "3000",
        region: "Sfax",
        country: "Tunisie",
      },
      billingAddress: {
        street: "456 Avenue Habib Bourguiba",
        city: "Sfax",
        postalCode: "3000",
        region: "Sfax",
        country: "Tunisie",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  monthlyRevenue: [
    { month: "Jan", revenue: 95000 },
    { month: "Fév", revenue: 108000 },
    { month: "Mar", revenue: 125000 },
  ],
}

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité PNEU SHOP</p>
      </div>

      <DashboardStatsComponent stats={mockStats} />
    </div>
  )
}
