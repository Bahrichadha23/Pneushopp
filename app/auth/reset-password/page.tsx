"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const uid = searchParams.get("uid")
  const token = searchParams.get("token")

  useEffect(() => {
    if (uid && token) {
      verifyToken()
    } else {
      setError("Lien de réinitialisation invalide")
      setTokenValid(false)
    }
  }, [uid, token])

  const verifyToken = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/accounts/verify-reset-token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid, token }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setTokenValid(true)
        setUserEmail(data.email)
      } else {
        setTokenValid(false)
        setError(data.message || "Token invalide ou expiré")
      }
    } catch (err) {
      setTokenValid(false)
      setError("Erreur de vérification du token")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8000/api/accounts/reset-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Erreur lors de la réinitialisation")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p>Vérification du lien...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Link href="/auth/forgot-password" className="block">
                <Button className="w-full">
                  Demander un nouveau lien
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Mot de passe réinitialisé !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Link href="/auth/login" className="block">
              <Button className="w-full">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
            <p className="text-gray-600 mt-2">
              Compte : <span className="font-medium">{userEmail}</span>
            </p>
            <p className="text-sm text-gray-500">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Au moins 8 caractères</li>
                  <li>Une combinaison de lettres et chiffres</li>
                </ul>
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
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Mettre à jour le mot de passe
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
  )
}