"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NewsSection() {
  const newsItems = [
    {
      id: 1,
      title: "ÉVÉNEMENT",
      image: "/dark-warehouse-interior-with-tire-storage-racks.jpg",
      description: "Découvrez nos derniers événements et promotions",
      link: "/a-la-une",
    },
    {
      id: 2,
      title: "ACTUALITÉS",
      image: "/industrial-tire-warehouse-with-shelving-and-lighti.jpg",
      description: "Restez informé des dernières actualités du secteur",
      link: "/a-la-une",
    },
    {
      id: 3,
      title: "PROMOTION",
      image: "/modern-tire-storage-facility-with-industrial-light.jpg",
      description: "Profitez de nos offres promotionnelles exceptionnelles",
      link: "/boutique",
    },
  ];

  const cardVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.9 },
    show: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15,
      },
    },
  };

  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black tracking-tight"
            initial={{
              rotate: 90,
              opacity: 0,
              transformOrigin: "right center",
            }}
            whileInView={{ rotate: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 12,
              duration: 1.5,
            }}
          >
            À LA UNE
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <Link key={item.id} href={item.link}>
              <motion.div
                className="bg-black text-white cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
