"use client"
// Formulaire de commande avec informations de livraison
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { useOrder } from "@/contexts/order-context"
import { useAuth } from "@/contexts/auth-context"
import type { ShippingAddress, PaymentMethod } from "@/types/order"
import { PaymentForm } from "./payment-form"
import { useRouter } from "next/navigation"

export function CheckoutForm() {
  const { items, getTotalPrice, clearCart } = useCart()
  const { createOrder } = useOrder()
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping")
  const [isLoading, setIsLoading] = useState(false)

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    company: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Tunisie",
    phone: user?.phone || "",
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: "card",
  })

  const subtotal = getTotalPrice()
  const shippingCost = subtotal >= 200 ? 0 : 15 // Livraison gratuite à partir de 200 DT
  const tax = subtotal * 0.19 // TVA 19%
  const total = subtotal + shippingCost + tax

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("payment")
  }

  const handlePaymentSubmit = (payment: PaymentMethod) => {
    setPaymentMethod(payment)
    setStep("review")
  }

  const handleOrderSubmit = async () => {
    setIsLoading(true)
    try {
      const orderId = await createOrder({
        userId: user?.id,
        items,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        status: "pending",
      })

      clearCart()
      router.push(`/commande/confirmation/${orderId}`)
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "shipping") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informations de livraison</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={shippingAddress.firstName}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={shippingAddress.lastName}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Entreprise (optionnel)</Label>
              <Input
                id="company"
                value={shippingAddress.company}
                onChange={(e) => setShippingAddress((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress((prev) => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal *</Label>
                <Input
                  id="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Continuer vers le paiement
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (step === "payment") {
    return <PaymentForm onSubmit={handlePaymentSubmit} onBack={() => setStep("shipping")} />
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Récapitulatif de la commande</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé des articles */}
        <div>
          <h3 className="font-semibold mb-3">Articles commandés</h3>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between py-2">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <span>{(item.product.price * item.quantity).toFixed(2)} DT</span>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Sous-total:</span>
            <span>{subtotal.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison:</span>
            <span>{shippingCost === 0 ? "Gratuite" : `${shippingCost.toFixed(2)} DT`}</span>
          </div>
          <div className="flex justify-between">
            <span>TVA (19%):</span>
            <span>{tax.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{total.toFixed(2)} DT</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setStep("payment")} className="flex-1">
            Retour
          </Button>
          <Button onClick={handleOrderSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? "Traitement..." : "Confirmer la commande"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
