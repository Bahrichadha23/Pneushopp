// Page de gestion des produits
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductsTable from "@/components/admin/products-table";
import ProductForm from "@/components/admin/product-form";
import { Plus, Download, Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { adminService } from "@/lib/services/admin";
import type { AdminProduct } from "@/lib/services/admin";
import type { Product } from "@/types/product";
import { productToCreateData } from "@/lib/utils/product-mapper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";

// Fonction pour convertir AdminProduct vers Product pour l'affichage
const adminProductToProduct = (adminProduct: AdminProduct): Product => {
  // Mapper les saisons
  const seasonMap = {
    summer: "ete",
    winter: "hiver",
    all_season: "toutes-saisons",
  } as const;

  // Use designation as the full display name (designation = full product name from import)
  const displayName = adminProduct.designation || adminProduct.name || "";

  // L'API admin (AdminProductSerializer, fields = '__all__') ne sérialise pas
  // les @property "is_on_sale"/"discount_percentage" du modèle (ce ne sont pas
  // de vraies colonnes BDD) — elle renvoie en revanche bien old_price et price.
  // On recalcule donc nous-mêmes le statut de promotion à partir de ces deux
  // valeurs réelles, pour que la case "En promotion" reflète fidèlement l'état
  // enregistré en base (sinon elle réapparaît décochée à chaque réouverture).
  const oldPriceNum = adminProduct.old_price
    ? parseFloat(adminProduct.old_price.toString())
    : undefined;
  const currentPriceNum = parseFloat(adminProduct.price.toString());
  const computedIsOnSale = !!(oldPriceNum && oldPriceNum > currentPriceNum);
  const computedDiscount = computedIsOnSale && oldPriceNum
    ? Math.round((1 - currentPriceNum / oldPriceNum) * 100)
    : 0;

  return {
    id: adminProduct.id.toString(),
    slug: adminProduct.slug || displayName.toLowerCase().replace(/\s+/g, "-"),
    name: displayName,
    brand: adminProduct.brand,
    model: adminProduct.size || "",
    price: parseFloat(adminProduct.price.toString()),
    old_price: adminProduct.old_price
      ? parseFloat(adminProduct.old_price.toString())
      : undefined,
    discount_percentage: computedDiscount,
    image: adminProduct.image || "/placeholder.jpg",
    images: [],
    category: adminProduct.category || ("" as any),
    specifications: {
      width: 0,
      height: 0,
      diameter: 0,
      loadIndex: 0,
      speedRating: "",
      season: seasonMap[adminProduct.season] as any,
      specialty: "tourisme" as any,
    },
    stock: adminProduct.stock,
    description: adminProduct.description || "",
    features: [],
    inStock: adminProduct.stock > 0,
    is_on_sale: computedIsOnSale || adminProduct.is_featured,
    rating: undefined,
    reviewCount: 0,
    // Pass through all extra fields
    reference: adminProduct.reference,
    designation: adminProduct.designation,
    type: adminProduct.type,
    emplacement: adminProduct.emplacement,
    fabrication_date: adminProduct.fabrication_date,
  } as any;
};


export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin
  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Version convertie pour l'affichage
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 20,
  });

  // Charger les produits depuis l'API
  const loadProducts = async (page = 1) => {
    try {
      setIsPageLoading(true);
      setError("");

      const response = await adminService.getProducts({
        page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        setAdminProducts(response.data.results);
        // Convertir pour l'affichage
        const convertedProducts = response.data.results.map(
          adminProductToProduct
        );
        setProducts(convertedProducts);
        setPagination((prev) => ({
          ...prev,
          page,
          total: response.data?.count || 0,
        }));
      } else {
        setError(response.error || "Erreur lors du chargement des produits");
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des produits:", error);
      setError("Erreur de connexion au serveur");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleViewProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setViewingProduct(product);
      setIsViewDialogOpen(true);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }

    try {
      const response = await adminService.deleteProduct(parseInt(productId));

      if (response.success) {
        // Recharger la liste des produits
        await loadProducts(pagination.page);
      } else {
        setError(response.error || "Erreur lors de la suppression");
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression du produit");
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await adminService.updateProduct(parseInt(productId), {
        stock: newStock,
      });

      if (response.success && response.data) {
        // Mettre à jour localement
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, stock: newStock, inStock: newStock > 0 }
              : p
          )
        );
      } else {
        setError(response.error || "Erreur lors de la mise à jour du stock");
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du stock:", error);
      setError("Erreur lors de la mise à jour du stock");
    }
  };

  // Applique ou retire la promotion sur un produit fraîchement créé/modifié,
  // en fonction de la case « En promotion » du formulaire (relié au backend
  // via l'endpoint /products/set-promotion/, qui calcule old_price/price).
  const applyPromotionFromForm = async (
    productId: number,
    productData: Partial<Product>,
    wasOnSale: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const raw = productData as any;
    const wantsPromotion = !!raw.in_promotion;
    const discount = Number(raw.promotion_discount) || 0;

    try {
      if (wantsPromotion && discount > 0) {
        const res = await adminService.setProductPromotion({
          product_ids: [productId],
          discount_percentage: discount,
          promotion_label: "PROMO",
          remove: false,
        });
        if (!res.success) {
          return { success: false, error: res.error || "Échec de l'application de la promotion" };
        }
      } else if (!wantsPromotion && wasOnSale) {
        const res = await adminService.setProductPromotion({
          product_ids: [productId],
          discount_percentage: 0,
          remove: true,
        });
        if (!res.success) {
          return { success: false, error: res.error || "Échec du retrait de la promotion" };
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error("Erreur lors de l'application de la promotion:", err);
      return { success: false, error: err?.message || "Erreur lors de l'application de la promotion" };
    }
  };

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    setIsLoading(true);

    try {
      if (editingProduct) {
        // ── UPDATE: send only changed fields via PATCH ──────────────────────
        const raw = productData as any;
        const patchData: Record<string, any> = {
          name: raw.designation || productData.name || "",
          designation: raw.designation || productData.name || "",
          price: productData.price,
          stock: productData.stock ?? 0,
          is_active: true,
        };
        if (productData.brand) patchData.brand = productData.brand;
        if (productData.description) patchData.description = productData.description;
        if (productData.model) patchData.size = productData.model;
        if (raw.reference !== undefined) patchData.reference = raw.reference;
        if (raw.emplacement !== undefined) patchData.emplacement = raw.emplacement;
        if (raw.type !== undefined) patchData.type = raw.type;
        if (raw.purchase_price) patchData.purchase_price = raw.purchase_price;

        const response = await adminService.updateProduct(
          parseInt(editingProduct.id),
          patchData
        );

        if (response.success) {
          const promoResult = await applyPromotionFromForm(
            parseInt(editingProduct.id),
            productData,
            !!editingProduct.is_on_sale
          );
          await loadProducts(pagination.page);
          setIsFormOpen(false);
          setEditingProduct(undefined);
          // Signal the stock management page to refresh (handles cross-tab updates)
          localStorage.setItem("stock_updated_at", Date.now().toString());
          if (!promoResult.success) {
            setError(`Produit mis à jour, mais la promotion n'a pas pu être appliquée : ${promoResult.error}`);
            return { success: true, error: promoResult.error };
          }
          return { success: true };
        } else {
          setError(response.error || "Erreur lors de la mise à jour");
          return { success: false, error: response.error };
        }
      } else {
        // ── CREATE ──────────────────────────────────────────────────────────
        const createData = productToCreateData(
          { ...productData, slug: undefined },
          false
        );

        const response = await adminService.createProduct(createData);

        if (response.success) {
          let promoResult: { success: boolean; error?: string } = { success: true };
          if (response.data?.id) {
            promoResult = await applyPromotionFromForm(response.data.id, productData, false);
          }
          await loadProducts(pagination.page);
          setIsFormOpen(false);
          setEditingProduct(undefined);
          if (!promoResult.success) {
            setError(`Produit créé, mais la promotion n'a pas pu être appliquée : ${promoResult.error}`);
            return { success: true, error: promoResult.error };
          }
          return { success: true };
        } else {
          setError(response.error || "Erreur lors de la création");
          return { success: false, error: response.error };
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      const errorMessage = "Erreur lors de la sauvegarde";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportProducts = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Catalogue Produits");

    ws.columns = [
      { header: "Référence", key: "reference", width: 20 },
      { header: "Désignation", key: "name", width: 35 },
      { header: "Marque", key: "brand", width: 18 },
      { header: "Taille", key: "size", width: 15 },
      { header: "Catégorie", key: "category", width: 18 },
      { header: "Saison", key: "season", width: 14 },
      { header: "Prix TTC (DT)", key: "price", width: 14 },
      { header: "Ancien Prix (DT)", key: "old_price", width: 16 },
      { header: "Stock", key: "stock", width: 10 },
      { header: "Actif", key: "is_active", width: 8 },
      { header: "Description", key: "description", width: 40 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

    const seasonLabels: Record<string, string> = { summer: "Été", winter: "Hiver", all_season: "4 Saisons" };

    adminProducts.forEach((p) => {
      ws.addRow({
        reference: p.reference || "",
        name: p.name || "",
        brand: p.brand || "",
        size: p.size || "",
        category: p.category_name || p.category || "",
        season: seasonLabels[p.season] || p.season || "",
        price: Number(p.price || 0),
        old_price: p.old_price ? Number(p.old_price) : "",
        stock: p.stock || 0,
        is_active: p.is_active ? "Oui" : "Non",
        description: p.description || "",
      });
    });

    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Catalogue_Produits_${date}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestion des produits
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Gérez votre catalogue de pneumatiques
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportProducts}
            className="w-full sm:w-auto bg-[#0066CC] hover:bg-[#004C99] text-white border-0"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter l'historique (Excel)
          </Button>
        </div>
      </div>

      {/* Products Table with scroll for mobile */}
      <div className="overflow-x-auto">
        <ProductsTable
          products={products}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateStock={handleUpdateStock}
        />
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center gap-2 mt-6 text-sm sm:text-base">
        <Button
          disabled={pagination.page === 1}
          onClick={() => loadProducts(pagination.page - 1)}
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 disabled:opacity-40"
        >
          Précédent
        </Button>

        <span className="text-gray-700 self-center">
          Page {pagination.page} /{" "}
          {Math.ceil(pagination.total / pagination.limit)}
        </span>

        <Button
          disabled={
            pagination.page >= Math.ceil(pagination.total / pagination.limit)
          }
          onClick={() => loadProducts(pagination.page + 1)}
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 disabled:opacity-40"
        >
          Suivant
        </Button>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Fiche article" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmitProduct}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Product View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du produit</DialogTitle>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              {/* Product Image */}
              {viewingProduct.image && (
                <div className="flex justify-center">
                  <img
                    src={viewingProduct.image}
                    alt={viewingProduct.name}
                    className="max-h-48 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Informations de base
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Nom:</span>
                      <p className="text-gray-900">{viewingProduct.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Marque:</span>
                      <p className="text-gray-900">{viewingProduct.brand}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Modèle:</span>
                      <p className="text-gray-900">{viewingProduct.model}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Catégorie:
                      </span>
                      <p className="text-gray-900">{viewingProduct.category}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Tarification
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Prix:</span>
                      <p className="text-gray-900 text-lg font-bold">
                        {viewingProduct.price.toFixed(3)} DT
                      </p>
                    </div>
                    {viewingProduct.old_price && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Ancien prix:
                        </span>
                        <p className="text-gray-500 line-through">
                          {viewingProduct.old_price.toFixed(3)} DT
                        </p>
                      </div>
                    )}
                    {viewingProduct.discount_percentage && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Réduction:
                        </span>
                        <p className="text-yellow-600 font-semibold">
                          -{viewingProduct.discount_percentage}%
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">
                        En promotion:
                      </span>
                      <p className="text-gray-900">
                        {viewingProduct.is_on_sale ? "Oui" : "Non"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Spécifications techniques
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {viewingProduct.specifications?.width && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-600">
                        Largeur:
                      </span>
                      <p className="text-gray-900 font-semibold">
                        {viewingProduct.specifications.width} mm
                      </p>
                    </div>
                  )}
                  {viewingProduct.specifications?.height && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-600">
                        Hauteur:
                      </span>
                      <p className="text-gray-900 font-semibold">
                        {viewingProduct.specifications.height}
                      </p>
                    </div>
                  )}
                  {viewingProduct.specifications?.diameter && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-600">
                        Diamètre:
                      </span>
                      <p className="text-gray-900 font-semibold">
                        {viewingProduct.specifications.diameter}"
                      </p>
                    </div>
                  )}
                  {viewingProduct.specifications?.loadIndex &&
                    viewingProduct.specifications.loadIndex > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-medium text-gray-600">
                          Indice de charge:
                        </span>
                        <p className="text-gray-900 font-semibold">
                          {viewingProduct.specifications.loadIndex}
                        </p>
                      </div>
                    )}
                  {viewingProduct.specifications?.speedRating && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-600">
                        Indice de vitesse:
                      </span>
                      <p className="text-gray-900 font-semibold">
                        {viewingProduct.specifications.speedRating}
                      </p>
                    </div>
                  )}
                  {viewingProduct.specifications?.season && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-600">Saison:</span>
                      <p className="text-gray-900 font-semibold">
                        {viewingProduct.specifications.season}
                      </p>
                    </div>
                  )}
                </div>
                {viewingProduct.model && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600">
                      Format complet:
                    </span>
                    <p className="text-gray-900 text-lg font-mono bg-gray-50 p-2 rounded mt-1">
                      {viewingProduct.model}
                    </p>
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Stock</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">
                      Quantité en stock:
                    </span>
                    <Badge
                      variant={
                        viewingProduct.stock > 10
                          ? "default"
                          : viewingProduct.stock > 0
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {viewingProduct.stock} unité(s)
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Statut:</span>
                    <p
                      className={`font-semibold ${
                        viewingProduct.stock > 0
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {viewingProduct.stock > 0
                        ? "En stock"
                        : "Rupture de stock"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => setIsViewDialogOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
