"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/lib/api-client";
import type { Order } from "@/types/admin";
import { CreditCard, Building, Truck, Receipt, Banknote, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

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

const LETTRE_CHEQUE_BANKS = [
  "Banque de Tunisie",
  "BNA",
  "BIAT",
  "UIB",
  "Amen Bank",
  "Attijari Bank",
  "UBCI",
  "Autres",
];


export const PAYMENT_LABELS: Record<string, string> = {
  card: "Carte bancaire",
  cash_on_delivery: "TPE à la livraison",
  especes: "Espèces",
  bank_transfer: "Virement bancaire",
  cri: "Paiement CRI",
  cheque: "Chèque",
  check: "Chèque",
  lettre_de_change: "Lettre de change",
  mixed: "Multi-modalités",
};

const MODE_OPTIONS = [
  { id: "card", label: "Carte bancaire", Icon: CreditCard },
  { id: "bank_transfer", label: "Virement bancaire", Icon: Building },
  { id: "especes", label: "Espèces", Icon: Banknote },
  { id: "cri", label: "Paiement CRI", Icon: Receipt },
  { id: "cash_on_delivery", label: "TPE à la livraison", Icon: Truck },
  { id: "lettre_de_change", label: "Lettre de change", Icon: Receipt },
  { id: "cheque", label: "Chèque", Icon: Receipt },
  { id: "check", label: "Chèque", Icon: Receipt },
];

function formatAmount(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
function parseAmount(value: string): number {
  return Number.parseFloat(value.replace(",", ".")) || 0;
}

interface PayerFactureModalProps {
  order: Order;
  onClose: () => void;
  onPaid: () => void;
}

export default function PayerFactureModal({ order, onClose, onPaid }: PayerFactureModalProps) {
  const total = order.totalAmount + (order.deliveryCost || 0);

  // Mode(s) de paiement choisi(s) par le client (par défaut, le vendeur coche le même)
  const clientMethod = order.paymentMethod || "card";
  const [selectedModes, setSelectedModes] = useState<string[]>(
    MODE_OPTIONS.some((m) => m.id === clientMethod) ? [clientMethod] : ["card"]
  );

  // Montant encaissé par mode (clé = mode id)
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const getAmount = (id: string) =>
    amounts[id] !== undefined ? parseAmount(amounts[id]) : 0;
  const getAmountInput = (id: string) =>
    amounts[id] !== undefined ? amounts[id] : formatAmount(total);

  const payableModes = (modes: string[]) => modes.filter((m) => m !== "card");

  const toggleMode = (id: string) => {
    setSelectedModes((prev) => {
      const isAdding = !prev.includes(id);
      const next = isAdding ? [...prev, id] : prev.filter((m) => m !== id);
      if (id !== "card") {
        setAmounts((prevAmounts) => {
          const amts = { ...prevAmounts };
          if (isAdding) {
            if (id === "cri") {
              // CRI = 1% du montant de la facture
              amts[id] = formatAmount(Math.round(total * 0.01 * 100) / 100);
            } else {
              const others = payableModes(next).filter((m) => m !== id);
              const sumOthers = others.reduce(
                (s, m) => s + (amts[m] !== undefined ? parseAmount(amts[m]) : total),
                0
              );
              amts[id] = formatAmount(Math.max(total - sumOthers, 0));
            }
          } else {
            delete amts[id];
          }
          return amts;
        });
      }
      return next;
    });
  };

  // Met à jour le montant d'un mode. Chaque mode garde son propre montant ;
  // le reste global est calculé séparément (total - somme des montants saisis).
  const handleAmountChange = (id: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const sumEntered = payableModes(selectedModes).reduce((s, m) => s + getAmount(m), 0);
  const remainingTotal = Math.max(total - sumEntered, 0);

  const [remarque, setRemarque] = useState("");

  // Virement
  const [transferNumber, setTransferNumber] = useState("");
  const [transferHolderName, setTransferHolderName] = useState("Pneushop");
  const [bankName, setBankName] = useState("");
  const [transferImage, setTransferImage] = useState<File | null>(null);

  // Lettre de change
  const [lettreNumber, setLettreNumber] = useState("");
  const [lettreDate, setLettreDate] = useState("");
  const [lettreName, setLettreName] = useState("Pneushop");
  const [lettreBankName, setLettreBankName] = useState("");
  const [lettreRib, setLettreRib] = useState("");
  const [lettreLieu, setLettreLieu] = useState("");
  const [lettreImage, setLettreImage] = useState<File | null>(null);

  // Chèque
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeName, setChequeName] = useState("Pneushop");
  const [chequeBankName, setChequeBankName] = useState("");
  const [chequeImage, setChequeImage] = useState<File | null>(null);

  // TPE à la livraison
  const [codAuthNumber, setCodAuthNumber] = useState("");
  const [codBankName, setCodBankName] = useState("");

  // Vendeur en charge de la commande (affiché sur la facture) — auto-rempli avec l'utilisateur connecté
  const { user } = useAuth();
  const currentUserName =
    (user?.firstName || user?.lastName)
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.email || "";
  const vendeur = order.commercial || currentUserName;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasMode = (id: string) => selectedModes.includes(id);
  const onlyCard = selectedModes.length === 1 && selectedModes[0] === "card";

  const handleSubmit = async () => {
    setError("");

    if (selectedModes.length === 0) {
      setError("Veuillez sélectionner au moins un mode de paiement.");
      return;
    }

    // Validations minimales par mode
    if (hasMode("bank_transfer")) {
      if (!transferNumber.trim() || !transferHolderName.trim() || !bankName.trim()) {
        setError("Veuillez renseigner le N° de virement, le nom du titulaire et la banque.");
        return;
      }
    }
    if ((hasMode("cheque") || hasMode("check")) && !chequeNumber.trim()) {
      setError("Veuillez renseigner le N° de chèque.");
      return;
    }
    if (hasMode("lettre_de_change") && !lettreNumber.trim()) {
      setError("Veuillez renseigner le N° de la lettre de change.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        payment_status: remainingTotal <= 0.001 ? "paid" : "pending",
        payment_method: selectedModes.length > 1 ? "mixed" : selectedModes[0],
        commercial: vendeur,
      };

      if (hasMode("bank_transfer")) {
        const montant = getAmount("bank_transfer");
        Object.assign(payload, {
          transfer_number: transferNumber,
          transfer_holder_name: transferHolderName,
          transfer_bank_name: bankName,
          transfer_amount_paid: montant,
          transfer_remaining: remainingTotal,
          transfer_remarque: remarque || undefined,
        });
      }
      if (hasMode("lettre_de_change")) {
        const montant = getAmount("lettre_de_change");
        Object.assign(payload, {
          lettre_number: lettreNumber,
          lettre_date: lettreDate || undefined,
          lettre_name: lettreName,
          lettre_bank_name: lettreBankName,
          lettre_rib: lettreRib,
          lettre_lieu: lettreLieu,
          lettre_amount_paid: montant,
          lettre_remaining: remainingTotal,
          lettre_remarque: remarque || undefined,
        });
      }
      if (hasMode("cheque") || hasMode("check")) {
        const montant = getAmount(hasMode("cheque") ? "cheque" : "check");
        Object.assign(payload, {
          cheque_number: chequeNumber,
          cheque_date: chequeDate || undefined,
          cheque_name: chequeName,
          cheque_bank_name: chequeBankName,
          cheque_amount_paid: montant,
          cheque_remaining: remainingTotal,
          cheque_remarque: remarque || undefined,
        });
      }
      if (hasMode("cash_on_delivery")) {
        const montant = getAmount("cash_on_delivery");
        Object.assign(payload, {
          cod_authorization_number: codAuthNumber,
          cod_bank_name: codBankName,
          cod_amount_paid: montant,
          cod_remaining: remainingTotal,
          cod_remarque: remarque || undefined,
        });
      }
      if (hasMode("especes")) {
        const montant = getAmount("especes");
        Object.assign(payload, {
          especes_amount_paid: montant,
          especes_remarque: remarque || undefined,
        });
      }
      if (hasMode("cri")) {
        const montant = getAmount("cri");
        Object.assign(payload, {
          cri_amount_paid: montant,
          cri_remaining: remainingTotal,
          cri_remarque: remarque || undefined,
        });
      }

      await apiClient.patch(`/orders/${order.id}/`, payload);

      // Upload de l'image justificative si fournie
      const imageMap: { type: string; file: File | null }[] = [
        { type: "transfer", file: transferImage },
        { type: "cheque", file: chequeImage },
        { type: "lettre", file: lettreImage },
      ];
      for (const { type, file } of imageMap) {
        if (file) {
          const form = new FormData();
          form.append("image_type", type);
          form.append("image", file);
          await apiClient.post(`/orders/${order.id}/upload-payment-image/`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      onPaid();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du paiement", err);
      setError("Une erreur est survenue lors de l'enregistrement du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAmountField = (id: string, label = "Montant encaissé") => (
    <div>
      <Label className="text-sm font-semibold text-yellow-700">{label}</Label>
      <div className="mt-1 flex max-w-[200px]">
        <Input
          type="text"
          inputMode="decimal"
          value={getAmountInput(id)}
          onChange={(e) => handleAmountChange(id, e.target.value)}
          className="rounded-r-none border-yellow-200 bg-yellow-50"
        />
        <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm bg-yellow-100 text-yellow-700 border-yellow-200">
          DT
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-slate-800 px-4 py-3 z-10">
          <h2 className="text-sm font-semibold text-white">
            Encaisser la facture #{(order.orderNumber || "").replace(/^CPS/i, "FPS")}
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">
              Mode choisi par le client lors de la commande :{" "}
              <span className="font-semibold text-slate-700">
                {PAYMENT_LABELS[clientMethod] || clientMethod || "—"}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Montant total de la facture :{" "}
              <span className="font-semibold text-slate-700">{formatAmount(total)} DT</span>
            </p>
            {payableModes(selectedModes).length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Total encaissé (
                {payableModes(selectedModes)
                  .map((m) => PAYMENT_LABELS[m] || m)
                  .join(" + ")}
                ) :{" "}
                <span className="font-semibold text-slate-700">{formatAmount(sumEntered)} DT</span>
                {" — "}Restant :{" "}
                <span
                  className={`font-semibold ${
                    remainingTotal > 0 ? "text-orange-600" : "text-green-600"
                  }`}
                >
                  {formatAmount(remainingTotal)} DT
                </span>
              </p>
            )}
          </div>

          {/* Vendeur en charge de la commande (auto, compte connecté) */}
          <div>
            <Label className="text-sm font-semibold text-slate-600 mb-1 block">
              Vendeur en charge de cette commande
            </Label>
            <div className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {vendeur || "—"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enregistré automatiquement avec le compte connecté. Affiché sur la facture et dans la trésorerie.
            </p>
          </div>

          {/* Sélection du/des mode(s) de paiement (par défaut = mode du client) */}
          <div>
            <Label className="text-sm font-semibold text-slate-600 mb-2 block">
              Mode(s) de paiement encaissé(s)
            </Label>
            <p className="text-xs text-slate-400 mb-2">
              Sélectionnez plusieurs modes si le client a payé en plusieurs fois / de plusieurs façons.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODE_OPTIONS.filter((m) => m.id !== "check").map(({ id, label, Icon }) => {
                const isCriDisabled = id === "cri" && total <= 1000;
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      isCriDisabled
                        ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
                        : selectedModes.includes(id)
                        ? "border-2 border-yellow-400 cursor-pointer"
                        : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                    }`}
                    title={isCriDisabled ? "Le paiement CRI n'est possible que pour les commandes dépassant 1000 DT." : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModes.includes(id)}
                      onChange={() => !isCriDisabled && toggleMode(id)}
                      disabled={isCriDisabled}
                      className="h-4 w-4 accent-yellow-500"
                    />
                    <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className={`text-sm font-medium ${selectedModes.includes(id) ? "text-yellow-700" : "text-slate-700"}`}>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Espèces / TPE (paiement à la livraison) ── */}
          {(hasMode("especes") || hasMode("cash_on_delivery")) && (
            <div className="space-y-3 p-3 border-2 border-yellow-400 rounded-lg bg-white">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    hasMode("especes") ? "border-yellow-500 bg-yellow-400 text-black font-semibold" : "border-gray-200 bg-white hover:border-yellow-400 text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasMode("especes")}
                    onChange={() => toggleMode("especes")}
                    className="h-4 w-4 rounded accent-black"
                  />
                  <Banknote className="h-4 w-4" />
                  <span className="text-sm font-semibold">Espèces</span>
                </label>
                <label
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    hasMode("cash_on_delivery") ? "border-yellow-500 bg-yellow-400 text-black font-semibold" : "border-gray-200 bg-white hover:border-yellow-400 text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasMode("cash_on_delivery")}
                    onChange={() => toggleMode("cash_on_delivery")}
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
                    <Input readOnly value={formatAmount(total)} className="rounded-r-none bg-white" />
                    <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-100 text-sm text-gray-600">DT</span>
                  </div>
                </div>
                <div>
                  <Label className={`text-sm font-semibold ${hasMode("especes") ? "text-yellow-700" : "text-gray-400"}`}>
                    Montant payé Espèces
                  </Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={hasMode("especes") ? getAmountInput("especes") : ""}
                      disabled={!hasMode("especes")}
                      onChange={(e) => handleAmountChange("especes", e.target.value)}
                      className={`rounded-r-none ${hasMode("especes") ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-100 text-gray-400"}`}
                    />
                    <span className={`inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm ${hasMode("especes") ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>DT</span>
                  </div>
                </div>
                <div>
                  <Label className={`text-sm font-semibold ${hasMode("cash_on_delivery") ? "text-yellow-700" : "text-gray-400"}`}>
                    Montant payé TPE
                  </Label>
                  <div className="mt-1 flex">
                    <Input
                      type="text" inputMode="decimal" placeholder="0,00"
                      value={hasMode("cash_on_delivery") ? getAmountInput("cash_on_delivery") : ""}
                      disabled={!hasMode("cash_on_delivery")}
                      onChange={(e) => handleAmountChange("cash_on_delivery", e.target.value)}
                      className={`rounded-r-none ${hasMode("cash_on_delivery") ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-100 text-gray-400"}`}
                    />
                    <span className={`inline-flex items-center px-3 border border-l-0 rounded-r-md text-sm ${hasMode("cash_on_delivery") ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>DT</span>
                  </div>
                </div>
              </div>

              {hasMode("cash_on_delivery") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">N° Autorisation TPE</Label>
                    <Input value={codAuthNumber} onChange={(e) => setCodAuthNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Banque</Label>
                    <select
                      value={codBankName}
                      onChange={(e) => setCodBankName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionner...</option>
                      {BANK_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold">Remarque</Label>
                <Textarea rows={2} value={remarque} onChange={(e) => setRemarque(e.target.value)} className="mt-1 resize-y" placeholder="Ajouter une remarque..." />
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1">
                Possibilité de paiement avec plusieurs méthodes
              </p>
            </div>
          )}

          {/* ── Virement ── */}
          {hasMode("bank_transfer") && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building className="h-4 w-4" /> Virement bancaire
              </p>
              {renderAmountField("bank_transfer")}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold">N° de Virement *</Label>
                  <Input value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom du titulaire *</Label>
                  <Input value={transferHolderName} onChange={(e) => setTransferHolderName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Banque *</Label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner une banque</option>
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Justificatif (image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setTransferImage(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          {/* ── Paiement CRI ── */}
          {hasMode("cri") && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Paiement CRI
              </p>
              {renderAmountField("cri")}
            </div>
          )}

          {/* ── Lettre de change ── */}
          {hasMode("lettre_de_change") && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Lettre de change
              </p>
              {renderAmountField("lettre_de_change")}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">N° Lettre *</Label>
                  <Input value={lettreNumber} onChange={(e) => setLettreNumber(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date</Label>
                  <Input type="date" value={lettreDate} onChange={(e) => setLettreDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input value={lettreName} onChange={(e) => setLettreName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select
                    value={lettreBankName}
                    onChange={(e) => setLettreBankName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {LETTRE_CHEQUE_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">RIB</Label>
                  <Input value={lettreRib} onChange={(e) => setLettreRib(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Lieu</Label>
                  <Input value={lettreLieu} onChange={(e) => setLettreLieu(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Lettre scannée (image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setLettreImage(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          {/* ── Chèque ── */}
          {(hasMode("cheque") || hasMode("check")) && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Chèque
              </p>
              {renderAmountField(hasMode("cheque") ? "cheque" : "check")}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">N° Chèque *</Label>
                  <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date</Label>
                  <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nom</Label>
                  <Input value={chequeName} onChange={(e) => setChequeName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Banque</Label>
                  <select
                    value={chequeBankName}
                    onChange={(e) => setChequeBankName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {LETTRE_CHEQUE_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Chèque scanné (image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setChequeImage(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          {/* Remarque générale */}
          {!onlyCard && !hasMode("especes") && !hasMode("cash_on_delivery") && (
            <div>
              <Label className="text-sm font-semibold">Remarque</Label>
              <Textarea rows={2} value={remarque} onChange={(e) => setRemarque(e.target.value)} className="mt-1 resize-y" />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-black border-0"
            >
              {submitting ? "Enregistrement..." : "Confirmer le paiement"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
