import Header from "@/components/header"
import Footer from "@/components/footer"

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">À Propos de Pneu Shop</h1>

          <div className="prose prose-lg max-w-none">
            <div className="bg-yellow-500 text-black p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-4">PNEU SHOP, LE SPÉCIALISTE DU PNEU PAS CHER</h2>
              <p className="text-lg">Leader en Tunisie de la vente en ligne de pneumatiques</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-semibold mb-4">Notre Mission</h3>
                <p className="text-gray-700 mb-4">
                  Pneushop.tn s'engage à fournir aux automobilistes tunisiens des pneumatiques de qualité à des prix
                  compétitifs. Nous proposons un large choix de pneus pour tous types de véhicules.
                </p>
                <p className="text-gray-700">
                  Notre objectif est de simplifier l'achat de pneus en ligne tout en garantissant un service client
                  exceptionnel et une livraison rapide.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Nos Services</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Large gamme de pneumatiques</li>
                  <li>• Livraison gratuite 24h/72h</li>
                  <li>• Paiement sécurisé</li>
                  <li>• Conseil personnalisé</li>
                  <li>• Service après-vente</li>
                  <li>• Garantie qualité</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Pourquoi Choisir Pneu Shop ?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <h4 className="font-semibold mb-2">Expertise</h4>
                  <p className="text-sm text-gray-600">Plus de 10 ans d'expérience dans le secteur</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4 className="font-semibold mb-2">Prix Compétitifs</h4>
                  <p className="text-sm text-gray-600">Les meilleurs prix du marché tunisien</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚚</span>
                  </div>
                  <h4 className="font-semibold mb-2">Livraison Rapide</h4>
                  <p className="text-sm text-gray-600">Livraison gratuite en 24h/72h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
