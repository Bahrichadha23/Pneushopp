"use client";
import type React from "react";
import { useState } from "react";

// Composant carte produit réutilisable avec fonctionnalités e-commerce
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({
  product,
  className = "",
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 999) setQuantity(val);
    else if (e.target.value === "") setQuantity(1);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    await addToCart(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  return (
    <Link href={`/boutique/${product.slug}`}>
      <div
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}
      >
        {/* Image du produit avec badges */}
        <div className="relative bg-gray-50">
          <div className="w-full h-48 flex items-center justify-center p-4">
            <img
              src={imageError || !product.image 
                ? "https://placehold.co/400x400/e5e7eb/6b7280?text=Pneu" 
                : product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onError={() => setImageError(true)}
            />
          </div>

          {/* Badges promotions et stock */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_on_sale && (product as any).promotion_label && (
              <Badge className="bg-red-600 text-white text-[10px] font-bold px-2">
                {(product as any).promotion_label}
              </Badge>
            )}
            {product.is_on_sale && (product.discount_percentage ?? 0) > 0 && (
              <Badge className="bg-yellow-400 text-black font-bold">
                -{product.discount_percentage}%
              </Badge>
            )}
          </div>

          {/* Badge populaire */}
          {product.rating && product.rating >= 4.7 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500 text-black">Populaire</Badge>
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="p-4">
          {/* Marque et nom */}
          <div className="mb-2">
            <p className="text-sm text-gray-600 font-medium">{product.brand}</p>
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Spécifications principales */}
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              {product.specifications.width}/{product.specifications.height} R
              {product.specifications.diameter}
              {product.specifications.loadIndex > 0 &&
                product.specifications.loadIndex}
              {product.specifications.speedRating &&
                product.specifications.speedRating}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {(({
                summer: "Été", winter: "Hiver", all_season: "Toutes saisons",
                "été": "Été", "hiver": "Hiver", "toutes-saisons": "Toutes saisons",
              } as Record<string, string>)[product.specifications.season] || product.specifications.season || "")}
              {product.specifications.season ? " • " : ""}{product.brand}
            </p>
          </div>

          {/* Note et avis */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">
                  {product.rating}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviewCount} avis)
              </span>
            </div>
          )}

          {/* Prix */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-black">
                {product.price} DT
              </span>
              {product.old_price && (
                <span className="text-sm text-red-400 line-through">
                  {product.old_price} DT
                </span>
              )}
            </div>
            {product.old_price && product.old_price > product.price && (
              <p className="text-xs text-green-600 font-semibold mt-0.5">
                Économie : {(product.old_price - product.price).toFixed(3)} DT
              </p>
            )}
          </div>

          {/* Sélecteur de quantité */}
          {(
            <div
              className="flex items-center justify-center gap-2 mb-3"
              onClick={(e) => e.preventDefault()}
            >
              <button
                onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.max(1, q - 1)); }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={handleQuantityChange}
                onClick={(e) => e.preventDefault()}
                className="w-14 h-8 text-center border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={(e) => { e.preventDefault(); setQuantity((q) => Math.min(999, q + 1)); }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Bouton d'ajout au panier */}
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full text-black font-medium
              transition-all duration-500 ease-out
              ${isAdding
                ? 'bg-yellow-500 hover:bg-yellow-500 scale-110 shadow-2xl shadow-yellow-500/50 -translate-y-2'
                : 'bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'
              }
            `}
          >
            <ShoppingCart className={`w-4 h-4 mr-2 inline-block transition-all duration-700 ease-out ${isAdding ? 'rotate-[720deg] scale-150' : ''}`} />
            <span className="inline-block transition-all duration-300">
              {isAdding ? "✓ Ajouté!" : "Ajouter au panier"}
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
