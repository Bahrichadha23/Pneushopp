import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Conditions Générales
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="bg-yellow-500 text-black p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-2">
                PNEU SHOP — Conditions Générales
              </h2>
              <p className="text-lg">
                Veuillez lire attentivement ces conditions qui régissent
                l'utilisation de notre site et l'achat de nos produits.
              </p>
            </div>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">1. Objet</h3>
              <p className="text-gray-700">
                Les présentes conditions générales (ci-après « CG ») définissent
                les droits et obligations des parties dans le cadre de la vente
                en ligne de produits proposés par Pneu Shop aux consommateurs en
                Tunisie via le site pneushop.tn.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">2. Commande</h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  • La validation de la commande vaut acceptation sans réserve
                  des présentes CG.
                </li>
                <li>
                  • Pneu Shop se réserve le droit d'annuler toute commande
                  légitimement suspecte (fraude, informations incomplètes,
                  etc.).
                </li>
                <li>
                  • Un email de confirmation récapitulatif est envoyé à
                  l'adresse fournie.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">
                3. Prix et Paiement
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Les prix sont indiqués en TND toutes taxes comprises.</li>
                <li>
                  • Les modes de paiement acceptés sont ceux affichés au moment
                  du checkout (paiement sécurisé).
                </li>
                <li>
                  • Pneu Shop se réserve le droit de modifier les prix à tout
                  moment, mais les produits seront facturés sur la base des
                  tarifs en vigueur au moment de la validation.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">4. Livraison</h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  • Livraison Rapide 24h/72h selon disponibilité et région.
                </li>
                <li>
                  • Les délais sont indicatifs. Tout retard raisonnable ne peut
                  donner lieu à des dommages et intérêts.
                </li>
                <li>
                  • À la réception, vérifiez l'état des produits et signalez
                  toute anomalie sous 48h.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">
                5. Retours et Rétractation
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  • Vous disposez d'un délai légal de rétractation conformément
                  à la réglementation en vigueur.
                </li>
                <li>
                  • Les produits doivent être retournés neufs, non montés, dans
                  leur emballage d'origine.
                </li>
                <li>
                  • Les frais de retour peuvent s'appliquer selon le motif et
                  l'état du produit.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">6. Garantie</h3>
              <p className="text-gray-700">
                Nos produits bénéficient des garanties légales de conformité et
                contre les vices cachés. Toute demande de garantie doit être
                accompagnée de la preuve d'achat et d'un descriptif du défaut
                constaté.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">7. Responsabilité</h3>
              <p className="text-gray-700">
                Pneu Shop ne saurait être tenu responsable des dommages
                indirects. La responsabilité est limitée au montant de la
                commande. L'utilisateur est responsable du choix des produits et
                de leur montage par un professionnel qualifié.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">
                8. Données Personnelles
              </h3>
              <p className="text-gray-700">
                Les données collectées sont traitées conformément à notre
                politique de confidentialité et à la législation applicable.
                Vous disposez de droits d'accès, de rectification et
                d'opposition.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">
                9. Propriété Intellectuelle
              </h3>
              <p className="text-gray-700">
                Tous les éléments du site (textes, logos, visuels) sont protégés
                et demeurent la propriété de leurs titulaires. Toute
                reproduction non autorisée est interdite.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-3">
                10. Droit Applicable et Litiges
              </h3>
              <p className="text-gray-700">
                Les présentes CG sont soumises au droit tunisien. Tout litige
                sera de la compétence exclusive des tribunaux tunisiens
                compétents.
              </p>
            </section>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Contact</h3>
              <p className="text-gray-700">
                Pour toute question concernant ces conditions, vous pouvez nous
                contacter via la page{" "}
                <a href="/contact" className="text-yellow-600 hover:underline">
                  Contact
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
