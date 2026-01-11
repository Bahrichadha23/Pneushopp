"use client";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/cart-context";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const prevCartCount = useRef(0);
  const isActive = (path: string) => pathname === path;
  const { user, logout } = useAuth();

  // Watch for cart count changes and trigger animation
  useEffect(() => {
    const currentCount = getTotalItems();
    
    // If cart has items, trigger animation every 2 seconds
    if (currentCount > 0) {
      setShowCartAnimation(true);
      
      const interval = setInterval(() => {
        setShowCartAnimation(false);
        setTimeout(() => {
          setShowCartAnimation(true);
        }, 100); // Brief pause before next animation
      }, 2000);
      
      return () => clearInterval(interval);
    } else {
      setShowCartAnimation(false);
    }
  }, [getTotalItems()]);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
    } else {
      router.push("/panier");
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Remove previous highlights
    const prevHighlights = document.querySelectorAll('.search-highlight');
    prevHighlights.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });

    // Search and highlight in page content
    const win = window as any;
    if (win.find) {
      win.find(searchQuery, false, false, true, false, true, false);
    } else {
      // Fallback for browsers that don't support window.find
      const bodyText = document.body.innerHTML;
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      const newText = bodyText.replace(regex, '<span class="search-highlight bg-yellow-300">$1</span>');
      if (bodyText !== newText) {
        document.body.innerHTML = newText;
      }
    }

    // Scroll to first occurrence
    const firstMatch = document.querySelector('.search-highlight');
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
              {/* Desktop Logo with animation */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden sm:block"
              >
                <Image
                  src="/logo.png"
                  alt="Logo PneuShop"
                  width={150}
                  height={100}
                />
              </motion.div>
              {/* Mobile Logo */}
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="block sm:hidden ml-10"
              >
                <Image
                  src="/logo.png"
                  alt="Logo Mobile PneuShop"
                  width={120}
                  height={100}
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

          {/* Desktop User Menu (Updated) */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop User Menu (with dropdown) */}
                <div className="relative hidden lg:inline-block text-left">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center font-medium text-gray-900 hover:text-yellow-500"
                  >
                    <UserCircle className="h-6 w-6 mr-1" />
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
                        {user ? (
                          <>
                            <Link
                              href="/profile"
                              className="block px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                              onClick={() => setIsOpen(false)}
                            >
                              Mon Profil
                            </Link>
                            <button
                              onClick={() => {
                                logout();
                                setIsOpen(false);
                                window.location.reload();
                              }}
                              className="w-full text-left px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                            >
                              Déconnexion
                            </button>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-900 hover:text-yellow-500 font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="text-gray-900 hover:text-yellow-500 font-medium"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile User Menu Trigger */}
            <div className="relative inline-block text-left lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center font-medium text-gray-900 hover:text-yellow-500"
              >
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
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
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                          onClick={() => setIsOpen(false)}
                        >
                          Mon Profil
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                            window.location.reload();
                          }}
                          className="w-full text-left px-4 py-2 text-gray-900 hover:text-yellow-500 hover:bg-gray-100"
                        >
                          Déconnexion
                        </button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCartClick}
              className={`relative h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 
                transition-all duration-500 ease-out
                ${showCartAnimation 
                  ? 'animate-bounce scale-125 bg-yellow-100' 
                  : ''
                }
              `}
            >
              <ShoppingCart className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-700 ${showCartAnimation ? 'rotate-[360deg] text-yellow-600' : ''}`} />
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center transition-all duration-500 ${showCartAnimation ? 'scale-150 animate-pulse bg-green-500' : ''}`}>
                {getTotalItems()}
              </span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 py-3 px-4"
            >
              <div className="flex items-center gap-2 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Rechercher sur cette page..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    autoFocus
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-6"
                >
                  Rechercher
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSearchBar(false);
                    setSearchQuery("");
                    // Clear highlights
                    const highlights = document.querySelectorAll('.search-highlight');
                    highlights.forEach(el => {
                      const parent = el.parentNode;
                      if (parent) {
                        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                        parent.normalize();
                      }
                    });
                  }}
                  className="text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
