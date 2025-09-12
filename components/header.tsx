"use client"
import { Search, ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import UserMenu from "@/components/auth/user-menu"

export default function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getTotalItems } = useCart()

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex flex-col items-start">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-black">PNEU SH</h1>
                  <div className="relative">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center relative">
                      <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                      {/* Motion lines */}
                      <div className="absolute -right-2 top-1 w-3 h-0.5 bg-yellow-400"></div>
                      <div className="absolute -right-3 top-2 w-2 h-0.5 bg-yellow-400"></div>
                      <div className="absolute -right-2 top-3 w-3 h-0.5 bg-yellow-400"></div>
                    </div>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-black">P</h1>
                </div>
                <p className="text-xs text-gray-600 hidden sm:block">Vos pneumatiques en un seul clic</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link
              href="/"
              className={`font-medium text-sm xl:text-base ${isActive("/") ? "text-yellow-500" : "text-gray-900 hover:text-yellow-500"} transition-colors`}
            >
              ACCUEIL
            </Link>
            <Link
              href="/a-la-une"
              className={`font-medium text-sm xl:text-base ${isActive("/a-la-une") ? "text-yellow-500" : "text-gray-900 hover:text-yellow-500"} transition-colors`}
            >
              À LA UNE
            </Link>
            <Link
              href="/boutique"
              className={`font-medium text-sm xl:text-base ${isActive("/boutique") ? "text-yellow-500" : "text-gray-900 hover:text-yellow-500"} transition-colors`}
            >
              BOUTIQUE
            </Link>
            <Link
              href="/a-propos"
              className={`font-medium text-sm xl:text-base ${isActive("/a-propos") ? "text-yellow-500" : "text-gray-900 hover:text-yellow-500"} transition-colors`}
            >
              À PROPOS
            </Link>
            <Link
              href="/contact"
              className={`font-medium text-sm xl:text-base ${isActive("/contact") ? "text-yellow-500" : "text-gray-900 hover:text-yellow-500"} transition-colors`}
            >
              CONTACT
            </Link>
          </nav>

          {/* Right side icons - Improved mobile layout */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-yellow-500 font-bold text-xs sm:text-sm hidden sm:block">OFFRES</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <UserMenu />

            <Link href="/panier">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </Button>
            </Link>

            {/* Mobile menu button - Added functional mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Added sliding mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-4">
              <Link
                href="/"
                className={`block font-medium ${isActive("/") ? "text-yellow-500" : "text-gray-900"} py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ACCUEIL
              </Link>
              <Link
                href="/a-la-une"
                className={`block font-medium ${isActive("/a-la-une") ? "text-yellow-500" : "text-gray-900"} py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                À LA UNE
              </Link>
              <Link
                href="/boutique"
                className={`block font-medium ${isActive("/boutique") ? "text-yellow-500" : "text-gray-900"} py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                BOUTIQUE
              </Link>
              <Link
                href="/a-propos"
                className={`block font-medium ${isActive("/a-propos") ? "text-yellow-500" : "text-gray-900"} py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                À PROPOS
              </Link>
              <Link
                href="/contact"
                className={`block font-medium ${isActive("/contact") ? "text-yellow-500" : "text-gray-900"} py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CONTACT
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <span className="text-yellow-500 font-bold text-sm">OFFRES SPÉCIALES</span>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
