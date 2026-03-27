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
import { CreditCard, Building, Truck, Receipt } from "lucide-react";
import { API_URL } from "@/lib/config";

const BANK_OPTIONS = [
  "QNB",
  "ABC",
  "AMEN",
  "ATTIJARI",
  "BT",
  "BH",
  "BIAT",
  "STB",
  "BANQUE CENTRALE DE TUNISIE",
];

function parseAmount(value: string): number {
  return Number.parseFloat(value.replace(",", ".")) || 0;
}

function formatAmount(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

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
  const [criMontantInput, setCriMontantInput] = useState("");
  const [criRemarque, setCriRemarque] = useState("");
  const [bankMontantInput, setBankMontantInput] = useState("");
  const [bankRemarque, setBankRemarque] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [transferHolderName, setTransferHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [transferImagePreview, setTransferImagePreview] = useState("");
  const [lettreMontantInput, setLettreMontantInput] = useState("");
  const [lettreRemarque, setLettreRemarque] = useState("");
  const [lettreNumber, setLettreNumber] = useState("");
  const [lettreDate, setLettreDate] = useState("");
  const [lettreName, setLettreName] = useState("");
  const [lettreBankName, setLettreBankName] = useState("");
  const [lettreImage, setLettreImage] = useState<File | null>(null);
  const [lettreImagePreview, setLettreImagePreview] = useState("");
  const [lettreRIB, setLettreRIB] = useState("");
  const [lettreLieu, setLettreLieu] = useState("");
  const [chequeMontantInput, setChequeMontantInput] = useState("");
  const [chequeRemarque, setChequeRemarque] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeName, setChequeName] = useState("");
  const [chequeBankName, setChequeBankName] = useState("");
  const [chequeImage, setChequeImage] = useState<File | null>(null);
  const [chequeImagePreview, setChequeImagePreview] = useState("");
  const [cashOnDeliveryMontantInput, setCashOnDeliveryMontantInput] = useState("");
  const [cashOnDeliveryRemarque, setCashOnDeliveryRemarque] = useState("");
  const [authorizationNumber, setAuthorizationNumber] = useState("");
  const [cashOnDeliveryBankName, setCashOnDeliveryBankName] = useState("");

  // Total ticket = current order total + previous CRI balance
  const totalTicket = totalPrice + previousCriBalance;

  const criMontantNumRaw = parseAmount(criMontantInput);
  const criMontantNum = Math.min(Math.max(criMontantNumRaw, 0), totalTicket);
  const criReste = Math.max(0, totalTicket - criMontantNum);

  const bankMontantNumRaw = parseAmount(bankMontantInput);
  const bankMontantNum = Math.min(Math.max(bankMontantNumRaw, 0), totalPrice);
  const bankReste = Math.max(0, totalPrice - bankMontantNum);

  const lettreMontantNumRaw = parseAmount(lettreMontantInput);
  const lettreMontantNum = Math.min(Math.max(lettreMontantNumRaw, 0), totalPrice);
  const lettreReste = Math.max(0, totalPrice - lettreMontantNum);

  const chequeMontantNumRaw = parseAmount(chequeMontantInput);
  const chequeMontantNum = Math.min(Math.max(chequeMontantNumRaw, 0), totalPrice);
  const chequeReste = Math.max(0, totalPrice - chequeMontantNum);

  const cashOnDeliveryMontantNumRaw = parseAmount(cashOnDeliveryMontantInput);
  const cashOnDeliveryMontantNum = Math.min(Math.max(cashOnDeliveryMontantNumRaw, 0), totalPrice);
  const cashOnDeliveryReste = Math.max(0, totalPrice - cashOnDeliveryMontantNum);

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

  useEffect(() => {
    if (paymentType === "cri" && criMontantInput === "") {
      setCriMontantInput(formatAmount(totalTicket));
    }
    // Initialize once when switching to CRI or when total changes.
    // Do not depend on criMontantInput to avoid forcing value while user edits.
  }, [paymentType, totalTicket]);

  useEffect(() => {
    if (paymentType === "bank_transfer" && bankMontantInput === "") {
      setBankMontantInput(formatAmount(totalPrice));
    }
    // Same behavior for bank transfer amount input.
  }, [paymentType, totalPrice]);

  useEffect(() => {
    if (paymentType === "lettre_de_change" && lettreMontantInput === "") {
      setLettreMontantInput(formatAmount(totalPrice));
    }
  }, [paymentType, totalPrice]);

  useEffect(() => {
    if (paymentType === "cheque" && chequeMontantInput === "") {
      setChequeMontantInput(formatAmount(totalPrice));
    }
  }, [paymentType, totalPrice]);

  useEffect(() => {
    if (paymentType === "cash_on_delivery" && cashOnDeliveryMontantInput === "") {
      setCashOnDeliveryMontantInput(formatAmount(totalPrice));
    }
  }, [paymentType, totalPrice]);

  useEffect(() => {
    if (!transferImage) {
      setTransferImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(transferImage);
    setTransferImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [transferImage]);

  useEffect(() => {
    if (!lettreImage) {
      setLettreImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(lettreImage);
    setLettreImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [lettreImage]);

  useEffect(() => {
    if (!chequeImage) {
      setChequeImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(chequeImage);
    setChequeImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [chequeImage]);

  const handleWarrantyChoice = (acceptWarranty: boolean) => {
    const paymentMethod: PaymentMethod = {
      type: paymentType,
      ...(paymentType === "card" ? cardData : {}),
      ...(paymentType === "cri"
        ? {
            montant: criMontantNum,
            reste: criReste,
            totalTicket,
            remarque: criRemarque || undefined,
          }
        : {}),
      ...(paymentType === "bank_transfer"
        ? {
            montant: bankMontantNum,
            reste: bankReste,
            totalTicket: totalPrice,
            remarque: bankRemarque || undefined,
            transferNumber: transferNumber || undefined,
            transferHolderName: transferHolderName || undefined,
            bankName: bankName || undefined,
            transferImageName: transferImage?.name || undefined,
          }
        : {}),
      ...(paymentType === "lettre_de_change"
        ? {
            montant: lettreMontantNum,
            reste: lettreReste,
            totalTicket: totalPrice,
            remarque: lettreRemarque || undefined,
            lettreNumber: lettreNumber || undefined,
            lettreDate: lettreDate || undefined,
            lettreName: lettreName || undefined,
            lettreBankName: lettreBankName || undefined,
            lettreImageName: lettreImage?.name || undefined,
            lettreRIB: lettreRIB || undefined,
            lettreLieu: lettreLieu || undefined,
          }
        : {}),
      ...(paymentType === "cheque"
        ? {
            montant: chequeMontantNum,
            reste: chequeReste,
            totalTicket: totalPrice,
            remarque: chequeRemarque || undefined,
            chequeNumber: chequeNumber || undefined,
            chequeDate: chequeDate || undefined,
            chequeName: chequeName || undefined,
            chequeBankName: chequeBankName || undefined,
            chequeImageName: chequeImage?.name || undefined,
          }
        : {}),
      ...(paymentType === "cash_on_delivery"
        ? {
            montant: cashOnDeliveryMontantNum,
            reste: cashOnDeliveryReste,
            totalTicket: totalPrice,
            remarque: cashOnDeliveryRemarque || undefined,
            authorizationNumber: authorizationNumber || undefined,
            bankName: cashOnDeliveryBankName || undefined,
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

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="lettre_de_change" id="lettre_de_change" />
                <Receipt className="h-5 w-5" />
                <Label htmlFor="lettre_de_change" className="flex-1 cursor-pointer">
                  Lettre de change
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="cheque" id="cheque" />
                <Receipt className="h-5 w-5" />
                <Label htmlFor="cheque" className="flex-1 cursor-pointer">
                  Chèque
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

          {paymentType === "cash_on_delivery" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : TPE A LA LIVRAISON</h3>
              {/* Total Ticket / Reste / Montant */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(totalPrice)}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(cashOnDeliveryReste)}
                      className="rounded-r-none border-red-200 bg-red-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste a payer</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={cashOnDeliveryMontantInput}
                      onChange={(e) => {
                        const entered = parseAmount(e.target.value);
                        if (entered > totalPrice) {
                          setCashOnDeliveryMontantInput(formatAmount(totalPrice));
                          return;
                        }
                        setCashOnDeliveryMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant paye maintenant</p>
                </div>
              </div>

              {/* Remarque */}
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea
                  className="mt-1 resize-y"
                  rows={3}
                  placeholder="Ajouter une remarque..."
                  value={cashOnDeliveryRemarque}
                  onChange={(e) => setCashOnDeliveryRemarque(e.target.value)}
                />
              </div>

              {/* TPE Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° d'autorisation</Label>
                  <Input
                    type="text"
                    placeholder="N° d'autorisation..."
                    value={authorizationNumber}
                    onChange={(e) => setAuthorizationNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select
                    value={cashOnDeliveryBankName}
                    onChange={(e) => setCashOnDeliveryBankName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="">Sélectionner une banque...</option>
                    <option value="Banque de Tunisie">Banque de Tunisie</option>
                    <option value="BNA">BNA</option>
                    <option value="BIAT">BIAT</option>
                    <option value="UIB">UIB</option>
                    <option value="Amen Bank">Amen Bank</option>
                    <option value="Attijari Bank">Attijari Bank</option>
                    <option value="UBCI">UBCI</option>
                    <option value="Banque de Khartoum">Banque de Khartoum</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {paymentType === "bank_transfer" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Virement</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(totalPrice)}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(bankReste)}
                      className="rounded-r-none border-red-200 bg-red-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste a payer</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={bankMontantInput}
                      onChange={(e) => {
                        const entered = parseAmount(e.target.value);
                        if (entered > totalPrice) {
                          setBankMontantInput(formatAmount(totalPrice));
                          return;
                        }
                        setBankMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-green-100 text-sm text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant paye maintenant</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea
                  className="mt-1 resize-y"
                  rows={3}
                  placeholder="Ajouter une remarque..."
                  value={bankRemarque}
                  onChange={(e) => setBankRemarque(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="transferNumber" className="text-sm font-semibold">
                    N° de Virement
                  </Label>
                  <Input
                    id="transferNumber"
                    placeholder="N° de Virement"
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="transferHolder" className="text-sm font-semibold">
                    Nom
                  </Label>
                  <Input
                    id="transferHolder"
                    placeholder="Nom du titulaire"
                    value={transferHolderName}
                    onChange={(e) => setTransferHolderName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="bankName" className="text-sm font-semibold">
                    Banque
                  </Label>
                  <select
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selectionner une banque</option>
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="transferImage" className="text-sm font-semibold">
                    Image
                  </Label>
                  <Input
                    id="transferImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTransferImage(file);
                    }}
                  />
                  <div className="mt-2 h-28 rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                    {transferImagePreview ? (
                      <img
                        src={transferImagePreview}
                        alt="Apercu du justificatif"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">Aucun image selectionnee</span>
                    )}
                  </div>
                </div>
              </div>
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
                      value={formatAmount(totalTicket)}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(criReste)}
                      className="rounded-r-none border-red-200 bg-red-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste a payer (credit)</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={criMontantInput}
                      onChange={(e) => {
                        const entered = parseAmount(e.target.value);
                        if (entered > totalTicket) {
                          setCriMontantInput(formatAmount(totalTicket));
                          return;
                        }
                        setCriMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant paye maintenant</p>
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

          {paymentType === "lettre_de_change" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Lettre de change</h3>
              {/* Total Ticket / Reste / Montant */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(totalTicket)}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(lettreReste)}
                      className="rounded-r-none border-red-200 bg-red-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste a payer</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={lettreMontantInput}
                      onChange={(e) => {
                        const entered = parseAmount(e.target.value);
                        if (entered > totalTicket) {
                          setLettreMontantInput(formatAmount(totalTicket));
                          return;
                        }
                        setLettreMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant paye maintenant</p>
                </div>
              </div>

              {/* Remarque */}
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea
                  className="mt-1 resize-y"
                  rows={2}
                  placeholder="Ajouter une remarque..."
                  value={lettreRemarque}
                  onChange={(e) => setLettreRemarque(e.target.value)}
                />
              </div>

              {/* Lettre Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° Lettre de change</Label>
                  <Input
                    type="text"
                    placeholder="Numéro de la lettre..."
                    value={lettreNumber}
                    onChange={(e) => setLettreNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date Lettre de change</Label>
                  <Input
                    type="date"
                    value={lettreDate}
                    onChange={(e) => setLettreDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input
                    type="text"
                    placeholder="Nom du bénéficiaire..."
                    value={lettreName}
                    onChange={(e) => setLettreName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select
                    value={lettreBankName}
                    onChange={(e) => setLettreBankName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="">Sélectionner une banque...</option>
                    <option value="Banque de Tunisie">Banque de Tunisie</option>
                    <option value="BNA">BNA</option>
                    <option value="BIAT">BIAT</option>
                    <option value="UIB">UIB</option>
                    <option value="Amen Bank">Amen Bank</option>
                    <option value="Attijari Bank">Attijari Bank</option>
                    <option value="UBCI">UBCI</option>
                    <option value="Banque de Khartoum">Banque de Khartoum</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">RIB</Label>
                  <Input
                    type="text"
                    placeholder="RIB..."
                    value={lettreRIB}
                    onChange={(e) => setLettreRIB(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Lieu</Label>
                  <Input
                    type="text"
                    placeholder="Lieu d'émission..."
                    value={lettreLieu}
                    onChange={(e) => setLettreLieu(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-semibold">Image de la lettre de change</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLettreImage(file);
                    }
                  }}
                  className="mt-1"
                />
                {lettreImagePreview ? (
                  <div className="mt-2 relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                    <img src={lettreImagePreview} alt="Lettre preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Aucun image selectionnee</span>
                )}
              </div>
            </div>
          )}

          {paymentType === "cheque" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Chèque</h3>
              {/* Total Ticket / Reste / Montant */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(totalTicket)}
                      className="rounded-r-none bg-white"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">
                      DT
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input
                      readOnly
                      value={formatAmount(chequeReste)}
                      className="rounded-r-none border-red-200 bg-red-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reste a payer</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={chequeMontantInput}
                      onChange={(e) => {
                        const entered = parseAmount(e.target.value);
                        if (entered > totalTicket) {
                          setChequeMontantInput(formatAmount(totalTicket));
                          return;
                        }
                        setChequeMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">
                      DT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant paye maintenant</p>
                </div>
              </div>

              {/* Remarque */}
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea
                  className="mt-1 resize-y"
                  rows={2}
                  placeholder="Ajouter une remarque..."
                  value={chequeRemarque}
                  onChange={(e) => setChequeRemarque(e.target.value)}
                />
              </div>

              {/* Cheque Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° Chèque</Label>
                  <Input
                    type="text"
                    placeholder="Numéro du chèque..."
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date Chèque</Label>
                  <Input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input
                    type="text"
                    placeholder="Nom du bénéficiaire..."
                    value={chequeName}
                    onChange={(e) => setChequeName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select
                    value={chequeBankName}
                    onChange={(e) => setChequeBankName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="">Sélectionner une banque...</option>
                    <option value="Banque de Tunisie">Banque de Tunisie</option>
                    <option value="BNA">BNA</option>
                    <option value="BIAT">BIAT</option>
                    <option value="UIB">UIB</option>
                    <option value="Amen Bank">Amen Bank</option>
                    <option value="Attijari Bank">Attijari Bank</option>
                    <option value="UBCI">UBCI</option>
                    <option value="Banque de Khartoum">Banque de Khartoum</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-semibold">Image du chèque</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setChequeImage(file);
                    }
                  }}
                  className="mt-1"
                />
                {chequeImagePreview ? (
                  <div className="mt-2 relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                    <img src={chequeImagePreview} alt="Cheque preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Aucun image selectionnee</span>
                )}
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
