// Composant footer optimisé pour mobile avec sections repliables
"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MobileOptimizedFooter() {
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  return (
    <footer className="bg-black text-white">
      {/* Section principale avec informations de contact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact - toujours visible */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold mb-4">NOUS CONTACTER :</h3>
            <div className="space-y-2 text-sm">
              <p>Tél. : +216 29 353 666</p>
              <p>Adresse : 9 Rue El Milaha, Menzah 8, 2037, ARIANA</p>
              <p>E-mail : service.commercial@pneushop.tn</p>
              <p>Horaires : LUNDI - SAMEDI</p>
            </div>
          </div>

          {/* Newsletter - Section repliable sur mobile */}
          <div className="lg:col-span-1">
            <div className="lg:hidden">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto text-left"
                onClick={() => toggleSection("newsletter")}
              >
                <h3 className="text-lg font-bold">NEWSLETTER</h3>
                {openSections.includes("newsletter") ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>

            <div
              className={`${openSections.includes("newsletter") || "lg:block"} ${!openSections.includes("newsletter") && "hidden lg:block"} mt-4 lg:mt-0`}
            >
              <h3 className="hidden lg:block text-lg font-bold mb-4">NEWSLETTER</h3>
              <p className="text-sm mb-4">
                Abonnez-vous à notre newsletter. Inscrivez-vous à notre e-mail pour obtenir les dernières nouvelles.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your e-mail..."
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm"
                />
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 text-sm">→</Button>
              </div>

              {/* Applications mobiles */}
              <div className="flex gap-2 mt-4">
                <Button className="bg-white text-black px-4 py-2 rounded text-sm">Apple</Button>
                <Button className="bg-white text-black px-4 py-2 rounded text-sm">Google</Button>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux - Section repliable sur mobile */}
          <div className="lg:col-span-1">
            <div className="lg:hidden">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto text-left"
                onClick={() => toggleSection("social")}
              >
                <h3 className="text-lg font-bold">SUIVEZ-NOUS</h3>
                {openSections.includes("social") ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>

            <div
              className={`${openSections.includes("social") || "lg:block"} ${!openSections.includes("social") && "hidden lg:block"} mt-4 lg:mt-0`}
            >
              <h3 className="hidden lg:block text-lg font-bold mb-4">SUIVEZ-NOUS</h3>
              <div className="flex gap-2">
                {/* Icônes des réseaux sociaux */}
                <div className="w-8 h-8 bg-white rounded"></div>
                <div className="w-8 h-8 bg-white rounded"></div>
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <span>PNEU SHOP</span>
            </div>
            <p className="text-center sm:text-right">
              © Droits d'auteur 2024 pneushop.
              <br className="sm:hidden" />
              par Innovation-wep.pro Tunisie
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
