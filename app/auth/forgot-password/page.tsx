"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/config";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email envoyé !</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Nous avons envoyé les instructions de réinitialisation à :
                </p>
                <p className="font-medium text-lg">{email}</p>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Vérifiez votre boîte de réception et suivez les instructions
                    dans l&apos;email. Le lien est valide pendant 1 heure.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3 pt-4">
                <p className="text-sm text-gray-500 text-center">
                  Vous n&apos;avez pas reçu l&apos;email ?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                >
                  Renvoyer l&apos;email
                </Button>
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
            <p className="text-gray-600 mt-2">
              Entrez votre adresse email et nous vous enverrons les instructions
              pour réinitialiser votre mot de passe.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer les instructions
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500 inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
