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
import { API_URL } from "@/lib/config";

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
      // First, validate credentials with authService directly without using context login
      const credentials = { email: formData.email, password: formData.password };
      const response = await fetch(`${API_URL}/accounts/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || errorData.error || "Identifiants incorrects");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log("🔐 Login response:", data);

      // Check role BEFORE storing anything
      if (data.user && data.user.role && ["admin", "purchasing", "sales"].includes(data.user.role)) {
        setError("Accès refusé.");
        setIsLoading(false);
        return;
      }

      // Only proceed with actual login if user is not an admin
      const result = await login(formData.email, formData.password);

      console.log("🔐 Login result:", result);

      if (result.success) {
        console.log("✅ Login successful");
        
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

    </div>
  );
}
