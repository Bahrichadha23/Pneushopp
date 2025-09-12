"use client"

// Importation des composants UI nécessaires pour la section hero
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
          <div className="w-1/2 bg-gray-100 flex items-center justify-center overflow-hidden">
            <div className="text-center max-w-full px-8">
              {/* Titre principal en gros caractères */}
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight">PNEU SHOP</h1>
              {/* Sous-titres décrivant les valeurs de l'entreprise */}
              <p className="text-xl lg:text-2xl xl:text-3xl text-black mt-2">Le prix, la qualité,</p>
              <p className="text-xl lg:text-2xl xl:text-3xl text-black">la performance</p>
            </div>
          </div>

          <div className="absolute top-0 left-1/2 w-1 bg-yellow-400 h-full transform -translate-x-1/2 -skew-x-4 z-10"></div>

          <div className="w-1/2 relative overflow-hidden">
            <div className="absolute inset-0" style={{ clipPath: "polygon(2% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>
              <img
                src="/luxury-tires-golden-rims-warehouse-shelving-professional-lighting.jpg"
                alt="Pneus avec jantes dorées dans un entrepôt professionnel avec rayonnages"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Badge central en bas - positionné exactement comme l'original */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg">
              <div className="flex items-center space-x-3">
                {/* Icône de compteur de vitesse stylisée */}
                <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center relative">
                  <div className="w-1 h-4 bg-black absolute transform -rotate-45 origin-bottom"></div>
                  <div className="w-3 h-3 border border-black rounded-full bg-white"></div>
                </div>
                {/* Texte du slogan principal */}
                <span className="text-sm font-bold text-black uppercase tracking-wide">
                  LE PNEU FIABLE
                  <br />À BAS PRIX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section éducative "Comment lire un pneu" sur fond noir */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de la section avec animation d'apparition */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 animate-fade-in">
              <span className="text-yellow-400">COMMENT LIRE</span> UN PNEU ?
            </h2>
            <p className="text-xl animate-fade-in-delay">On vous explique tout !</p>
          </div>

          {/* Zone centrale avec image de pneu et labels explicatifs */}
          <div className="relative flex justify-center items-center">
            <div className="relative">
              <div className="absolute inset-0 w-96 h-96 rounded-full bg-yellow-400 transform scale-110"></div>

              <img
                src="/clean-tire-fully-transparent.jpg"
                alt="Pneu avec arrière-plan complètement transparent"
                className="relative w-96 h-96 object-contain animate-slow-spin z-10"
              />

              {/* Label RADIAL en haut */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-lg animate-float-1 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                RADIAL
              </div>
              {/* Label DIAMÈTRE à droite en haut */}
              <div className="absolute top-1/4 -right-20 text-yellow-400 font-bold text-lg animate-float-2 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                DIAMÈTRE
              </div>
              {/* Label CHARGE à droite au centre */}
              <div className="absolute top-1/2 -right-24 text-yellow-400 font-bold text-lg animate-float-3 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                CHARGE
              </div>
              {/* Label VITESSE à droite en bas */}
              <div className="absolute bottom-1/4 -right-20 text-yellow-400 font-bold text-lg animate-float-4 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                VITESSE
              </div>
              {/* Label HAUTEUR à gauche en bas */}
              <div className="absolute bottom-1/4 -left-20 text-yellow-400 font-bold text-lg animate-float-5 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                HAUTEUR
              </div>
              {/* Label LARGEUR à gauche au centre */}
              <div className="absolute top-1/2 -left-24 text-yellow-400 font-bold text-lg animate-float-6 bg-black px-4 py-2 rounded-lg border border-yellow-400 shadow-lg">
                LARGEUR
              </div>
            </div>
          </div>

          {/* Texte explicatif sous l'image */}
          <div className="mt-8 text-center text-sm">
            <p>Recherche de pneu par dimensions</p>
          </div>
        </div>
      </div>

      {/* Formulaire de recherche de pneus sur fond jaune */}
      <div className="bg-yellow-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grille de 6 champs de sélection avec animations échelonnées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Champ Largeur - obligatoire */}
            <div className="animate-slide-up">
              <label className="block text-sm font-bold text-black mb-2">Largeur *</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir largeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="175">175</SelectItem>
                  <SelectItem value="185">185</SelectItem>
                  <SelectItem value="195">195</SelectItem>
                  <SelectItem value="205">205</SelectItem>
                  <SelectItem value="215">215</SelectItem>
                  <SelectItem value="225">225</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Hauteur - obligatoire */}
            <div className="animate-slide-up-delay-1">
              <label className="block text-sm font-bold text-black mb-2">Hauteur *</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir hauteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="55">55</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="65">65</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Radial - généralement "R" pour radial */}
            <div className="animate-slide-up-delay-2">
              <label className="block text-sm font-bold text-black mb-2">Radial</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir le radial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R">R</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Diamètre - obligatoire */}
            <div className="animate-slide-up-delay-3">
              <label className="block text-sm font-bold text-black mb-2">Diamètre *</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir diamètre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="17">17</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="19">19</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Charge - indice de charge du pneu */}
            <div className="animate-slide-up-delay-4">
              <label className="block text-sm font-bold text-black mb-2">Charge</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir la charge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="88">88</SelectItem>
                  <SelectItem value="91">91</SelectItem>
                  <SelectItem value="94">94</SelectItem>
                  <SelectItem value="97">97</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Vitesse - indice de vitesse maximale */}
            <div className="animate-slide-up-delay-5">
              <label className="block text-sm font-bold text-black mb-2">Vitesse</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 hover:border-black transition-colors">
                  <SelectValue placeholder="Choisir la vitesse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">H</SelectItem>
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="W">W</SelectItem>
                  <SelectItem value="Y">Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bouton de recherche avec animation de rebond */}
          <div className="text-center">
            <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 font-bold rounded animate-bounce-slow hover:scale-105 transition-transform">
              RECHERCHE
            </Button>
          </div>
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
