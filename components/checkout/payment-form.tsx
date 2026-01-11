"use client";
// Formulaire de paiement avec différentes méthodes
import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMethod } from "@/types/order";
import { CreditCard, Smartphone, Building, Truck } from "lucide-react";

interface PaymentFormProps {
  onSubmit: (payment: PaymentMethod, acceptWarranty: boolean) => void;
  onBack: () => void;
}

export function PaymentForm({ onSubmit, onBack }: PaymentFormProps) {
  const [paymentType, setPaymentType] = useState<PaymentMethod["type"]>("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });
  const [showWarrantyButtons, setShowWarrantyButtons] = useState(false);

  const handleWarrantyChoice = (acceptWarranty: boolean) => {
    const paymentMethod: PaymentMethod = {
      type: paymentType,
      ...(paymentType === "card" ? cardData : {}),
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
