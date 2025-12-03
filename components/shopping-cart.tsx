// Composant panier d'achat avec gestion des quantités
"use client";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ShoppingCart({
  isOpen = true,
  onClose,
}: ShoppingCartProps) {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Votre panier est vide
        </h3>
        <p className="text-gray-600 mb-4">
          Découvrez nos pneus et ajoutez-les à votre panier
        </p>
        <Link href="/boutique">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Voir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* En-tête du panier */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Votre panier</h2>
        <Badge variant="secondary" className="text-sm">
          {items.length} article{items.length > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Liste des articles */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-start gap-4">
              {/* Image produit */}
              <img
                src={item.product.image || "/placeholder.svg"}
                alt={item.product.name}
                className="w-20 h-20 object-cover rounded-md"
              />

              {/* Informations produit */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.product.brand}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.product.specifications.width}/
                      {item.product.specifications.height} R
                      {item.product.specifications.diameter}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Contrôles de quantité et prix */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="h-8 w-8"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.product.stock}
                      className="h-8 w-8"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {(item.product.price * item.quantity).toFixed(2)} DT
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.product.price} DT / unité
                    </p>
                  </div>
                </div>

                {/* Avertissement stock */}
                {item.quantity >= item.product.stock && (
                  <p className="text-xs text-orange-600 mt-2">
                    Stock maximum atteint ({item.product.stock} disponibles)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé et actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-gray-900">
            {getTotalPrice().toFixed(2)} DT
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={clearCart}
            className="flex-1 bg-transparent"
          >
            Vider le panier
          </Button>
          <Link href="/checkout" className="flex-1">
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              Passer commande
            </Button>
          </Link>
        </div>

        {/* Informations livraison */}
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-800">
            🚚 Livraison Rapide à partir de 2 pneus (24h-72h)
          </p>
        </div>
      </div>
    </div>
  );
}
