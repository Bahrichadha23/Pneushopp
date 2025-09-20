"use client"

// Importation des composants UI nécessaires pour la section hero
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
/**
 * Composant HeroSection - Section principale de la page d'accueil
 * Contient la bannière hero, la section "Comment lire un pneu" et le formulaire de recherche
 *
 * Structure:
 * 1. Bannière hero avec image et texte divisés par une ligne jaune diagonale
 * 2. Section éducative sur fond noir expliquant la lecture des dimensions de pneu
 * 3. Formulaire de recherche sur fond jaune avec 6 champs de sélection
 *
 * @returns JSX.Element - La section hero complète avec animations
 */
export default function HeroSection() {
  return (
    <section className="relative">
      {/* Bannière hero principale avec design split-screen */}
      <div className="relative h-80 lg:h-96 overflow-hidden">
              <div className="absolute inset-0 flex">
                
                <div className="w-1/2 lg:w-1/2 bg-gray-100 flex items-center justify-center overflow-hidden">
                <motion.div
                  className="text-center max-w-full px-4 sm:px-8"
                  initial={{ x: -150, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    duration: 1,
                    ease: "easeOut",
                  }}
                  whileInView={{
                    x: [0, -10, 10, -5, 0], 
                  }}
                  viewport={{ once: true }}
                >
              {/* Main Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight">
                PNEU SHOP
              </h1>

              {/* Subtitles */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-black mt-2">
                Le prix, la qualité,
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-black">
                la performance
              </p>
            </motion.div>
          </div>

          <div className="absolute top-0 left-1/2 w-1 bg-yellow-400 h-full transform -translate-x-1/2 -skew-x-4 z-10"></div>

          <div className="w-1/2 relative overflow-hidden">
          {/* Background image with cinematic reveal */}
          <div
            className="absolute inset-0 animate-reveal-zoom"
            style={{ clipPath: "polygon(2% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          >
            <img
              src="/luxury-tires-golden-rims-warehouse-shelving-professional-lighting.jpg"
              alt="Pneus avec jantes dorées dans un entrepôt professionnel avec rayonnages"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Badge with fade-in bounce */}
       <div className="ml-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-badge-in">
        <div className="bg-white rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center space-x-3">
            {/* Speedometer icon with spin */}
            <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center relative animate-spin-once">
              <div className="w-1 h-4 bg-black absolute transform -rotate-45 origin-bottom"></div>
              <div className="w-3 h-3 border border-black rounded-full bg-white"></div>
        </div>

            {/* Main slogan text */}
            <span className="text-sm font-bold text-black uppercase tracking-wide">
              LE PNEU FIABLE
              <br />À BAS PRIX
            </span>
            </div>
        </div>
      </div>
        </div>

        </div>
      </div>

      <div className="bg-black text-white flex items-center justify-center">
      <div className="text-center font-bold tracking-wider text-3xl leading-tight space-y-0.5">
        <p>
          PRIX <span className="text-yellow-400">MINI</span>,
        </p>
        <p>
          PERFORMANCE
        </p>
        <p>
          <span className="text-yellow-400">MAXI</span>
        </p>
      </div>
    </div>
      {/* Définitions des animations CSS personnalisées */}
      <style jsx>{`
        /* Animation de flottement pour les labels - chacun avec un timing différent */
        @keyframes float-1 { 0%, 100% { transform: translateY(0px) translateX(-50%); } 50% { transform: translateY(-10px) translateX(-50%); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes float-3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-4 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
        @keyframes float-5 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-11px); } }
        @keyframes float-6 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
        
        /* Animation de rotation lente pour l'image du pneu */
        @keyframes slow-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Animation d'apparition en fondu avec mouvement vertical */
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Animation de glissement vers le haut pour les champs de formulaire */
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Animation de rebond lent pour le bouton de recherche */
        @keyframes bounce-slow { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        
        /* Classes d'animation avec délais échelonnés pour créer un effet de cascade */
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 3.2s ease-in-out infinite 0.2s; }
        .animate-float-3 { animation: float-3 2.8s ease-in-out infinite 0.4s; }
        .animate-float-4 { animation: float-4 3.1s ease-in-out infinite 0.6s; }
        .animate-float-5 { animation: float-5 2.9s ease-in-out infinite 0.8s; }
        .animate-float-6 { animation: float-6 3.3s ease-in-out infinite 1s; }
        .animate-slow-spin { animation: slow-spin 20s linear infinite; }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-fade-in-delay { animation: fade-in 1s ease-out 0.3s both; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-up-delay-1 { animation: slide-up 0.6s ease-out 0.1s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.6s ease-out 0.3s both; }
        .animate-slide-up-delay-4 { animation: slide-up 0.6s ease-out 0.4s both; }
        .animate-slide-up-delay-5 { animation: slide-up 0.6s ease-out 0.5s both; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }

        /* Ajouté le dégradé radial pour l'arrière-plan circulaire */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </section>
  )
}
