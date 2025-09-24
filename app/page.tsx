// Importation de tous les composants nécessaires pour construire la page d'accueil
import Header from "@/components/header"; // En-tête avec navigation et logo
import HeroSection from "@/components/hero-section"; // Section principale avec bannière et recherche
import TireGuideSection from "@/components/tire-guide-section"; // Section "Comment lire un pneu"
import NewsSection from "@/components/news-section"; // Section "À la une" avec actualités
import WhyChooseUsSection from "@/components/why-choose-us-section"; // Section "Pourquoi nous choisir"
import ProductCategoriesSection from "@/components/product-categories-section"; // Catégories de pneus
import ManufacturersSection from "@/components/manufacturers-section"; // Logos des fabricants
import Footer from "@/components/footer"; // Pied de page avec informations de contact

/**
 * Composant principal de la page d'accueil du site Pneu Shop
 * Structure la mise en page complète du site e-commerce de pneumatiques
 *
 * @returns JSX.Element - La page d'accueil complète
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* En-tête du site avec logo, navigation et icônes utilisateur */}
      <Header />

      {/* Section hero principale avec bannière, titre et formulaire de recherche */}
      <HeroSection />

      {/* Section éducative expliquant comment lire les dimensions d'un pneu */}
      <TireGuideSection />

      {/* Section actualités avec événements, news et promotions */}
      <NewsSection />

      {/* Section argumentaire commercial expliquant les avantages du site */}
      <WhyChooseUsSection />

      {/* Section présentant les différentes catégories de pneus disponibles */}
      <ProductCategoriesSection />

      {/* Section promotionnelle pour la livraison gratuite */}
      <div className="bg-gray-50 py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Livraison <span className="text-yellow-400">GRATUITE</span> en{" "}
          <span className="text-yellow-400">2 à 4 jours</span>
        </h2>
        <p className="text-xl text-gray-600">
          pour toute commande de 2 pneus ou plus
        </p>
      </div>

      {/* Section affichant les logos des marques partenaires */}
      <ManufacturersSection />

      {/* Pied de page avec informations de contact et liens utiles */}
      <Footer />
    </div>
  );
}
