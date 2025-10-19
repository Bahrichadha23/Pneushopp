"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // your auth context

export default function UserMenu() {
  const { user, logout } = useAuth(); // user object if logged in, null if not
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center font-medium text-gray-900 hover:text-yellow-500"
      >
        <UserCircle className="h-6 w-6 mr-1" />
        {user && <span className="hidden sm:block">{user.firstName}</span>}
        <ChevronDown
          className={`h-4 w-4 transform transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-44 rounded-lg bg-white shadow-lg border border-gray-200 z-20"
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
  );
}
