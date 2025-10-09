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
    // <section className="relative w-full h-[90vh] overflow-hidden">
    //   <video src="/hero-video.mp4" className="absolute inset-0 w-full px-10 py-5 h-full object-cover" autoPlay
    //     loop
    //     muted
    //     playsInline></video>
    // </section>
    <section className="relative w-full h-[90vh] overflow-hidden">
      <video
        src="/hero-video.mp4"
        className="absolute inset-0 w-full h-full object-cover object-center"
        autoPlay
        loop
        muted
        playsInline
      />
    </section>

  );
}
