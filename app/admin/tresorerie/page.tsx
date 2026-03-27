"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Printer } from "lucide-react";
import ExcelJS from "exceljs";

interface TresorerieRecord {
  id: string;
  createdAt: Date;
  dateFormatted: string;
  document: string;
  refDoc: string;
  type: string;
  client: string;
  fournisseur: string;
  chequeNumber: string;
  remarque: string;
  chequeStatus: string;
  dueDate: Date;
  dueDateFormatted: string;
  displayName: string;
  paymentMethod: string;
  paymentStatus: string;
  utilisateur: string;
  caisse: string;
  valeur: number;
  totalAmount: number;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    specifications?: string;
  }>;
  shippingAddress: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  criAmountPaid: number;
  criRemaining: number;
  criRemarque: string;
  transferAmountPaid: number;
  transferRemaining: number;
  transferNumber: string;
  transferHolderName: string;
  transferBankName: string;
  transferImageName: string;
  transferRemarque: string;
  lettreAmountPaid: number;
  lettreRemaining: number;
  lettreNumber: string;
  lettreDate: string;
  lettreName: string;
  lettreBankName: string;
  lettreRib: string;
  lettreLieu: string;
  lettreImageName: string;
  lettreRemarque: string;
  chequeAmountPaid: number;
  chequeRemaining: number;
  chequeNumberValue: string;
  chequeDate: string;
  chequeName: string;
  chequeBankName: string;
  chequeImageName: string;
  chequeRemarque: string;
  codAmountPaid: number;
  codRemaining: number;
  codAuthorizationNumber: string;
  codBankName: string;
  codRemarque: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Carte de crédit",
  cash_on_delivery: "TPE à la livraison",
  bank_transfer: "Virement",
  cri: "CRI",
  cheque: "Chèque",
  check: "Chèque",
  lettre_de_change: "Lettre de change",
};

const CHEQUE_STATUS_LABELS: Record<string, string> = {
  pending: "En circulation",
  paid: "Payé",
  failed: "Annulé",
  refunded: "Escompte",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
};

function formatCurrency(value: number): string {
  return (
    value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " DT"
  );
}

function getPaidAmount(record: TresorerieRecord): number {
  if (record.paymentMethod === "cri") {
    return record.criAmountPaid;
  }

  if (record.paymentMethod === "bank_transfer") {
    return record.transferAmountPaid;
  }

  if (record.paymentMethod === "lettre_de_change") {
    return record.lettreAmountPaid;
  }

  if (record.paymentMethod === "cheque" || record.paymentMethod === "check") {
    return record.chequeAmountPaid;
  }

  if (record.paymentMethod === "cash_on_delivery") {
    return record.codAmountPaid;
  }

  if (record.paymentStatus === "paid") {
    return record.totalAmount;
  }

  return 0;
}

function getRemainingAmount(record: TresorerieRecord): number {
  if (record.paymentMethod === "cri") {
    if (record.criRemaining > 0) {
      return record.criRemaining;
    }
    return Math.max(record.totalAmount - record.criAmountPaid, 0);
  }

  if (record.paymentMethod === "bank_transfer") {
    if (record.transferRemaining > 0) {
      return record.transferRemaining;
    }
    return Math.max(record.totalAmount - record.transferAmountPaid, 0);
  }

  if (record.paymentMethod === "lettre_de_change") {
    if (record.lettreRemaining > 0) {
      return record.lettreRemaining;
    }
    return Math.max(record.totalAmount - record.lettreAmountPaid, 0);
  }

  if (record.paymentMethod === "cheque" || record.paymentMethod === "check") {
    if (record.chequeRemaining > 0) {
      return record.chequeRemaining;
    }
    return Math.max(record.totalAmount - record.chequeAmountPaid, 0);
  }

  if (record.paymentMethod === "cash_on_delivery") {
    if (record.codRemaining > 0) {
      return record.codRemaining;
    }
    return Math.max(record.totalAmount - record.codAmountPaid, 0);
  }

  return Math.max(record.totalAmount - getPaidAmount(record), 0);
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function matchesDateFilter(
  date: Date,
  filter: string,
  fromDate: string,
  toDate: string
): boolean {
  const now = new Date();

  if (!filter || filter === "all") {
    return true;
  }

  if (filter === "today") {
    return sameDate(date, now);
  }

  if (filter === "yesterday") {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return sameDate(date, yesterday);
  }

  if (filter === "this_week") {
    const weekStart = new Date(now);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
  }

  if (filter === "this_month") {
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (filter === "this_year") {
    return date.getFullYear() === now.getFullYear();
  }

  if (filter === "specific") {
    if (!fromDate) return true;
    const specificDate = new Date(fromDate);
    return sameDate(date, specificDate);
  }

  if (filter === "period") {
    let isAfterFrom = true;
    let isBeforeTo = true;

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      isAfterFrom = date >= from;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      isBeforeTo = date <= to;
    }

    return isAfterFrom && isBeforeTo;
  }

  return true;
}

export default function TresoreriePage() {
  const [records, setRecords] = useState<TresorerieRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<TresorerieRecord | null>(null);

  const [dateFilter, setDateFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");

  const [refDocFilter, setRefDocFilter] = useState("");
  const [chequeNumberFilter, setChequeNumberFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [caisseFilter, setCaisseFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef(false);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user, router]);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch(`${API_URL}/orders/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch orders");

        const data = await res.json();
        const mapped: TresorerieRecord[] = (data.results || []).map(
          (o: any) => {
            const createdAt = new Date(o.created_at);
            const dueDate = new Date(o.created_at);
            const firstName = o.shipping_address?.first_name || "";
            const lastName = o.shipping_address?.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim() || "N/A";

            return {
              id: String(o.id),
              createdAt,
              dateFormatted: createdAt.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              dueDate,
              dueDateFormatted: dueDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              document: "Facture Vente",
              refDoc: o.order_number || "",
              type:
                PAYMENT_LABELS[o.payment_method] || o.payment_method || "N/A",
              client: fullName,
              fournisseur: o.supplier?.name || "",
              chequeNumber: String(o.id).padStart(4, "0"),
              remarque:
                o.cri_remarque ||
                o.transfer_remarque ||
                o.lettre_remarque ||
                o.cheque_remarque ||
                o.cod_remarque ||
                "",
              chequeStatus: CHEQUE_STATUS_LABELS[o.payment_status] || "",
              displayName: fullName,
              paymentMethod: o.payment_method || "",
              paymentStatus: o.payment_status || "pending",
              utilisateur: o.user?.email || o.user?.username || "",
              caisse: "Tk",
              valeur: parseFloat(o.total_amount || "0"),
              totalAmount: parseFloat(o.total_amount || "0"),
              items: (o.items || []).map((item: any) => ({
                product_name: item.product_name || "-",
                quantity: Number(item.quantity || 0),
                unit_price: parseFloat(item.unit_price || "0"),
                total_price: parseFloat(item.total_price || "0"),
                specifications: item.specifications || "",
              })),
              shippingAddress: o.shipping_address || {},
              criAmountPaid: parseFloat(o.cri_amount_paid || "0"),
              criRemaining: parseFloat(o.cri_remaining || "0"),
              criRemarque: o.cri_remarque || "",
              transferAmountPaid: parseFloat(o.transfer_amount_paid || "0"),
              transferRemaining: parseFloat(o.transfer_remaining || "0"),
              transferNumber: o.transfer_number || "",
              transferHolderName: o.transfer_holder_name || "",
              transferBankName: o.transfer_bank_name || "",
              transferImageName: o.transfer_image_name || "",
              transferRemarque: o.transfer_remarque || "",
              lettreAmountPaid: parseFloat(o.lettre_amount_paid || "0"),
              lettreRemaining: parseFloat(o.lettre_remaining || "0"),
              lettreNumber: o.lettre_number || "",
              lettreDate: o.lettre_date || "",
              lettreName: o.lettre_name || "",
              lettreBankName: o.lettre_bank_name || "",
              lettreRib: o.lettre_rib || "",
              lettreLieu: o.lettre_lieu || "",
              lettreImageName: o.lettre_image_name || "",
              lettreRemarque: o.lettre_remarque || "",
              chequeAmountPaid: parseFloat(o.cheque_amount_paid || "0"),
              chequeRemaining: parseFloat(o.cheque_remaining || "0"),
              chequeNumberValue: o.cheque_number || "",
              chequeDate: o.cheque_date || "",
              chequeName: o.cheque_name || "",
              chequeBankName: o.cheque_bank_name || "",
              chequeImageName: o.cheque_image_name || "",
              chequeRemarque: o.cheque_remarque || "",
              codAmountPaid: parseFloat(o.cod_amount_paid || "0"),
              codRemaining: parseFloat(o.cod_remaining || "0"),
              codAuthorizationNumber: o.cod_authorization_number || "",
              codBankName: o.cod_bank_name || "",
              codRemarque: o.cod_remarque || "",
            };
          }
        );

        setRecords(mapped);
      } catch (error) {
        console.error("Failed to fetch tresorerie records:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const users = useMemo(
    () => Array.from(new Set(records.map((r) => r.utilisateur).filter(Boolean))),
    [records]
  );

  const clients = useMemo(
    () => Array.from(new Set(records.map((r) => r.client).filter(Boolean))),
    [records]
  );

  const suppliers = useMemo(
    () => Array.from(new Set(records.map((r) => r.fournisseur).filter(Boolean))),
    [records]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesDateFilter(r.createdAt, dateFilter, dateFrom, dateTo)) {
        return false;
      }

      if (!matchesDateFilter(r.dueDate, dueDateFilter, dueDateFrom, dueDateTo)) {
        return false;
      }

      if (
        refDocFilter &&
        !r.refDoc.toLowerCase().includes(refDocFilter.toLowerCase())
      ) {
        return false;
      }

      if (
        chequeNumberFilter &&
        !r.chequeNumber.toLowerCase().includes(chequeNumberFilter.toLowerCase())
      ) {
        return false;
      }

      if (typeFilter && r.paymentMethod !== typeFilter) {
        return false;
      }

      if (caisseFilter && r.caisse !== caisseFilter) {
        return false;
      }

      if (userFilter && r.utilisateur !== userFilter) {
        return false;
      }

      if (clientFilter && r.client !== clientFilter) {
        return false;
      }

      if (supplierFilter && r.fournisseur !== supplierFilter) {
        return false;
      }

      if (statusFilter && r.chequeStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [
    records,
    dateFilter,
    dueDateFilter,
    dateFrom,
    dateTo,
    dueDateFrom,
    dueDateTo,
    refDocFilter,
    chequeNumberFilter,
    typeFilter,
    caisseFilter,
    userFilter,
    clientFilter,
    supplierFilter,
    statusFilter,
  ]);

  const totalValue = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + r.valeur, 0),
    [filteredRecords]
  );

  const totalPaid = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + getPaidAmount(r), 0),
    [filteredRecords]
  );

  const totalRemaining = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + getRemainingAmount(r), 0),
    [filteredRecords]
  );

  const syncHorizontalScroll = (
    source: HTMLDivElement | null,
    target: HTMLDivElement | null
  ) => {
    if (!source || !target || syncLockRef.current) return;

    syncLockRef.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      syncLockRef.current = false;
    });
  };

  const handleExportCSV = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tresorerie Vente");

    worksheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Facture", key: "invoice", width: 20 },
      { header: "Document", key: "document", width: 18 },
      { header: "Type", key: "type", width: 18 },
      { header: "Client/Fournisseur", key: "tier", width: 28 },
      { header: "N°", key: "numero", width: 10 },
      { header: "Remarque", key: "remarque", width: 26 },
      { header: "Etat Chèque", key: "etatCheque", width: 16 },
      { header: "Date d'échéance", key: "dueDate", width: 16 },
      { header: "Nom", key: "nom", width: 20 },
      { header: "Montant Facture", key: "invoiceAmount", width: 16 },
      { header: "Montant Payé", key: "paidAmount", width: 16 },
      { header: "Reste", key: "remainingAmount", width: 14 },
      { header: "Statut Paiement", key: "statutPaiement", width: 16 },
    ];

    worksheet.getRow(1).font = { bold: true };

    filteredRecords.forEach((record) => {
      const paidAmount = getPaidAmount(record);
      const remainingAmount = getRemainingAmount(record);

      worksheet.addRow({
        date: record.dateFormatted,
        invoice: record.refDoc,
        document: record.document,
        type: record.type,
        tier: record.client || record.fournisseur,
        numero: record.chequeNumber,
        remarque: record.remarque,
        etatCheque: record.chequeStatus || "-",
        dueDate: record.dueDateFormatted,
        nom: record.displayName,
        invoiceAmount: record.totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        remainingAmount: remainingAmount.toFixed(2),
        statutPaiement:
          PAYMENT_STATUS_LABELS[record.paymentStatus] || record.paymentStatus,
      });
    });

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const filename = `Tresorerie_Vente_${date}.csv`;

    const csvBuffer = await workbook.csv.writeBuffer();
    const blob = new Blob([csvBuffer], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Chargement de la trésorerie...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-4">
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-300 bg-[#f4f6f8] px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-800">Trésorerie Vente</h1>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="all">Tout</option>
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="specific">Date Spécifique</option>
                <option value="this_week">Cette Semaine</option>
                <option value="this_month">Ce Mois</option>
                <option value="this_year">Cette Année</option>
                <option value="period">Période Spécifique</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Date d'échéance
              </label>
              <select
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="all">Tout</option>
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="specific">Date Spécifique</option>
                <option value="this_week">Cette Semaine</option>
                <option value="this_month">Ce Mois</option>
                <option value="this_year">Cette Année</option>
                <option value="period">Période Spécifique</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Référence Document
              </label>
              <Input
                placeholder="N° référence"
                value={refDocFilter}
                onChange={(e) => setRefDocFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">N° Chèque</label>
              <Input
                placeholder="N° chèque"
                value={chequeNumberFilter}
                onChange={(e) => setChequeNumberFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Etat Chèque</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                <option value="En circulation">En circulation</option>
                <option value="Payé">Payé</option>
                <option value="Annulé">Annulé</option>
                <option value="Escompte">Escompte</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                <option value="cash_on_delivery">TPE à la livraison</option>
                <option value="card">Carte de crédit</option>
                <option value="bank_transfer">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="check">Chèque (legacy)</option>
                <option value="cri">CRI</option>
                <option value="lettre_de_change">Lettre de change</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Caisse</label>
              <select
                value={caisseFilter}
                onChange={(e) => setCaisseFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                <option value="Tk">Tk</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Utilisateur</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                {users.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Client</label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                {clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Fournisseur
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(dateFilter === "specific" || dateFilter === "period") && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Date début
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              {dateFilter === "period" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Date fin
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {(dueDateFilter === "specific" || dueDateFilter === "period") && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Échéance début
                </label>
                <Input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                />
              </div>
              {dueDateFilter === "period" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Échéance fin
                  </label>
                  <Input
                    type="date"
                    value={dueDateTo}
                    onChange={(e) => setDueDateTo(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Lignes
                </div>
                <div className="text-base font-semibold text-slate-800">
                  {filteredRecords.length}
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Facture
                </div>
                <div className="text-base font-semibold text-slate-800">
                  {formatCurrency(totalValue)}
                </div>
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Paye
                </div>
                <div className="text-base font-semibold text-emerald-700">
                  {formatCurrency(totalPaid)}
                </div>
              </div>

              <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                  Reste
                </div>
                <div className="text-base font-semibold text-rose-700">
                  {formatCurrency(totalRemaining)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                className="h-9 gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-2"
                onClick={handleExportCSV}
              >
                <FileDown className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div
            ref={tableScrollRef}
            onScroll={() =>
              syncHorizontalScroll(tableScrollRef.current, bottomScrollRef.current)
            }
            className="w-full overflow-x-auto rounded border border-slate-200"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <table className="min-w-[1500px] w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Facture</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Type</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Détails Paiement</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Client/Fournisseur</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Etat Chèque</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Date d'échéance</th>
                  <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">Montant Facture</th>
                  <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">Montant Payé</th>
                  <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">Reste</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-10 text-center text-slate-500">
                      Aucun enregistrement trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-2 py-2 align-top whitespace-nowrap">{record.dateFormatted}</td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{record.refDoc || "-"}</div>
                        <div className="text-xs text-slate-500">{record.document}</div>
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">{record.type}</td>
                      <td className="px-2 py-2 align-top min-w-[260px] max-w-[320px] text-xs leading-4 text-slate-700 break-words">
                        {record.paymentMethod === "cri" && (
                          <>
                            <div>Montant: {formatCurrency(record.criAmountPaid)}</div>
                            <div>Reste: {formatCurrency(record.criRemaining)}</div>
                            <div>Remarque: {record.criRemarque || "-"}</div>
                          </>
                        )}
                        {record.paymentMethod === "bank_transfer" && (
                          <>
                            <div>N° Virement: {record.transferNumber || "-"}</div>
                            <div>Nom: {record.transferHolderName || "-"}</div>
                            <div>Banque: {record.transferBankName || "-"}</div>
                            <div>Image: {record.transferImageName || "-"}</div>
                            <div>Montant: {formatCurrency(record.transferAmountPaid)}</div>
                            <div>Reste: {formatCurrency(record.transferRemaining)}</div>
                          </>
                        )}
                        {record.paymentMethod === "lettre_de_change" && (
                          <>
                            <div>N° Lettre: {record.lettreNumber || "-"}</div>
                            <div>Date: {record.lettreDate || "-"}</div>
                            <div>Nom: {record.lettreName || "-"}</div>
                            <div>Banque: {record.lettreBankName || "-"}</div>
                            <div>RIB: {record.lettreRib || "-"}</div>
                            <div>Lieu: {record.lettreLieu || "-"}</div>
                            <div>Image: {record.lettreImageName || "-"}</div>
                            <div>Montant: {formatCurrency(record.lettreAmountPaid)}</div>
                            <div>Reste: {formatCurrency(record.lettreRemaining)}</div>
                          </>
                        )}
                        {(record.paymentMethod === "cheque" || record.paymentMethod === "check") && (
                          <>
                            <div>N° Chèque: {record.chequeNumberValue || "-"}</div>
                            <div>Date: {record.chequeDate || "-"}</div>
                            <div>Nom: {record.chequeName || "-"}</div>
                            <div>Banque: {record.chequeBankName || "-"}</div>
                            <div>Image: {record.chequeImageName || "-"}</div>
                            <div>Montant: {formatCurrency(record.chequeAmountPaid)}</div>
                            <div>Reste: {formatCurrency(record.chequeRemaining)}</div>
                          </>
                        )}
                        {record.paymentMethod === "cash_on_delivery" && (
                          <>
                            <div>N° Autorisation: {record.codAuthorizationNumber || "-"}</div>
                            <div>Banque: {record.codBankName || "-"}</div>
                            <div>Montant: {formatCurrency(record.codAmountPaid)}</div>
                            <div>Reste: {formatCurrency(record.codRemaining)}</div>
                            <div>Remarque: {record.codRemarque || "-"}</div>
                          </>
                        )}
                        {record.paymentMethod === "card" && <div>Carte bancaire</div>}
                      </td>
                      <td className="px-2 py-2 align-top min-w-[180px] max-w-[220px]">
                        <div className="font-medium text-slate-700">{record.client || record.fournisseur || "-"}</div>
                        <div className="text-xs text-slate-500 truncate" title={record.remarque}>
                          {record.remarque || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        {record.chequeStatus || "-"}
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">{record.dueDateFormatted}</td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold">
                        {formatCurrency(record.totalAmount)}
                      </td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold text-emerald-700">
                        {formatCurrency(getPaidAmount(record))}
                      </td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold text-rose-700">
                        {formatCurrency(getRemainingAmount(record))}
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecord(record)}
                        >
                          Voir facture
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            ref={bottomScrollRef}
            onScroll={() =>
              syncHorizontalScroll(bottomScrollRef.current, tableScrollRef.current)
            }
            className="w-full overflow-x-auto rounded border border-slate-200 bg-slate-50"
            style={{ scrollbarGutter: "stable both-edges" }}
            aria-label="Table horizontal scrollbar"
          >
            <div className="flex h-6 min-w-[1500px] items-center px-3 text-[11px] font-medium text-slate-500">
              Faites défiler horizontalement pour voir toutes les colonnes
            </div>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-md bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-slate-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">Facture Vente</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xl leading-none text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-4 text-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded border">
                  <div className="bg-slate-900 px-3 py-2 font-semibold text-white">Facture Vente</div>
                  <div className="space-y-1 p-3 text-slate-700">
                    <p><span className="font-semibold">Num :</span> {selectedRecord.refDoc || "-"}</p>
                    <p><span className="font-semibold">Date :</span> {selectedRecord.dateFormatted}</p>
                    <p><span className="font-semibold">Ticket :</span> {selectedRecord.chequeNumber}</p>
                    <p><span className="font-semibold">Méthode :</span> {selectedRecord.type}</p>
                  </div>
                </div>

                <div className="rounded border">
                  <div className="bg-slate-900 px-3 py-2 font-semibold text-white">Client</div>
                  <div className="space-y-1 p-3 text-slate-700">
                    <p><span className="font-semibold">Nom :</span> {selectedRecord.client || "-"}</p>
                    <p><span className="font-semibold">Tel :</span> {selectedRecord.shippingAddress.phone || "-"}</p>
                    <p>
                      <span className="font-semibold">Adresse :</span>{" "}
                      {[
                        selectedRecord.shippingAddress.address,
                        selectedRecord.shippingAddress.city,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded border">
                <table className="w-full min-w-[800px] text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 text-left">Ref</th>
                      <th className="px-2 py-2 text-left">Désignation</th>
                      <th className="px-2 py-2 text-right">Quantité</th>
                      <th className="px-2 py-2 text-right">P.U.H.T</th>
                      <th className="px-2 py-2 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-slate-500">
                          Aucun article
                        </td>
                      </tr>
                    ) : (
                      selectedRecord.items.map((item, index) => (
                        <tr key={`${selectedRecord.id}-${index}`} className="border-t">
                          <td className="px-2 py-2">{index + 1}</td>
                          <td className="px-2 py-2">{item.product_name}</td>
                          <td className="px-2 py-2 text-right">{item.quantity}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded border">
                <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                  Détails Paiement
                </div>
                <div className="grid grid-cols-1 gap-2 p-3 text-slate-700 md:grid-cols-2">
                  <p><span className="font-semibold">Statut :</span> {PAYMENT_STATUS_LABELS[selectedRecord.paymentStatus] || selectedRecord.paymentStatus}</p>
                  <p><span className="font-semibold">Montant Facture :</span> {formatCurrency(selectedRecord.totalAmount)}</p>
                  <p><span className="font-semibold">Montant Payé :</span> {formatCurrency(getPaidAmount(selectedRecord))}</p>
                  <p><span className="font-semibold">Reste :</span> {formatCurrency(getRemainingAmount(selectedRecord))}</p>

                  {selectedRecord.paymentMethod === "bank_transfer" && (
                    <>
                      <p><span className="font-semibold">N° Virement :</span> {selectedRecord.transferNumber || "-"}</p>
                      <p><span className="font-semibold">Banque :</span> {selectedRecord.transferBankName || "-"}</p>
                      <p><span className="font-semibold">Nom :</span> {selectedRecord.transferHolderName || "-"}</p>
                      <p><span className="font-semibold">Image :</span> {selectedRecord.transferImageName || "-"}</p>
                    </>
                  )}

                  {selectedRecord.paymentMethod === "lettre_de_change" && (
                    <>
                      <p><span className="font-semibold">N° Lettre :</span> {selectedRecord.lettreNumber || "-"}</p>
                      <p><span className="font-semibold">Date Lettre :</span> {selectedRecord.lettreDate || "-"}</p>
                      <p><span className="font-semibold">Nom :</span> {selectedRecord.lettreName || "-"}</p>
                      <p><span className="font-semibold">Banque :</span> {selectedRecord.lettreBankName || "-"}</p>
                      <p><span className="font-semibold">RIB :</span> {selectedRecord.lettreRib || "-"}</p>
                      <p><span className="font-semibold">Lieu :</span> {selectedRecord.lettreLieu || "-"}</p>
                      <p><span className="font-semibold">Image :</span> {selectedRecord.lettreImageName || "-"}</p>
                    </>
                  )}

                  {(selectedRecord.paymentMethod === "cheque" || selectedRecord.paymentMethod === "check") && (
                    <>
                      <p><span className="font-semibold">N° Chèque :</span> {selectedRecord.chequeNumberValue || "-"}</p>
                      <p><span className="font-semibold">Date Chèque :</span> {selectedRecord.chequeDate || "-"}</p>
                      <p><span className="font-semibold">Nom :</span> {selectedRecord.chequeName || "-"}</p>
                      <p><span className="font-semibold">Banque :</span> {selectedRecord.chequeBankName || "-"}</p>
                      <p><span className="font-semibold">Image :</span> {selectedRecord.chequeImageName || "-"}</p>
                    </>
                  )}

                  {selectedRecord.paymentMethod === "cash_on_delivery" && (
                    <>
                      <p><span className="font-semibold">N° Autorisation :</span> {selectedRecord.codAuthorizationNumber || "-"}</p>
                      <p><span className="font-semibold">Banque :</span> {selectedRecord.codBankName || "-"}</p>
                    </>
                  )}

                  {selectedRecord.remarque && (
                    <p className="md:col-span-2"><span className="font-semibold">Remarque :</span> {selectedRecord.remarque}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Fermer
                </Button>
                <Button onClick={() => window.print()}>Imprimer</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
