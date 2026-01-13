"use client";
import type React from "react";
import { useState } from "react";

// Composant carte produit réutilisable avec fonctionnalités e-commerce
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche la navigation vers la page produit
    
    // Set animation state FIRST (immediately)
    setIsAdding(true);
    
    // Then add to cart
    await addToCart(product);
    
    // Keep animation for 1.5 seconds
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
        <div className="relative">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-48 object-cover"
          />

          {/* Badges promotions et stock */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_on_sale && (
              <Badge className="bg-red-500 text-white">
                -{product.discount_percentage}%
              </Badge>
            )}

            {!product.inStock && (
              <Badge variant="destructive">Rupture de stock</Badge>
            )}
          </div>

          {/* Badge nouveau ou populaire */}
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
              {product.specifications.season.replace("-", " ")} •{" "}
              {product.brand}
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-black">
                {product.price} DT
              </span>
              {product.old_price && (
                <span className="text-sm text-red-500 line-through">
                  {product.old_price} DT
                </span>
              )}
            </div>
          </div>

          {/* Bouton d'ajout au panier */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
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
              {isAdding ? "✓ Ajouté!" : product.inStock ? "Ajouter au panier" : "Indisponible"}
            </span>
          </Button>

          {/* Stock restant si faible */}
          {product.inStock && product.stock <= 5 && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              Plus que {product.stock} en stock !
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
