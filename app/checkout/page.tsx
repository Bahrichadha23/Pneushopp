"use client";
// Page de commande avec processus de checkout complet
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CheckoutPage() {
  const { items } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
        <p className="text-gray-600 mb-8">
          Ajoutez des produits à votre panier pour procéder à la commande.
        </p>
        <Button asChild>
          <Link href="/boutique">Continuer vos achats</Link>
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Connexion requise</h1>
        <p className="text-gray-600 mb-8">
          Vous devez être connecté pour passer une commande.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/auth/login">Se connecter</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/register">Créer un compte</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Finaliser votre commande
      </h1>
      <CheckoutForm />
    </div>
  );
}
