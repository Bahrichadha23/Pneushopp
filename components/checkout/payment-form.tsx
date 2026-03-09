"use client";
// Formulaire de paiement avec différentes méthodes
import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentMethod } from "@/types/order";
import { CreditCard, Smartphone, Building, Truck, Receipt } from "lucide-react";
import { API_URL } from "@/lib/config";

interface PaymentFormProps {
  onSubmit: (payment: PaymentMethod, acceptWarranty: boolean) => void;
  onBack: () => void;
  totalPrice: number;
}

export function PaymentForm({ onSubmit, onBack, totalPrice }: PaymentFormProps) {
  const [paymentType, setPaymentType] = useState<PaymentMethod["type"]>("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });
  const [showWarrantyButtons, setShowWarrantyButtons] = useState(false);
  const [previousCriBalance, setPreviousCriBalance] = useState(0);
  const [criReste, setCriReste] = useState("");
  const [criRemarque, setCriRemarque] = useState("");

  // Total ticket = current order total + previous CRI loan balance
  const totalTicket = totalPrice + previousCriBalance;
  // Montant (remaining/loan) = totalTicket - reste (what client pays now)
  const resteNum = parseFloat(criReste.replace(",", ".")) || 0;
  const criMontant = Math.max(0, totalTicket - resteNum);

  // Fetch previous CRI balance on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    fetch(`${API_URL}/orders/cri-balance/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.balance > 0) {
          setPreviousCriBalance(data.balance);
        }
      })
      .catch(() => {});
  }, []);

  const handleWarrantyChoice = (acceptWarranty: boolean) => {
    const paymentMethod: PaymentMethod = {
      type: paymentType,
      ...(paymentType === "card" ? cardData : {}),
      ...(paymentType === "cri"
        ? {
            montant: criMontant,
            reste: resteNum,
            totalTicket,
            remarque: criRemarque || undefined,
          }
        : {}),
    };
    onSubmit(paymentMethod, acceptWarranty);
  };

  const handleContinue = () => {
    setShowWarrantyButtons(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form validation passed
    handleContinue();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Méthode de paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup
            value={paymentType}
            onValueChange={(value) =>
              setPaymentType(value as PaymentMethod["type"])
            }
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="h-5 w-5" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  Carte bancaire
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Building className="h-5 w-5" />
                <Label
                  htmlFor="bank_transfer"
                  className="flex-1 cursor-pointer"
                >
                  Virement bancaire
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem
                  value="cash_on_delivery"
                  id="cash_on_delivery"
                />
                <Truck className="h-5 w-5" />
                <Label
                  htmlFor="cash_on_delivery"
                  className="flex-1 cursor-pointer"
                >
                  Paiement à la livraison
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="cri" id="cri" />
                <Receipt className="h-5 w-5" />
                <Label htmlFor="cri" className="flex-1 cursor-pointer">
                  Paiement CRI
                </Label>
              </div>
            </div>
          </RadioGroup>

          {paymentType === "card" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Informations de carte</h3>
              <div>
                <Label htmlFor="cardNumber">Numéro de carte *</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      cardNumber: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Date d'expiration *</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/AA"
                    value={cardData.expiryDate}
                    onChange={(e) =>
                      setCardData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData((prev) => ({ ...prev, cvv: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="holderName">Nom du titulaire *</Label>
                <Input
                  id="holderName"
                  placeholder="Nom complet"
                  value={cardData.holderName}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      holderName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          )}

          {paymentType === "bank_transfer" && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Informations de virement</h3>
              <p className="text-sm text-gray-600">
                Banque: Banque de Tunisie
                <br />
                IBAN: TN59 1000 6035 1835 9847 8831
                <br />
                BIC: BTUBTNT1XXX
                <br />
                Référence: Votre numéro de commande
              </p>
            </div>
          )}

          {paymentType === "cri" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : CRI</h3>
              {/* Total Ticket / Reste / Montant */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={totalTicket.toFixed(2).replace(".", ",")}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={criReste}
                      onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(",", ".")) || 0;
                      if (val > totalTicket) {
                        setCriReste(totalTicket.toFixed(2));
                      } else {
                        setCriReste(e.target.value);
                      }
                    }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-green-100 text-sm text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant payé maintenant</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={criMontant.toFixed(2).replace(".", ",")}
                      className={`rounded-r-none ${criMontant > 0 ? "border-red-200 bg-red-50" : "bg-white"}`}
                    />
                    <span className={`inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm ${criMontant > 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-600"}`}>
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste à payer (crédit)</p>
                </div>
              </div>

              {/* Remarque */}
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea
                  className="mt-1 resize-y"
                  rows={3}
                  placeholder="Ajouter une remarque..."
                  value={criRemarque}
                  onChange={(e) => setCriRemarque(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 bg-transparent"
            >
              Retour
            </Button>
            {!showWarrantyButtons ? (
              <Button type="submit" className="flex-1">
                Continuer
              </Button>
            ) : (
              <div className="flex-1 flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleWarrantyChoice(true)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  Obtenir la garantie
                </Button>
                <Button
                  type="button"
                  onClick={() => handleWarrantyChoice(false)}
                  className="flex-1 bg-black"
                >
                  Continuer
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
