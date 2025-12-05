"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Filter } from "lucide-react";
import type { Product } from "@/types/product";
import ProductCard from "@/components/product-card";
import { API_URL } from "@/lib/config";

interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  old_price?: string;
  brand: string;
  size: string;
  season: string;
  season_display: string;
  stock: number;
  is_featured: boolean;
  is_on_sale: boolean;
  discount_percentage: number;
  image?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}
const categoryMap: Record<string, Product["category"]> = {
  auto: "auto",
  suv: "suv",
  camionnette: "camionnette",
  utilitaire: "utilitaire",
  agricole: "agricole",
  "poids-lourd": "poids-lourd",
  "4x4": "4x4",
  tourisme: "auto",
};

const convertApiProduct = (apiProduct: ApiProduct): Product => {
  // Parse size like "225/45R17"
  let width = 0;
  let height = 0;
  let diameter = 0;

  if (apiProduct.size && apiProduct.size.includes("/")) {
    const [w, rest] = apiProduct.size.split("/");
    const [h, d] = rest.split("R");

    width = Number(w);
    height = Number(h);
    diameter = Number(d);
  }

  return {
    id: apiProduct.id.toString(),
    slug: apiProduct.slug,
    name: apiProduct.name,
    brand: apiProduct.brand,

    // Use name or model if your backend has one
    model: apiProduct.name,

    price: parseFloat(apiProduct.price),
    old_price: apiProduct.old_price
      ? parseFloat(apiProduct.old_price)
      : undefined,
    is_on_sale: apiProduct.is_on_sale,
    discount_percentage: apiProduct.discount_percentage,

    image: apiProduct.image || "/placeholder.jpg",
    images: [
      new File([], apiProduct.image || "/placeholder.jpg", {
        type: "image/jpeg",
      }),
    ],

    category: categoryMap[apiProduct.category.slug] ?? "auto",

    specifications: {
      width,
      height,
      diameter,
      loadIndex: 0, // backend does not send this
      speedRating: "", // backend does not send this

      // Convert season to union type
      season:
        apiProduct.season === "summer"
          ? "ete"
          : apiProduct.season === "winter"
          ? "hiver"
          : "toutes-saisons",

      // Choose a default specialty
      specialty: "tourisme",
    },

    stock: apiProduct.stock,
    description: apiProduct.description,
    features: [],
    inStock: apiProduct.stock > 0,

    isPromotion:
      apiProduct.discount_percentage > 0 ||
      apiProduct.is_on_sale ||
      apiProduct.is_featured,
  };
};

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 20, // number of products per page
  });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/products/?page=${page}&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const apiProducts = data.results || [];
      const convertedProducts = apiProducts.map(convertApiProduct);

      setProducts(convertedProducts);

      setPagination({
        page,
        total: data.count || 0,
        limit: pagination.limit,
      });

      setError(null);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setError(`Erreur lors du chargement des produits: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand =
        !brandFilter ||
        brandFilter === "all" ||
        product.brand.toLowerCase() === brandFilter.toLowerCase();

      const matchesCategory =
        !categoryFilter ||
        categoryFilter === "all" ||
        product.category === categoryFilter;

      return matchesSearch && matchesBrand && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "brand":
          return a.brand.localeCompare(b.brand);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des produits...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Notre Boutique
          </h1>
          <p className="text-gray-600">
            Découvrez notre large gamme de pneumatiques
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtrer les produits</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="camionnette">Camionnette</SelectItem>
                <SelectItem value="utilitaire">Utilitaire</SelectItem>
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes marques</SelectItem>
                <SelectItem value="continental">Continental</SelectItem>
                <SelectItem value="kleber">Kleber</SelectItem>
                <SelectItem value="tigar">Tigar</SelectItem>
                <SelectItem value="michelin">Michelin</SelectItem>
                <SelectItem value="bridgestone">Bridgestone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
                <SelectItem value="price-low">Prix (croissant)</SelectItem>
                <SelectItem value="price-high">Prix (décroissant)</SelectItem>
                <SelectItem value="brand">Marque</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setBrandFilter("all");
                setCategoryFilter("all");
                setPriceFilter("");
                setSortBy("name");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              {filteredProducts.length} produit
              {filteredProducts.length !== 1 ? "s" : ""} trouvé
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun produit trouvé avec ces critères
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setBrandFilter("all");
                setCategoryFilter("all");
                setPriceFilter("");
                setSortBy("name");
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </main>
      {/* Pagination */}
      <div className="flex mb-10 flex-wrap justify-center gap-2 mt-6 text-sm sm:text-base">
        <Button
          variant="outline"
          disabled={pagination.page === 1}
          onClick={() => fetchProducts(pagination.page - 1)}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>

        <span className="text-gray-700 self-center">
          Page {pagination.page} /{" "}
          {Math.ceil(pagination.total / pagination.limit)}
        </span>

        <Button
          variant="outline"
          disabled={
            pagination.page >= Math.ceil(pagination.total / pagination.limit)
          }
          onClick={() => fetchProducts(pagination.page + 1)}
          className="w-full sm:w-auto"
        >
          Next
        </Button>
      </div>

      <Footer />
    </div>
  );
}
