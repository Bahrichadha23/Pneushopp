"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, TrendingUp, Plus, Minus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

type StockVariant = "default" | "secondary" | "destructive" | "outline";

interface StockStatus {
  status: string;
  variant: StockVariant;
}

const getStockStatus = (current: number, min = 5, max = 100): StockStatus => {
  if (current <= 0)
    return { status: "Rupture de stock", variant: "destructive" };
  if (current <= min) return { status: "Stock faible", variant: "secondary" };
  if (current < max) return { status: "En stock", variant: "default" };
  return { status: "Stock élevé", variant: "outline" };
};

interface AdminProduct {
  id: number;
  name: string;
  brand: string;
  size: string;
  category: string;
  stock: number;
  stockMin: number;
  stockMax: number;
  prixAchat: number;
  prixVente: number;
  emplacement: string;
  isOnSale: boolean;
  discountPct: number;
}

export default function StockManagementPage() {
  const [stock, setStock] = useState<AdminProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusPanel, setStatusPanel] = useState<{
    isOpen: boolean;
    product: AdminProduct | null;
    minStock: number;
    maxStock: number;
  }>({
    isOpen: false,
    product: null,
    minStock: 5,
    maxStock: 100,
  });
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    productId: number | null;
    change: number;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    change: 0,
    productName: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin");
    return null;
  }

  // Fetch stock with pagination
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(
          `${API_URL}/admin/products/?page=${pagination.page}&limit=${pagination.limit}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        setPagination((prev) => ({
          ...prev,
          total: data.count ?? data.results?.length ?? 0,
        }));

        const formattedStock: AdminProduct[] = (data.results || data).map(
          (item: any) => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            size: item.size,
            category: item.category_name || item.category?.name || "-",
            stock: item.stock,
            stockMin: item.stock_min ?? 5,
            stockMax: item.stock_max ?? 100,
            prixAchat: parseFloat(item.purchase_price || item.old_price || "0"),
            prixVente: parseFloat(item.price || "0"),
            emplacement: item.location || "-",
            isOnSale: item.is_on_sale || false,
            discountPct: item.discount_percentage || 0,
          })
        );

        setStock(formattedStock);
      } catch (err) {
        console.error("Erreur lors du chargement du stock :", err);
      }
    };

    fetchStock();
  }, [pagination.page]);

  const loadPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount);

  const openStatusPanel = (item: AdminProduct) => {
    setStatusPanel({
      isOpen: true,
      product: item,
      minStock: item.stockMin,
      maxStock: item.stockMax,
    });
  };

  const closeStatusPanel = () => {
    setStatusPanel({ isOpen: false, product: null, minStock: 5, maxStock: 100 });
  };

  const handleStatusPanelConfirm = async () => {
    if (!statusPanel.product) return;
    const { id } = statusPanel.product;
    const { minStock, maxStock } = statusPanel;    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ stock_min: minStock, stock_max: maxStock }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      setStock((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockMin: minStock, stockMax: maxStock } : p))
      );
      closeStatusPanel();
    } catch (err) {
      console.error("Échec mise à jour seuils:", err);
    }
  };

  const openConfirmation = (id: number, change: number) => {
    const item = stock.find((p) => p.id === id);
    if (!item) return;
    setConfirmation({
      isOpen: true,
      productId: id,
      change,
      productName: item.name,
    });
  };

  const handleCancelDialog = () => {
    setConfirmation({ isOpen: false, productId: null, change: 0, productName: "" });
  };

  const handleConfirmDialogAction = async () => {
    if (confirmation.productId === null) return;
    await updateStock(confirmation.productId, confirmation.change);
    handleCancelDialog();
  };

  const updateStock = async (id: number, change: number) => {
    const item = stock.find((p) => p.id === id);
    if (!item) return;

    const newStock = Math.max(0, Number(item.stock) + change);

    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du stock");

      setStock((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
      );
    } catch (err) {
      console.error("❌ Échec mise à jour stock:", err);
    }
  };

  const filteredStock = stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter
      ? getStockStatus(item.stock, item.stockMin, item.stockMax).status === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = stock.filter(
    (item) => item.stock > 0 && item.stock <= item.stockMin
  );

  const totalValue = stock.reduce(
    (sum, item) => sum + item.stock * item.prixVente,
    0
  );

  return (
    <div className="space-y-2 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredStock.length} produits
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Produits en stock
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Unités totales
            </CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.reduce((sum, item) => sum + item.stock, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher un produit..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Status Filter Panel */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-700 mr-1">Filtrer par statut :</span>
        {[
          { label: "Tous", value: null, className: "cursor-pointer border border-gray-300 bg-white text-gray-700 hover:bg-gray-100" },
          { label: "Stock élevé", value: "Stock élevé", className: "cursor-pointer border border-gray-300 bg-white text-gray-700 hover:bg-gray-100" },
          { label: "En stock", value: "En stock", className: "cursor-pointer border border-blue-500 bg-white text-blue-700 hover:bg-blue-50" },
          { label: "Stock faible", value: "Stock faible", className: "cursor-pointer border border-yellow-400 bg-white text-yellow-700 hover:bg-yellow-50" },
          { label: "Rupture de stock", value: "Rupture de stock", className: "cursor-pointer border border-red-400 bg-white text-red-700 hover:bg-red-50" },
        ].map(({ label, value, className }) => {
          const isActive =
            value === null ? statusFilter === null : statusFilter === value;
          return (
            <button
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? value === null
                    ? "bg-gray-800 text-white border border-gray-800"
                    : value === "Stock élevé"
                    ? "bg-gray-700 text-white border border-gray-700"
                    : value === "En stock"
                    ? "bg-blue-600 text-white border border-blue-600"
                    : value === "Stock faible"
                    ? "bg-yellow-500 text-white border border-yellow-500"
                    : "bg-red-500 text-white border border-red-500"
                  : className
              }`}
            >
              {label}
              {value !== null && (
                <span className="ml-1 text-xs opacity-75">
                  ({stock.filter((i) => getStockStatus(i.stock, i.stockMin, i.stockMax).status === value).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="space-y-4">
        {filteredStock.length === 0 && <p>Aucun produit trouvé</p>}

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Produit</th>
                  <th className="px-2 py-1 text-left">Marque</th>
                  <th className="px-2 py-1 text-left">Taille</th>
                  <th className="px-2 py-1 text-left">Catégorie</th>
                  <th className="px-2 py-1 text-center">Stock</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Min/Max</th>
                  <th className="px-2 py-1">Prix vente</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.stockMin, item.stockMax);
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1 font-medium">{item.name}</td>
                      <td className="px-2 py-1">{item.brand}</td>
                      <td className="px-2 py-1">{item.size}</td>
                      <td className="px-2 py-1">{item.category}</td>
                      <td className="px-2 py-1 text-center">{item.stock}</td>
                      <td className="px-2 py-1">
                        <Badge
                          variant={stockStatus.variant}
                          className="cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => openStatusPanel(item)}
                          title="Cliquer pour modifier le statut"
                        >
                          {stockStatus.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1">
                        {item.stockMin} / {item.stockMax}
                      </td>
                      <td className="px-2 py-1">
                        {formatCurrency(item.prixVente)}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmation(item.id, -1)}
                            disabled={item.stock <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmation(item.id, 1)}
                            disabled={item.stock >= item.stockMax}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Edit Panel */}
        <AnimatePresence>
          {statusPanel.isOpen && statusPanel.product && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={closeStatusPanel}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    Seuils Min / Max du stock
                  </h2>
                  <button
                    onClick={closeStatusPanel}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Produit</span>
                    <span className="text-gray-900 font-semibold text-right max-w-[60%]">{statusPanel.product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marque</span>
                    <span className="text-gray-800">{statusPanel.product.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taille</span>
                    <span className="text-gray-800">{statusPanel.product.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Catégorie</span>
                    <span className="text-gray-800">{statusPanel.product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock actuel</span>
                    <span className="font-bold text-blue-700">{statusPanel.product.stock} unité(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut actuel</span>
                    <Badge variant={getStockStatus(statusPanel.product.stock, statusPanel.product.stockMin, statusPanel.product.stockMax).variant}>
                      {getStockStatus(statusPanel.product.stock, statusPanel.product.stockMin, statusPanel.product.stockMax).status}
                    </Badge>
                  </div>
                </div>

                {/* Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum
                      <span className="ml-1 text-xs text-orange-500 font-normal">(Stock faible)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={statusPanel.minStock}
                      onChange={(e) =>
                        setStatusPanel((prev) => ({
                          ...prev,
                          minStock: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">En dessous = stock faible</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum
                      <span className="ml-1 text-xs text-green-600 font-normal">(Stock élevé)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={statusPanel.maxStock}
                      onChange={(e) =>
                        setStatusPanel((prev) => ({
                          ...prev,
                          maxStock: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Au-dessus = stock élevé</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={closeStatusPanel} className="text-gray-600">
                    Annuler
                  </Button>
                  <Button
                    onClick={handleStatusPanelConfirm}
                    className="bg-black text-white"
                  >
                    Confirmer
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmation.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={handleCancelDialog}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Confirmer la mise à jour du stock
                  </h2>
                  <button
                    onClick={handleCancelDialog}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir{" "}
                  <strong>
                    {confirmation.change > 0 ? "augmenter" : "diminuer"}
                  </strong>{" "}
                  le stock de <strong>{confirmation.productName}</strong> de{" "}
                  <strong>{Math.abs(confirmation.change)}</strong> unité(s) ?
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancelDialog}
                    className="text-gray-600"
                  >
                    Non
                  </Button>
                  <Button
                    onClick={handleConfirmDialogAction}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Oui
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => loadPage(pagination.page - 1)}
          >
            Previous
          </Button>

          <span className="text-gray-700">
            Page {pagination.page} /{" "}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>

          <Button
            variant="outline"
            disabled={
              pagination.page >= Math.ceil(pagination.total / pagination.limit)
            }
            onClick={() => loadPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
