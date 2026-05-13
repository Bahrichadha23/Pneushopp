"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const newsItems = [
  {
    id: 1,
    num: "01",
    category: "Événements",
    title: "Salons & Actualités",
    description: "Retrouvez nos événements, salons professionnels et toutes les actualités Pneushop.",
    image: "/Evenements.jpeg",
    link: "/a-la-une",
    cta: "Voir les événements",
    accent: "#D4A017",        // jaune
    textAccent: "text-yellow-400",
    borderAccent: "group-hover:border-yellow-400",
    badgeBg: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30",
    large: true,
  },
  {
    id: 2,
    num: "02",
    category: "Actualités",
    title: "Le Monde du Pneu",
    description: "Dernières nouvelles du secteur pneumatique et conseils d'experts.",
    image: "/Actualite.jpeg",
    link: "/a-la-une",
    cta: "Lire les actualités",
    accent: "#60A5FA",        // bleu
    textAccent: "text-blue-400",
    borderAccent: "group-hover:border-blue-400",
    badgeBg: "bg-blue-400/20 text-blue-300 border border-blue-400/30",
    large: false,
  },
  {
    id: 3,
    num: "03",
    category: "Promotions",
    title: "Offres Spéciales",
    description: "Remises exclusives et meilleures offres du moment sur nos pneumatiques.",
    image: "/Promotion.jpeg",
    link: "/promotion",
    cta: "Voir les promotions",
    accent: "#F87171",        // rouge
    textAccent: "text-red-400",
    borderAccent: "group-hover:border-red-400",
    badgeBg: "bg-red-400/20 text-red-300 border border-red-400/30",
    large: false,
  },
];

export default function NewsSection() {
  const [main, ...side] = newsItems;

  return (
    <section className="bg-gray-950 py-20 relative overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Section header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <motion.p
              className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-3 flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="w-8 h-px bg-yellow-400 inline-block" />
              Pneushop
            </motion.p>
            <motion.h2
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              À la <span className="text-yellow-400">Une</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/a-la-une"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-yellow-400 transition-colors duration-200 group"
            >
              Tout voir
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* ── Layout éditorial : 1 grande carte + 2 petites ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Grande carte — ÉVÉNEMENTS */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
          >
            <Link href={main.link} className="group block h-full">
              <div className={`relative h-[420px] sm:h-[500px] lg:h-full min-h-[420px] rounded-2xl overflow-hidden border-2 border-white/5 ${main.borderAccent} transition-all duration-400 shadow-xl`}>
                {/* Image */}
                <img
                  src={main.image}
                  alt={main.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Numéro décoratif */}
                <div className="absolute top-5 right-6 text-white/10 font-black text-7xl leading-none select-none">
                  {main.num}
                </div>

                {/* Badge catégorie */}
                <div className="absolute top-5 left-5">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${main.badgeBg}`}>
                    {main.category}
                  </span>
                </div>

                {/* Contenu bas */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h3 className="text-3xl font-extrabold text-white mb-3 tracking-tight leading-tight">
                    {main.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-sm">
                    {main.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-2 text-sm font-bold transition-all duration-300 group-hover:gap-3"
                    style={{ color: main.accent }}
                  >
                    {main.cta}
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Deux petites cartes */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {side.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex-1"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: 0.12 + i * 0.1, duration: 0.55 }}
              >
                <Link href={item.link} className="group block h-full">
                  <div className={`relative h-[220px] sm:h-[240px] rounded-2xl overflow-hidden border-2 border-white/5 ${item.borderAccent} transition-all duration-400 shadow-xl`}>
                    {/* Image */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* Numéro décoratif */}
                    <div className="absolute top-3 right-5 text-white/10 font-black text-5xl leading-none select-none">
                      {item.num}
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${item.badgeBg}`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Contenu */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-xl font-extrabold text-white mb-1 tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-300 group-hover:gap-2.5"
                        style={{ color: item.accent }}
                      >
                        {item.cta}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

        {/* ── Séparateur bas ── */}
        <motion.div
          className="mt-14 flex items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Pneushop · Votre spécialiste pneu</span>
          <div className="h-px flex-1 bg-white/10" />
        </motion.div>
      </div>
    </section>
  );
}
