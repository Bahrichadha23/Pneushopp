"use client";

import { useState } from "react";
import { useCart } from "../contexts/cart-context";
import { createOrder } from "../types/order";
import Link from "next/link";
import type { Product } from "@/types/product";

interface CartModalProps {
  onClose: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  paymentMethod: string;
}

const CartModal = ({ onClose }: CartModalProps) => {
  const { items, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    paymentMethod: "card",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.postalCode.trim() ||
      !formData.phone.trim()
    ) {
      setError("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!isCheckingOut) {
      if (items.length === 0) {
        setError("Votre panier est vide");
        return;
      }
      setIsCheckingOut(true);
      setError(null);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price:
            typeof item.product.price === "string"
              ? parseFloat(item.product.price)
              : item.product.price,
          total_price:
            (typeof item.product.price === "string"
              ? parseFloat(item.product.price)
              : item.product.price) * item.quantity,
          specifications: item.product.specifications || {},
        })),
        shipping_address: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postal_code: formData.postalCode.trim(),
          country: formData.country,
          phone: formData.phone.trim(),
        },
        payment_method: formData.paymentMethod,
      };

      console.log("Sending order data:", JSON.stringify(orderData, null, 2)); // Add this line
      const order = await createOrder(orderData);
      // ... rest of the code ...

      // Clear cart without restoring stock (stock already deducted by order)
      await clearCart(false);
      alert(`Commande #${order.id} créée avec succès !`);
      onClose();
    } catch (err) {
      console.error("Erreur lors de la commande :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Échec de la création de la commande"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (!onClose) {
    console.error("CartModal: onClose prop is required");
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Mon Panier</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-gray-600 mb-4">Votre panier est vide</p>
            <Link
              href="/boutique"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={onClose}
            >
              Continuer vos achats
            </Link>
          </div>
        ) : (
          <>
            {!isCheckingOut ? (
              <>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.quantity}`}
                      className="flex items-start border-b pb-4"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {item.product.brand}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium">
                            {typeof item.product.price === "number"
                              ? item.product.price.toFixed(2)
                              : parseFloat(item.product.price).toFixed(2)}{" "}
                            DT × {item.quantity}
                          </span>
                          <span className="font-semibold">
                            {(
                              (typeof item.product.price === "number"
                                ? item.product.price
                                : parseFloat(item.product.price)) *
                              item.quantity
                            ).toFixed(2)}{" "}
                            DT
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <span>
                      Total ({totalItems}{" "}
                      {totalItems > 1 ? "articles" : "article"})
                    </span>
                    <span className="font-bold">
                      {totalPrice.toFixed(2)} DT
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Traitement..." : "Procéder au paiement"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Informations de livraison
                </h3>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Ville *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Moyen de paiement *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="card">Carte de crédit</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Traitement..." : "Confirmer la commande"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800"
                    disabled={isSubmitting}
                  >
                    Retour au panier
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
