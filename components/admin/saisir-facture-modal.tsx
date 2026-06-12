"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import { PAYMENT_LABELS } from "@/components/admin/payer-facture-modal";

interface ManualItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

const PAYMENT_METHOD_OPTIONS = [
  "especes",
  "card",
  "cash_on_delivery",
  "bank_transfer",
  "cheque",
  "lettre_de_change",
];

interface SaisirFactureModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function SaisirFactureModal({ onClose, onCreated }: SaisirFactureModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<ManualItem[]>([
    { productName: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("especes");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (idx: number, patch: Partial<ManualItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productName: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalTTC = items.reduce(
    (sum, it) => sum + it.unitPrice * it.quantity * (1 - (it.discount || 0) / 100),
    0
  );

  const handleSubmit = async () => {
    setError("");
    if (!customerName.trim()) {
      setError("Le nom du client est requis.");
      return;
    }
    const validItems = items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Ajoutez au moins un article.");
      return;
    }

    setSaving(true);
    try {
      const [firstName, ...rest] = customerName.trim().split(" ");
      const lastName = rest.join(" ");

      await apiClient.post("/orders/", {
        status: "confirmed",
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        delivery_cost: deliveryCost,
        total_amount: totalTTC,
        commercial: "Page Facebook",
        shipping_address: {
          first_name: firstName || customerName,
          last_name: lastName,
          phone: customerPhone,
          address,
        },
        billing_address: {
          first_name: firstName || customerName,
          last_name: lastName,
          phone: customerPhone,
          address,
        },
        items: validItems.map((it) => ({
          product_name: it.productName,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          total_price: it.unitPrice * it.quantity,
          discount: it.discount || 0,
        })),
      });

      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la création de la facture.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Saisir une facture</h2>
            <p className="text-xs text-gray-500">Pour les commandes reçues via la page Facebook</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Nom du client *</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="ex: Ahmed Ben Ali" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Téléphone</label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="ex: 12345678" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-700 mb-1 block">Adresse</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de livraison" />
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Articles</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <label className="text-[11px] text-gray-500 block mb-1">Désignation (pneu, taille…)</label>}
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(idx, { productName: e.target.value })}
                      placeholder="ex: Pneu Good Year 205/55 R16"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="text-[11px] text-gray-500 block mb-1">Qté</label>}
                    <Input
                      type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="text-[11px] text-gray-500 block mb-1">PU TTC (DT)</label>}
                    <Input
                      type="number" min={0} step={0.001} value={item.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="text-[11px] text-gray-500 block mb-1">Remise %</label>}
                    <Input
                      type="number" min={0} max={100} value={item.discount}
                      onChange={(e) => updateItem(idx, { discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-2"
                      title="Supprimer cet article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:text-[#004C99]"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un article
            </button>
          </div>

          {/* Payment & delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Frais de livraison (DT)</label>
              <Input
                type="number" min={0} step={0.001} value={deliveryCost}
                onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Mode de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_LABELS[m] || m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Statut de paiement</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="paid">Payée</option>
                <option value="pending">Non payée</option>
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total TTC (hors livraison)</span>
            <span className="text-lg font-bold text-gray-900">{totalTTC.toFixed(3)} DT</span>
          </div>

          {error && (
            <p className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-[#0066CC] hover:bg-[#004C99] text-white border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Créer la facture
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
