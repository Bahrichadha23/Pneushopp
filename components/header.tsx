"use client";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import UserMenu from "@/components/auth/user-menu";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, ChevronDown } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = (path: string) => pathname === path;

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
                <Image src="/logo.png" alt="Logo" width={150} height={100} />
              </motion.div>
              {/* Mobile Logo with top animation */}
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="block sm:hidden ml-10"
              >
                <Image
                  src="/logo.png"
                  alt="Mobile Logo"
                  width={120}
                  height={100}
                  // width = {40}
                  // height = {20}
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

          {/* Desktop User Menu */}
          <div className="hidden lg:block">
            <UserMenu />
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile User Menu Trigger */}
            <div className="relative inline-block text-left lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center font-medium text-gray-900 hover:text-yellow-500"
              >
                {/* User Icon */}
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
                {/* Chevron Icon */}
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg border border-gray-200 z-20"
                  >
                    <Link
                      href="/auth/login"
                      className="block px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Inscription
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Cart Button */}
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
          <div className="lg:hidden absolute top-14 left-0 w-full border-t border-gray-200 bg-white shadow-lg z-40">
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
  );
}
