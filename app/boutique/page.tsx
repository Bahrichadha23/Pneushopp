import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BoutiquePage() {
  const products = [
    {
      id: 1,
      name: "Pneu Continental PremiumContact 6",
      size: "225/45 R17 91W",
      price: "120 DT",
      image: "/car-tire-with-modern-design.png",
      category: "Auto",
    },
    {
      id: 2,
      name: "Pneu Pirelli Scorpion Verde",
      size: "235/55 R19 105V",
      price: "180 DT",
      image: "/car-tire-with-modern-design.png",
      category: "SUV",
    },
    {
      id: 3,
      name: "Pneu Kleber Citilander",
      size: "215/65 R16 98H",
      price: "95 DT",
      image: "/van-tire-with-reinforced-sidewalls.png",
      category: "Camionnette",
    },
    {
      id: 4,
      name: "Pneu Tigar Cargo Speed",
      size: "195/70 R15C 104R",
      price: "85 DT",
      image: "/truck-tire-heavy-duty-commercial.png",
      category: "Utilitaire",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Notre Boutique</h1>
          <p className="text-gray-600">Découvrez notre large gamme de pneumatiques</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtrer les produits</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="camionnette">Camionnette</SelectItem>
                <SelectItem value="utilitaire">Utilitaire</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continental">Continental</SelectItem>
                <SelectItem value="pirelli">Pirelli</SelectItem>
                <SelectItem value="kleber">Kleber</SelectItem>
                <SelectItem value="tigar">Tigar</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-100">0 - 100 DT</SelectItem>
                <SelectItem value="100-150">100 - 150 DT</SelectItem>
                <SelectItem value="150-200">150 - 200 DT</SelectItem>
                <SelectItem value="200+">200+ DT</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-red-600 hover:bg-red-700">Filtrer</Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-square p-4 bg-gray-50">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.size}</p>
                <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-600">{product.price}</span>
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
