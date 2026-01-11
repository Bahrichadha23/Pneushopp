import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

export default function ALaUnePage() {
  const newsItems = [
    {
      id: 1,
      slug: "nouvelle-gamme-continental",
      title: "Nouvelle Gamme Continental",
      category: "ÉVÉNEMENT",
      image: "/Evenements.jpeg",
      excerpt:
        "Découvrez la nouvelle gamme Continental PremiumContact 7 avec une technologie révolutionnaire pour une adhérence optimale.",
    },
    {
      id: 2,
      slug: "promotion-speciale-pirelli",
      title: "Promotion Spéciale Pirelli",
      category: "PROMOTION",
      image: "/Promotion.jpeg",
      excerpt:
        "Profitez de -20% sur tous les pneus Pirelli jusqu'à la fin du mois. Offre valable sur toute la gamme.",
    },
    {
      id: 3,
      slug: "guide-entretien-pneus",
      title: "Guide d'Entretien des Pneus",
      category: "ACTUALITÉS",
      image: "/Actualite.jpeg",
      excerpt:
        "Apprenez comment prolonger la durée de vie de vos pneus avec nos conseils d'experts.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">À La Une</h1>
          <p className="text-lg text-gray-600">
            Découvrez nos dernières actualités, événements et promotions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <article
              key={item.id}
              className="bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold">
                    {item.category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h2>
                <p className="text-gray-600 mb-4">{item.excerpt}</p>

                {/* Link to slug page */}
                <Link
                  href={item.id === 2 ? "/promotion" : `/a-la-une/${item.slug}`}
                >
                  <span className="hover:text-yellow-600 font-semibold text-yellow-500">
                    Lire la suite →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
