"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const newsItems = [
  {
    id: 1,
    title: "ÉVÉNEMENTS",
    subtitle: "À la une",
    description: "Découvrez nos derniers événements, salons et actualités Pneushop",
    image: "/Evenements.jpeg",
    link: "/a-la-une",
    cta: "Voir les événements",
    accent: "#D4A017",
  },
  {
    id: 2,
    title: "ACTUALITÉS",
    subtitle: "Le monde du pneu",
    description: "Restez informé des dernières nouvelles du secteur pneumatique",
    image: "/Actualite.jpeg",
    link: "/a-la-une",
    cta: "Lire les actualités",
    accent: "#1A73E8",
  },
  {
    id: 3,
    title: "PROMOTIONS",
    subtitle: "Offres spéciales",
    description: "Profitez de nos meilleures offres et remises exclusives",
    image: "/Promotion.jpeg",
    link: "/promotion",
    cta: "Voir les promotions",
    accent: "#E53E3E",
  },
];

export default function NewsSection() {
  return (
    <section className="bg-gray-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.p
            className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-2"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Découvrez
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            À LA <span className="text-yellow-400">UNE</span>
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link href={item.link} className="group block h-full">
                <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer">
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Top badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: item.accent }}>
                      {item.subtitle}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all duration-300"
                      style={{ color: item.accent }}>
                      {item.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Hover border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-yellow-400 transition-all duration-300 pointer-events-none" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
