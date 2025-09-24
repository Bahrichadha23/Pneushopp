"use client";

// Importation des composants UI nécessaires pour la section hero
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
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
      <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Left side (Text Section) */}
          <div className="w-1/2 bg-white flex items-center justify-center overflow-hidden">
            <motion.div
              className="text-center max-w-full px-4 sm:px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 3.0, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              {/* Main Title */}
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight">
                PNEU SHOP
              </h1>

              {/* Subtitles */}
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-black mt-1 sm:mt-2">
                Le prix, la qualité,
              </p>
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-black">
                la performance
              </p>
            </motion.div>
          </div>

          {/* Yellow divider line */}
          {/* <div className="absolute top-0 mt-1.5 h-92 left-1/2 w-1 bg-yellow-400  transform translate-x-6 -skew-x-8 z-10"></div> */}
          {/* Yellow divider line */}
          <motion.div
            className="relative top-0 mt-1 h-full w-1 bg-yellow-400 z-10 hidden lg:block"
            initial={{ scaleY: 0, opacity: 0, skewX: -11, x: 24 }} // 24px ≈ translate-x-6
            animate={{ scaleY: 1, opacity: 1, skewX: -10, x: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          {/* <motion.div
            className="relative top-0 mt-1 h-full w-1 mr-3.5 bg-yellow-400 z-10 hidden"
            initial={{ scaleY: 0, opacity: 0, x: 24 }}
            animate={{ scaleY: 1, opacity: 1, skewX: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          /> */}
          <motion.div
            className="relative top-0 mt-1 h-full w-1 mr-4 bg-yellow-400 z-10 block lg:hidden"
            initial={{ scaleY: 0, opacity: 0, x: 24 }}
            animate={{ scaleY: 1, opacity: 1, skewX: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />

          {/* Right side (Image Section) */}
          <div className="w-1/2 mt-4 sm:mt-6 mb-4 sm:mb-6 relative overflow-hidden ">
            {/* Background image with slide-in */}
            <motion.div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(7% 0%, 100% 0%, 100% 100%, 0% 100%)",
              }}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img
                src="/hero-image.jpeg"
                alt="hero-image"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </div>
      <motion.div
        className="bg-black text-white flex items-center justify-center py-2 sm:py-4"
        initial={{ x: -200, opacity: 0 }} // Start off-screen left
        animate={{ x: 0, opacity: 1 }} // Move into place
        transition={{ duration: 0.8, ease: "easeOut" }} // Smooth effect
      >
        <div className="text-center font-bold tracking-wider text-xl sm:text-2xl md:text-3xl leading-tight space-y-0.5">
          <p>
            PRIX <span className="text-yellow-400">MINI</span>,
          </p>
          <p>PERFORMANCE</p>
          <p>
            <span className="text-yellow-400">MAXI</span>
          </p>
        </div>
      </motion.div>{" "}
      {/* Définitions des animations CSS personnalisées */}
      <style jsx>{`
        /* Animation de flottement pour les labels - chacun avec un timing différent */
        @keyframes float-1 {
          0%,
          100% {
            transform: translateY(0px) translateX(-50%);
          }
          50% {
            transform: translateY(-10px) translateX(-50%);
          }
        }
        @keyframes float-2 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes float-3 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes float-4 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-9px);
          }
        }
        @keyframes float-5 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-11px);
          }
        }
        @keyframes float-6 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        /* Animation de rotation lente pour l'image du pneu */
        @keyframes slow-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Animation d'apparition en fondu avec mouvement vertical */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Animation de glissement vers le haut pour les champs de formulaire */
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Animation de rebond lent pour le bouton de recherche */
        @keyframes bounce-slow {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        /* Classes d'animation avec délais échelonnés pour créer un effet de cascade */
        .animate-float-1 {
          animation: float-1 3s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 3.2s ease-in-out infinite 0.2s;
        }
        .animate-float-3 {
          animation: float-3 2.8s ease-in-out infinite 0.4s;
        }
        .animate-float-4 {
          animation: float-4 3.1s ease-in-out infinite 0.6s;
        }
        .animate-float-5 {
          animation: float-5 2.9s ease-in-out infinite 0.8s;
        }
        .animate-float-6 {
          animation: float-6 3.3s ease-in-out infinite 1s;
        }
        .animate-slow-spin {
          animation: slow-spin 20s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s both;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-slide-up-delay-1 {
          animation: slide-up 0.6s ease-out 0.1s both;
        }
        .animate-slide-up-delay-2 {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        .animate-slide-up-delay-3 {
          animation: slide-up 0.6s ease-out 0.3s both;
        }
        .animate-slide-up-delay-4 {
          animation: slide-up 0.6s ease-out 0.4s both;
        }
        .animate-slide-up-delay-5 {
          animation: slide-up 0.6s ease-out 0.5s both;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        /* Ajouté le dégradé radial pour l'arrière-plan circulaire */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </section>
  );
}
