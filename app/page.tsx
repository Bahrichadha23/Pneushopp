import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import TireGuideSection from "@/components/tire-guide-section";
import NewsSection from "@/components/news-section";
import WhyChooseUsSection from "@/components/why-choose-us-section";
import ProductCategoriesSection from "@/components/product-categories-section";
import ManufacturersSection from "@/components/manufacturers-section";
import Footer from "@/components/footer";
import Link from "next/link";
import { Truck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <TireGuideSection />
      <NewsSection />
      <WhyChooseUsSection />
      <ProductCategoriesSection />

      {/* Bannière Livraison Rapide */}
      <div className="bg-gray-900 py-12 text-center relative overflow-hidden">
        {/* subtle diagonal stripe */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative max-w-xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1 mb-4">
            <Truck className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Livraison</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Livraison <span className="text-yellow-400">Rapide</span> en{" "}
            <span className="text-yellow-400">2 à 4 jours</span>
          </h2>
          <p className="text-gray-400 mb-6">
            Pour toute commande de 2 pneus ou plus, partout en Tunisie.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2.5 rounded-full transition-colors duration-200 text-sm"
          >
            Voir la boutique →
          </Link>
        </div>
      </div>

      <ManufacturersSection />
      <Footer />
    </div>
  );
}
