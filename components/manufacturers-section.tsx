export default function ManufacturersSection() {
  const manufacturers = [
    { name: "BARUM", logo: "/barum-logo.jpg" },
    { name: "AMINE", logo: "/amine.png" },
    { name: "BRIDGESTONE", logo: "/bridgestone.png" },
    { name: "CONTINENTAL", logo: "/continental-logo.jpg" },
    { name: "DAYTON", logo: "/dayton.png" },
    { name: "PIRELLI", logo: "/pirelli-tire-brand-logo.png" },
    { name: "GENERAL", logo: "/general-tire-logo.jpg" },
    { name: "GOODYEAR", logo: "/goodyear-logo.jpg" },
    { name: "NEXEN", logo: "/nexen-logo.png" },
    { name: "Waterfall", logo: "logo_waterfall.png" }
  ]

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">PRINCIPAUX FABRICANTS</h2>
          <p className="text-lg text-gray-600">TOP VENTES</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
          {manufacturers.map((manufacturer, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <img
                src={manufacturer.logo}
                alt={`${manufacturer.name} logo`}
                className="max-h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
