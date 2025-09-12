// Page dédiée au panier d'achat
import ShoppingCart from "@/components/shopping-cart"

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShoppingCart />
      </div>
    </div>
  )
}
