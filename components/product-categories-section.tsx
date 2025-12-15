"use client";
import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button"
import Link from "next/link";
export default function ProductCategoriesSection() {
  const categories = [
    {
      id: 1,
      name: "PNEU AGRICOLE",
      image: "/AGRICOLE.jpeg",
      description: "Pneus spécialisés pour tracteurs et machines agricoles",
      slug: "continental",
    },
    {
      id: 2,
      name: "PNEU 4*4",
      image: "/4X4.jpeg",
      description: "Pneus pour voitures particulières et berlines",
      slug: "continental",
    },
    {
      id: 3,
      name: "PNEU MOTO",
      image: "/MOTO.jpeg",
      description: "Pneus renforcés pour utilitaires et camionnettes",
      slug: "continental",
    },
    {
      id: 4,
      name: "PNEU TOURISM",
      image: "/TOURISM.jpeg",
      description: "Pneus haute résistance pour camions et poids lourds",
      slug: "continental",
    },
    {
      id: 5,
      name: "PNEU UTILITAIRE",
      image: "/UTILITAIRE.jpeg",
      description: "Pneus haute résistance pour camions et poids lourds",
      slug: "continental",
    },
  ];

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading with bounce animation */}
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: -80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 10,
              duration: 1.2,
            }}
            viewport={{ once: true, amount: 0.5 }}
          >
            DÉCOUVREZ <span className="text-yellow-500">NOS PNEUS</span>
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: -60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 12,
              duration: 1.2,
              delay: 0.2, // appears slightly after heading
            }}
            viewport={{ once: true, amount: 0.5 }}
          >
            PAR CATÉGORIES
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 50 }} // start hidden & below
              whileInView={{ opacity: 1, y: 0 }} // animate into place
              viewport={{ once: true, amount: 0.2 }} // trigger when in view
              transition={{
                duration: 0.8,
                delay: index * 0.15, // stagger effect
                type: "spring",
                stiffness: 120,
                damping: 12,
              }}
            >
              <div className="aspect-square p-6 flex items-center justify-center bg-gray-100">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>
                <Link
                  href={`/boutique?category=${category.slug}`}
                  className="w-full text-center px-2 py-2 border-2 border-yellow-300 rounded-md font-semibold text-gray-700 bg-transparent 
             hover:bg-yellow-300 hover:text-white transition duration-300 ease-in-out"
                >
                  Voir les pneus
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
