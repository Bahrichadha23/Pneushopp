"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Search } from "lucide-react";
import ExcelJS from "exceljs";

interface TresorerieRecord {
  id: string;
  orderNumber: string;
  createdAt: Date;
  dateFormatted: string;
  document: string;
  refDoc: string;
  type: string;
  client: string;
  remarque: string;
  paymentMethod: string;
  paymentStatus: string;
  utilisateur: string;
  valeur: number;
  totalAmount: number;
  deliveryCost: number;
  criAmountPaid: number;
  criRemaining: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Carte de crédit",
  cash_on_delivery: "Espèces",
  bank_transfer: "Virement",
  cri: "CRI",
  check: "Chèque",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  cash_on_delivery: "bg-green-100 text-green-800",
  card: "bg-blue-100 text-blue-800",
  bank_transfer: "bg-purple-100 text-purple-800",
  cri: "bg-orange-100 text-orange-800",
  check: "bg-yellow-100 text-yellow-800",
};

function formatCurrency(value: number): string {
  return (
    value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " DT"
  );
}

export default function TresoreriePage() {
  const [records, setRecords] = useState<TresorerieRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
            const firstName = o.shipping_address?.first_name || "";
            const lastName = o.shipping_address?.last_name || "";
            return {
              id: o.id.toString(),
              orderNumber: o.order_number || "",
              createdAt,
              dateFormatted: createdAt.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              document: "Facture de vente",
              refDoc: o.order_number || "",
              type:
                PAYMENT_LABELS[o.payment_method] || o.payment_method || "N/A",
              client: `${firstName} ${lastName}`.trim() || "N/A",
              remarque: o.cri_remarque || o.notes || "",
              paymentMethod: o.payment_method || "",
              paymentStatus: o.payment_status || "pending",
              utilisateur: o.user?.email || o.user?.username || "",
              valeur: parseFloat(o.total_amount || "0"),
              totalAmount: parseFloat(o.total_amount || "0"),
              deliveryCost: parseFloat(o.delivery_cost || "0"),
              criAmountPaid: parseFloat(o.cri_amount_paid || "0"),
              criRemaining: parseFloat(o.cri_remaining || "0"),
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

  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.client.toLowerCase().includes(term) ||
          r.orderNumber.toLowerCase().includes(term) ||
          r.remarque.toLowerCase().includes(term) ||
          r.utilisateur.toLowerCase().includes(term)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((r) => r.paymentMethod === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.paymentStatus === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((r) => r.createdAt >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.createdAt <= to);
    }

    return filtered;
  }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo, records]);

  const totals = useMemo(() => {
    const total = filteredRecords.reduce((sum, r) => sum + r.valeur, 0);
    const especes = filteredRecords
      .filter((r) => r.paymentMethod === "cash_on_delivery")
      .reduce((sum, r) => sum + r.valeur, 0);
    const carte = filteredRecords
      .filter((r) => r.paymentMethod === "card")
      .reduce((sum, r) => sum + r.valeur, 0);
    const virement = filteredRecords
      .filter((r) => r.paymentMethod === "bank_transfer")
      .reduce((sum, r) => sum + r.valeur, 0);
    const cri = filteredRecords
      .filter((r) => r.paymentMethod === "cri")
      .reduce((sum, r) => sum + r.criAmountPaid, 0);
    const criRestant = filteredRecords
      .filter((r) => r.paymentMethod === "cri")
      .reduce((sum, r) => sum + r.criRemaining, 0);
    const cheque = filteredRecords
      .filter((r) => r.paymentMethod === "check")
      .reduce((sum, r) => sum + r.valeur, 0);
    return { total, especes, carte, virement, cri, criRestant, cheque };
  }, [filteredRecords]);

  const handleExportCSV = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Trésorerie Vente");

    worksheet.columns = [
      { header: "N° COMMANDE", key: "orderNumber", width: 18 },
      { header: "COMMERCIAL", key: "commercial", width: 20 },
      { header: "Date", key: "date", width: 12 },
      { header: "N° Facture", key: "invoice", width: 18 },
      { header: "Client", key: "client", width: 25 },
      { header: "Espèces", key: "especes", width: 12 },
      { header: "Chèque", key: "cheque", width: 12 },
      { header: "Virement", key: "virement", width: 12 },
      { header: "Carte de crédit", key: "carte", width: 15 },
      { header: "Lettre de change", key: "lettre", width: 15 },
      { header: "CRI", key: "cri", width: 12 },
      { header: "Remise", key: "remise", width: 12 },
      { header: "Total HT", key: "totalHT", width: 12 },
      { header: "Total TVA", key: "totalTVA", width: 12 },
      { header: "Total TTC", key: "totalTTC", width: 12 },
      { header: "Reste", key: "reste", width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true };

    filteredRecords.forEach((record) => {
      const totalHT = record.totalAmount;
      const totalTVA = +(totalHT * 0.19).toFixed(2);
      const totalTTC = +(totalHT + totalTVA).toFixed(2);
      const paymentValue =
        record.paymentMethod === "cri"
          ? record.criAmountPaid.toFixed(2)
          : totalTTC.toFixed(2);

      worksheet.addRow({
        orderNumber: record.orderNumber,
        commercial: record.utilisateur,
        date: record.dateFormatted,
        invoice: record.refDoc,
        client: record.client,
        especes:
          record.paymentMethod === "cash_on_delivery" ? paymentValue : "",
        cheque: record.paymentMethod === "check" ? paymentValue : "",
        virement:
          record.paymentMethod === "bank_transfer" ? paymentValue : "",
        carte: record.paymentMethod === "card" ? paymentValue : "",
        lettre: "",
        cri: record.paymentMethod === "cri" ? paymentValue : "",
        remise: "",
        totalHT: totalHT.toFixed(2),
        totalTVA: totalTVA.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        reste:
          record.paymentMethod === "cri"
            ? record.criRemaining.toFixed(2)
            : "0.00",
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement de la trésorerie...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Trésorerie Vente
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Suivi des paiements et encaissements
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileDown className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-gray-500 uppercase">
            Total
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(totals.total)}
          </div>
          <div className="text-xs text-gray-500">
            {filteredRecords.length} opération(s)
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-green-600 uppercase">
            Espèces
          </div>
          <div className="text-lg font-bold text-green-700">
            {formatCurrency(totals.especes)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-blue-600 uppercase">
            Carte
          </div>
          <div className="text-lg font-bold text-blue-700">
            {formatCurrency(totals.carte)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-purple-600 uppercase">
            Virement
          </div>
          <div className="text-lg font-bold text-purple-700">
            {formatCurrency(totals.virement)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-yellow-600 uppercase">
            Chèque
          </div>
          <div className="text-lg font-bold text-yellow-700">
            {formatCurrency(totals.cheque)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-orange-600 uppercase">
            CRI
          </div>
          <div className="text-lg font-bold text-orange-700">
            {formatCurrency(totals.cri)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-medium text-red-600 uppercase">
            Reste CRI
          </div>
          <div className="text-lg font-bold text-red-700">
            {formatCurrency(totals.criRestant)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Client, N° commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de paiement
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="cash_on_delivery">Espèces</option>
              <option value="card">Carte de crédit</option>
              <option value="bank_transfer">Virement</option>
              <option value="check">Chèque</option>
              <option value="cri">CRI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut paiement
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="paid">Payé</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Document
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Réf Doc
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Remarque
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Utilisateur
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 text-right">
                  Valeur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Aucun enregistrement trouvé
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.dateFormatted}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.document}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                      {record.refDoc}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          PAYMENT_TYPE_COLORS[record.paymentMethod] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{record.client}</td>
                    <td
                      className="px-4 py-3 max-w-[200px] truncate"
                      title={record.remarque}
                    >
                      {record.remarque || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          PAYMENT_STATUS_COLORS[record.paymentStatus] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[record.paymentStatus] ||
                          record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{record.utilisateur}</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(record.valeur)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 font-bold">
                  <td colSpan={8} className="px-4 py-3 text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {formatCurrency(totals.total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
