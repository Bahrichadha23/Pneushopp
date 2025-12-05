"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, TrendingUp, Plus, Minus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

type StockVariant = "default" | "secondary" | "destructive" | "outline";

interface StockStatus {
  status: string;
  variant: StockVariant;
}

const getStockStatus = (current: number): StockStatus => {
  if (current <= 0)
    return { status: "Rupture de stock", variant: "destructive" };
  if (current <= 5) return { status: "Stock faible", variant: "secondary" };
  if (current <= 20) return { status: "En stock", variant: "default" };
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
}

export default function StockManagementPage() {
  const [stock, setStock] = useState<AdminProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
            category: item.category?.name || "Auto",
            stock: item.stock,
            stockMin: item.stockMin ?? 0,
            stockMax: item.stockMax ?? 100,
            prixAchat: parseFloat(item.old_price || "0"),
            prixVente: parseFloat(item.price || "0"),
            emplacement: item.location || "-",
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

  const filteredStock = stock.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = stock.filter(
    (item) => item.stock > 0 && item.stock <= 5
  );

  const totalValue = stock.reduce(
    (sum, item) => sum + item.stock * item.prixAchat,
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
                  <th className="px-2 py-1">Prix achat</th>
                  <th className="px-2 py-1">Prix vente</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const stockStatus = getStockStatus(item.stock);
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1 font-medium">{item.name}</td>
                      <td className="px-2 py-1">{item.brand}</td>
                      <td className="px-2 py-1">{item.size}</td>
                      <td className="px-2 py-1">{item.category}</td>
                      <td className="px-2 py-1 text-center">{item.stock}</td>
                      <td className="px-2 py-1">
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1">
                        {item.stockMin} / {item.stockMax}
                      </td>
                      <td className="px-2 py-1">
                        {formatCurrency(item.prixAchat)}
                      </td>
                      <td className="px-2 py-1">
                        {formatCurrency(item.prixVente)}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.id, -1)}
                            disabled={item.stock <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.id, 1)}
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
