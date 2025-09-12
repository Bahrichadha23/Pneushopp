export default function TireGuideSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Comment lire <span className="text-yellow-500">un pneu ?</span>
          </h2>
          <p className="text-lg text-gray-600">On vous explique tout !</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Explanations */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                225
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">225 = largeur</h3>
                <p className="text-gray-600">Largeur du pneu en millimètres</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                45
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">45 = hauteur</h3>
                <p className="text-gray-600">Rapport hauteur/largeur en pourcentage</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">R = structure radiale</h3>
                <p className="text-gray-600">Type de construction du pneu</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                17
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">17 = diamètre</h3>
                <p className="text-gray-600">Diamètre de la jante en pouces</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                91
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">91 = indice de charge</h3>
                <p className="text-gray-600">Charge maximale supportée par le pneu</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">W = indice de vitesse</h3>
                <p className="text-gray-600">Vitesse maximale autorisée</p>
              </div>
            </div>
          </div>

          {/* Right side - Tire Image with Labels */}
          <div className="relative">
            <div className="relative mx-auto w-96 h-96 flex items-center justify-center">
              {/* Tire Image */}
              <img src="/images/tire-guide.png" alt="Tire with dimension labels" className="w-80 h-80 object-contain" />

              {/* Dimension Labels positioned around the tire */}
              <div className="absolute inset-0">
                {/* DIAMETRE - top */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">DIAMETRE</div>
                  <div className="w-px h-8 bg-yellow-500 mx-auto"></div>
                </div>

                {/* CHARGE - top right */}
                <div className="absolute top-12 right-8">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">CHARGE</div>
                  <div className="w-8 h-px bg-yellow-500 mt-2"></div>
                </div>

                {/* VITESSE - right */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">VITESSE</div>
                </div>

                {/* RADIAL - left top */}
                <div className="absolute left-8 top-16">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">RADIAL</div>
                </div>

                {/* HAUTEUR - left */}
                <div className="absolute left-4 top-1/3">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">HAUTEUR</div>
                </div>

                {/* LARGEUR - bottom left */}
                <div className="absolute bottom-16 left-8">
                  <div className="bg-yellow-500 text-black px-2 py-1 text-sm font-bold rounded">LARGEUR</div>
                </div>

                {/* Central tire marking */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="text-white font-bold text-xl bg-black bg-opacity-50 px-3 py-1 rounded">
                    225/45 R17 91W
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
