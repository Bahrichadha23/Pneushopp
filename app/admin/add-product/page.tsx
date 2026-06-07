"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/admin/product-form";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminService } from "@/lib/services/admin";
import { productToCreateData } from "@/lib/utils/product-mapper";

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if not authorized
  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin");
    return null;
  }

  // Applique (ou retire) la promotion sur le produit fraîchement créé,
  // selon la case « En promotion » du formulaire — relié au vrai mécanisme
  // backend via /products/set-promotion/ (qui calcule old_price/price).
  const applyPromotionFromForm = async (
    productId: number,
    productData: Partial<Product>
  ) => {
    const raw = productData as any;
    const wantsPromotion = !!raw.in_promotion;
    const discount = Number(raw.promotion_discount) || 0;
    if (!wantsPromotion || discount <= 0) return;

    try {
      await adminService.setProductPromotion({
        product_ids: [productId],
        discount_percentage: discount,
        promotion_label: "PROMO",
        remove: false,
      });
    } catch (err) {
      console.error("Erreur lors de l'application de la promotion:", err);
    }
  };

  const handleSubmit = async (productData: Partial<Product>) => {
    setIsLoading(true);
    setError("");

    try {
      const createData = productToCreateData(
        { ...productData, slug: undefined },
        false
      );

      const response = await adminService.createProduct(createData);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erreur lors de la création du produit");
      }

      await applyPromotionFromForm(response.data.id, productData);

      // Succès — affiche le message et redirige
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/produits");
      }, 1500);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du produit";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/produits");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin/produits" className="text-blue-600 hover:underline">
          Produits
        </Link>
        <span>›</span>
        <span className="text-gray-700">Ajouter un produit</span>
      </nav>

      {/* En-tête */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Ajouter un produit
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Remplissez les informations ci-dessous pour créer un nouveau produit.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <AlertDescription className="text-emerald-800">
            Produit créé avec succès ! Redirection en cours...
          </AlertDescription>
        </Alert>
      )}

      <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
    </div>
  );
}
