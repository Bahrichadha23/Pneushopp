import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Conditions Générales de Vente
          </h1>
          <p className="text-center text-gray-500 text-sm mb-10">
            Dernière mise à jour : Juin 2025 — Droit applicable : République Tunisienne
          </p>

          <div className="bg-yellow-500 text-black p-6 rounded-lg mb-10">
            <h2 className="text-xl font-bold mb-2">PNEU SHOP — CGV</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent toute
              commande passée sur le site <strong>pneushop.tn</strong>. En passant
              commande, le client reconnaît avoir pris connaissance et accepté
              sans réserve les présentes CGV.
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-10 text-gray-700">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Identification du vendeur</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <p><strong>Dénomination :</strong> PNEU SHOP</p>
                <p><strong>Activité :</strong> Vente de pneus, jantes et accessoires automobiles</p>
                <p><strong>Pays :</strong> République Tunisienne</p>
                <p>
                  <strong>Régime fiscal :</strong> Assujetti à la TVA au taux de 19 %
                  conformément au Code de l'IRPP et de l'IS
                </p>
                <p><strong>Contact :</strong>{" "}
                  <a href="/contact" className="text-yellow-600 hover:underline">
                    Formulaire de contact
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Champ d'application</h2>
              <p>
                Les présentes CGV s'appliquent à toutes les ventes de produits réalisées
                par PNEU SHOP à des clients particuliers ou professionnels domiciliés en
                Tunisie, conclues via le site <strong>pneushop.tn</strong> ou directement
                en magasin. Elles sont conformes aux dispositions de la{" "}
                <strong>Loi n° 2000-83 du 9 août 2000</strong> relative aux échanges et
                au commerce électroniques et aux dispositions du Code de Commerce tunisien.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Produits et disponibilité</h2>
              <p>
                Les produits proposés sont ceux figurant sur le site au moment de la
                consultation. PNEU SHOP s'efforce de maintenir à jour les informations
                relatives aux stocks ; toutefois, en cas d'indisponibilité d'un produit
                après validation de la commande, le client en sera informé dans les
                meilleurs délais et pourra demander un remboursement intégral ou un
                produit de substitution.
              </p>
              <p className="mt-3">
                Les caractéristiques essentielles des produits (marque, dimensions,
                indice de charge, indice de vitesse, saison) sont précisées sur chaque
                fiche produit. Il appartient au client de vérifier la compatibilité des
                pneus avec son véhicule avant toute commande.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Prix</h2>
              <p>
                Les prix affichés sont en <strong>Dinars Tunisiens (DT)</strong>, toutes
                taxes comprises (TVA 19 % incluse). Les prix n'incluent pas les frais de
                livraison, qui sont indiqués séparément lors du processus de commande.
              </p>
              <p className="mt-3">
                Un <strong>timbre fiscal de 1,000 DT</strong> est ajouté à chaque facture
                conformément à la réglementation fiscale tunisienne en vigueur.
              </p>
              <p className="mt-3">
                PNEU SHOP se réserve le droit de modifier ses prix à tout moment.
                Toute commande est facturée aux prix en vigueur au moment de sa validation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Commande</h2>
              <p>
                Le processus de commande se déroule comme suit :
              </p>
              <ol className="list-decimal pl-6 mt-3 space-y-2">
                <li>Sélection des produits et ajout au panier ;</li>
                <li>Vérification du récapitulatif de commande ;</li>
                <li>Saisie des informations de livraison et de contact ;</li>
                <li>Choix du mode de paiement ;</li>
                <li>Validation et confirmation de la commande.</li>
              </ol>
              <p className="mt-3">
                La commande est réputée ferme et définitive à réception de la confirmation
                par e-mail. PNEU SHOP se réserve le droit d'annuler toute commande suspecte
                ou ne respectant pas les présentes CGV.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Paiement</h2>
              <p>Les modes de paiement acceptés sont :</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li><strong>Paiement à la livraison</strong> (espèces ou TPE) ;</li>
                <li><strong>Virement bancaire</strong> (sur présentation du justificatif) ;</li>
                <li><strong>Chèque</strong> (encaissement avant expédition) ;</li>
                <li><strong>Lettre de change (traite)</strong> ;</li>
                <li><strong>CRI (Contre-Remboursement Intégral)</strong>.</li>
              </ul>
              <p className="mt-3">
                En cas de paiement par chèque ou virement, la commande n'est traitée
                qu'après confirmation de la réception des fonds.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Livraison</h2>
              <p>
                La livraison est assurée sur l'ensemble du territoire tunisien. Les délais
                indicatifs sont de <strong>2 à 5 jours ouvrables</strong> selon la région.
                PNEU SHOP ne saurait être tenu responsable des retards dus à des
                circonstances extérieures (grèves, conditions météorologiques, perturbations
                des transporteurs).
              </p>
              <p className="mt-3">
                Les frais de livraison sont calculés en fonction du poids, du volume et de
                la destination et sont communiqués au client avant la validation de la
                commande. Le transfert des risques intervient à la remise du colis au
                transporteur.
              </p>
              <p className="mt-3">
                En cas d'avarie ou de perte lors du transport, le client doit formuler ses
                réserves auprès du transporteur dans un délai de <strong>3 jours</strong>{" "}
                à compter de la réception.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Garantie légale et garantie commerciale</h2>
              <p>
                Tous les produits vendus par PNEU SHOP bénéficient de la garantie légale
                contre les vices cachés conformément aux articles 643 et suivants du Code
                des Obligations et Contrats (COC) tunisien.
              </p>
              <p className="mt-3">
                PNEU SHOP propose en option une{" "}
                <strong>garantie commerciale de montage</strong> couvrant les défauts
                liés à la pose des pneus. Cette garantie est facultative et soumise à
                acceptation lors de la commande. Elle est nominative et liée au véhicule
                déclaré au moment de l'achat (immatriculation et kilométrage).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Droit de rétractation et retours</h2>
              <p>
                Conformément à la réglementation tunisienne sur le commerce électronique
                (Loi n° 2000-83), le client dispose d'un droit de rétractation dans un
                délai de <strong>7 jours</strong> à compter de la réception du produit,
                sous réserve que ce dernier soit retourné dans son état d'origine, non
                monté, dans son emballage d'origine.
              </p>
              <p className="mt-3">
                Les frais de retour sont à la charge du client, sauf si le produit est
                défectueux ou ne correspond pas à la commande. Tout pneu monté ou utilisé
                ne peut faire l'objet d'un retour sauf vice caché avéré.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Responsabilité</h2>
              <p>
                PNEU SHOP ne saurait être tenu responsable de dommages indirects résultant
                de l'utilisation des produits achetés. La responsabilité de PNEU SHOP est
                en tout état de cause limitée au montant de la commande en cause.
              </p>
              <p className="mt-3">
                Il appartient au client de s'assurer de la compatibilité des pneus commandés
                avec son véhicule (dimensions, indice de charge, indice de vitesse) avant
                toute pose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Réclamations et service après-vente</h2>
              <p>
                Pour toute réclamation, le client est invité à contacter notre service
                client via la{" "}
                <a href="/contact" className="text-yellow-600 hover:underline">
                  page contact
                </a>. PNEU SHOP s'engage à traiter toute réclamation dans un délai de
                <strong> 5 jours ouvrables</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Protection des données personnelles</h2>
              <p>
                Les données personnelles collectées lors de la commande sont traitées
                conformément à notre{" "}
                <a href="/confidentialite" className="text-yellow-600 hover:underline">
                  Politique de Confidentialité
                </a>
                , conforme à la Loi organique n° 2004-63 du 27 juillet 2004.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Propriété intellectuelle</h2>
              <p>
                L'ensemble des éléments du site pneushop.tn (textes, images, logos,
                structure) sont la propriété exclusive de PNEU SHOP et sont protégés
                par le droit tunisien de la propriété intellectuelle. Toute reproduction,
                même partielle, est interdite sans autorisation préalable écrite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Loi applicable et juridiction compétente</h2>
              <p>
                Les présentes CGV sont soumises au droit tunisien. En cas de litige, et
                à défaut de résolution amiable dans un délai de <strong>30 jours</strong>,
                les tribunaux tunisiennes compétents seront saisis. Tout litige relatif
                à l'interprétation ou à l'exécution des présentes CGV sera de la
                compétence exclusive des tribunaux de Tunis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">15. Modifications des CGV</h2>
              <p>
                PNEU SHOP se réserve le droit de modifier les présentes CGV à tout moment.
                Les CGV applicables sont celles en vigueur à la date de la commande.
                Il appartient au client de les consulter lors de chaque commande.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
