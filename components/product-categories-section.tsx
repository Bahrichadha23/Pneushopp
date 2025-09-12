import { Button } from "@/components/ui/button"

export default function ProductCategoriesSection() {
  const categories = [
    {
      id: 1,
      name: "PNEU AGRICOLE",
      image: "/agricultural-tire-with-deep-treads.png",
      description: "Pneus spécialisés pour tracteurs et machines agricoles",
    },
    {
      id: 2,
      name: "PNEU AUTO",
      image: "/car-tire-with-modern-design.png",
      description: "Pneus pour voitures particulières et berlines",
    },
    {
      id: 3,
      name: "PNEU CAMIONNETTE",
      image: "/van-tire-with-reinforced-sidewalls.png",
      description: "Pneus renforcés pour utilitaires et camionnettes",
    },
    {
      id: 4,
      name: "PNEU POIDS LOURD",
      image: "/truck-tire-heavy-duty-commercial.png",
      description: "Pneus haute résistance pour camions et poids lourds",
    },
  ]

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            DÉCOUVREZ <span className="text-yellow-500">NOS PNEUS</span>
          </h2>
          <p className="text-lg text-gray-600">PAR CATÉGORIES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-square p-6 flex items-center justify-center bg-gray-100">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                <Button variant="outline" className="w-full bg-transparent">
                  Voir les pneus
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
