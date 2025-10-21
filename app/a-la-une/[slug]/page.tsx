import Header from "@/components/header";
import Footer from "@/components/footer";

const newsItems = [
  {
    id: 1,
    slug: "nouvelle-gamme-continental-2024",
    title: "Nouvelle Gamme Continental 2024",
    date: "15 Janvier 2024",
    category: "ÉVÉNEMENT",
    image: "/placeholder.svg?key=news1",
    content: `
      Découvrez la nouvelle gamme Continental PremiumContact 7 avec une
      technologie révolutionnaire pour une adhérence optimale.
      <br /><br />
      Ce pneu offre une sécurité accrue sur sol mouillé et une performance
      améliorée sur routes sèches.
    `,
  },
  {
    id: 2,
    slug: "promotion-speciale-pirelli",
    title: "Promotion Spéciale Pirelli",
    date: "10 Janvier 2024",
    category: "PROMOTION",
    image: "/placeholder.svg?key=promo2",
    content: `
      Profitez de -20% sur tous les pneus Pirelli jusqu'à la fin du mois.
      <br /><br />
      Offre valable sur toute la gamme dans nos points de vente et en ligne.
    `,
  },
  {
    id: 3,
    slug: "guide-entretien-pneus",
    title: "Guide d'Entretien des Pneus",
    date: "5 Janvier 2024",
    category: "ACTUALITÉS",
    image: "/placeholder.svg?key=guide1",
    content: `
      Apprenez comment prolonger la durée de vie de vos pneus avec nos conseils
      d'experts : pression régulière, rotation, équilibrage et alignement.
    `,
  },
];

// ✅ Add this function here:
export async function generateStaticParams() {
  return newsItems.map((item) => ({
    slug: item.slug,
  }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = newsItems.find((item) => item.slug === params.slug);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Article introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold">
          {article.category}
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {article.title}
        </h1>
        <p className="text-sm text-gray-500 mt-2">{article.date}</p>
        <div className="mt-6">
          <img
            src={article.image}
            alt={article.title}
            className="w-full rounded-lg shadow-md"
          />
        </div>
        <div
          className="mt-6 text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>
      <Footer />
    </div>
  );
}
