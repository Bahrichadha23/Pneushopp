export default function WhyChooseUsSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Black banner */}
        <div className="bg-black text-white text-center py-4 mb-12">
          <h2 className="text-xl font-bold tracking-wider">PRIX MINI, PERFORMANCES MAXI</h2>
        </div>

        {/* Main title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pourquoi acheter sur <span className="text-yellow-500">Pneushop.tn</span> ?
          </h2>
        </div>

        {/* Three columns content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>Pneushop.tn</strong>, leader en Tunisie de la vente en ligne de pneumatiques, propose un large
              choix de pneus pas chers :{" "}
              <strong>
                pneus pour voiture, pneus pour SUV et 4X4, pneus pour camionnette et utilitaire, des pneus agricoles et
                des pneus poids-lourd.
              </strong>
            </p>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Acheter et faire le choix de nouveaux pneus auto n'est pas toujours évident.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Vous trouverez sur le site un large choix de pneus pas chers, des marques et des conseils pour trouver les
              pneus auto qui vous conviennent.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Tous les pneus pour tous types de véhicules sont sur <strong>Pneushop.tn</strong>.
            </p>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>Pneushop</strong> le meilleur e-commerçant dans la catégorie service vente pneus.{" "}
              <strong>Pneushop.tn</strong> propose des pneus mais également de nombreux services pour satisfaire et
              faciliter les achats des utilisateurs.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nous vous proposons en plus de l'achat de pneus auto, des services de livraison, SUV, 4X4, camionnette
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
