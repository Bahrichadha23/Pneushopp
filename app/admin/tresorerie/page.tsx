"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Printer } from "lucide-react";

// Convert relative media path (/media/...) to full backend URL
function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
import ExcelJS from "exceljs";

const COMMERCIAUX = [
  "Zeineb Assali",
  "Khawla",
  "Zeineb",
  "Amal",
  "Sonia",
  "Amara",
];

interface TresorerieRecord {
  id: string;
  createdAt: Date;
  dateFormatted: string;
  commercial: string;
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
  orderStatus: string;
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
  especesAmountPaid: number;
  especesRemarque: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Carte de crédit",
  cash_on_delivery: "TPE à la livraison",
  especes: "Espèces",
  bank_transfer: "Virement",
  cri: "CRI",
  cheque: "Chèque",
  check: "Chèque",
  lettre_de_change: "Lettre de change",
  mixed: "Multi-modalités",
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
  if (record.paymentMethod === "mixed") {
    // Sum all non-zero payment amounts
    return (record.criAmountPaid || 0) + (record.transferAmountPaid || 0) +
      (record.lettreAmountPaid || 0) + (record.chequeAmountPaid || 0) + (record.codAmountPaid || 0) +
      (record.especesAmountPaid || 0);
  }
  if (record.paymentMethod === "cri") return record.criAmountPaid;
  if (record.paymentMethod === "bank_transfer") return record.transferAmountPaid;
  if (record.paymentMethod === "lettre_de_change") return record.lettreAmountPaid;
  if (record.paymentMethod === "cheque" || record.paymentMethod === "check") return record.chequeAmountPaid;
  if (record.paymentMethod === "cash_on_delivery") return record.codAmountPaid;
  if (record.paymentMethod === "especes") return record.totalAmount;
  if (record.paymentStatus === "paid") return record.totalAmount;
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

function printFacture(record: TresorerieRecord) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const getPaymentDetails = () => {
    if (record.paymentMethod === "bank_transfer") return `N° Virement : ${record.transferNumber || "-"} | Banque : ${record.transferBankName || "-"} | Titulaire : ${record.transferHolderName || "-"}`;
    if (record.paymentMethod === "lettre_de_change") return `N° Lettre : ${record.lettreNumber || "-"} | Date : ${record.lettreDate || "-"} | Banque : ${record.lettreBankName || "-"}`;
    if (record.paymentMethod === "cheque" || record.paymentMethod === "check") return `N° Chèque : ${record.chequeNumberValue || "-"} | Date : ${record.chequeDate || "-"} | Banque : ${record.chequeBankName || "-"}`;
    if (record.paymentMethod === "cash_on_delivery") return `N° Auth : ${record.codAuthorizationNumber || "-"} | Banque : ${record.codBankName || "-"}`;
    if (record.paymentMethod === "cri") return `Remarque : ${record.criRemarque || "-"}`;
    if (record.paymentMethod === "especes") return "Paiement en espèces";
    return "Carte bancaire";
  };
  const rows = record.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fa"}">
      <td style="padding:4px 6px;border:1px solid #ddd">${i + 1}</td>
      <td style="padding:4px 6px;border:1px solid #ddd">${item.product_name}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right">${item.unit_price.toFixed(2)} DT</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right">${item.total_price.toFixed(2)} DT</td>
    </tr>`).join("");
  const paidAmount = getPaidAmount(record);
  const remaining = Math.max(record.totalAmount - paidAmount, 0);
  win.document.write(`<!DOCTYPE html><html><head><title>Facture ${record.refDoc || record.id}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#222}
    table{width:100%;border-collapse:collapse}th{background:#475569;color:#fff;padding:5px 8px;text-align:left}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
    .box{border:1px solid #ddd;border-radius:4px;padding:8px}
    .box-title{font-weight:bold;font-size:11px;text-transform:uppercase;color:#64748b;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:3px}
    .row{display:flex;gap:6px;margin-bottom:2px}.label{font-weight:bold;min-width:120px}
    .totals{display:flex;justify-content:flex-end;margin-top:12px}
    .totals table{width:280px}.totals td{padding:3px 8px;border:1px solid #ddd}
    @media print{body{padding:0}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid #475569;padding-bottom:8px">
      <div><div style="font-size:18px;font-weight:bold">FACTURE</div><div style="color:#64748b">${record.refDoc || record.id}</div></div>
      <div style="text-align:right"><div style="font-weight:bold;font-size:16px">PneuShop</div><div style="color:#64748b;font-size:11px">Date : ${record.dateFormatted}</div></div>
    </div>
    <div class="grid2">
      <div class="box"><div class="box-title">Informations Facture</div>
        <div class="row"><span class="label">N° Facture :</span>${record.refDoc || "-"}</div>
        <div class="row"><span class="label">Date :</span>${record.dateFormatted}</div>
        <div class="row"><span class="label">Méthode :</span>${record.type}</div>
        ${record.commercial ? `<div class="row"><span class="label">Commercial :</span>${record.commercial}</div>` : ""}
        <div class="row"><span class="label">Paiement :</span>${getPaymentDetails()}</div>
      </div>
      <div class="box"><div class="box-title">Client</div>
        <div class="row"><span class="label">Nom :</span>${record.client || "-"}</div>
        <div class="row"><span class="label">Téléphone :</span>${record.shippingAddress.phone || "-"}</div>
        <div class="row"><span class="label">Adresse :</span>${[record.shippingAddress.address, record.shippingAddress.city].filter(Boolean).join(", ") || "-"}</div>
      </div>
    </div>
    <table><thead><tr><th>#</th><th>Désignation</th><th style="text-align:center">Qté</th><th style="text-align:right">P.U. TTC</th><th style="text-align:right">Total TTC</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="totals"><table>
      <tr><td>Montant Facture</td><td style="text-align:right;font-weight:bold">${record.totalAmount.toFixed(2)} DT</td></tr>
      <tr style="color:#059669"><td>Montant Payé</td><td style="text-align:right;font-weight:bold">${paidAmount.toFixed(2)} DT</td></tr>
      <tr style="color:#dc2626"><td>Reste à payer</td><td style="text-align:right;font-weight:bold">${remaining.toFixed(2)} DT</td></tr>
    </table></div>
    <div style="margin-top:40px;display:flex;justify-content:space-between">
      <div><div style="font-weight:bold">Cachet et Signature</div><div style="margin-top:30px;border-top:1px solid #ddd;width:150px"></div></div>
      <div style="font-size:10px;color:#64748b;text-align:right">Facture générée par PneuShop<br>${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`);
  win.document.close();
}

const fps = (n: string) => (n || "").replace(/^CPS/i, "FPS");

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
  const [userFilter, setUserFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [commercialFilter, setCommercialFilter] = useState("");
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
        // no_pagination=true → retourne TOUTES les commandes sans limite de page
        const { data } = await apiClient.get("/orders/?no_pagination=true");

        // Le backend retourne soit un tableau direct, soit { results: [...] }
        const orders: any[] = Array.isArray(data) ? data : (data.results ?? []);

        const mapped: TresorerieRecord[] = orders.map((o: any) => {
          const createdAt = new Date(o.created_at);

          // Date d'échéance : spécifique au mode de paiement
          let dueDate: Date;
          if (
            (o.payment_method === "cheque" || o.payment_method === "check") &&
            o.cheque_date
          ) {
            dueDate = new Date(o.cheque_date);
          } else if (o.payment_method === "lettre_de_change" && o.lettre_date) {
            dueDate = new Date(o.lettre_date);
          } else {
            // Pour CRI et autres : pas d'échéance propre → même date que la commande
            dueDate = new Date(o.created_at);
          }

          const firstName = o.shipping_address?.first_name || "";
          const lastName = o.shipping_address?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim() || "N/A";

          // Remarque : première remarque non-vide parmi les modes de paiement
          const remarque =
            o.cri_remarque ||
            o.transfer_remarque ||
            o.lettre_remarque ||
            o.cheque_remarque ||
            o.cod_remarque ||
            "";

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
            commercial: o.commercial || "",
            document: "Facture Vente",
            refDoc: fps(o.order_number || ""),
            type: PAYMENT_LABELS[o.payment_method] || o.payment_method || "N/A",
            client: fullName,
            // Les commandes de vente n'ont pas de fournisseur ; champ conservé pour compatibilité
            fournisseur: "",
            // Numéro de ticket (référence interne = ID commande)
            chequeNumber: fps(o.order_number || String(o.id).padStart(6, "0")),
            remarque,
            chequeStatus: CHEQUE_STATUS_LABELS[o.payment_status] || "",
            displayName: fullName,
            paymentMethod: o.payment_method || "",
            paymentStatus: o.payment_status || "pending",
            orderStatus: o.status || "pending",
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
            // CRI
            criAmountPaid: parseFloat(o.cri_amount_paid || "0"),
            criRemaining: parseFloat(o.cri_remaining || "0"),
            criRemarque: o.cri_remarque || "",
            // Virement bancaire
            transferAmountPaid: parseFloat(o.transfer_amount_paid || "0"),
            transferRemaining: parseFloat(o.transfer_remaining || "0"),
            transferNumber: o.transfer_number || "",
            transferHolderName: o.transfer_holder_name || "",
            transferBankName: o.transfer_bank_name || "",
            transferImageName: o.transfer_image_name || "",
            transferRemarque: o.transfer_remarque || "",
            // Lettre de change
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
            // Chèque
            chequeAmountPaid: parseFloat(o.cheque_amount_paid || "0"),
            chequeRemaining: parseFloat(o.cheque_remaining || "0"),
            chequeNumberValue: o.cheque_number || "",
            chequeDate: o.cheque_date || "",
            chequeName: o.cheque_name || "",
            chequeBankName: o.cheque_bank_name || "",
            chequeImageName: o.cheque_image_name || "",
            chequeRemarque: o.cheque_remarque || "",
            // TPE / Cash on delivery
            codAmountPaid: parseFloat(o.cod_amount_paid || "0"),
            codRemaining: parseFloat(o.cod_remaining || "0"),
            codAuthorizationNumber: o.cod_authorization_number || "",
            codBankName: o.cod_bank_name || "",
            codRemarque: o.cod_remarque || "",
            especesAmountPaid: parseFloat(o.especes_amount_paid || "0"),
            especesRemarque: o.especes_remarque || "",
          };
        });

        setRecords(mapped);
      } catch (error) {
        console.error("Échec du chargement de la trésorerie :", error);
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
      // Quick date filter (today/week/month…) — if dates are also set, both must match
      if (!matchesDateFilter(r.createdAt, dateFilter, dateFrom, dateTo)) {
        return false;
      }
      // Always-visible date range for createdAt
      if (dateFrom) {
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
        if (r.createdAt < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (r.createdAt > to) return false;
      }

      if (!matchesDateFilter(r.dueDate, dueDateFilter, dueDateFrom, dueDateTo)) {
        return false;
      }
      // Always-visible date range for dueDate
      if (dueDateFrom) {
        const from = new Date(dueDateFrom); from.setHours(0, 0, 0, 0);
        if (r.dueDate < from) return false;
      }
      if (dueDateTo) {
        const to = new Date(dueDateTo); to.setHours(23, 59, 59, 999);
        if (r.dueDate > to) return false;
      }

      if (
        refDocFilter &&
        !r.refDoc.toLowerCase().includes(refDocFilter.toLowerCase())
      ) {
        return false;
      }

      // Filtre N° Chèque → recherche sur le vrai numéro de chèque/lettre/virement
      if (chequeNumberFilter) {
        const haystack = [
          r.chequeNumberValue,
          r.lettreNumber,
          r.transferNumber,
          r.codAuthorizationNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(chequeNumberFilter.toLowerCase())) return false;
      }

      if (typeFilter && r.paymentMethod !== typeFilter) {
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

      if (statusFilter) {
        if (r.chequeStatus !== statusFilter) return false;
      }

      if (paymentStatusFilter) {
        const paymentLabel = PAYMENT_STATUS_LABELS[r.paymentStatus] || "";
        if (paymentLabel !== paymentStatusFilter) return false;
      }

      if (commercialFilter && r.commercial !== commercialFilter) {
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
    userFilter,
    clientFilter,
    supplierFilter,
    statusFilter,
    paymentStatusFilter,
    commercialFilter,
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

  // Sauvegarde du commercial via PATCH
  const handleCommercialChange = async (recordId: string, value: string) => {
    // Mise à jour optimiste locale
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, commercial: value } : r))
    );
    try {
      await apiClient.patch(`/orders/${recordId}/`, { commercial: value });
    } catch (err) {
      console.error("Erreur sauvegarde commercial", err);
    }
  };

  const handlePaymentStatusChange = async (recordId: string, newStatus: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, paymentStatus: newStatus } : r))
    );
    try {
      await apiClient.patch(`/orders/${recordId}/`, { payment_status: newStatus });
    } catch (err) {
      console.error("Erreur sauvegarde statut paiement", err);
    }
  };

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

  const handleExportXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Trésorerie");

    ws.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Facture", key: "invoice", width: 20 },
      { header: "Type Paiement", key: "type", width: 20 },
      { header: "Client", key: "client", width: 28 },
      { header: "Commercial", key: "commercial", width: 18 },
      { header: "Statut", key: "statut", width: 16 },
      { header: "Date Échéance", key: "dueDate", width: 16 },
      { header: "Montant Facture", key: "montant", width: 18 },
      { header: "Montant Payé", key: "paye", width: 18 },
      { header: "Reste", key: "reste", width: 16 },
    ];

    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    filteredRecords.forEach((record, i) => {
      const paid = getPaidAmount(record);
      const remaining = getRemainingAmount(record);
      const row = ws.addRow({
        date: record.dateFormatted,
        invoice: record.refDoc,
        type: record.type,
        client: record.client || record.fournisseur,
        commercial: record.commercial || "-",
        statut: PAYMENT_STATUS_LABELS[record.paymentStatus] || record.paymentStatus,
        dueDate: record.dueDateFormatted,
        montant: parseFloat(record.totalAmount.toFixed(3)),
        paye: parseFloat(paid.toFixed(3)),
        reste: parseFloat(remaining.toFixed(3)),
      });

      // Color paid/remaining cells
      row.getCell("paye").font = { color: { argb: "FF059669" }, bold: true };
      if (remaining > 0) row.getCell("reste").font = { color: { argb: "FFDC2626" }, bold: true };

      // Alternate row background
      if (i % 2 === 0) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      } else {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });

    // Add totals row
    const totalRow = ws.addRow({
      date: "TOTAL",
      montant: parseFloat(filteredRecords.reduce((s, r) => s + r.totalAmount, 0).toFixed(3)),
      paye: parseFloat(filteredRecords.reduce((s, r) => s + getPaidAmount(r), 0).toFixed(3)),
      reste: parseFloat(filteredRecords.reduce((s, r) => s + getRemainingAmount(r), 0).toFixed(3)),
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tresorerie_${date}.xlsx`;
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
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Facturé</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrency(records.reduce((s, r) => s + r.totalAmount, 0))}</p>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} commandes</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">Encaissé</p>
          <p className="mt-1 text-2xl font-bold text-brand-gold">{formatCurrency(records.reduce((s, r) => s + getPaidAmount(r), 0))}</p>
          <p className="text-xs text-brand-gold mt-0.5">{records.filter(r => getRemainingAmount(r) === 0).length} soldées</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Reste à recouvrer</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{formatCurrency(records.reduce((s, r) => s + getRemainingAmount(r), 0))}</p>
          <p className="text-xs text-slate-500 mt-0.5">{records.filter(r => getRemainingAmount(r) > 0).length} en cours</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Échéances &lt; 7 jours</p>
          <p className="mt-1 text-2xl font-bold text-orange-700">
            {records.filter(r => {
              const diff = (r.dueDate.getTime() - Date.now()) / 86400000;
              return diff >= 0 && diff <= 7 && getRemainingAmount(r) > 0 && (r.paymentMethod === 'cheque' || r.paymentMethod === 'check' || r.paymentMethod === 'lettre_de_change');
            }).length}
          </p>
          <p className="text-xs text-orange-500 mt-0.5">chèques/lettres</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-300 bg-[#f4f6f8] px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-800">Trésorerie Vente</h1>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Période</label>
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); if (e.target.value !== "specific") { setDateFrom(""); setDateTo(""); } }}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="all">Toutes les dates</option>
                <option value="this_week">Cette semaine</option>
                <option value="this_month">Ce mois</option>
                <option value="this_year">Cette année</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Période d'échéance
              </label>
              <select
                value={dueDateFilter}
                onChange={(e) => { setDueDateFilter(e.target.value); if (e.target.value !== "specific") { setDueDateFrom(""); setDueDateTo(""); } }}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="all">Toutes les échéances</option>
                <option value="this_week">Cette semaine</option>
                <option value="this_month">Ce mois</option>
                <option value="this_year">Cette année</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Référence Facture
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
                <option value="En attente">En attente</option>
                <option value="Échoué">Échoué</option>
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
                <option value="especes">Espèces</option>
                <option value="card">Carte de crédit</option>
                <option value="bank_transfer">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="check">Chèque (legacy)</option>
                <option value="cri">CRI</option>
                <option value="lettre_de_change">Lettre de change</option>
                <option value="mixed">Multi-modalités</option>
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
                Statut Paiement
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                <option value="En attente">En attente</option>
                <option value="Payé">Payé</option>
                <option value="Échoué">Échoué</option>
                <option value="En circulation">En circulation</option>
                <option value="Escompte">Escompte</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Commercial</label>
              <select
                value={commercialFilter}
                onChange={(e) => setCommercialFilter(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Tout</option>
                {COMMERCIAUX.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Date début</label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateFilter("all"); }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Date fin</label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDateFilter("all"); }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Date échéance début</label>
              <Input type="date" value={dueDateFrom} onChange={(e) => { setDueDateFrom(e.target.value); setDueDateFilter("all"); }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Date échéance fin</label>
              <Input type="date" value={dueDateTo} onChange={(e) => { setDueDateTo(e.target.value); setDueDateFilter("all"); }} />
            </div>
          </div>

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

              <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-gold">
                  Paye
                </div>
                <div className="text-base font-semibold text-brand-gold">
                  {formatCurrency(totalPaid)}
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  Reste
                </div>
                <div className="text-base font-semibold text-slate-700">
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
              <Button
                variant="outline"
                className="h-9 gap-2"
                onClick={handleExportXLSX}
              >
                <FileDown className="h-4 w-4" />
                Export Excel
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
            <table className="min-w-[1700px] w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Facture</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Type</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Détails Paiement</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Client/Fournisseur</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Commercial</th>
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
                    <td colSpan={12} className="px-3 py-10 text-center text-slate-500">
                      Aucun enregistrement trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={(() => {
                        const diff = (record.dueDate.getTime() - Date.now()) / 86400000;
                        const hasRemaining = getRemainingAmount(record) > 0;
                        const isDueType = record.paymentMethod === 'cheque' || record.paymentMethod === 'check' || record.paymentMethod === 'lettre_de_change';
                        if (hasRemaining && isDueType && diff < 0) return "bg-red-50 border-l-2 border-l-red-400";
                        if (hasRemaining && isDueType && diff <= 7) return "bg-orange-50 border-l-2 border-l-orange-400";
                        return index % 2 === 0 ? "bg-white" : "bg-slate-50";
                      })()}
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
                            {record.transferImageName && (
                              <a href={mediaUrl(record.transferImageName)} target="_blank" rel="noreferrer">
                                <img
                                  src={mediaUrl(record.transferImageName)}
                                  alt="Virement"
                                  className="mt-1 h-14 w-auto rounded border border-slate-200 object-contain cursor-pointer"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                                />
                                <span className="hidden text-xs text-gray-400 italic">Image non disponible</span>
                              </a>
                            )}
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
                            {record.lettreImageName && (
                              <a href={mediaUrl(record.lettreImageName)} target="_blank" rel="noreferrer">
                                <img
                                  src={mediaUrl(record.lettreImageName)}
                                  alt="Lettre"
                                  className="mt-1 h-14 w-auto rounded border border-slate-200 object-contain cursor-pointer"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                                />
                                <span className="hidden text-xs text-gray-400 italic">Image non disponible</span>
                              </a>
                            )}
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
                            {record.chequeImageName && (
                              <a href={mediaUrl(record.chequeImageName)} target="_blank" rel="noreferrer">
                                <img
                                  src={mediaUrl(record.chequeImageName)}
                                  alt="Chèque"
                                  className="mt-1 h-14 w-auto rounded border border-slate-200 object-contain cursor-pointer"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                                />
                                <span className="hidden text-xs text-gray-400 italic">Image non disponible</span>
                              </a>
                            )}
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
                        {record.paymentMethod === "especes" && <div>Paiement en espèces</div>}
                        {record.paymentMethod === "card" && <div>Carte bancaire</div>}
                        {record.paymentMethod === "mixed" && (<>
                          {record.especesAmountPaid > 0 && <div>Espèces: {formatCurrency(record.especesAmountPaid)}</div>}
                          {record.criAmountPaid > 0 && <div>CRI: {formatCurrency(record.criAmountPaid)}</div>}
                          {record.transferAmountPaid > 0 && <div>Virement: {formatCurrency(record.transferAmountPaid)}</div>}
                          {record.chequeAmountPaid > 0 && <div>Chèque: {formatCurrency(record.chequeAmountPaid)}</div>}
                          {record.lettreAmountPaid > 0 && <div>Lettre: {formatCurrency(record.lettreAmountPaid)}</div>}
                          {record.codAmountPaid > 0 && <div>TPE: {formatCurrency(record.codAmountPaid)}</div>}
                        </>)}
                      </td>
                      <td className="px-2 py-2 align-top min-w-[180px] max-w-[220px]">
                        <div className="font-medium text-slate-700">{record.client || record.fournisseur || "-"}</div>
                        <div className="text-xs text-slate-500 truncate" title={record.remarque}>
                          {record.remarque || "-"}
                        </div>
                      </td>
                      {/* Colonne Commercial */}
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        <select
                          value={record.commercial}
                          onChange={(e) => handleCommercialChange(record.id, e.target.value)}
                          className="w-36 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        >
                          <option value="">— Choisir —</option>
                          {COMMERCIAUX.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        <select
                          value={record.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(record.id, e.target.value)}
                          className={`rounded border px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange ${
                            record.paymentStatus === 'paid' ? 'border-emerald-300 bg-emerald-50 text-brand-gold' :
                            record.paymentStatus === 'failed' ? 'border-red-300 bg-red-50 text-brand-red' :
                            'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <option value="pending">En attente</option>
                          <option value="paid">Payé</option>
                          <option value="failed">Annulé</option>
                          <option value="refunded">Remboursé</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top whitespace-nowrap">{record.dueDateFormatted}</td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold">
                        {formatCurrency(record.totalAmount)}
                      </td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold text-brand-gold">
                        {formatCurrency(getPaidAmount(record))}
                      </td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap font-semibold text-slate-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-2xl text-xs">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-slate-800 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-white">
                Facture {selectedRecord.refDoc || selectedRecord.id}
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-300 hover:text-white text-lg leading-none"
              >×</button>
            </div>

            <div className="p-4 space-y-3">
              {/* Ligne 1 : Infos facture + Client côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-slate-200">
                  <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Facture</div>
                  <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                    <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">N° Facture :</span><span>{selectedRecord.refDoc || "-"}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Date :</span><span>{selectedRecord.dateFormatted}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Date échéance :</span><span>{selectedRecord.dueDateFormatted}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Méthode :</span><span>{selectedRecord.type}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Statut :</span><span>{PAYMENT_STATUS_LABELS[selectedRecord.paymentStatus] || selectedRecord.paymentStatus}</span></div>
                    {selectedRecord.commercial && (
                      <div className="flex gap-1"><span className="font-semibold w-28 shrink-0">Commercial :</span><span>{selectedRecord.commercial}</span></div>
                    )}
                  </div>
                </div>

                <div className="rounded border border-slate-200">
                  <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Client</div>
                  <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                    <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Nom :</span><span>{selectedRecord.client || "-"}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Tél :</span><span>{selectedRecord.shippingAddress.phone || "-"}</span></div>
                    <div className="flex gap-1"><span className="font-semibold w-20 shrink-0">Adresse :</span>
                      <span>{[selectedRecord.shippingAddress.address, selectedRecord.shippingAddress.city].filter(Boolean).join(", ") || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau articles */}
              <div className="rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="px-2 py-1.5 text-left font-semibold w-8">Réf</th>
                      <th className="px-2 py-1.5 text-left font-semibold">Désignation</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-14">Qté</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-24">P.U. TTC</th>
                      <th className="px-2 py-1.5 text-right font-semibold w-24">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.items.length === 0 ? (
                      <tr><td colSpan={5} className="px-2 py-3 text-center text-slate-400">Aucun article</td></tr>
                    ) : (
                      selectedRecord.items.map((item, index) => (
                        <tr key={`${selectedRecord.id}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-2 py-1 text-slate-500">{index + 1}</td>
                          <td className="px-2 py-1">{item.product_name}</td>
                          <td className="px-2 py-1 text-right">{item.quantity}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-2 py-1 text-right font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ligne 3 : Paiement + Totaux côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                {/* Détails paiement */}
                <div className="rounded border border-slate-200">
                  <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Détails Paiement</div>
                  <div className="px-2 py-1.5 space-y-0.5 text-slate-700">
                    {selectedRecord.paymentMethod === "bank_transfer" && (<>
                      <div><span className="font-semibold">N° Virement :</span> {selectedRecord.transferNumber || "-"}</div>
                      <div><span className="font-semibold">Banque :</span> {selectedRecord.transferBankName || "-"}</div>
                      <div><span className="font-semibold">Titulaire :</span> {selectedRecord.transferHolderName || "-"}</div>
                      {selectedRecord.transferImageName && (
                        <div className="mt-1">
                          <span className="font-semibold">Justificatif :</span>
                          <a href={mediaUrl(selectedRecord.transferImageName)} target="_blank" rel="noreferrer" className="block mt-1">
                            <img src={mediaUrl(selectedRecord.transferImageName)} alt="Virement" className="max-h-40 w-auto rounded border border-slate-200 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display="none"; (e.target as HTMLImageElement).insertAdjacentHTML("afterend","<span class='text-xs text-gray-400 italic'>Image non disponible</span>"); }} />
                          </a>
                        </div>
                      )}
                    </>)}
                    {selectedRecord.paymentMethod === "lettre_de_change" && (<>
                      <div><span className="font-semibold">N° Lettre :</span> {selectedRecord.lettreNumber || "-"}</div>
                      <div><span className="font-semibold">Date :</span> {selectedRecord.lettreDate || "-"}</div>
                      <div><span className="font-semibold">Banque :</span> {selectedRecord.lettreBankName || "-"}</div>
                      <div><span className="font-semibold">RIB :</span> {selectedRecord.lettreRib || "-"}</div>
                      <div><span className="font-semibold">Lieu :</span> {selectedRecord.lettreLieu || "-"}</div>
                      {selectedRecord.lettreImageName && (
                        <div className="mt-1">
                          <span className="font-semibold">Lettre scannée :</span>
                          <a href={mediaUrl(selectedRecord.lettreImageName)} target="_blank" rel="noreferrer" className="block mt-1">
                            <img src={mediaUrl(selectedRecord.lettreImageName)} alt="Lettre de change" className="max-h-40 w-auto rounded border border-slate-200 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display="none"; (e.target as HTMLImageElement).insertAdjacentHTML("afterend","<span class='text-xs text-gray-400 italic'>Image non disponible</span>"); }} />
                          </a>
                        </div>
                      )}
                    </>)}
                    {(selectedRecord.paymentMethod === "cheque" || selectedRecord.paymentMethod === "check") && (<>
                      <div><span className="font-semibold">N° Chèque :</span> {selectedRecord.chequeNumberValue || "-"}</div>
                      <div><span className="font-semibold">Date :</span> {selectedRecord.chequeDate || "-"}</div>
                      <div><span className="font-semibold">Nom :</span> {selectedRecord.chequeName || "-"}</div>
                      <div><span className="font-semibold">Banque :</span> {selectedRecord.chequeBankName || "-"}</div>
                      {selectedRecord.chequeImageName && (
                        <div className="mt-1">
                          <span className="font-semibold">Chèque scanné :</span>
                          <a href={mediaUrl(selectedRecord.chequeImageName)} target="_blank" rel="noreferrer" className="block mt-1">
                            <img src={mediaUrl(selectedRecord.chequeImageName)} alt="Chèque" className="max-h-40 w-auto rounded border border-slate-200 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display="none"; (e.target as HTMLImageElement).insertAdjacentHTML("afterend","<span class='text-xs text-gray-400 italic'>Image non disponible</span>"); }} />
                          </a>
                        </div>
                      )}
                    </>)}
                    {selectedRecord.paymentMethod === "cash_on_delivery" && (<>
                      <div><span className="font-semibold">N° Autorisation :</span> {selectedRecord.codAuthorizationNumber || "-"}</div>
                      <div><span className="font-semibold">Banque :</span> {selectedRecord.codBankName || "-"}</div>
                    </>)}
                    {selectedRecord.paymentMethod === "cri" && (
                      <div><span className="font-semibold">Remarque :</span> {selectedRecord.criRemarque || "-"}</div>
                    )}
                    {selectedRecord.paymentMethod === "especes" && <div>Paiement en espèces</div>}
                    {selectedRecord.paymentMethod === "card" && <div>Carte bancaire</div>}
                    {/* Multi-modal: show all non-zero payment method details */}
                    {selectedRecord.paymentMethod === "mixed" && (<>
                      {selectedRecord.especesAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">Espèces</div>}
                      {selectedRecord.especesAmountPaid > 0 && <div><span className="font-semibold">Montant :</span> {formatCurrency(selectedRecord.especesAmountPaid)}</div>}
                      {selectedRecord.especesRemarque && selectedRecord.especesAmountPaid > 0 && <div><span className="font-semibold">Remarque :</span> {selectedRecord.especesRemarque}</div>}
                      {selectedRecord.criAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">CRI</div>}
                      {selectedRecord.criAmountPaid > 0 && <div><span className="font-semibold">Montant CRI :</span> {formatCurrency(selectedRecord.criAmountPaid)}</div>}
                      {selectedRecord.transferAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">Virement</div>}
                      {selectedRecord.transferAmountPaid > 0 && <><div><span className="font-semibold">N° Virement :</span> {selectedRecord.transferNumber || "-"}</div><div><span className="font-semibold">Banque :</span> {selectedRecord.transferBankName || "-"}</div><div><span className="font-semibold">Montant :</span> {formatCurrency(selectedRecord.transferAmountPaid)}</div></>}
                      {selectedRecord.chequeAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">Chèque</div>}
                      {selectedRecord.chequeAmountPaid > 0 && <><div><span className="font-semibold">N° Chèque :</span> {selectedRecord.chequeNumberValue || "-"}</div><div><span className="font-semibold">Banque :</span> {selectedRecord.chequeBankName || "-"}</div><div><span className="font-semibold">Montant :</span> {formatCurrency(selectedRecord.chequeAmountPaid)}</div></>}
                      {selectedRecord.lettreAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">Lettre de change</div>}
                      {selectedRecord.lettreAmountPaid > 0 && <><div><span className="font-semibold">N° Lettre :</span> {selectedRecord.lettreNumber || "-"}</div><div><span className="font-semibold">Banque :</span> {selectedRecord.lettreBankName || "-"}</div><div><span className="font-semibold">Montant :</span> {formatCurrency(selectedRecord.lettreAmountPaid)}</div></>}
                      {selectedRecord.codAmountPaid > 0 && <div className="font-semibold text-slate-500 mt-1">TPE</div>}
                      {selectedRecord.codAmountPaid > 0 && <><div><span className="font-semibold">N° Auth :</span> {selectedRecord.codAuthorizationNumber || "-"}</div><div><span className="font-semibold">Montant :</span> {formatCurrency(selectedRecord.codAmountPaid)}</div></>}
                    </>)}
                    {selectedRecord.remarque && (
                      <div><span className="font-semibold">Note :</span> {selectedRecord.remarque}</div>
                    )}
                  </div>
                </div>

                {/* Totaux */}
                <div className="rounded border border-slate-200">
                  <div className="bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Totaux</div>
                  <div className="px-2 py-1.5 space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Montant Facture</span>
                      <span className="font-semibold">{formatCurrency(selectedRecord.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-brand-gold">
                      <span>Montant Payé</span>
                      <span className="font-semibold">{formatCurrency(getPaidAmount(selectedRecord))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 text-slate-700">
                      <span className="font-semibold">Reste à payer</span>
                      <span className="font-bold">{formatCurrency(getRemainingAmount(selectedRecord))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedRecord(null)}>Fermer</Button>
                {selectedRecord.orderStatus !== 'pending' && selectedRecord.orderStatus !== 'cancelled' ? (
                  <Button size="sm" onClick={() => printFacture(selectedRecord!)}>
                    <Printer className="h-3.5 w-3.5 mr-1" />Imprimer facture
                  </Button>
                ) : (
                  <Button size="sm" disabled title="Facture disponible après confirmation de la commande" className="opacity-50 cursor-not-allowed">
                    <Printer className="h-3.5 w-3.5 mr-1" />Imprimer facture
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}