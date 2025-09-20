import Header from "@/components/header"
import Footer from "@/components/footer"

export default function ConfidentialityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Politique de Confidentialité</h1>

          <div className="prose prose-lg max-w-none">
            <div className="bg-yellow-500 text-black p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-2">Protection de vos données chez PNEU SHOP</h2>
              <p className="text-lg">Cette politique explique quelles données nous collectons, comment nous les utilisons et vos droits concernant vos informations personnelles.</p>
            </div>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">1. Responsable du traitement</h3>
              <p className="text-gray-700">Pneu Shop est responsable du traitement des données collectées via le site pneushop.tn. Pour toute question, utilisez la page <a href="/contact" className="text-yellow-600 hover:underline">Contact</a>.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">2. Données collectées</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Données d'identité: nom, prénom, coordonnées.</li>
                <li>• Données de commande: produits, adresses de livraison/facturation, historique d'achats.</li>
                <li>• Données de paiement: informations de paiement traitées via des prestataires sécurisés (nous ne stockons pas les détails complets de carte).</li>
                <li>• Données de navigation: cookies, adresse IP, pages visitées, préférences.</li>
                <li>• Communications: messages envoyés au service client.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">3. Finalités et bases légales</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Exécution du contrat: gestion des commandes, livraison, facturation, service après-vente.</li>
                <li>• Intérêt légitime: amélioration du site, prévention de la fraude, statistiques.</li>
                <li>• Consentement: envoi de newsletters/offres marketing lorsque vous l'acceptez.</li>
                <li>• Obligations légales: comptabilité, garanties, litiges.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">4. Partage des données</h3>
              <p className="text-gray-700">Vos données peuvent être partagées avec des prestataires de services (paiement, livraison, hébergement, support) strictement pour les finalités décrites et sous obligations de confidentialité.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">5. Transferts internationaux</h3>
              <p className="text-gray-700">Si des transferts de données en dehors de la Tunisie sont nécessaires, ils seront encadrés par des garanties appropriées afin d'assurer un niveau de protection adéquat.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">6. Durées de conservation</h3>
              <p className="text-gray-700">Les données sont conservées pendant la durée nécessaire aux finalités poursuivies, et conformément aux obligations légales (par exemple, les documents de facturation peuvent être conservés plusieurs années).</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">7. Vos droits</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Droit d'accès et de rectification.</li>
                <li>• Droit à l'effacement (dans les limites légales).</li>
                <li>• Droit d'opposition et de limitation du traitement.</li>
                <li>• Droit à la portabilité des données.</li>
                <li>• Droit de retirer votre consentement à tout moment pour les traitements fondés sur le consentement.</li>
              </ul>
              <p className="text-gray-700 mt-2">Pour exercer vos droits, contactez-nous via la page <a href="/contact" className="text-yellow-600 hover:underline">Contact</a>.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">8. Cookies</h3>
              <p className="text-gray-700">Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre consentement, des cookies de mesure d'audience et de personnalisation. Vous pouvez gérer vos préférences via les paramètres de votre navigateur ou les bannières de consentement le cas échéant.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">9. Sécurité</h3>
              <p className="text-gray-700">Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre l'accès non autorisé, la perte, l'altération ou la divulgation.</p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">10. Modifications de la politique</h3>
              <p className="text-gray-700">Nous pouvons mettre à jour cette politique pour refléter des changements juridiques ou opérationnels. La version en ligne fait foi; nous indiquerons la date de dernière mise à jour.</p>
            </section>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Contact</h3>
              <p className="text-gray-700">Pour toute question relative à la confidentialité, contactez-nous via la page <a href="/contact" className="text-yellow-600 hover:underline">Contact</a>.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
