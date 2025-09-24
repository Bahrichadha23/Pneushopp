"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
// import { API_URL } from "@/lib/config";
// Fetch a single product by slug
async function fetchProduct(slug: string) {
  const res = await fetch(`http://localhost:8000/products/${slug}/`);
  if (!res.ok) {
    throw new Error("Erreur lors du chargement du produit");
  }
  return res.json();
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProduct(slug as string);

        // Convert API product into your frontend type
        const converted: Product = {
          id: data.id.toString(),
          name: data.name,
          brand: data.brand,
          model: data.size,
          price: parseFloat(data.price),
          old_price: data.old_price ? parseFloat(data.old_price) : undefined,
          discount_percentage: data.discount_percentage,
          image: data.image || "/placeholder.jpg",
          images: [data.image || "/placeholder.jpg"],
          category: "auto",
          specifications: {
            width: 225,
            height: 45,
            diameter: 17,
            loadIndex: 91,
            speedRating: "W",
            season: data.season,
            specialty: "tourisme",
          },
          stock: data.stock,
          description: data.description,
          features: [],
          inStock: data.stock > 0,
          //   isPromotion: data.is_featured,
          rating: 4.5,
          reviewCount: 0,
        };

        setProduct(converted);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600">{error || "Produit introuvable"}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left: Product Image */}
          <div className="flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-w-md w-full rounded-lg shadow-lg object-contain"
            />
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Marque: <span className="font-medium">{product.brand}</span>
            </p>
            <p className="text-lg text-gray-600 mb-2">
              Modèle: <span className="font-medium">{product.model}</span>
            </p>

            <div className="flex items-center gap-4 mt-4 mb-6">
              <p className="text-2xl font-bold text-green-600">
                {product.price} €
              </p>
              {product.old_price && (
                <p className="text-lg text-gray-400 line-through">
                  {product.old_price} €
                </p>
              )}
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            <Button disabled={!product.inStock}>
              {product.inStock ? "Ajouter au panier" : "Rupture de stock"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
