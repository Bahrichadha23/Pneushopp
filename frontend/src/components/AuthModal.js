"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

const AuthModal = ({ onClose }) => {
  const [mode, setMode] = useState("login") // 'login', 'register', 'verify', 'forgot', 'reset'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    phone: "",
    address: "",
    password_confirm: "",
    code: "",
    new_password: "", // Adding new password field
    new_password_confirm: "", // Adding password confirmation field
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState(null)

  const { login, register, verifyEmail, forgotPassword, resetPassword, logout, user } = useAuth()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(formData.email, formData.password)
    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.password_confirm) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    const result = await register(formData)
    if (result.success) {
      setUserId(result.data.user_id)
      setMessage(result.data.message)
      setMode("verify")
    } else {
      setError(result.error.email?.[0] || result.error.password?.[0] || "Erreur d'inscription")
    }
    setLoading(false)
  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await verifyEmail(userId, formData.code)
    if (result.success) {
      setMessage(result.message)
      setTimeout(() => {
        setMode("login")
        setMessage("")
      }, 2000)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await forgotPassword(formData.email)
    if (result.success) {
      setMessage(result.message)
      setTimeout(() => {
        setMode("reset")
        setMessage("")
      }, 2000)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.new_password !== formData.new_password_confirm) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    const result = await resetPassword(formData.email, formData.code, formData.new_password)
    if (result.success) {
      setMessage(result.message)
      setTimeout(() => {
        setMode("login")
        setMessage("")
        setFormData({ ...formData, code: "", new_password: "", new_password_confirm: "" })
      }, 2000)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  if (user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
          <h2>Mon Profil</h2>
          <div style={{ textAlign: "center" }}>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Nom d'utilisateur:</strong> {user.username}
            </p>
            {user.phone && (
              <p>
                <strong>Téléphone:</strong> {user.phone}
              </p>
            )}
            <button className="btn mt-1" onClick={handleLogout}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {mode === "login" && (
          <>
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
            <div className="text-center mt-1">
              <span
                className="link"
                onClick={() => {
                  setMode("forgot")
                  setError("")
                }}
              >
                Mot de passe oublié ?
              </span>
            </div>
            <div className="text-center mt-1">
              Pas de compte ?{" "}
              <span
                className="link"
                onClick={() => {
                  setMode("register")
                  setError("")
                }}
              >
                S'inscrire
              </span>
            </div>
          </>
        )}

        {mode === "register" && (
          <>
            <h2>Inscription</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Téléphone (optionnel)</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Inscription..." : "S'inscrire"}
              </button>
            </form>
            <div className="text-center mt-1">
              Déjà un compte ?{" "}
              <span
                className="link"
                onClick={() => {
                  setMode("login")
                  setError("")
                }}
              >
                Se connecter
              </span>
            </div>
          </>
        )}

        {mode === "verify" && (
          <>
            <h2>Vérification Email</h2>
            {message && <p style={{ color: "green", textAlign: "center" }}>{message}</p>}
            <form onSubmit={handleVerifyEmail}>
              <div className="form-group">
                <label>Code de vérification</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Entrez le code à 6 chiffres"
                  required
                />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Vérification..." : "Vérifier"}
              </button>
            </form>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h2>Mot de passe oublié</h2>
            {message && <p style={{ color: "green", textAlign: "center" }}>{message}</p>}
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le code"}
              </button>
            </form>
            <div className="text-center mt-1">
              <span
                className="link"
                onClick={() => {
                  setMode("login")
                  setError("")
                  setMessage("")
                }}
              >
                Retour à la connexion
              </span>
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <h2>Réinitialiser le mot de passe</h2>
            {message && <p style={{ color: "green", textAlign: "center" }}>{message}</p>}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>Code de vérification</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Code à 6 chiffres"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  name="new_password_confirm"
                  value={formData.new_password_confirm}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthModal
