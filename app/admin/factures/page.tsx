"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { fetchOrders } from "@/lib/services/order";
import { handleDownloadInvoice } from "@/components/admin/orders-table";
import type { Order } from "@/types/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_VARIANTS: Record<Order["status"], "default" | "secondary" | "outline" | "destructive"> = {
  pending: "destructive",
  confirmed: "outline",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export default function FacturesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchClient, setSearchClient] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (user && !["admin", "sales"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user]);

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesClient =
        searchClient === "" ||
        o.customerName.toLowerCase().includes(searchClient.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchClient.toLowerCase());

      const matchesDate =
        searchDate === "" ||
        (() => {
          const d = new Date(o.createdAt);
          const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return local === searchDate;
        })();

      return matchesClient && matchesDate;
    });
  }, [orders, searchClient, searchDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const handleDownload = async (order: Order) => {
    setDownloading(order.id);
    try {
      await handleDownloadInvoice(order);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500">
            Consultez et téléchargez toutes les factures clients
          </p>
        </div>
      </div>

      {/* Search filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par client ou email..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            className="pl-10"
          />
        </div>
        <div>
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
        {(searchClient || searchDate) && (
          <Button
            variant="ghost"
            onClick={() => { setSearchClient(""); setSearchDate(""); }}
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Stats */}
      <p className="text-sm text-gray-500">
        {filtered.length} facture{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucune facture trouvée.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Télécharger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerEmail}</p>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(order)}
                        disabled={downloading === order.id}
                        className="gap-2"
                      >
                        {downloading === order.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">#{order.orderNumber}</span>
                  <Badge variant={STATUS_VARIANTS[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(order.totalAmount + (order.deliveryCost || 0))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(order)}
                    disabled={downloading === order.id}
                    className="gap-2"
                  >
                    {downloading === order.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
