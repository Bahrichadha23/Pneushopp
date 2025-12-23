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
import { Loader2, Upload, X, Plus } from "lucide-react";
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
    old_price: 0,
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
    isPromotion: false,
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
      setFormData({
        name: product.name,
        brand: product.brand,
        model: product.model,
        price: product.price,
        old_price: product.old_price || 0,
        category: product.category,
        specifications: {
          width: product.specifications.width,
          height: product.specifications.height,
          diameter: product.specifications.diameter,
          loadIndex: product.specifications.loadIndex,
          speedRating: product.specifications.speedRating,
          season: product.specifications.season,
          specialty: product.specifications.specialty ?? undefined,
        },
        stock: product.stock,
        description: product.description,
        features: product.features,
        inStock: product.inStock,
        isPromotion: product.is_on_sale || false,
        images: product.images,
        // New manual fields
        reference: product.reference || "",
        designation: product.designation || "",
        type: product.type || "",
        emplacement: product.emplacement || "",
        fabrication_date: product.fabrication_date || "",
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.brand.trim()) newErrors.brand = "La marque est requise";
    if (!formData.model.trim()) newErrors.model = "Le modèle est requis";
    if (formData.price <= 0)
      newErrors.price = "Le prix doit être supérieur à 0";
    if (formData.stock < 0)
      newErrors.stock = "Le stock ne peut pas être négatif";
    if (!formData.description.trim())
      newErrors.description = "La description est requise";

    // Validation des spécifications
    if (formData.specifications.width <= 0)
      newErrors.width = "La largeur est requise";
    if (formData.specifications.height <= 0)
      newErrors.height = "La hauteur est requise";
    if (formData.specifications.diameter <= 0)
      newErrors.diameter = "Le diamètre est requis";
    if (formData.specifications.loadIndex <= 0)
      newErrors.loadIndex = "L'indice de charge est requis";
    if (!formData.specifications.speedRating.trim())
      newErrors.speedRating = "L'indice de vitesse est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      const discount =
        formData.old_price > formData.price
          ? Math.round(
              ((formData.old_price - formData.price) / formData.old_price) * 100
            )
          : 0;

      const productData: Partial<Product> = {
        ...formData,
        old_price: formData.old_price,
        discount_percentage: discount > 0 ? discount : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-2">
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
              <Label htmlFor="brand" className="mb-2">
                Marque *
              </Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => handleInputChange("brand", value)}
              >
                <SelectTrigger className={errors.brand ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner une marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Continental">Continental</SelectItem>
                  <SelectItem value="Michelin">Michelin</SelectItem>
                  <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                  <SelectItem value="BFGoodrich">BFGoodrich</SelectItem>
                  <SelectItem value="Kleber">Kleber</SelectItem>
                  <SelectItem value="Firestone">Firestone</SelectItem>
                  <SelectItem value="General Tire">General Tire</SelectItem>
                  <SelectItem value="Tigar">Tigar</SelectItem>
                </SelectContent>
              </Select>
              {errors.brand && (
                <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model" className="mb-2">
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
              <Label htmlFor="category" className="mb-2">
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

          <div>
            <Label htmlFor="description" className="mb-2">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Complémentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference" className="mb-2">
                Référence
              </Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="designation" className="mb-2">
                Désignation
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) =>
                  handleInputChange("designation", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="type" className="mb-2">
                Type
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="emplacement" className="mb-2">
                Emplacement
              </Label>
              <Input
                id="emplacement"
                value={formData.emplacement}
                onChange={(e) =>
                  handleInputChange("emplacement", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="fabrication_date" className="mb-2">
                Date de Fabrication
              </Label>
              <Input
                id="fabrication_date"
                type="date"
                value={formData.fabrication_date}
                onChange={(e) =>
                  handleInputChange("fabrication_date", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spécifications techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Spécifications techniques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="width" className="mb-2">
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
              <Label htmlFor="height" className="mb-2">
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
              <Label htmlFor="diameter" className="mb-2">
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
              <Label htmlFor="loadIndex" className="mb-2">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="speedRating" className="mb-2">
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

            <div>
              <Label htmlFor="season" className="mb-2">
                Saison
              </Label>
              <Select
                value={formData.specifications.season}
                onValueChange={(value) =>
                  handleSpecificationChange("season", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ete">Été</SelectItem>
                  <SelectItem value="hiver">Hiver</SelectItem>
                  <SelectItem value="toutes-saisons">Toutes saisons</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specialty" className="mb-2">
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

      {/* Prix et stock */}
      <Card>
        <CardHeader>
          <CardTitle>Prix et inventaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price" className="mb-2">
                Prix de vente (DT) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) => {
                  const newPrice = Number.parseFloat(e.target.value) || 0;

                  if (!formData.old_price) {
                    handleInputChange("old_price", formData.price);
                  }

                  handleInputChange("price", newPrice);
                }}
              />
            </div>

            <div>
              <Label htmlFor="old_price">Prix original (DT)</Label>
              <Input
                id="old_price"
                type="number"
                step="0.01"
                value={formData.old_price || ""}
                onChange={(e) =>
                  handleInputChange(
                    "old_price",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="stock" className="mb-2">
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

          <div className="flex items-center space-x-6">
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
                id="isPromotion"
                checked={formData.isPromotion}
                onCheckedChange={(checked) =>
                  handleInputChange("isPromotion", checked)
                }
              />
              <Label htmlFor="isPromotion">En promotion</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            htmlFor="fileUpload"
            className="flex items-center cursor-pointer border rounded p-2 w-fit text-gray-600 hover:text-black hover:border-black"
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter une image
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*"
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
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
