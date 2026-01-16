"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductForm from "@/components/admin/product-form";
import { Product } from "@/types/product";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleSubmit = async (productData: Partial<Product>) => {
    setIsLoading(true);
    setError("");

    try {
      // Create FormData to send files and data to backend
      // Backend will: 1) Upload images to Cloudinary 2) Save Cloudinary URLs to Django DB
      const formData = new FormData();

      // Add basic fields
      formData.append("name", productData.name || "");
      formData.append("brand", productData.brand || "");
      formData.append("model", productData.model || "");
      formData.append("price", String(productData.price || 0));
      formData.append("old_price", String(productData.old_price || 0));
      formData.append("category", productData.category || "");
      formData.append("stock", String(productData.stock || 0));
      formData.append("description", productData.description || "");
      formData.append("inStock", String(productData.inStock || true));
      formData.append("isPromotion", String(productData.isPromotion || false));

      // Add new manual fields
      if (productData.reference)
        formData.append("reference", productData.reference);
      if (productData.designation)
        formData.append("designation", productData.designation);
      if (productData.type) formData.append("type", productData.type);
      if (productData.emplacement)
        formData.append("emplacement", productData.emplacement);
      if (productData.fabrication_date)
        formData.append("fabrication_date", productData.fabrication_date);

      // Add specifications
      if (productData.specifications) {
        formData.append(
          "specifications",
          JSON.stringify(productData.specifications)
        );
      }

      // Add features
      if (productData.features && productData.features.length > 0) {
        formData.append("features", JSON.stringify(productData.features));
      }

      // Add images - send each image file
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach((image) => {
          if (image instanceof File) {
            // Append each image with the name 'images' (multiple files with same key)
            formData.append("images", image);
          }
        });
      }

      const response = await fetch(`${API_URL}/admin/products/manual/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (errorData.error?.includes("duplicate key")) {
          throw new Error(
            "Un produit avec ce nom existe déjà. Veuillez utiliser un nom différent."
          );
        }

        if (errorData.error?.includes("slug")) {
          throw new Error(
            "Ce nom de produit est déjà utilisé. Veuillez en choisir un autre."
          );
        }

        throw new Error(
          errorData.message ||
            errorData.error ||
            "Erreur lors de la création du produit"
        );
      }

      // Success - show message and redirect
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
    <div className="container mx-auto p-2 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ajouter un Article</h1>
        <p className="text-muted-foreground mt-2">
          Remplissez les informations pour ajouter un nouvel article au
          catalogue
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
      {success && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            ✅ Produit créé avec succès! Redirection en cours...
          </AlertDescription>
        </Alert>
      )}

        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations du Produit</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
