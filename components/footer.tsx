export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold mb-6">NOUS CONTACTER :</h3>
            <div className="space-y-3">
              <p>
                <strong>Tél. :</strong> +216 29 353 666
              </p>
              <p>
                <strong>Adresse :</strong> 9 Rue El Milaha, Menzah 8, 2037, ARIANA
              </p>
              <p>
                <strong>E-mail :</strong> service.commercial@pneushop.tn
              </p>
              <p>
                <strong>Horaires :</strong> LUNDI - SAMEDI
              </p>
            </div>
          </div>

          {/* Social Media and Logo */}
          <div className="flex flex-col items-center lg:items-end">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">SUIVEZ-NOUS</h3>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-white rounded"></div>
                <div className="w-8 h-8 bg-white rounded"></div>
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-black rounded-full"></div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold">PNEU SHOP</h4>
                <p className="text-xs text-gray-400">Vos pneumatiques en un seul clic</p>
              </div>
            </div>

            {/* Social media icons */}
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-white rounded"></div>
              <div className="w-8 h-8 bg-white rounded"></div>
              <div className="w-8 h-8 bg-white rounded"></div>
              <div className="w-8 h-8 bg-white rounded"></div>
              <div className="w-8 h-8 bg-white rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="bg-gray-100 text-black py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © Droits d'auteur 2024 pneushop.
            <br />
            par Innovation-wep.pro Tunisie
          </p>
        </div>
      </div>
    </footer>
  )
}
