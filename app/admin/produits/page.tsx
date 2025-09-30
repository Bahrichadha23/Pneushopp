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
import { Plus, Download, Upload, Loader2, AlertCircle } from "lucide-react";
import { adminService } from "@/lib/services/admin";
import type { AdminProduct, ProductCreateData } from "@/lib/services/admin";
import type { Product } from "@/types/product";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fonction pour convertir AdminProduct vers Product pour l'affichage
const adminProductToProduct = (adminProduct: AdminProduct): Product => {
  // Mapper les saisons
  const seasonMap = {
    summer: "ete",
    winter: "hiver",
    all_season: "toutes-saisons",
  } as const;

  return {
    id: adminProduct.id.toString(),
    name: adminProduct.name,
    brand: adminProduct.brand,
    model: adminProduct.size || "", // Utiliser size comme model temporairement
    price: parseFloat(adminProduct.price.toString()),
    old_price: adminProduct.old_price
      ? parseFloat(adminProduct.old_price.toString())
      : undefined,
    discount_percentage: adminProduct.discount_percentage,
    image: adminProduct.image || "/placeholder.jpg",
    images: [adminProduct.image || "/placeholder.jpg"],
    category: "auto" as any, // Valeur par défaut
    specifications: {
      width: 225, // Valeurs par défaut car non disponibles dans AdminProduct
      height: 45,
      diameter: 17,
      loadIndex: 91,
      speedRating: "W",
      season: seasonMap[adminProduct.season] as any,
      specialty: "tourisme" as any,
    },
    stock: adminProduct.stock,
    description: adminProduct.description,
    features: [], // Non disponible dans AdminProduct
    inStock: adminProduct.stock > 0,
    is_on_sale: adminProduct.is_featured,
    rating: undefined, // Non disponible dans AdminProduct
    reviewCount: 0,
  };
};

// Fonction pour convertir Product vers ProductCreateData pour l'API
const productToCreateData = (product: Partial<Product>): ProductCreateData => {
  // Mapper les saisons vers l'API
  const seasonMap = {
    ete: "summer",
    hiver: "winter",
    "toutes-saisons": "all_season",
  } as const;

  // Générer un slug unique à partir du brand, name et model (max 50 caractères)
  const generateSlug = (brand: string, name: string, model: string) => {
    // Nettoyer et normaliser les chaînes
    const cleanString = (str: string) =>
      str
        .toLowerCase()
        .replace(/[àáâãäå]/g, "a")
        .replace(/[èéêë]/g, "e")
        .replace(/[ìíîï]/g, "i")
        .replace(/[òóôõö]/g, "o")
        .replace(/[ùúûü]/g, "u")
        .replace(/[ýÿ]/g, "y")
        .replace(/[ñ]/g, "n")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9\s-]/g, "") // Supprimer les caractères spéciaux
        .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
        .replace(/-+/g, "-") // Remplacer les tirets multiples par un seul
        .replace(/^-|-$/g, ""); // Supprimer les tirets en début et fin

    const cleanBrand = cleanString(brand);
    const cleanName = cleanString(name);
    const cleanModel = cleanString(model);

    // Stratégie intelligente pour rester sous 50 caractères
    let slug = "";

    // Essayer brand-name-model
    if (cleanBrand && cleanName && cleanModel) {
      slug = `${cleanBrand}-${cleanName}-${cleanModel}`;
    }
    // Si trop long, essayer brand-name
    else if (cleanBrand && cleanName) {
      slug = `${cleanBrand}-${cleanName}`;
    }
    // Sinon juste le nom
    else {
      slug = cleanName || cleanBrand || "produit";
    }

    // Si encore trop long, tronquer intelligemment
    if (slug.length > 50) {
      // Essayer brand-name seulement
      if (cleanBrand && cleanName) {
        slug = `${cleanBrand}-${cleanName}`;
      }

      // Si encore trop long, tronquer à 50 caractères en gardant les mots entiers
      if (slug.length > 50) {
        const words = slug.split("-");
        slug = "";
        for (const word of words) {
          if ((slug + "-" + word).length <= 50) {
            slug = slug ? slug + "-" + word : word;
          } else {
            break;
          }
        }
      }
    }

    // Garantir que le slug n'est jamais vide et fait maximum 50 caractères
    return slug.slice(0, 50).replace(/-$/, "") || "produit";
  };

  // Mapper les catégories frontend vers les IDs Django
  const categoryMap = {
    auto: 1, // Pneus Voiture
    suv: 1, // Pneus Voiture
    camionnette: 2, // Pneus Camionnette
    utilitaire: 2, // Pneus Camionnette
    "poids-lourd": 3, // Pneus Camion
    agricole: 4, // Pneus Agricole
    "4x4": 1, // Pneus Voiture
  } as const;

  return {
    name: product.name || "",
    slug: generateSlug(
      product.brand || "",
      product.name || "",
      product.model || ""
    ),
    description: product.description || "",
    price: product.price || 0,
    old_price: product.old_price,
    category: categoryMap[product.category as keyof typeof categoryMap] || 1,
    brand: product.brand || "",
    size: product.model || "", // Utiliser model comme size
    season:
      seasonMap[product.specifications?.season as keyof typeof seasonMap] ||
      "all_season",
    stock: product.stock || 0,
    is_featured: product.is_on_sale || false,
    is_active: true,
  };
};

export default function ProductsPage() {
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Version convertie pour l'affichage
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
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
    console.log("Voir produit:", productId);
    // Redirection vers la page de détail du produit
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

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    setIsLoading(true);

    try {
      const createData = productToCreateData(productData);

      if (editingProduct) {
        // Mise à jour
        const response = await adminService.updateProduct(
          parseInt(editingProduct.id),
          createData
        );

        if (response.success) {
          await loadProducts(pagination.page); // Recharger la liste
          setIsFormOpen(false);
          setEditingProduct(undefined);
          return { success: true };
        } else {
          setError(response.error || "Erreur lors de la mise à jour");
          return { success: false, error: response.error };
        }
      } else {
        // Création
        const response = await adminService.createProduct(createData);

        if (response.success) {
          await loadProducts(pagination.page); // Recharger la liste
          setIsFormOpen(false);
          setEditingProduct(undefined);
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

  const handleExportProducts = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `produits-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportProducts = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedProducts = JSON.parse(e.target?.result as string);
            setProducts((prev) => [...prev, ...importedProducts]);
          } catch (error) {
            alert("Erreur lors de l'import du fichier");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
            variant="outline"
            onClick={handleExportProducts}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          {/* You can add Import button here too if needed */}
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
          variant="outline"
          disabled={pagination.page === 1}
          onClick={() => loadProducts(pagination.page - 1)}
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
          onClick={() => loadProducts(pagination.page + 1)}
          className="w-full sm:w-auto"
        >
          Next
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
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
    </div>
  );
}
