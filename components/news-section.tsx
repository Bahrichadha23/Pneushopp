export default function NewsSection() {
  const newsItems = [
    {
      id: 1,
      title: "ÉVÉNEMENT",
      image: "/dark-warehouse-interior-with-tire-storage-racks.jpg",
      description: "Découvrez nos derniers événements et promotions",
    },
    {
      id: 2,
      title: "ACTUALITÉS",
      image: "/industrial-tire-warehouse-with-shelving-and-lighti.jpg",
      description: "Restez informé des dernières actualités du secteur",
    },
    {
      id: 3,
      title: "PROMOTION",
      image: "/modern-tire-storage-facility-with-industrial-light.jpg",
      description: "Profitez de nos offres promotionnelles exceptionnelles",
    },
  ]

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black">À LA UNE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="bg-black text-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
