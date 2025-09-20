"use client"
import { Search, ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import UserMenu from "@/components/auth/user-menu"
import Image from "next/image"  
import { motion } from "framer-motion"

export default function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getTotalItems } = useCart()

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
   <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
    <div className="flex items-center justify-between h-14 sm:h-16">
       {/* Mobile menu button */}
       <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      {/* Logo Section */}
      <div className="flex items-center">
      <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
        {/* Desktop Logo with left animation */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden sm:block"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={150}
            height={100}
          />
        </motion.div>

        {/* Mobile Logo with top animation */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="block sm:hidden ml-10"
        >
          <Image
            src="/mobile-logo.png"
            alt="Mobile Logo"
            width={40}
            height={20}
          />
        </motion.div>
      </Link>
    </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
        {[
          { href: "/", label: "ACCUEIL" },
          { href: "/a-la-une", label: "À LA UNE" },
          { href: "/boutique", label: "BOUTIQUE" },
          { href: "/a-propos", label: "À PROPOS" },
          { href: "/contact", label: "CONTACT" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`font-medium text-sm xl:text-base ${
              isActive(item.href)
                ? "text-yellow-500"
                : "text-gray-900 hover:text-yellow-500"
            } transition-colors`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right side icons */}
      <div className="flex items-center space-x-2 sm:space-x-3">
  {/* UserMenu only for desktop */}
  

      <div className="hidden lg:block">
        <UserMenu />
     </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10">
           <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>   

        <Link href="/panier">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {getTotalItems()}
            </span>
          </Button>
        </Link>

       
      </div>
    </div>

   {/* Mobile Navigation Menu */}
  {isMobileMenuOpen && (
    <div className="lg:hidden border-t border-gray-200  bg-white">
      <nav className="px-4 py-4 space-y-2 sm:space-y-3">
      {[
        { href: "/", label: "ACCUEIL" },
        { href: "/a-la-une", label: "À LA UNE" },
        { href: "/boutique", label: "BOUTIQUE" },
        { href: "/a-propos", label: "À PROPOS" },
        { href: "/contact", label: "CONTACT" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block font-medium cursor-pointer ${
            isActive(item.href) ? "text-yellow-500" : "text-gray-900"
          } py-2`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ))}

      {/* Added Login + Signup */}
      <div className="pt-3 border-t border-gray-200">
        <Link
          href="/auth/login"
          className="block hover:cursor-pointer font-medium text-gray-900 hover:text-yellow-500 py-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Connexion
        </Link>
        <Link
          href="/auth/register"
          className="block hover:cursor-pointer font-medium text-gray-900 hover:text-yellow-500 py-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Inscription
        </Link>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <span className="text-yellow-500 font-bold text-xs sm:text-sm">
          OFFRES SPÉCIALES
        </span>
      </div>
    </nav>
  </div>
   )}
  </div>
</header>
  )
}
