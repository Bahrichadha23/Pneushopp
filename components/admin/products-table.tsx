// Tableau de gestion des produits avec filtres avancés
"use client";
import { useState } from "react";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  Package,
} from "lucide-react";

interface ProductsTableProps {
  products: Product[];
  onViewProduct: (productId: string) => void;
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export default function ProductsTable({
  products,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateStock,
}: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [promoFilter, setPromoFilter] = useState<string>("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (!product.inStock || product.stock === 0) {
      return {
        status: "out",
        label: "Rupture",
        variant: "destructive" as const,
      };
    } else if (product.stock <= 5) {
      return {
        status: "low",
        label: "Stock faible",
        variant: "destructive" as const,
      };
    } else if (product.stock <= 10) {
      return {
        status: "medium",
        label: "Stock moyen",
        variant: "secondary" as const,
      };
    } else {
      return { status: "good", label: "En stock", variant: "default" as const };
    }
  };

  const getCategoryLabel = (category: Product["category"]) => {
    const labels = {
      auto: "Auto",
      suv: "SUV",
      camionnette: "Camionnette",
      agricole: "Agricole",
      "poids-lourd": "Poids lourd",
      utilitaire: "Utilitaire",
      "4x4": "4X4",
    };
    return labels[category] || category;
  };

  // Filtrage et tri des produits
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const matchesBrand =
        brandFilter === "all" || product.brand === brandFilter;

      let matchesStock = true;
      if (stockFilter === "in-stock")
        matchesStock = product.inStock && product.stock > 0;
      else if (stockFilter === "low-stock")
        matchesStock = product.stock <= 5 && product.stock > 0;
      else if (stockFilter === "out-of-stock")
        matchesStock = !product.inStock || product.stock === 0;

      const matchesPromo =
        promoFilter === "all" ||
        (promoFilter === "on-sale" && product.is_on_sale) ||
        (promoFilter === "not-on-sale" && !product.is_on_sale);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesStock &&
        matchesPromo
      );
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

      if (sortBy === "specifications") {
        aValue = `${a.specifications.width}/${a.specifications.height}R${a.specifications.diameter}`;
        bValue = `${b.specifications.width}/${b.specifications.height}R${b.specifications.diameter}`;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand))).sort();

  return (
    <div className="space-y-4">
      {/* Filtres et recherche */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom, marque, modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="camionnette">Camionnette</SelectItem>
              <SelectItem value="agricole">Agricole</SelectItem>
              <SelectItem value="poids-lourd">Poids lourd</SelectItem>
              <SelectItem value="utilitaire">Utilitaire</SelectItem>
              <SelectItem value="4x4">4X4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marques</SelectItem>
              {uniqueBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les stocks</SelectItem>
              <SelectItem value="in-stock">En stock</SelectItem>
              <SelectItem value="low-stock">Stock faible</SelectItem>
              <SelectItem value="out-of-stock">Rupture</SelectItem>
            </SelectContent>
          </Select>
          <Select value={promoFilter} onValueChange={setPromoFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Promotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="on-sale">En promotion</SelectItem>
              <SelectItem value="not-on-sale">Hors promotion</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="brand">Marque</SelectItem>
              <SelectItem value="price">Prix</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="specifications">Dimensions</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Produits Per Page
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAndSortedProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stock faible</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredAndSortedProducts.filter(
                    (p) => p.stock <= 5 && p.stock > 0
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ruptures</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredAndSortedProducts.filter(
                    (p) => !p.inStock || p.stock === 0
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Valeur stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  filteredAndSortedProducts.reduce(
                    (sum, p) => sum + p.price * p.stock,
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Produits en promo
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAndSortedProducts.filter((p) => p.is_on_sale).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <Table className="min-w-[700px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="hidden sm:table-cell">
                Spécifications
              </TableHead>
              <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.brand} - {product.model}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="text-sm">
                      <p className="font-medium">
                        {product.specifications.width}/
                        {product.specifications.height}R
                        {product.specifications.diameter}
                      </p>
                      <p className="text-gray-500">
                        {product.specifications.loadIndex}
                        {product.specifications.speedRating} -{" "}
                        {product.specifications.season}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div>
                      {product.is_on_sale ? (
                        <>
                          <p className="text-red-600 font-bold">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.old_price || 0)}
                          </p>
                          <p className="text-xs text-green-600">
                            -{product.discount_percentage}%
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">
                          {formatCurrency(product.price)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <Input
                      type="number"
                      value={product.stock}
                      onChange={(e) =>
                        onUpdateStock(
                          product.id,
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 h-8"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewProduct(product.id)}
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditProduct(product.id)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteProduct(product.id)}
                        title="Supprimer"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun produit trouvé avec les critères sélectionnés.
        </div>
      )}
    </div>
  );
}
