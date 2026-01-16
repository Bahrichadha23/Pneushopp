// Formulaire de connexion administrateur
"use client";
import { useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function AdminLoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Veuillez entrer une adresse email valide");
      setIsLoading(false);
      return;
    }

    console.log("🔐 Admin login attempt:", formData.email);

    try {
      const result = await login(formData.email, formData.password);

      console.log("🔐 Admin login result:", result);

      if (result.success) {
        const loggedInUser = result.user;

        // Check if user has admin privileges
        if (loggedInUser && loggedInUser.role && ["admin", "purchasing", "sales"].includes(loggedInUser.role as string)) {
          console.log(`✅ Admin access granted: ${loggedInUser.role}`);

          switch (loggedInUser.role) {
            case "admin":
              router.push("/admin");
              break;
            case "purchasing":
              router.push("/admin/produits");
              break;
            case "sales":
              router.push("/admin/commandes");
              break;
          }
        } else {
          // User is not an admin - logout immediately
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          
          setError("Accès refusé. Cette page est réservée aux administrateurs.");
        }
      } else {
        console.log("❌ Login failed:", result.error);
        setError(result.error || "Erreur de connexion");
      }
    } catch (err: any) {
      console.error("💥 Login error:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Espace Administrateur</h2>
          <p className="text-yellow-100 mt-2">
            Accès réservé au personnel autorisé
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email administrateur</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="E-mail"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              ← Retour à la connexion utilisateur
            </Link>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-300">
          <Shield className="inline h-3 w-3 mr-1" />
          Connexion sécurisée - Toutes les tentatives sont enregistrées
        </p>
      </div>
    </div>
  );
}
