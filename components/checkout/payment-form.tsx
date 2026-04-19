"use client";
// Formulaire de paiement avec différentes méthodes
import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ALL_PAYMENT_TYPES = [
  { id: "card", label: "Carte bancaire", Icon: CreditCard },
  { id: "bank_transfer", label: "Virement bancaire", Icon: Building },
  { id: "cash_on_delivery", label: "Paiement à la livraison (TPE)", Icon: Truck },
  { id: "cri", label: "Paiement CRI", Icon: Receipt },
  { id: "lettre_de_change", label: "Lettre de change", Icon: Receipt },
  { id: "cheque", label: "Chèque", Icon: Receipt },
];

export function PaymentForm({ onSubmit, onBack, totalPrice }: PaymentFormProps) {
  // Multi-modal: array of selected payment types
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["card"]);
  const isSelected = (type: string) => selectedTypes.includes(type);
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

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
  const [transferHolderName, setTransferHolderName] = useState("Pneushop");
  const [bankName, setBankName] = useState("");
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [transferImagePreview, setTransferImagePreview] = useState("");
  const [lettreMontantInput, setLettreMontantInput] = useState("");
  const [lettreRemarque, setLettreRemarque] = useState("");
  const [lettreNumber, setLettreNumber] = useState("");
  const [lettreDate, setLettreDate] = useState("");
  const [lettreName, setLettreName] = useState("Pneushop");
  const [lettreBankName, setLettreBankName] = useState("");
  const [lettreImage, setLettreImage] = useState<File | null>(null);
  const [lettreImagePreview, setLettreImagePreview] = useState("");
  const [lettreRIB, setLettreRIB] = useState("");
  const [lettreLieu, setLettreLieu] = useState("");
  const [chequeMontantInput, setChequeMontantInput] = useState("");
  const [chequeRemarque, setChequeRemarque] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeName, setChequeName] = useState("Pneushop");
  const [chequeBankName, setChequeBankName] = useState("");
  const [chequeImage, setChequeImage] = useState<File | null>(null);
  const [chequeImagePreview, setChequeImagePreview] = useState("");
  const [cashOnDeliveryMontantInput, setCashOnDeliveryMontantInput] = useState("");
  const [cashOnDeliveryRemarque, setCashOnDeliveryRemarque] = useState("");
  const [authorizationNumber, setAuthorizationNumber] = useState("");
  const [cashOnDeliveryBankName, setCashOnDeliveryBankName] = useState("");

  // Total ticket = current order total + previous CRI balance (only relevant for CRI)
  const totalTicket = totalPrice + previousCriBalance;

  const criMontantNum = Math.min(Math.max(parseAmount(criMontantInput), 0), totalTicket);
  const bankMontantNum = Math.min(Math.max(parseAmount(bankMontantInput), 0), totalPrice);
  const lettreMontantNum = Math.min(Math.max(parseAmount(lettreMontantInput), 0), totalPrice);
  const chequeMontantNum = Math.min(Math.max(parseAmount(chequeMontantInput), 0), totalPrice);
  const cashOnDeliveryMontantNum = Math.min(Math.max(parseAmount(cashOnDeliveryMontantInput), 0), totalPrice);

  // Combined total across all selected methods (for balance display)
  const totalEnteredAllMethods =
    (isSelected("bank_transfer") ? bankMontantNum : 0) +
    (isSelected("cri") ? criMontantNum : 0) +
    (isSelected("lettre_de_change") ? lettreMontantNum : 0) +
    (isSelected("cheque") ? chequeMontantNum : 0) +
    (isSelected("cash_on_delivery") ? cashOnDeliveryMontantNum : 0);

  const globalReste = Math.max(totalPrice - totalEnteredAllMethods, 0);

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

  // Helper : renvoie le montant à initialiser pour une méthode nouvellement sélectionnée.
  // Si méthode unique → montant total.
  // Si multi-modal : seule la 1ère méthode de la liste reçoit le montant total,
  // les autres commencent à 0 (évite la condition de course entre les useEffects).
  const initAmountFor = (self: string, base: number) => {
    if (selectedTypes.length <= 1) return base;
    return selectedTypes[0] === self ? base : 0;
  };

  // Initialisation des montants à la sélection d'un mode de paiement
  useEffect(() => {
    if (isSelected("cri") && criMontantInput === "") {
      setCriMontantInput(formatAmount(initAmountFor("cri", totalTicket)));
    }
  }, [selectedTypes, totalTicket]);

  useEffect(() => {
    if (isSelected("bank_transfer") && bankMontantInput === "") {
      setBankMontantInput(formatAmount(initAmountFor("bank_transfer", totalPrice)));
    }
  }, [selectedTypes, totalPrice]);

  useEffect(() => {
    if (isSelected("lettre_de_change") && lettreMontantInput === "") {
      setLettreMontantInput(formatAmount(initAmountFor("lettre_de_change", totalPrice)));
    }
  }, [selectedTypes, totalPrice]);

  useEffect(() => {
    if (isSelected("cheque") && chequeMontantInput === "") {
      setChequeMontantInput(formatAmount(initAmountFor("cheque", totalPrice)));
    }
  }, [selectedTypes, totalPrice]);

  useEffect(() => {
    if (isSelected("cash_on_delivery") && cashOnDeliveryMontantInput === "") {
      setCashOnDeliveryMontantInput(formatAmount(initAmountFor("cash_on_delivery", totalPrice)));
    }
  }, [selectedTypes, totalPrice]);

  useEffect(() => {
    if (!transferImage) { setTransferImagePreview(""); return; }
    const url = URL.createObjectURL(transferImage);
    setTransferImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [transferImage]);

  useEffect(() => {
    if (!lettreImage) { setLettreImagePreview(""); return; }
    const url = URL.createObjectURL(lettreImage);
    setLettreImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [lettreImage]);

  useEffect(() => {
    if (!chequeImage) { setChequeImagePreview(""); return; }
    const url = URL.createObjectURL(chequeImage);
    setChequeImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [chequeImage]);

  const handleWarrantyChoice = (acceptWarranty: boolean) => {
    const isMixed = selectedTypes.length > 1;
    const primaryType = selectedTypes[0] || "card";

    // Per-method amounts (used both for single and multi-modal)
    const pm: any = {
      type: isMixed ? "mixed" : (primaryType as PaymentMethod["type"]),

      // For single method, keep montant/reste (backward compat)
      ...(!isMixed && isSelected("cri") ? { montant: criMontantNum, reste: Math.max(totalTicket - criMontantNum, 0), totalTicket } : {}),
      ...(!isMixed && isSelected("bank_transfer") ? { montant: bankMontantNum, reste: Math.max(totalPrice - bankMontantNum, 0) } : {}),
      ...(!isMixed && isSelected("lettre_de_change") ? { montant: lettreMontantNum, reste: Math.max(totalPrice - lettreMontantNum, 0) } : {}),
      ...(!isMixed && isSelected("cheque") ? { montant: chequeMontantNum, reste: Math.max(totalPrice - chequeMontantNum, 0) } : {}),
      ...(!isMixed && isSelected("cash_on_delivery") ? { montant: cashOnDeliveryMontantNum, reste: Math.max(totalPrice - cashOnDeliveryMontantNum, 0) } : {}),

      // Per-method private amounts (for multi-modal & order-context)
      _criMontant: isSelected("cri") ? criMontantNum : 0,
      _criReste: isSelected("cri") ? Math.max(totalTicket - criMontantNum, 0) : 0,
      _bankMontant: isSelected("bank_transfer") ? bankMontantNum : 0,
      _bankReste: isSelected("bank_transfer") ? Math.max(totalPrice - bankMontantNum, 0) : 0,
      _lettreMontant: isSelected("lettre_de_change") ? lettreMontantNum : 0,
      _lettreReste: isSelected("lettre_de_change") ? Math.max(totalPrice - lettreMontantNum, 0) : 0,
      _chequeMontant: isSelected("cheque") ? chequeMontantNum : 0,
      _chequeReste: isSelected("cheque") ? Math.max(totalPrice - chequeMontantNum, 0) : 0,
      _codMontant: isSelected("cash_on_delivery") ? cashOnDeliveryMontantNum : 0,
      _codReste: isSelected("cash_on_delivery") ? Math.max(totalPrice - cashOnDeliveryMontantNum, 0) : 0,

      // Card
      ...(isSelected("card") ? cardData : {}),

      // CRI metadata
      ...(isSelected("cri") ? { remarque: criRemarque || undefined } : {}),

      // Virement bancaire metadata
      ...(isSelected("bank_transfer") ? {
        remarque: bankRemarque || undefined,
        transferNumber: transferNumber || undefined,
        transferHolderName: transferHolderName || undefined,
        bankName: bankName || undefined,
        transferImageName: transferImage?.name || undefined,
        _transferImageFile: transferImage || undefined,
      } : {}),

      // Lettre de change metadata
      ...(isSelected("lettre_de_change") ? {
        lettreRemarque: lettreRemarque || undefined,
        lettreNumber: lettreNumber || undefined,
        lettreDate: lettreDate || undefined,
        lettreName: lettreName || undefined,
        lettreBankName: lettreBankName || undefined,
        lettreImageName: lettreImage?.name || undefined,
        lettreRIB: lettreRIB || undefined,
        lettreLieu: lettreLieu || undefined,
        _lettreImageFile: lettreImage || undefined,
      } : {}),

      // Chèque metadata
      ...(isSelected("cheque") ? {
        chequeRemarque: chequeRemarque || undefined,
        chequeNumber: chequeNumber || undefined,
        chequeDate: chequeDate || undefined,
        chequeName: chequeName || undefined,
        chequeBankName: chequeBankName || undefined,
        chequeImageName: chequeImage?.name || undefined,
        _chequeImageFile: chequeImage || undefined,
      } : {}),

      // TPE / Cash on delivery metadata
      ...(isSelected("cash_on_delivery") ? {
        codRemarque: cashOnDeliveryRemarque || undefined,
        authorizationNumber: authorizationNumber || undefined,
        codBankName: cashOnDeliveryBankName || undefined,
      } : {}),
    };

    onSubmit(pm as PaymentMethod, acceptWarranty);
  };

  const handleContinue = () => {
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un mode de paiement.");
      return;
    }
    // Limite espèces à 4999 DT
    if (isSelected("cash_on_delivery") && cashOnDeliveryMontantNum > 4999) {
      alert("Le paiement en espèces est limité à 4 999 DT. Veuillez choisir un autre mode de paiement pour le montant excédentaire.");
      return;
    }
    // Image obligatoire pour virement, chèque, lettre de change
    if (isSelected("bank_transfer") && !transferImage) {
      alert("Veuillez joindre une image du justificatif de virement bancaire (obligatoire).");
      return;
    }
    if (isSelected("cheque") && !chequeImage) {
      alert("Veuillez joindre une image du chèque (obligatoire).");
      return;
    }
    if (isSelected("lettre_de_change") && !lettreImage) {
      alert("Veuillez joindre une image de la lettre de change (obligatoire).");
      return;
    }
    setShowWarrantyButtons(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleContinue();
  };

  const isMultiModal = selectedTypes.length > 1;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Méthode de paiement</CardTitle>
        {isMultiModal && (
          <p className="text-sm text-blue-600 font-medium mt-1">
            Paiement multi-modalités activé ({selectedTypes.length} méthodes sélectionnées)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment type selection — checkboxes allow multi-modal */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 mb-2">
              Sélectionnez le(s) mode(s) de paiement
            </p>
            {ALL_PAYMENT_TYPES.map(({ id, label, Icon }) => (
              <label
                key={id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected(id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected(id)}
                  onChange={() => toggleType(id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Icon className="h-5 w-5 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Global balance indicator (only shown when multi-modal) */}
          {isMultiModal && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Récapitulatif paiement</div>
              <div className="flex justify-between text-sm">
                <span>Total commande</span>
                <span className="font-semibold">{formatAmount(totalPrice)} DT</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Total saisi</span>
                <span className="font-semibold">{formatAmount(totalEnteredAllMethods)} DT</span>
              </div>
              <div className="flex justify-between text-sm text-rose-700 border-t pt-1 mt-1">
                <span className="font-semibold">Reste à répartir</span>
                <span className="font-bold">{formatAmount(globalReste)} DT</span>
              </div>
            </div>
          )}

          {/* ── Card fields ── */}
          {isSelected("card") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Informations de carte</h3>
              <div>
                <Label htmlFor="cardNumber">Numéro de carte *</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber}
                  onChange={(e) => setCardData((prev) => ({ ...prev, cardNumber: e.target.value }))}
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
                    onChange={(e) => setCardData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value }))}
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
                  onChange={(e) => setCardData((prev) => ({ ...prev, holderName: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          {/* ── Cash on delivery fields ── */}
          {isSelected("cash_on_delivery") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : TPE À LA LIVRAISON</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalPrice)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(Math.max(totalPrice - cashOnDeliveryMontantNum, 0))} className="rounded-r-none border-red-200 bg-red-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={cashOnDeliveryMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setCashOnDeliveryMontantInput(formatAmount(totalPrice)); return; }
                        setCashOnDeliveryMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-green-100 text-sm text-green-700 border-green-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={3} placeholder="Ajouter une remarque..." value={cashOnDeliveryRemarque} onChange={(e) => setCashOnDeliveryRemarque(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° d'autorisation</Label>
                  <Input type="text" placeholder="N° d'autorisation..." value={authorizationNumber} onChange={(e) => setAuthorizationNumber(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select value={cashOnDeliveryBankName} onChange={(e) => setCashOnDeliveryBankName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                    <option value="">Sélectionner une banque...</option>
                    {["Banque de Tunisie","BNA","BIAT","UIB","Amen Bank","Attijari Bank","UBCI","Autres"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Bank transfer fields ── */}
          {isSelected("bank_transfer") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Virement</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalPrice)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(Math.max(totalPrice - bankMontantNum, 0))} className="rounded-r-none border-red-200 bg-red-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={bankMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setBankMontantInput(formatAmount(totalPrice)); return; }
                        setBankMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-green-100 text-sm text-green-700 border-green-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={3} placeholder="Ajouter une remarque..." value={bankRemarque} onChange={(e) => setBankRemarque(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold">N° de Virement</Label>
                  <Input placeholder="N° de Virement" value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input placeholder="Nom du titulaire" value={transferHolderName} onChange={(e) => setTransferHolderName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Selectionner une banque</option>
                    {BANK_OPTIONS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Image <span className="text-red-600">*</span></Label>
                  <Input type="file" accept="image/*" onChange={(e) => setTransferImage(e.target.files?.[0] || null)} />
                  <div className="mt-2 h-28 rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                    {transferImagePreview
                      ? <img src={transferImagePreview} alt="Apercu" className="h-full w-full object-contain" />
                      : <span className="text-xs text-gray-500">Aucune image sélectionnée</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CRI fields ── */}
          {isSelected("cri") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : CRI</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalTicket)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(Math.max(totalTicket - criMontantNum, 0))} className="rounded-r-none border-red-200 bg-red-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={criMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalTicket) { setCriMontantInput(formatAmount(totalTicket)); return; }
                        setCriMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={3} placeholder="Ajouter une remarque..." value={criRemarque} onChange={(e) => setCriRemarque(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Lettre de change fields ── */}
          {isSelected("lettre_de_change") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Lettre de change</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalPrice)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(Math.max(totalPrice - lettreMontantNum, 0))} className="rounded-r-none border-red-200 bg-red-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={lettreMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setLettreMontantInput(formatAmount(totalPrice)); return; }
                        setLettreMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={2} placeholder="Ajouter une remarque..." value={lettreRemarque} onChange={(e) => setLettreRemarque(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° Lettre de change</Label>
                  <Input type="text" placeholder="Numéro de la lettre..." value={lettreNumber} onChange={(e) => setLettreNumber(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date Lettre de change</Label>
                  <Input type="date" value={lettreDate} onChange={(e) => setLettreDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input type="text" placeholder="Nom du bénéficiaire..." value={lettreName} onChange={(e) => setLettreName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select value={lettreBankName} onChange={(e) => setLettreBankName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                    <option value="">Sélectionner une banque...</option>
                    {["Banque de Tunisie","BNA","BIAT","UIB","Amen Bank","Attijari Bank","UBCI","Autres"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">RIB</Label>
                  <Input type="text" placeholder="RIB..." value={lettreRIB} onChange={(e) => setLettreRIB(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Lieu</Label>
                  <Input type="text" placeholder="Lieu d'émission..." value={lettreLieu} onChange={(e) => setLettreLieu(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Image de la lettre de change <span className="text-red-600">*</span></Label>
                <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLettreImage(f); }} className="mt-1" />
                {lettreImagePreview
                  ? <div className="mt-2 relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden"><img src={lettreImagePreview} alt="Lettre preview" className="w-full h-full object-cover" /></div>
                  : <span className="text-xs text-gray-500">Aucune image sélectionnée</span>
                }
              </div>
            </div>
          )}

          {/* ── Chèque fields ── */}
          {isSelected("cheque") && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Paiement : Chèque</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalPrice)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-red-700">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(Math.max(totalPrice - chequeMontantNum, 0))} className="rounded-r-none border-red-200 bg-red-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-red-100 text-sm text-red-700 border-red-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-green-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={chequeMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setChequeMontantInput(formatAmount(totalPrice)); return; }
                        setChequeMontantInput(e.target.value);
                      }}
                      className="rounded-r-none border-green-200 bg-green-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-green-100 text-green-700 border-green-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={2} placeholder="Ajouter une remarque..." value={chequeRemarque} onChange={(e) => setChequeRemarque(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">N° Chèque</Label>
                  <Input type="text" placeholder="Numéro du chèque..." value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date Chèque</Label>
                  <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input type="text" placeholder="Nom du bénéficiaire..." value={chequeName} onChange={(e) => setChequeName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select value={chequeBankName} onChange={(e) => setChequeBankName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                    <option value="">Sélectionner une banque...</option>
                    {["Banque de Tunisie","BNA","BIAT","UIB","Amen Bank","Attijari Bank","UBCI","Autres"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Image du chèque <span className="text-red-600">*</span></Label>
                <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setChequeImage(f); }} className="mt-1" />
                {chequeImagePreview
                  ? <div className="mt-2 relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden"><img src={chequeImagePreview} alt="Cheque preview" className="w-full h-full object-cover" /></div>
                  : <span className="text-xs text-gray-500">Aucune image sélectionnée</span>
                }
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Retour
            </Button>
            {!showWarrantyButtons ? (
              <Button type="submit" className="flex-1">
                Continuer
              </Button>
            ) : (
              <div className="flex-1 flex gap-2">
                <Button type="button" onClick={() => handleWarrantyChoice(true)} className="flex-1 bg-yellow-500 hover:bg-yellow-600">
                  Obtenir la garantie
                </Button>
                <Button type="button" onClick={() => handleWarrantyChoice(false)} className="flex-1 bg-black">
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
