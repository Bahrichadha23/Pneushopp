// Formulaire d'ajout/modification de produits
"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, X, Plus, Info } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  onSubmit: (
    productData: Partial<Product>
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    price: 0,
    purchase_price: 0,
    category: "" as Product["category"],
    specifications: {
      width: 0,
      height: 0,
      diameter: 0,
      loadIndex: 0,
      speedRating: "",
      season: "ete" as Product["specifications"]["season"],
      specialty: "tourisme" as Product["specifications"]["specialty"],
    },
    stock: 0,
    description: "",
    features: [] as string[],
    inStock: true,
    inPromotion: false,
    promotionDiscount: 20,
    images: [] as File[],
    // New manual fields
    reference: "",
    designation: "",
    type: "",
    emplacement: "",
    fabrication_date: "",
  });

  const [newFeature, setNewFeature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // Initialiser le formulaire avec les données du produit existant
  useEffect(() => {
    if (product) {
      // The backend returns all fields via AdminProductSerializer (fields='__all__')
      // Cast to any to access fields not declared in the Product TS type
      const raw = product as any;
      setFormData({
        // Use designation as primary name (fuller), fallback to name
        name: raw.designation || raw.name || product.name || "",
        brand: product.brand || "",
        model: product.model || raw.size || "",
        price: product.price || 0,
        purchase_price: raw.purchase_price || product.purchase_price || 0,
        category: product.category,
        specifications: {
          // These come from the size string (e.g. "235/60R16") — parse or use defaults
          width: product.specifications?.width || 0,
          height: product.specifications?.height || 0,
          diameter: product.specifications?.diameter || 0,
          loadIndex: product.specifications?.loadIndex || 0,
          speedRating: product.specifications?.speedRating || "",
          season: product.specifications?.season || "ete",
          specialty: product.specifications?.specialty ?? "tourisme",
        },
        stock: product.stock ?? 0,
        description: product.description || "",
        features: product.features || [],
        inStock: product.inStock ?? (product.stock > 0),
        inPromotion: !!product.is_on_sale,
        promotionDiscount: product.discount_percentage || 20,
        images: (product.images || []).filter((img: any): img is File => img instanceof File),
        reference: raw.reference || product.reference || "",
        designation: raw.designation || product.designation || "",
        type: raw.type || product.type || "",
        emplacement: raw.emplacement || product.emplacement || "",
        fabrication_date: raw.fabrication_date || product.fabrication_date || "",
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const isEditing = !!product;

    // Always required
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (formData.price <= 0) newErrors.price = "Le prix doit être supérieur à 0";
    if (formData.stock < 0) newErrors.stock = "Le stock ne peut pas être négatif";

    // Only required when creating (not editing — product may have been imported without these)
    if (!isEditing) {
      if (!formData.brand.trim()) newErrors.brand = "La marque est requise";
      if (!formData.model.trim()) newErrors.model = "Le modèle est requis";
      if (!formData.description.trim()) newErrors.description = "La description est requise";
      if (formData.specifications.width <= 0) newErrors.width = "La largeur est requise";
      if (formData.specifications.height <= 0) newErrors.height = "La hauteur est requise";
      if (formData.specifications.diameter <= 0) newErrors.diameter = "Le diamètre est requis";
      if (formData.specifications.loadIndex <= 0) newErrors.loadIndex = "L'indice de charge est requis";
      if (!formData.specifications.speedRating.trim()) newErrors.speedRating = "L'indice de vitesse est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      const productData: Partial<Product> & {
        in_promotion?: boolean;
        promotion_discount?: number;
      } = {
        ...formData,
        purchase_price: formData.purchase_price || undefined,
        in_promotion: formData.inPromotion,
        promotion_discount: formData.promotionDiscount,
        image: "/placeholder.svg",
      };

      const result = await onSubmit(productData);
      if (!result.success) {
        setSubmitError(result.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setSubmitError("Erreur lors de la sauvegarde");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSpecificationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addImage = () => {
    const url = prompt("URL de l'image:");
    if (url) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Informations générales */}
      <Card className="gap-2 py-2.5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Informations générales
            <Info className="h-3.5 w-3.5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label htmlFor="name" className="mb-1">
                Nom du produit *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="brand" className="mb-1">
                Marque {!product && "*"}
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="Ex: Michelin, Nexen, Pirelli..."
                className={errors.brand ? "border-red-500" : ""}
              />
              {errors.brand && (
                <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model" className="mb-1">
                Modèle *
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && (
                <p className="text-red-500 text-xs mt-1">{errors.model}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category" className="mb-1">
                Catégorie *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tourisme">Tourisme</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="camionnette">Camionnette</SelectItem>
                  <SelectItem value="agricole">Agricole</SelectItem>
                  <SelectItem value="poids-lourd">Poids lourd</SelectItem>
                  <SelectItem value="utilitaire">Utilitaire</SelectItem>
                  <SelectItem value="4x4">4X4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="gap-2 py-2.5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Description
            <Info className="h-3.5 w-3.5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description" className="mb-1">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value.slice(0, 1000))
              }
              maxLength={1000}
              rows={2}
              placeholder="Décrivez le produit en détail..."
              className={`min-h-0 ${errors.description ? "border-red-500" : ""}`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description ? (
                <p className="text-red-500 text-xs">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">
                {formData.description.length} / 1000
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spécifications techniques */}
      <Card className="gap-2 py-2.5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Spécifications techniques
            <Info className="h-3.5 w-3.5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <Label htmlFor="width" className="mb-1">
                Largeur *
              </Label>
              <Input
                id="width"
                type="number"
                value={formData.specifications.width || ""}
                onChange={(e) =>
                  handleSpecificationChange(
                    "width",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className={errors.width ? "border-red-500" : ""}
              />
              {errors.width && (
                <p className="text-red-500 text-xs mt-1">{errors.width}</p>
              )}
            </div>

            <div>
              <Label htmlFor="height" className="mb-1">
                Hauteur *
              </Label>
              <Input
                id="height"
                type="number"
                value={formData.specifications.height || ""}
                onChange={(e) =>
                  handleSpecificationChange(
                    "height",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className={errors.height ? "border-red-500" : ""}
              />
              {errors.height && (
                <p className="text-red-500 text-xs mt-1">{errors.height}</p>
              )}
            </div>

            <div>
              <Label htmlFor="diameter" className="mb-1">
                Diamètre *
              </Label>
              <Input
                id="diameter"
                type="number"
                value={formData.specifications.diameter || ""}
                onChange={(e) =>
                  handleSpecificationChange(
                    "diameter",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className={errors.diameter ? "border-red-500" : ""}
              />
              {errors.diameter && (
                <p className="text-red-500 text-xs mt-1">{errors.diameter}</p>
              )}
            </div>

            <div>
              <Label htmlFor="loadIndex" className="mb-1">
                Indice charge *
              </Label>
              <Input
                id="loadIndex"
                type="number"
                value={formData.specifications.loadIndex || ""}
                onChange={(e) =>
                  handleSpecificationChange(
                    "loadIndex",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className={errors.loadIndex ? "border-red-500" : ""}
              />
              {errors.loadIndex && (
                <p className="text-red-500 text-xs mt-1">{errors.loadIndex}</p>
              )}
            </div>

            <div>
              <Label htmlFor="speedRating" className="mb-1">
                Indice vitesse *
              </Label>
              <Select
                value={formData.specifications.speedRating}
                onValueChange={(value) =>
                  handleSpecificationChange("speedRating", value)
                }
              >
                <SelectTrigger
                  className={errors.speedRating ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">H (210 km/h)</SelectItem>
                  <SelectItem value="V">V (240 km/h)</SelectItem>
                  <SelectItem value="W">W (270 km/h)</SelectItem>
                  <SelectItem value="Y">Y (300 km/h)</SelectItem>
                  <SelectItem value="T">T (190 km/h)</SelectItem>
                  <SelectItem value="S">S (180 km/h)</SelectItem>
                  <SelectItem value="R">R (170 km/h)</SelectItem>
                </SelectContent>
              </Select>
              {errors.speedRating && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.speedRating}
                </p>
              )}
            </div>

            {/* Saison supprimée */}

            <div>
              <Label htmlFor="specialty" className="mb-1">
                Spécialité
              </Label>
              <Select
                value={formData.specifications.specialty}
                onValueChange={(value) =>
                  handleSpecificationChange("specialty", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tourisme">Tourisme</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="eco">Éco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prix */}
      <Card className="gap-2 py-2.5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Prix
            <Info className="h-3.5 w-3.5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label htmlFor="purchase_price" className="mb-1">
                Prix d'achat (DT)
              </Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={formData.purchase_price || ""}
                onChange={(e) => {
                  const achat = Number.parseFloat(e.target.value) || 0;
                  handleInputChange("purchase_price", achat);
                  // Calcul automatique prix vente :
                  // marque "amine" → +10%, tous les autres → +15%
                  if (achat > 0) {
                    const brandLower = (formData.brand || "").toLowerCase().trim();
                    const isAmine = brandLower.includes("amine");
                    const margin = isAmine ? 1.10 : 1.15;
                    const sellPrice = Math.round(achat * margin * 1000) / 1000;
                    handleInputChange("price", sellPrice);
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Prix vente = prix achat × {((formData.brand || "").toLowerCase().includes("amine") ? "110%" : "115%")}
                <Info className="h-3 w-3 text-blue-400" />
              </p>
            </div>

            <div>
              <Label htmlFor="price" className="mb-1">
                Prix de vente (DT) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                value={formData.price || ""}
                onChange={(e) =>
                  handleInputChange("price", Number.parseFloat(e.target.value) || 0)
                }
                className="bg-brand-gold-light border-brand-gold font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="stock" className="mb-1">
                Stock disponible *
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || ""}
                onChange={(e) =>
                  handleInputChange(
                    "stock",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className={errors.stock ? "border-red-500" : ""}
              />
              {errors.stock && (
                <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) =>
                  handleInputChange("inStock", checked)
                }
              />
              <Label htmlFor="inStock">En stock</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="inPromotion"
                checked={formData.inPromotion}
                onCheckedChange={(checked) =>
                  handleInputChange("inPromotion", checked === true)
                }
              />
              <Label htmlFor="inPromotion">En promotion</Label>
            </div>
          </div>

          {formData.inPromotion && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <Label htmlFor="promotionDiscount" className="text-sm text-gray-700 whitespace-nowrap mb-0">
                Remise à appliquer (%)
              </Label>
              <Input
                id="promotionDiscount"
                type="number"
                min={1}
                max={99}
                value={formData.promotionDiscount || ""}
                onChange={(e) =>
                  handleInputChange(
                    "promotionDiscount",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                className="w-28 bg-white"
              />
              <p className="text-xs text-gray-500">
                Le prix barré et le label promo seront générés automatiquement après l'enregistrement.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="gap-2 py-2.5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Images
            <Info className="h-3.5 w-3.5 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <label
            htmlFor="fileUpload"
            className="inline-flex items-center gap-2.5 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-500 shrink-0">
              <Upload className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">Ajouter une image</span>
              <span className="text-xs text-gray-400">PNG, JPG ou WEBP (max. 5 Mo)</span>
            </span>
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFormData((prev) => ({
                  ...prev,
                  images: [...prev.images, e.target.files![0]],
                }));
              }
            }}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {formData.images.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={
                    typeof file === "string" ? file : URL.createObjectURL(file)
                  }
                  alt={`Image ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#FF8C00] hover:bg-[#CC7000] text-white disabled:opacity-100 disabled:bg-[#FF8C00]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : product ? (
            "Mettre à jour"
          ) : (
            "Créer le produit"
          )}
        </Button>
      </div>
    </form>
  );
}
