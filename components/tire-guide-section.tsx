"use client";
import { motion } from "framer-motion";

export default function TireGuideSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h2
          className="text-3xl font-bold text-yellow-500 mb-2"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          COMMENT LIRE <span className="text-black">UN PNEU ?</span>
        </motion.h2>

        <motion.p
          className="text-lg font-bold text-black"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          viewport={{ once: true }}
        >
          On vous explique tout !
        </motion.p>
      </div>
    </div>


        
      {/* Formulaire de recherche de pneus sur fond jaune */}
      <div className="bg-yellow-400 py-12 px-6">
        <div className="space-y-6 text-center">
          
          {/* Largeur */}
          <div>
            <label className="block text-sm font-bold text-black mb-1">Largeur *</label>
            <input
              type="text"
              placeholder="Entrer la largeur"
              className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
            />
          </div>

        {/* Hauteur */}
        <div>
          <label className="block text-sm font-bold text-black mb-1">Hauteur *</label>
          <input
            type="text"
            placeholder="Entrer la hauteur"
            className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
          />
        </div>

        {/* Radial */}
        <div>
          <label className="block text-sm font-bold text-black mb-1">Radial</label>
          <input
            type="text"
            placeholder="Entrer le radial"
            className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
          />
        </div>

        {/* Diamètre */}
        <div>
          <label className="block text-sm font-bold text-black mb-1">Diamètre *</label>
          <input
            type="text"
            placeholder="Entrer le diamètre"
            className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
          />
        </div>

        {/* Charge */}
        <div>
          <label className="block text-sm font-bold text-black mb-1">Charge</label>
          <input
            type="text"
            placeholder="Entrer la charge"
            className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
          />
        </div>

        {/* Vitesse */}
        <div>
          <label className="block text-sm font-bold text-black mb-1">Vitesse</label>
          <input
            type="text"
            placeholder="Entrer la vitesse"
            className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none"
          />
        </div>
      </div>
    </div>

  {/* Button */}
  <div className="text-center pt-8">
      <motion.button
        className="bg-black text-white font-bold p-3 rounded hover:bg-gray-800 transition"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
        transition={{
          opacity: { duration: 1 }, // fade in smoothly
          x: { duration: 0.6, ease: "easeInOut", delay: 1 }, // shake after fade
        }}
      >
        Rechercher
      </motion.button>
    </div>
      </div>
    </section>
  )
}
