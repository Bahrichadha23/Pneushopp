import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ConfidentialityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Politique de Confidentialité
          </h1>
          <p className="text-center text-gray-500 text-sm mb-10">
            Dernière mise à jour : Juin 2025 — Conforme à la législation tunisienne en vigueur
          </p>

          <div className="bg-yellow-500 text-black p-6 rounded-lg mb-10">
            <h2 className="text-xl font-bold mb-2">Protection de vos données personnelles</h2>
            <p>
              PNEU SHOP s'engage à protéger la confidentialité et la sécurité de vos
              données personnelles conformément à la{" "}
              <strong>Loi organique n° 2004-63 du 27 juillet 2004</strong> portant sur
              la protection des données à caractère personnel, et aux textes qui la
              complètent ou la modifient.
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-10 text-gray-700">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données à caractère personnel collectées
                via le site <strong>pneushop.tn</strong> est :
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3 text-sm">
                <p><strong>Dénomination :</strong> PNEU SHOP</p>
                <p><strong>Activité :</strong> Commerce de pneus et accessoires automobiles</p>
                <p><strong>Pays :</strong> République Tunisienne</p>
                <p><strong>Contact :</strong>{" "}
                  <a href="/contact" className="text-yellow-600 hover:underline">
                    Formulaire de contact
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
              <p>Dans le cadre de nos services, nous collectons les catégories de données suivantes :</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <strong>Données d'identification :</strong> nom, prénom, adresse e-mail,
                  numéro de téléphone, adresse postale.
                </li>
                <li>
                  <strong>Données de commande :</strong> articles commandés, adresse de
                  livraison, historique d'achats, mode de paiement choisi.
                </li>
                <li>
                  <strong>Données de connexion :</strong> identifiants de compte, mot de passe
                  chiffré, date et heure de connexion.
                </li>
                <li>
                  <strong>Données de navigation :</strong> adresse IP, type de navigateur,
                  pages visitées, durée de visite (via cookies analytiques).
                </li>
                <li>
                  <strong>Données de garantie :</strong> immatriculation du véhicule,
                  kilométrage (uniquement si vous souscrivez à la garantie montage).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Traiter et expédier vos commandes ;</li>
                <li>Gérer votre compte client et votre historique d'achats ;</li>
                <li>Émettre les factures et documents comptables ;</li>
                <li>Assurer le suivi du service après-vente (SAV) et des garanties ;</li>
                <li>Vous envoyer des notifications relatives à vos commandes ;</li>
                <li>
                  Vous adresser des offres commerciales (uniquement si vous y avez
                  expressément consenti lors de votre inscription) ;
                </li>
                <li>
                  Améliorer la qualité de nos services par des analyses statistiques
                  anonymisées.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base légale du traitement</h2>
              <p>Conformément à la loi n° 2004-63, le traitement de vos données repose sur :</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>L'exécution du contrat de vente</strong> (traitement des commandes, facturation, livraison) ;</li>
                <li><strong>Votre consentement explicite</strong> (newsletter, cookies non essentiels) ;</li>
                <li><strong>Nos obligations légales</strong> (conservation des factures, obligations fiscales tunisiennes) ;</li>
                <li><strong>Notre intérêt légitime</strong> (sécurité du site, prévention des fraudes).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Durée de conservation</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Catégorie</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Durée de conservation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="px-4 py-3">Données de compte client</td><td className="px-4 py-3">Durée de vie du compte + 2 ans</td></tr>
                    <tr><td className="px-4 py-3">Données de commande et factures</td><td className="px-4 py-3">10 ans (obligation légale fiscale)</td></tr>
                    <tr><td className="px-4 py-3">Données de garantie</td><td className="px-4 py-3">Durée de la garantie + 1 an</td></tr>
                    <tr><td className="px-4 py-3">Données de navigation (cookies)</td><td className="px-4 py-3">13 mois maximum</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Partage des données</h2>
              <p>
                Vos données personnelles ne sont pas vendues ni louées à des tiers.
                Elles peuvent être communiquées uniquement :
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Aux prestataires de transport et de livraison, dans le strict cadre
                  de l'exécution de votre commande ;
                </li>
                <li>
                  Aux autorités compétentes tunisiennes sur réquisition judiciaire ou
                  obligation légale ;
                </li>
                <li>
                  À nos prestataires informatiques hébergeant nos services, liés par
                  des obligations de confidentialité.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Sécurité des données</h2>
              <p>
                PNEU SHOP met en œuvre des mesures techniques et organisationnelles
                appropriées pour protéger vos données contre tout accès non autorisé,
                toute divulgation, modification ou destruction. Vos mots de passe sont
                chiffrés et jamais stockés en clair.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Vos droits</h2>
              <p>
                Conformément à la loi n° 2004-63, vous disposez des droits suivants
                concernant vos données personnelles :
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données ;</li>
                <li><strong>Droit de rectification :</strong> corriger vos informations inexactes ;</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement à des fins commerciales ;</li>
                <li><strong>Droit à la suppression :</strong> demander l'effacement de votre compte ;</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré.</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, contactez-nous via la{" "}
                <a href="/contact" className="text-yellow-600 hover:underline">
                  page contact
                </a>{" "}
                ou adressez une demande écrite à notre adresse. Vous pouvez également
                saisir l'
                <strong>
                  Instance Nationale de Protection des Données Personnelles (INPDP)
                </strong>{" "}
                en cas de litige : <a href="https://www.inpdp.nat.tn" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">www.inpdp.nat.tn</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookies</h2>
              <p>
                Notre site utilise des cookies strictement nécessaires au fonctionnement
                (session, panier) et des cookies analytiques pour améliorer l'expérience
                utilisateur. Vous pouvez refuser les cookies non essentiels via les
                paramètres de votre navigateur. Le refus de cookies essentiels peut
                affecter le fonctionnement du site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Modifications de la politique</h2>
              <p>
                Nous nous réservons le droit de modifier cette politique à tout moment.
                Toute modification sera publiée sur cette page avec la date de mise à
                jour. En cas de changement substantiel, vous serez informé par e-mail
                si vous êtes client enregistré.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
