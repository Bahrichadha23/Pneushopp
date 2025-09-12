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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function LoginForm({
  redirectTo = "/admin",
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

  const { login } = useAuth();
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success && result.user) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Check if user is admin and redirect accordingly
          if (result.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push(redirectTo);
          }
        }
      } else {
        setError(result.error || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur de connexion");
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
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  rememberMe: checked as boolean,
                }))
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

      {/* Comptes de démonstration */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Comptes de démonstration :
        </p>
        <div className="space-y-1 text-xs text-gray-600">
          <p>
            <strong>Admin :</strong> admin@pneushop.tn / password123
          </p>
          <p>
            <strong>Client :</strong> client@example.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}
