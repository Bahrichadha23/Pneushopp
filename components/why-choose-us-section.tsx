"use client";
import { motion } from "framer-motion";
import { Truck, Star, ShieldCheck } from "lucide-react";

const columns = [
  {
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: (
      <>
        <strong>Pneushop.tn</strong>, leader en Tunisie de la vente en ligne de
        pneumatiques, propose un large choix de pneus pas chers :{" "}
        <strong>
          pneus pour voiture, SUV et 4X4, camionnette et utilitaire, pneus
          agricoles et poids-lourd.
        </strong>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: (
      <>
        Acheter de nouveaux pneus n'est pas toujours évident. Vous trouverez sur
        le site un large choix de pneus pas chers, des marques et des conseils
        pour trouver les pneus auto qui vous conviennent.{" "}
        <strong>Tous les pneus pour tous types de véhicules.</strong>
      </>
    ),
  },
  {
    icon: Truck,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    text: (
      <>
        <strong>Pneushop</strong>, le meilleur e-commerçant dans la catégorie
        vente de pneus, propose également de nombreux services : livraison
        rapide, montage et conseil pour{" "}
        <strong>voitures, SUV, 4X4 et camionnettes.</strong>
      </>
    ),
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-10">
          <motion.p
            className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500 mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Notre engagement
          </motion.p>
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold text-gray-900"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            Pourquoi acheter sur{" "}
            <span className="text-yellow-500">Pneushop.tn</span> ?
          </motion.h2>
        </div>

        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col, i) => {
            const Icon = col.icon;
            return (
              <motion.div
                key={i}
                className={`rounded-xl border ${col.border} ${col.bg} p-6 flex flex-col gap-4`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border ${col.border}`}>
                  <Icon className={`w-5 h-5 ${col.color}`} />
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">{col.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
