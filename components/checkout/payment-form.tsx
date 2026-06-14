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
import { CreditCard, Building, Truck, Receipt, Banknote } from "lucide-react";
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

// especes & cash_on_delivery sont gérés via le parent "delivery"
const ALL_PAYMENT_TYPES = [
  { id: "card",            label: "Carte bancaire",       Icon: CreditCard, disabled: true },
  { id: "bank_transfer",   label: "Virement bancaire",    Icon: Building },
  { id: "delivery",        label: "Paiement à la livraison", Icon: Truck },
  { id: "cri",             label: "Paiement CRI",         Icon: Receipt },
  { id: "lettre_de_change",label: "Lettre de change",     Icon: Receipt },
  { id: "cheque",          label: "Chèque",               Icon: Receipt },
];

export function PaymentForm({ onSubmit, onBack, totalPrice }: PaymentFormProps) {
  // Multi-modal: array of selected payment types
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const isSelected = (type: string) => selectedTypes.includes(type);
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // "Paiement à la livraison" : multi-sélection Espèces ET/OU TPE
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
  const [especesChecked, setEspecesChecked] = useState(false);
  const [tpeChecked, setTpeChecked] = useState(false);
  const isDeliverySelected = especesChecked || tpeChecked;

  const toggleDeliveryParent = () => {
    if (deliveryExpanded) {
      setSelectedTypes((prev) => prev.filter((t) => t !== "especes" && t !== "cash_on_delivery"));
      setEspecesChecked(false);
      setTpeChecked(false);
      setDeliveryExpanded(false);
    } else {
      setDeliveryExpanded(true);
      // Espèces coché par défaut à l'ouverture, pour afficher directement le récapitulatif
      setEspecesChecked(true);
      setSelectedTypes((prev) => (prev.includes("especes") ? prev : [...prev, "especes"]));
      setEspecesMontantInput(formatAmount(totalPrice));
    }
  };

  const toggleEspeces = () => {
    const next = !especesChecked;
    setEspecesChecked(next);
    setSelectedTypes((prev) => {
      const filtered = prev.filter((t) => t !== "especes");
      return next ? [...filtered, "especes"] : filtered;
    });
    if (!next) {
      setEspecesMontantInput("");
      // Si seulement TPE reste, il prend le total complet
      if (tpeChecked) setCashOnDeliveryMontantInput(formatAmount(totalPrice));
    } else if (next && !tpeChecked) {
      // Seulement espèces → remplir automatiquement avec le total
      setEspecesMontantInput(formatAmount(totalPrice));
    }
  };

  const toggleTpe = () => {
    const next = !tpeChecked;
    setTpeChecked(next);
    setSelectedTypes((prev) => {
      const filtered = prev.filter((t) => t !== "cash_on_delivery");
      return next ? [...filtered, "cash_on_delivery"] : filtered;
    });
    if (!next) {
      setCashOnDeliveryMontantInput("");
      // Si seulement espèces reste, il prend le total complet
      if (especesChecked) setEspecesMontantInput(formatAmount(totalPrice));
    } else if (next && !especesChecked) {
      // Seulement TPE → remplir automatiquement avec le total
      setCashOnDeliveryMontantInput(formatAmount(totalPrice));
    }
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
  const [cashOnDeliveryBankName, setCashOnDeliveryBankName] = useState("");
  const [especesMontantInput, setEspecesMontantInput] = useState("");
  const [especesRemarque, setEspecesRemarque] = useState("");
  // Shared amount for delivery sub-types (especes + TPE share one Montant/Reste)
  const [deliveryMontantInput, setDeliveryMontantInput] = useState("");
  const [deliveryRemarque, setDeliveryRemarque] = useState("");
  const [criImage, setCriImage] = useState<File | null>(null);
  const [criImagePreview, setCriImagePreview] = useState("");

  // Total ticket = current order total + previous CRI balance (only relevant for CRI)
  const totalTicket = totalPrice + previousCriBalance;

  const criMontantNum = Math.min(Math.max(parseAmount(criMontantInput), 0), totalTicket);
  const bankMontantNum = Math.min(Math.max(parseAmount(bankMontantInput), 0), totalPrice);
  const lettreMontantNum = Math.min(Math.max(parseAmount(lettreMontantInput), 0), totalPrice);
  const chequeMontantNum = Math.min(Math.max(parseAmount(chequeMontantInput), 0), totalPrice);
  const cashOnDeliveryMontantNum = Math.min(Math.max(parseAmount(cashOnDeliveryMontantInput), 0), totalPrice);

  // Auto-remplissage du montant restant : si exactement 2 modes de paiement
  // payables sont sélectionnés (ex: especes + cheque), saisir un montant dans
  // l'un remplit automatiquement l'autre avec le reste du total.
  const PAYABLE_SETTERS: Record<string, (v: string) => void> = {
    especes: setEspecesMontantInput,
    tpe: setCashOnDeliveryMontantInput,
    bank_transfer: setBankMontantInput,
    lettre_de_change: setLettreMontantInput,
    cheque: setChequeMontantInput,
  };
  const isActivePayable = (id: string) => {
    if (id === "especes") return especesChecked;
    if (id === "tpe") return tpeChecked;
    return isSelected(id);
  };
  const autoFillOther = (currentId: string, enteredValue: number) => {
    const active = Object.keys(PAYABLE_SETTERS).filter(isActivePayable);
    if (active.length === 2) {
      const other = active.find((id) => id !== currentId);
      if (other) PAYABLE_SETTERS[other](formatAmount(Math.max(totalPrice - enteredValue, 0)));
    }
  };

  const especesMontantNum = Math.min(Math.max(parseAmount(especesMontantInput), 0), totalPrice);
  const deliveryMontantNum = Math.min(Math.max(parseAmount(deliveryMontantInput), 0), totalPrice);
  const tpeMontantNum = Math.min(Math.max(parseAmount(cashOnDeliveryMontantInput), 0), totalPrice);

  // Combined total across all selected methods (for balance display)
  const totalEnteredAllMethods =
    (isSelected("bank_transfer") ? bankMontantNum : 0) +
    (isSelected("cri") ? criMontantNum : 0) +
    (isSelected("lettre_de_change") ? lettreMontantNum : 0) +
    (isSelected("cheque") ? chequeMontantNum : 0) +
    (especesChecked ? especesMontantNum : 0) +
    (tpeChecked ? tpeMontantNum : 0);

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

  // CRI amount = 1% of totalPrice (auto-calculated, read-only)
  const criAutoAmount = Math.round(totalPrice * 0.01 * 100) / 100;

  // Initialisation des montants à la sélection d'un mode de paiement
  useEffect(() => {
    if (isSelected("cri")) {
      setCriMontantInput(formatAmount(criAutoAmount));
    }
  }, [selectedTypes, criAutoAmount]);

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
    if (especesChecked && especesMontantInput === "") {
      setEspecesMontantInput(formatAmount(!tpeChecked ? totalPrice : 0));
    }
  }, [especesChecked, totalPrice]);

  useEffect(() => {
    if (tpeChecked && cashOnDeliveryMontantInput === "") {
      setCashOnDeliveryMontantInput(formatAmount(!especesChecked ? totalPrice : 0));
    }
  }, [tpeChecked, totalPrice]);

  useEffect(() => {
    if (!criImage) { setCriImagePreview(""); return; }
    const url = URL.createObjectURL(criImage);
    setCriImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [criImage]);

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
      ...(!isMixed && isSelected("cash_on_delivery") ? { montant: deliveryMontantNum, reste: Math.max(totalPrice - deliveryMontantNum, 0) } : {}),
      ...(!isMixed && isSelected("especes") ? { montant: deliveryMontantNum, reste: Math.max(totalPrice - deliveryMontantNum, 0) } : {}),

      // Per-method private amounts (for multi-modal & order-context)
      _criMontant: isSelected("cri") ? criMontantNum : 0,
      _criReste: isSelected("cri") ? Math.max(totalTicket - criMontantNum, 0) : 0,
      _bankMontant: isSelected("bank_transfer") ? bankMontantNum : 0,
      _bankReste: isSelected("bank_transfer") ? Math.max(totalPrice - bankMontantNum, 0) : 0,
      _lettreMontant: isSelected("lettre_de_change") ? lettreMontantNum : 0,
      _lettreReste: isSelected("lettre_de_change") ? Math.max(totalPrice - lettreMontantNum, 0) : 0,
      _chequeMontant: isSelected("cheque") ? chequeMontantNum : 0,
      _chequeReste: isSelected("cheque") ? Math.max(totalPrice - chequeMontantNum, 0) : 0,
      _codMontant: isSelected("cash_on_delivery") ? deliveryMontantNum : 0,
      _codReste: isSelected("cash_on_delivery") ? Math.max(totalPrice - deliveryMontantNum, 0) : 0,
      _especesMontant: isSelected("especes") ? deliveryMontantNum : 0,
      _especesReste: isSelected("especes") ? Math.max(totalPrice - deliveryMontantNum, 0) : 0,

      // Card
      ...(isSelected("card") ? cardData : {}),

      // CRI metadata
      ...(isSelected("cri") ? {
        remarque: criRemarque || undefined,
        criImageName: criImage?.name || undefined,
        _criImageFile: criImage || undefined,
      } : {}),

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

      // Delivery (Espèces / TPE) metadata — montants séparés
      ...(isDeliverySelected ? {
        deliveryRemarque: deliveryRemarque || undefined,
        especesMontant: especesChecked ? especesMontantNum : 0,
        tpeMontant: tpeChecked ? tpeMontantNum : 0,
        deliverySubType: especesChecked && tpeChecked ? "mixed" : especesChecked ? "especes" : "cash_on_delivery",
      } : {}),
    };

    onSubmit(pm as PaymentMethod, acceptWarranty);
  };

  const handleContinue = () => {
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un mode de paiement.");
      return;
    }
    // Si livraison sélectionnée → vérifier qu'au moins un sous-type est coché
    if (deliveryExpanded && !especesChecked && !tpeChecked) {
      alert("Veuillez cocher au moins un mode : Espèces ou TPE.");
      return;
    }
    // Image obligatoire pour CRI
    if (isSelected("cri") && !criImage) {
      alert("Veuillez joindre une image pour le paiement CRI (obligatoire).");
      return;
    }
    // Champs obligatoires pour virement
    if (isSelected("bank_transfer")) {
      if (!transferNumber.trim()) {
        alert("Veuillez saisir le N° de virement (obligatoire).");
        return;
      }
      if (!transferHolderName.trim()) {
        alert("Veuillez saisir le nom du titulaire (obligatoire).");
        return;
      }
      if (!bankName.trim()) {
        alert("Veuillez sélectionner une banque (obligatoire).");
        return;
      }
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
  const deliveryOk = !deliveryExpanded || especesChecked || tpeChecked;
  const canContinue = selectedTypes.length > 0 && totalEnteredAllMethods >= totalPrice - 0.01 && deliveryOk;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Méthode de paiement</CardTitle>
        {isMultiModal && (
          <p className="text-sm text-yellow-700 font-medium mt-1">
            Paiement multi-modalités activé ({selectedTypes.length} méthodes sélectionnées)
          </p>
        )}
        <div className="mt-2 text-sm text-slate-600 space-y-0.5">
          <p>-Tarif : Dès 10 DT (ajustable selon les dimensions).</p>
          <p>-Validation : Notre service commercial vous contactera pour confirmer les frais.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment type selection — checkboxes allow multi-modal */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 mb-2">
              Sélectionnez le(s) mode(s) de paiement
            </p>
            {ALL_PAYMENT_TYPES.map(({ id, label, Icon, disabled: itemDisabled }) => {
              const isCriDisabled = id === "cri" && totalPrice <= 1000;
              const isItemDisabled = itemDisabled || isCriDisabled;

              // ── Parent "Paiement à la livraison" ──
              if (id === "delivery") {
                return (
                  <div key="delivery" className="border rounded-lg overflow-hidden">
                    {/* Ligne parente */}
                    <label
                      className={`flex items-center space-x-3 p-3 border-2 transition-colors cursor-pointer ${
                        deliveryExpanded
                          ? "border-yellow-500 bg-yellow-400"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={deliveryExpanded}
                        onChange={toggleDeliveryParent}
                        className="h-4 w-4 rounded border-gray-300 text-yellow-500 accent-black focus:ring-yellow-400"
                      />
                      <Truck className="h-5 w-5 text-gray-500 shrink-0" />
                      <span className={`flex-1 text-sm font-medium ${deliveryExpanded ? "text-black font-semibold" : "text-slate-700"}`}>Paiement à la livraison</span>
                      {isDeliverySelected && (
                        <span className="text-xs text-black font-semibold">
                          {[especesChecked && "Espèces", tpeChecked && "TPE"].filter(Boolean).join(" + ")}
                        </span>
                      )}
                    </label>
                  </div>
                );
              }

              // ── Autres modes ──
              return (
                <label
                  key={id}
                  className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors ${
                    isItemDisabled
                      ? "opacity-40 cursor-not-allowed pointer-events-none border-gray-200 bg-gray-50"
                      : isSelected(id)
                      ? "border-yellow-500 bg-yellow-400 cursor-pointer"
                      : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(id)}
                    onChange={() => !isItemDisabled && toggleType(id)}
                    disabled={isItemDisabled}
                    className="h-4 w-4 rounded border-gray-300 text-yellow-500 accent-black focus:ring-yellow-400"
                  />
                  <Icon className="h-5 w-5 text-gray-500 shrink-0" />
                  <span className={`flex-1 text-sm font-medium ${isSelected(id) ? "text-black font-semibold" : "text-slate-700"}`}>{label}</span>
                  {isCriDisabled && (
                    <span className="text-xs text-gray-400 italic">Disponible pour commandes &gt; 1000 DT</span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Récapitulatif supprimé — le total est affiché dans la page de commande */}

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

          {/* ── Delivery — sélection du mode + montants séparés Espèces / TPE ── */}
          {deliveryExpanded && (
            <div className="space-y-4 p-4 bg-white rounded-lg border-2 border-yellow-400">
              {/* Sélection du mode — en haut du rectangle, au-dessus du Total */}
              <div className="flex items-center justify-center gap-4">
                {/* Espèces */}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  especesChecked ? "border-yellow-500 bg-yellow-400 text-black font-semibold" : "border-gray-200 bg-white hover:border-yellow-400 text-gray-600"
                }`}>
                  <input
                    type="checkbox"
                    checked={especesChecked}
                    onChange={toggleEspeces}
                    className="h-4 w-4 rounded accent-black"
                  />
                  <Banknote className="h-4 w-4" />
                  <span className="text-sm font-semibold">Espèces</span>
                </label>
                {/* TPE */}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  tpeChecked ? "border-yellow-500 bg-yellow-400 text-black font-semibold" : "border-gray-200 bg-white hover:border-yellow-400 text-gray-600"
                }`}>
                  <input
                    type="checkbox"
                    checked={tpeChecked}
                    onChange={toggleTpe}
                    className="h-4 w-4 rounded accent-black"
                  />
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-semibold">TPE</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalPrice)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                {/* Montant payé en Espèces */}
                <div>
                  <Label className={`text-sm font-semibold ${especesChecked ? "text-yellow-700" : "text-gray-400"}`}>
                    Montant payé Espèces
                  </Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={especesChecked ? especesMontantInput : ""}
                      disabled={!especesChecked}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setEspecesMontantInput(formatAmount(totalPrice)); autoFillOther("especes", totalPrice); return; }
                        setEspecesMontantInput(e.target.value);
                        autoFillOther("especes", v);
                      }}
                      className={`rounded-r-none ${especesChecked ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-100 text-gray-400"}`}
                    />
                    <span className={`inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm ${especesChecked ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>DT</span>
                  </div>
                </div>
                {/* Montant payé en TPE */}
                <div>
                  <Label className={`text-sm font-semibold ${tpeChecked ? "text-yellow-700" : "text-gray-400"}`}>
                    Montant payé TPE
                  </Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={tpeChecked ? cashOnDeliveryMontantInput : ""}
                      disabled={!tpeChecked}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setCashOnDeliveryMontantInput(formatAmount(totalPrice)); autoFillOther("tpe", totalPrice); return; }
                        setCashOnDeliveryMontantInput(e.target.value);
                        autoFillOther("tpe", v);
                      }}
                      className={`rounded-r-none ${tpeChecked ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-100 text-gray-400"}`}
                    />
                    <span className={`inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm ${tpeChecked ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={2} placeholder="Ajouter une remarque..." value={deliveryRemarque} onChange={(e) => setDeliveryRemarque(e.target.value)} />
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
                  <Label className="text-sm font-semibold text-slate-600">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(globalReste)} className="rounded-r-none border-slate-200 bg-slate-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-slate-100 text-sm text-slate-600 border-slate-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-yellow-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={bankMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setBankMontantInput(formatAmount(totalPrice)); autoFillOther("bank_transfer", totalPrice); return; }
                        setBankMontantInput(e.target.value);
                        autoFillOther("bank_transfer", v);
                      }}
                      className="rounded-r-none border-yellow-200 bg-yellow-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-yellow-100 text-sm text-yellow-700 border-yellow-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={3} placeholder="Ajouter une remarque..." value={bankRemarque} onChange={(e) => setBankRemarque(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold">N° de Virement <span className="text-red-600">*</span></Label>
                  <Input placeholder="N° de Virement" value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} required />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom <span className="text-red-600">*</span></Label>
                  <Input placeholder="Nom du titulaire" value={transferHolderName} onChange={(e) => setTransferHolderName(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold">Banque <span className="text-red-600">*</span></Label>
                  <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
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
              <p className="text-xs text-yellow-700">Montant CRI calculé automatiquement (1% du total commande)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Total Ticket</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(totalTicket)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-600">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(globalReste)} className="rounded-r-none border-slate-200 bg-slate-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-slate-100 text-sm text-slate-600 border-slate-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-yellow-700">Montant CRI (1%)</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" readOnly
                      value={criMontantInput}
                      className="rounded-r-none border-yellow-200 bg-yellow-50 cursor-not-allowed"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-yellow-100 text-yellow-700 border-yellow-200">DT</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea className="mt-1 resize-y" rows={3} placeholder="Ajouter une remarque..." value={criRemarque} onChange={(e) => setCriRemarque(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Image CRI <span className="text-red-600">*</span></Label>
                <Input type="file" accept="image/*" onChange={(e) => setCriImage(e.target.files?.[0] || null)} className="mt-1" />
                <div className="mt-2 h-28 rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                  {criImagePreview
                    ? <img src={criImagePreview} alt="Apercu CRI" className="h-full w-full object-contain" />
                    : <span className="text-xs text-gray-500">Aucune image sélectionnée</span>
                  }
                </div>
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
                  <Label className="text-sm font-semibold text-slate-600">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(globalReste)} className="rounded-r-none border-slate-200 bg-slate-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-slate-100 text-sm text-slate-600 border-slate-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-yellow-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={lettreMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setLettreMontantInput(formatAmount(totalPrice)); autoFillOther("lettre_de_change", totalPrice); return; }
                        setLettreMontantInput(e.target.value);
                        autoFillOther("lettre_de_change", v);
                      }}
                      className="rounded-r-none border-yellow-200 bg-yellow-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-yellow-100 text-yellow-700 border-yellow-200">DT</span>
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
                  <Label className="text-sm font-semibold text-slate-600">Reste</Label>
                  <div className="mt-1 flex">
                    <Input readOnly value={formatAmount(globalReste)} className="rounded-r-none border-slate-200 bg-slate-50" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-slate-100 text-sm text-slate-600 border-slate-200">DT</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-yellow-700">Montant</Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={chequeMontantInput}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (v > totalPrice) { setChequeMontantInput(formatAmount(totalPrice)); autoFillOther("cheque", totalPrice); return; }
                        setChequeMontantInput(e.target.value);
                        autoFillOther("cheque", v);
                      }}
                      className="rounded-r-none border-yellow-200 bg-yellow-50"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-yellow-100 text-yellow-700 border-yellow-200">DT</span>
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

          <p className="text-xs text-gray-500 italic text-center">
            Possibilité de paiement avec plusieurs méthodes
          </p>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Retour
            </Button>
            {!showWarrantyButtons ? (
              <Button
                type="submit"
                className={`flex-1 bg-yellow-500 hover:bg-yellow-600 text-black ${!canContinue ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!canContinue}
              >
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
