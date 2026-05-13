"use client";

/**
 * ACHATS PAGE - COMPANY PURCHASES FROM SUPPLIERS
 * 
 * IMPORTANT: This is DIFFERENT from regular Orders/Clients
 * 
 * - Regular Orders (Commandes/Clients): Company SELLS TO clients → stock DECREASES
 * - Achats (This Page): Company BUYS FROM suppliers → stock INCREASES
 * 
 * When you buy 3 tires from a supplier:
 * 1. Search and find the tire in left panel
 * 2. Add to order with quantity = 3
 * 3. Select supplier and click "Confirmer l'Achat"
 * 4. Backend automatically ADDS 3 to the product stock
 * 
 * This builds company inventory that can later be sold to clients.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Trash2, Printer, Save, X, List, Loader2, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL } from "@/lib/config";
import type { Supplier } from "@/types/supplier";

/** Safe parse: backend sometimes returns HTML (e.g. 500 error) instead of JSON */
async function safeResponseJson(response: Response): Promise<{ data: any; isJson: boolean; errorText?: string }> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json") && text.trim()) {
    try {
      return { data: JSON.parse(text), isJson: true };
    } catch {
      return { data: null, isJson: false, errorText: text.slice(0, 300) || `HTTP ${response.status}` };
    }
  }
  return { data: null, isJson: false, errorText: text.slice(0, 500) || `HTTP ${response.status}` };
}

interface PurchaseItem {
  id: string;
  productId?: number;
  reference: string;
  designation: string;
  priceHT: number;
  discount: number;
  quantity: number;
  totalHT: number;
  dot: string;
  availableDots: string[];
  emplacement: string;
}

interface Product {
  id: number;
  reference: string;
  name: string;
  brand: string | { id: number; name: string; slug: string; description: string; product_count: number };
  category: string | { id: number; name: string; slug: string; description: string; product_count: number };
  price: number;
  stock: number;
  designation: string;
  location?: string;
  emplacement?: string;
  barcode?: string;
  fabrication_date?: string;
}

export default function AchatsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "responsable_achats") {
    router.push("/admin");
    return null;
  }

  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [searchRef, setSearchRef] = useState("");
  const [searchBrand, setSearchBrand] = useState("all");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [selectedDot, setSelectedDot] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showProductEdit, setShowProductEdit] = useState(false);
  const [editProductData, setEditProductData] = useState({
    emplacement: '',
    fabrication_week: '',
    fabrication_year: ''
  });

  // Fetch brands on mount
  useEffect(() => {
    // Temporarily using hardcoded brands until backend endpoint is available
    // TODO: Replace with API call when /products/brands/ endpoint is implemented
    const brandList = [
      "MICHELIN",
      "CONTINENTAL",
      "BRIDGESTONE",
      "GOODYEAR",
      "PIRELLI",
      "DUNLOP",
      "YOKOHAMA",
      "HANKOOK",
    ];
    setBrands(brandList);

    // Fetch suppliers
    const fetchSuppliersData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/suppliers/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const { data, isJson } = await safeResponseJson(response);
          if (isJson) setSuppliers(Array.isArray(data) ? data : data?.results || []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    
    const fetchPurchaseOrders = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/purchase-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { data, isJson, errorText } = await safeResponseJson(response);
        if (response.ok && isJson) {
          setConfirmedOrders(Array.isArray(data) ? data : data?.results || []);
        } else {
          if (!response.ok && errorText) console.error("purchase-orders fetch:", response.status, errorText);
          setConfirmedOrders([]);
        }
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        setConfirmedOrders([]); // Set empty array on error
      }
    };
    
    fetchSuppliersData();
    fetchPurchaseOrders();
  }, []);

  // Fetch existing purchase orders
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/purchase-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const { data: orders, isJson } = await safeResponseJson(response);
        if (response.ok && isJson) {
          setConfirmedOrders(Array.isArray(orders) ? orders : orders?.results || []);
        } else {
          setConfirmedOrders([]);
        }
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        setConfirmedOrders([]); // Set empty array on error
      }
    };
    fetchPurchaseOrders();
  }, []);

  const getBrandName = (brand: string | { id: number; name: string } | any): string => {
    if (typeof brand === 'string') return brand;
    if (brand && typeof brand === 'object' && brand.name) return brand.name;
    return '';
  };

  const getCategoryName = (category: string | { id: number; name: string } | any): string => {
    if (typeof category === 'string') return category;
    if (category && typeof category === 'object' && category.name) return category.name;
    return '';
  };

  const formatFabricationDate = (product: Product): string => {
    // If product has fabrication_date field, format it as week.year (e.g., 05.22)
    if (product.fabrication_date) {
      const date = new Date(product.fabrication_date);
      const week = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
      const year = date.getFullYear();
      return `${String(week).padStart(2, '0')}.${String(year).slice(-2)}`;
    }
    return 'N/A';
  };

  const handleProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleProductEdit = (product: Product) => {
    setSelectedProduct(product);
    
    // Parse existing fabrication_date if it exists
    let week = '';
    let year = '';
    if (product.fabrication_date) {
      const date = new Date(product.fabrication_date);
      const weekNum = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
      week = String(weekNum).padStart(2, '0');
      year = String(date.getFullYear()).slice(-2);
    }
    
    setEditProductData({
      emplacement: product.emplacement || '',
      fabrication_week: week,
      fabrication_year: year
    });
    setShowProductEdit(true);
  };

  const handleSaveProductEdit = async () => {
    if (!selectedProduct) return;

    // Convert week.year format to actual date for backend storage
    let fabrication_date = null;
    if (editProductData.fabrication_week && editProductData.fabrication_year) {
      const week = parseInt(editProductData.fabrication_week);
      const year = parseInt(`20${editProductData.fabrication_year}`); // Convert 22 to 2022
      
      // Calculate the date from week and year
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToAdd = (week - 1) * 7;
      const fabricationDate = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      fabrication_date = fabricationDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    const updateData = {
      emplacement: editProductData.emplacement || null,
      fabrication_date: fabrication_date
    };

    try {
      const token = localStorage.getItem("access_token");
      console.log('🔄 Updating product ID:', selectedProduct.id);
      console.log('📤 Sending update data:', updateData);
      console.log('🔗 API URL:', `${API_URL}/products/${selectedProduct.id}/`);
      
      const response = await fetch(`${API_URL}/products/${selectedProduct.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json();
      console.log('📥 Response data:', responseData);

      if (response.ok) {
        // Update the product in search results with the actual response data
        setSearchResults(searchResults.map(product => 
          product.id === selectedProduct.id 
            ? { ...product, ...responseData }
            : product
        ));
        
        // Also update the selected product
        setSelectedProduct({ ...selectedProduct, ...responseData });
        
        setShowProductEdit(false);
        alert('✅ Produit mis à jour avec succès dans la base de données!');
        
        // Refresh search results to get latest data from database
        if (searchRef || searchBrand !== 'all' || searchCategory !== 'all') {
          handleSearch();
        }
        
      } else {
        console.error('❌ API Error:', responseData);
        alert(`❌ Erreur lors de la mise à jour: ${JSON.stringify(responseData)}`);
      }
    } catch (error :any) {
      console.error('💥 Network error:', error);
      alert(`❌ Erreur de connexion: ${error.message}`);
    }
  };


  /**
   * Normalise tous les formats de dimension pneu vers "LLL/HHrDD"
   * Exemples acceptés (toutes largeurs : 155, 165, 175, 185, 195, 205, 215, 225, 235…) :
   *   "20555R16"   → "205/55R16"   (compact, sans séparateur)
   *   "21560r15"   → "215/60R15"   (minuscule r)
   *   "225 45 R17" → "225/45R17"   (espaces)
   *   "235-40-R18" → "235/40R18"   (tirets)
   *   "205/55R16"  → "205/55R16"   (déjà correct)
   *   "205"        → "205"         (largeur seule)
   *   "Michelin"   → "Michelin"    (marque)
   *   "REF123"     → "REF123"      (référence)
   */
  const normalizeSizeInput = (input: string): string => {
    const s = input.trim();
    // Regex générique : 3 chiffres + séparateur optionnel + 2 chiffres + séparateur optionnel + R/r + 2 chiffres
    const m = s.match(/^(\d{3})[\s\/\-]?(\d{2})[\s\/\-]?[Rr][\s]?(\d{2})$/);
    if (m) return `${m[1]}/${m[2]}R${m[3]}`;
    return s;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      const normalizedQuery = normalizeSizeInput(searchRef);
      if (normalizedQuery) params.append("search", normalizedQuery);
      if (searchBrand && searchBrand !== "all") params.append("brand", searchBrand);
      if (searchCategory && searchCategory !== "all") params.append("category", searchCategory);
      // FIFO : ordonner par date de fabrication croissante (le plus ancien en premier)
      params.append("ordering", "fabrication_date");

      const response = await fetch(
        `${API_URL}/products/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { data, isJson } = await safeResponseJson(response);
      if (response.ok && isJson) {
        // FIFO: sort by fabrication_date ascending so the oldest DOT appears first
        const results: Product[] = data?.results || [];
        results.sort((a, b) => {
          if (!a.fabrication_date) return 1;   // no date → goes to end
          if (!b.fabrication_date) return -1;
          return new Date(a.fabrication_date).getTime() - new Date(b.fabrication_date).getTime();
        });
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const computeDot = (fabrication_date: string | undefined): string => {
    if (!fabrication_date) return '';
    const date = new Date(fabrication_date);
    const week = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
    const year = date.getFullYear();
    return `${String(week).padStart(2, '0')}.${String(year).slice(-2)}`;
  };

  const addItem = (product: Product) => {
    const price = Number(product.price) || 0;
    const dot = computeDot(product.fabrication_date);

    // Collect all unique DOTs from search results that share the same reference/name (same model, different batches)
    const seen = new Set<string>();
    const availableDots: string[] = [];
    for (const p of searchResults) {
      const sameName = (p.name || p.designation) === (product.name || product.designation);
      const sameRef = p.reference && product.reference && p.reference === product.reference;
      if (sameName || sameRef) {
        const d = computeDot(p.fabrication_date);
        if (d && !seen.has(d)) {
          seen.add(d);
          availableDots.push(d);
        }
      }
    }
    // Ensure current product's own DOT is always included
    if (dot && !seen.has(dot)) availableDots.unshift(dot);

    // FIFO: sort availableDots oldest first (lowest year*100+week)
    availableDots.sort((a, b) => parseDot(a) - parseDot(b));

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productId: product.id,
      reference: product.reference || product.id.toString(),
      designation: product.name || product.designation,
      priceHT: price,
      discount: 0,
      quantity: 1,
      totalHT: price,
      dot,
      availableDots,
      emplacement: product.emplacement || product.location || '',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "priceHT" || field === "discount") {
            const priceHT = Number(updated.priceHT) || 0;
            const quantity = Number(updated.quantity) || 0;
            const discount = Number(updated.discount) || 0;
            const baseTotal = priceHT * quantity;
            updated.totalHT = baseTotal - (baseTotal * discount) / 100;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalHT || 0), 0);
    const discount = (subtotal * Number(globalDiscount)) / 100;
    return subtotal - discount;
  };

  /** Parse "WW.YY" → numeric sort key. Lower = older = minimum. */
  const parseDot = (dot: string): number => {
    const parts = dot.trim().split('.');
    if (parts.length !== 2) return Infinity;
    const week = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(week) || isNaN(year)) return Infinity;
    return year * 100 + week;
  };

  const getMinDot = (): string => {
    const valid = items.filter((i) => i.dot && i.dot.trim());
    if (valid.length === 0) return '';
    return valid.reduce((min, i) => (parseDot(i.dot) < parseDot(min.dot) ? i : min)).dot;
  };

  // Auto-select the minimum DOT whenever items change
  useEffect(() => {
    const min = getMinDot();
    if (min) setSelectedDot(min);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleSave = async () => {
    const now = new Date();
    const total = calculateTotal();
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Round to 2 decimal places for backend
    const totalRounded = Math.round(total * 100) / 100;
    
    const orderData = {
      supplier: parseInt(supplier),
      date_commande: formatDate(now),
      total_ht: totalRounded,
      total_ttc: totalRounded,
      articles: items.map((item) => ({
        ...(item.productId != null && { id: item.productId }),
        nom: item.designation,
        quantite: Number(item.quantity),
        prix_unitaire: Number(item.priceHT),
        reference: item.reference,
        discount: Number(item.discount),
        total_ht: Number(item.totalHT),
        dot: item.dot || '',
        emplacement: item.emplacement || '',
      })),
      invoice_number: invoiceNumber,
      dot: selectedDot,
    };

    try {
      const token = localStorage.getItem("access_token");
      
      console.log("📤 Sending order data:", orderData);
      console.log("🔑 Using token:", token ? "Token present" : "NO TOKEN!");
      
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      
      console.log("📥 Response status:", response.status);
      
      const { data: body, isJson, errorText } = await safeResponseJson(response);
      
      if (response.ok) {
        if (!isJson) {
          alert("❌ Réponse serveur invalide (non-JSON). Vérifiez les logs backend. " + (errorText || ""));
          return;
        }
        const savedOrder = body;
        console.log("✅ Order saved successfully:", savedOrder);
        
        const currentOrders = Array.isArray(confirmedOrders) ? confirmedOrders : [];
        setConfirmedOrders([...currentOrders, savedOrder]);
        
        setItems([]);
        setSupplier("");
        setNote("");
        setInvoiceNumber("");
        setSelectedWeek("");
        setSelectedDot("");
        setGlobalDiscount(0);
        
        alert("produit ajouté avec succès!");
      } else {
        const msg = isJson ? JSON.stringify(body) : (errorText || `HTTP ${response.status}`);
        console.error("❌ Error response:", msg);
        alert("❌ Erreur lors de l'enregistrement: " + msg);
      }
    } catch (error) {
      console.error("💥 Error saving purchase order:", error);
      alert("❌ Erreur de connexion: " + String(error));
    }
  };

  const handleClear = () => {
    setItems([]);
    setSupplier("");
    setNote("");
    setInvoiceNumber("");
    setSelectedWeek("");
    setSelectedDot("");
    setGlobalDiscount(0);
  };

  const refreshOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const { data: orders, isJson } = await safeResponseJson(response);
      if (response.ok && isJson) {
        setConfirmedOrders(Array.isArray(orders) ? orders : orders?.results || []);
      }
    } catch (error) {
      console.error("Error refreshing purchase orders:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Achat</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Product Search */}
        <Card>
          <CardHeader>
            <CardTitle>Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
                    <Label>Réf.</Label>
                    <Input
                      placeholder="Ex : 215 · 22545R17 · 215/55R16 · Michelin · REF123"
                      value={searchRef}
                      onChange={(e) => setSearchRef(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1"
                    />
                </div>

                  <Button className="mt-3 w-full" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Rechercher
                  </Button>

                {/* Search Results */}
                <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto"> 
                  {isSearching ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      Aucun produit trouvé. Utilisez la recherche pour afficher les résultats.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((product) => (
                        <div key={product.id} className="border-b pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {product.reference || product.id}
                                </span>
                                <span className="font-bold text-yellow-600">
                                  {getBrandName(product.brand)}
                                </span>
                              </div>
                              <div className="text-lg font-semibold">
                                {product.name}
                              </div>
                              <div className="text-sm text-black">
                                {product.designation || product.name}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div>
                                  <span className="text-yellow-600 font-bold">MARQUE :</span>{" "}
                                  <span className="text-yellow-600">{getBrandName(product.brand)}</span>
                                </div>
                                <div>
                                  <span className="font-bold">CATÉGORIE :</span> {getCategoryName(product.category)}
                                </div>
                                {product.location && (
                                  <div>
                                    <span className="font-bold">LIEU :</span>{" "}
                                    <span className="text-yellow-600">{product.location}</span>
                                  </div>
                                )}
                                {product.barcode && (
                                  <div>
                                    <span className="font-bold">CODE BARRE :</span> {product.barcode}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                {Number(product.price).toFixed(3)} <span className="text-sm">DT</span>
                              </div>
                              <div className={product.stock > 0 ? "text-yellow-600" : "text-black"}>
                                {product.stock} Pièce{product.stock > 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProductDetail(product)}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Détail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProductEdit(product)}
                              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addItem(product)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>           
          </CardContent>
        </Card>

        {/* Right Panel - Purchase Order */}
        <Card>
          <CardHeader>
            <CardTitle>Bon de livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supplier */}
            <div>
              <Label className="mb-2">
                <Plus className="inline h-3 w-3 mr-1" />
                Fournisseur
              </Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id.toString()}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Articles Table */}
            <div>
              <Label className="mb-2 block">Articles</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Désignation</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Remise</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-center">DOT</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Aucun article ajouté
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{item.designation}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.001"
                              value={item.priceHT}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "priceHT",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "discount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 text-right"
                            />
                          </TableCell>
                          {/* DOT = Semaine . Année — saisie par article */}
                          <TableCell className="text-center">
                            {(() => {
                              const parts = (item.dot || "").split(".");
                              const dotW = parts[0] || "";
                              const dotY = parts[1] || "";
                              const setDotPart = (w: string, y: string) =>
                                updateItem(item.id, "dot", w && y ? `${w.padStart(2,"0")}.${y}` : w || y || "");
                              return (
                                <div className="flex items-center gap-1 justify-center">
                                  <input
                                    type="number"
                                    min={1} max={52}
                                    value={dotW}
                                    onChange={(e) => setDotPart(e.target.value, dotY)}
                                    placeholder="Sem"
                                    className="w-12 text-center text-xs border border-input rounded px-1 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                  <span className="text-gray-400 text-xs">.</span>
                                  <input
                                    type="number"
                                    min={2000} max={2099}
                                    value={dotY ? (dotY.length <= 2 ? `20${dotY}` : dotY) : ""}
                                    onChange={(e) => {
                                      const y = String(e.target.value).slice(-2);
                                      setDotPart(dotW, y);
                                    }}
                                    placeholder="An"
                                    className="w-16 text-center text-xs border border-input rounded px-1 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={item.emplacement}
                              onChange={(e) =>
                                updateItem(item.id, "emplacement", e.target.value)
                              }
                              placeholder="Emplacement"
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-4">
              <div className="flex-1"></div>
              <div className="text-right">
                <Label> Total Achat HT</Label>
                <div className="text-2xl font-bold text-black">
                  {calculateTotal().toFixed(3)} DT
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <Label>Date Achat</Label>
              <Input
                type="date"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                className="bg-black  text-white flex-1"
                disabled={items.length === 0 || !supplier}
              >
                <Save className="h-4 w-4 mr-2" />
                Confirmer l'Achat
              </Button>
              <Button 
                variant="outline" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex-1"
                onClick={handleClear}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 -mt-6 -mx-6 px-6 rounded-t-lg">
              DF: {selectedProduct?.reference || selectedProduct?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 p-4">
              {/* Price */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-bold text-gray-700">DF</span>
                <span className="text-2xl font-bold text-gray-900">
                  {Number(selectedProduct.price).toFixed(3)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-bold text-gray-700">Emplacement</span>
                <span className="text-gray-900 text-right">
                  {selectedProduct.emplacement || selectedProduct.location || 'N/A'}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-bold text-gray-700">Qte</span>
                <span className={`text-xl font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProduct.stock}
                </span>
              </div>

              {/* Fabrication Date (Week/Year) */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-bold text-gray-700">Fabrication</span>
                <span className="text-gray-900">
                  {formatFabricationDate(selectedProduct)}
                </span>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm">
                  <span className="font-bold">Marque: </span>
                  <span className="text-yellow-600">{getBrandName(selectedProduct.brand)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">Catégorie: </span>
                  <span>{getCategoryName(selectedProduct.category)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">Désignation: </span>
                  <span>{selectedProduct.designation || selectedProduct.name}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowProductDetail(false)}
                className="w-full mt-4"
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Edit Modal */}
      <Dialog open={showProductEdit} onOpenChange={setShowProductEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 -mt-6 -mx-6 px-6 rounded-t-lg">
              Modifier Produit: {selectedProduct?.reference || selectedProduct?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 p-4">
              {/* Product Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-bold text-gray-800">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">{getBrandName(selectedProduct.brand)} - {selectedProduct.designation}</p>
              </div>

              {/* Emplacement */}
              <div>
                <Label htmlFor="emplacement" className="font-bold text-gray-700">
                  Emplacement
                </Label>
                <Input
                  id="emplacement"
                  value={editProductData.emplacement}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, emplacement: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Fabrication Date */}
              <div>
                <Label className="font-bold text-gray-700">
                  Date de Fabrication (Semaine.Année)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editProductData.fabrication_week}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 52)) {
                        setEditProductData(prev => ({ ...prev, fabrication_week: value }));
                      }
                    }}
                    className="flex-1 text-center"
                    maxLength={2}
                  />
                  <span className="flex items-center text-gray-500">.</span>
                  <Input
                    value={editProductData.fabrication_year}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                      setEditProductData(prev => ({ ...prev, fabrication_year: value }));
                    }}
                    className="flex-1 text-center"
                    maxLength={2}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: Semaine (01-52) . Année (22 pour 2022)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveProductEdit}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowProductEdit(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
