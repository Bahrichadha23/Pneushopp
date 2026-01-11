// Formulaire de connexion utilisateur
"use client";
import { useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function LoginForm({
  redirectTo = "/",
  onSuccess,
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebugInfo(null);
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

    console.log("🔐 Attempting login with:", {
      email: formData.email,
      password: "***",
    });

    try {
      const result = await login(formData.email, formData.password);

      console.log("🔐 Login result:", result);

      if (result.success) {
        console.log("✅ Login successful");
        const loggedInUser = result.user;

        // Block admin users from regular login
        if (loggedInUser && loggedInUser.role && ["admin", "purchasing", "sales"].includes(loggedInUser.role as string)) {
          setError("Accès refusé. Veuillez utiliser la page de connexion administrateur.");
          setIsLoading(false);
          // Redirect to admin login after 2 seconds
          setTimeout(() => {
            router.push("/auth/login/admin");
          }, 2000);
          return;
        }

        if (onSuccess) {
          onSuccess();
        } else {
          console.log("👤 Regular user, redirecting to:", redirectTo);
          router.push(redirectTo);
        }
      } else {
        console.log("❌ Login failed:", result.error);
        setError(result.error || "Erreur de connexion");
        setDebugInfo({
          email: formData.email,
          errorType: "auth_failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error("💥 Login error:", err);
      setError("Erreur de connexion au serveur");
      setDebugInfo({
        email: formData.email,
        errorType: "network_error",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
        <p className="text-gray-600 mt-2">
          Connectez-vous à votre compte PNEU SHOP
        </p>
      </div>

      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="votre@email.com"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Votre mot de passe"
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, rememberMe: checked }))
              }
              disabled={isLoading}
            />
            <Label htmlFor="rememberMe" className="text-sm">
              Se souvenir de moi
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-yellow-600 hover:text-yellow-500"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/register"
            className="text-yellow-600 hover:text-yellow-500 font-medium"
          >
            Créer un compte
          </Link>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/auth/login/admin"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Accès administrateur
        </Link>
      </div>
    </div>
  );
}
