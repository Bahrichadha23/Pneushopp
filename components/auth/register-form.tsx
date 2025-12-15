// Formulaire d'inscription utilisateur
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
import { toast } from "sonner";

interface RegisterFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function RegisterForm({
  redirectTo = "/",
  onSuccess,
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    newsletter: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  // const [debugInfo, setDebugInfo] = useState<any>(null)

  const { register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms =
        "Vous devez accepter les conditions d'utilisation";
    }

    if (
      formData.phone &&
      !/^(\+216|216)?\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{3}$/.test(
        formData.phone.replace(/\s/g, "")
      )
    ) {
      newErrors.phone = "Format de téléphone invalide (ex: +216 20 123 456)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // setDebugInfo(null)

  //   if (!validateForm()) return;

  //   setIsLoading(true);

  //   try {
  //     const registerData = {
  //       firstName: formData.firstName.trim(),
  //       lastName: formData.lastName.trim(),
  //       email: formData.email.trim(),
  //       phone: formData.phone.trim() || undefined,
  //       password: formData.password,
  //       acceptTerms: formData.acceptTerms,
  //       newsletter: formData.newsletter,
  //     };

  //     const result = await register(registerData);

  //     console.log("📝 Registration result:", result);

  //     if (result.success) {
  //       console.log("✅ Registration successful");
  //       if (onSuccess) {
  //         onSuccess();
  //       } else {
  //         router.push(redirectTo);
  //       }
  //     } else {
  //       console.log("❌ Registration failed:", result.error);
  //       setErrors({ general: result.error || "Erreur lors de l'inscription" });
  //     }

  //     console.log("✅ Registration successful (forced)");
  //   } catch (err: any) {
  //     console.error("💥 Registration error:", err);
  //     setErrors({ general: "Erreur lors de l'inscription" });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const registerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        acceptTerms: formData.acceptTerms,
        newsletter: formData.newsletter,
      };

      const result = await register(registerData);
      console.log("Registration result:", result);

      // If registration was successful
      if (result.success) {
        router.push("/auth/login");
        return;
      }

      // Backend errors (Django returns field: [error])
      // Backend errors (TypeScript-safe)
      if (result.error) {
        const backendErrors: Record<string, string> = {};

        if (typeof result.error === "string") {
          // backend sends "password: Ce mot de passe est trop courant."
          const [field, message] = result.error.split(":").map((s) => s.trim());
          backendErrors[field || "general"] = message || result.error;
        } else if (typeof result.error === "object") {
          // backend sends { password: ["Ce mot de passe est trop courant."] }
          Object.entries(result.error).forEach(([field, value]) => {
            backendErrors[field] = Array.isArray(value)
              ? value[0]
              : String(value);
          });
        }

        setErrors(backendErrors);
      } else {
        setErrors({ general: "Erreur lors de l'inscription" });
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrors({
        general: "Erreur lors de l'inscription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear only the error for this field
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Optional: re-run validation for all fields dynamically
    validateForm();
  };
  const isFormInvalid =
    !formData.firstName.trim() ||
    !formData.lastName.trim() ||
    !formData.email.trim() ||
    !formData.password ||
    !formData.confirmPassword ||
    !formData.acceptTerms ||
    formData.password.length < 6 ||
    formData.password !== formData.confirmPassword;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
        <p className="text-gray-600 mt-2">
          Rejoignez PNEU SHOP pour des offres exclusives
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Votre prénom"
              required
              disabled={isLoading}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Votre nom"
              required
              disabled={isLoading}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="votre@email.com"
            required
            disabled={isLoading}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+216 20 123 456"
            disabled={isLoading}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Mot de passe *</Label>
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
              className={errors.password ? "border-red-500" : ""}
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
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Le mot de passe doit être suffisamment fort (évitez les mots
            courants comme "password123")
          </p>
        </div>{" "}
        <div>
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Répétez votre mot de passe"
              required
              disabled={isLoading}
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, acceptTerms: checked }))
              }
              disabled={isLoading}
              className={errors.acceptTerms ? "border-red-500" : ""}
            />
            <Label htmlFor="acceptTerms" className="text-sm leading-5">
              J'accepte les{" "}
              <Link
                href="/conditions"
                className="text-yellow-600 hover:text-yellow-500"
              >
                conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                className="text-yellow-600 hover:text-yellow-500"
              >
                politique de confidentialité
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-xs">{errors.acceptTerms}</p>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={formData.newsletter}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, newsletter: checked }))
              }
              disabled={isLoading}
            />
            <Label htmlFor="newsletter" className="text-sm">
              Je souhaite recevoir les offres et actualités par email
            </Label>
          </div>
        </div>
        {errors.success && (
          <Alert className="border-green-500 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {errors.success}
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
          disabled={isLoading || isFormInvalid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création du compte...
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="text-yellow-600 hover:text-yellow-500 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
