// Formulaire d'ajout/modification de produits
"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, X, Plus } from "lucide-react"
import type { Product } from "@/types/product"

interface ProductFormProps {
  product?: Product
  onSubmit: (productData: Partial<Product>) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isLoading?: boolean
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    price: 0,
    originalPrice: 0,
    category: "auto" as Product["category"],
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
    images: [] as string[],
  })

  const [newFeature, setNewFeature] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")

  // Initialiser le formulaire avec les données du produit existant
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        model: product.model,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        category: product.category,
        specifications: product.specifications,
        stock: product.stock,
        description: product.description,
        features: product.features,
        inStock: product.inStock,
        isPromotion: product.isPromotion || false,
        images: product.images,
      })
    }
  }, [product])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Le nom est requis"
    if (!formData.brand.trim()) newErrors.brand = "La marque est requise"
    if (!formData.model.trim()) newErrors.model = "Le modèle est requis"
    if (formData.price <= 0) newErrors.price = "Le prix doit être supérieur à 0"
    if (formData.stock < 0) newErrors.stock = "Le stock ne peut pas être négatif"
    if (!formData.description.trim()) newErrors.description = "La description est requise"

    // Validation des spécifications
    if (formData.specifications.width <= 0) newErrors.width = "La largeur est requise"
    if (formData.specifications.height <= 0) newErrors.height = "La hauteur est requise"
    if (formData.specifications.diameter <= 0) newErrors.diameter = "Le diamètre est requis"
    if (formData.specifications.loadIndex <= 0) newErrors.loadIndex = "L'indice de charge est requis"
    if (!formData.specifications.speedRating.trim()) newErrors.speedRating = "L'indice de vitesse est requis"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) return

    try {
      const discount =
        formData.originalPrice > formData.price
          ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
          : 0

      const productData: Partial<Product> = {
        ...formData,
        discount: discount > 0 ? discount : undefined,
        image: formData.images[0] || "/placeholder.svg",
      }

      const result = await onSubmit(productData)
      if (!result.success) {
        setSubmitError(result.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      setSubmitError("Erreur lors de la sauvegarde")
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSpecificationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const addImage = () => {
    const url = prompt("URL de l'image:")
    if (url) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, url],
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

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
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Pirelli P Zero"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="brand">Marque *</Label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className={errors.brand ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner une marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pirelli">Pirelli</SelectItem>
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
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
            </div>

            <div>
              <Label htmlFor="model">Modèle *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="Ex: P Zero"
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description détaillée du produit..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
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
              <Label htmlFor="width">Largeur *</Label>
              <Input
                id="width"
                type="number"
                value={formData.specifications.width || ""}
                onChange={(e) => handleSpecificationChange("width", Number.parseInt(e.target.value) || 0)}
                placeholder="225"
                className={errors.width ? "border-red-500" : ""}
              />
              {errors.width && <p className="text-red-500 text-xs mt-1">{errors.width}</p>}
            </div>

            <div>
              <Label htmlFor="height">Hauteur *</Label>
              <Input
                id="height"
                type="number"
                value={formData.specifications.height || ""}
                onChange={(e) => handleSpecificationChange("height", Number.parseInt(e.target.value) || 0)}
                placeholder="45"
                className={errors.height ? "border-red-500" : ""}
              />
              {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
            </div>

            <div>
              <Label htmlFor="diameter">Diamètre *</Label>
              <Input
                id="diameter"
                type="number"
                value={formData.specifications.diameter || ""}
                onChange={(e) => handleSpecificationChange("diameter", Number.parseInt(e.target.value) || 0)}
                placeholder="17"
                className={errors.diameter ? "border-red-500" : ""}
              />
              {errors.diameter && <p className="text-red-500 text-xs mt-1">{errors.diameter}</p>}
            </div>

            <div>
              <Label htmlFor="loadIndex">Indice charge *</Label>
              <Input
                id="loadIndex"
                type="number"
                value={formData.specifications.loadIndex || ""}
                onChange={(e) => handleSpecificationChange("loadIndex", Number.parseInt(e.target.value) || 0)}
                placeholder="91"
                className={errors.loadIndex ? "border-red-500" : ""}
              />
              {errors.loadIndex && <p className="text-red-500 text-xs mt-1">{errors.loadIndex}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="speedRating">Indice vitesse *</Label>
              <Select
                value={formData.specifications.speedRating}
                onValueChange={(value) => handleSpecificationChange("speedRating", value)}
              >
                <SelectTrigger className={errors.speedRating ? "border-red-500" : ""}>
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
              {errors.speedRating && <p className="text-red-500 text-xs mt-1">{errors.speedRating}</p>}
            </div>

            <div>
              <Label htmlFor="season">Saison</Label>
              <Select
                value={formData.specifications.season}
                onValueChange={(value) => handleSpecificationChange("season", value)}
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
              <Label htmlFor="specialty">Spécialité</Label>
              <Select
                value={formData.specifications.specialty}
                onValueChange={(value) => handleSpecificationChange("specialty", value)}
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
              <Label htmlFor="price">Prix de vente (DT) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                placeholder="180.00"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <Label htmlFor="originalPrice">Prix original (DT)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice || ""}
                onChange={(e) => handleInputChange("originalPrice", Number.parseFloat(e.target.value) || 0)}
                placeholder="220.00"
              />
              <p className="text-xs text-gray-500 mt-1">Pour les promotions</p>
            </div>

            <div>
              <Label htmlFor="stock">Stock disponible *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || ""}
                onChange={(e) => handleInputChange("stock", Number.parseInt(e.target.value) || 0)}
                placeholder="25"
                className={errors.stock ? "border-red-500" : ""}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) => handleInputChange("inStock", checked)}
              />
              <Label htmlFor="inStock">En stock</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPromotion"
                checked={formData.isPromotion}
                onCheckedChange={(checked) => handleInputChange("isPromotion", checked)}
              />
              <Label htmlFor="isPromotion">En promotion</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caractéristiques */}
      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Ajouter une caractéristique..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {feature}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => removeFeature(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" onClick={addImage} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Ajouter une image
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Image ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => removeImage(index)}
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600 text-black">
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
  )
}
