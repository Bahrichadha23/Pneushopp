"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Loader2, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";
import { API_URL } from "@/lib/config";
import { useCart } from "@/contexts/cart-context";

async function fetchProduct(slug: string) {
  const res = await fetch(`${API_URL}/products/${slug}`);
  console.log("REsult", res.body);
  if (!res.ok) {
    throw new Error("Erreur lors du chargement du produit");
  }
  const data = await res.json();

  // ✅ Console full product data (to see full description)
  console.log("Fetched product data:", data);

  return data;
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!slug) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProduct(slug as string);

        // 🔍 Collect all images from image, image_2, image_3 fields
        const allImages = [data.image, data.image_2, data.image_3].filter(
          (img) => img && img !== null && img !== ""
        ); // Remove null/empty values

        console.log("📸 Product images from API:");
        console.log("  - image:", data.image);
        console.log("  - image_2:", data.image_2);
        console.log("  - image_3:", data.image_3);
        console.log("📸 Total valid images:", allImages.length);

        // Convert API product into your frontend type
        const converted: Product = {
          id: data.id.toString(),
          slug: data.slug,
          name: data.name,
          brand: data.brand,
          model: data.size,
          price: parseFloat(data.price),
          old_price: data.old_price ? parseFloat(data.old_price) : undefined,
          discount_percentage: data.discount_percentage,
          image: data.image || "/placeholder.jpg",
          // ✅ Use collected images or fallback to main image
          images:
            allImages.length > 0
              ? allImages
              : [data.image || "/placeholder.jpg"],
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

        console.log("✅ Converted product images:", converted.images);
        console.log("✅ Total images count:", converted.images.length);

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

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product);
        // Optionally show success message
        console.log("Product added to cart successfully!");
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    }
  };

  const formatDescription = (desc: string) => {
    if (!desc) return [];

    // Split description into sections
    const sections = [];
    const lines = desc.split(/\n+/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if it's a heading (contains : or ends with specific keywords)
      if (
        trimmed.includes("Points forts") ||
        trimmed.includes("Conduite sûre") ||
        trimmed.includes("Grande maniabilité") ||
        trimmed.includes("Durée de vie") ||
        trimmed.includes("Dimensions et spécificités")
      ) {
        sections.push({ type: "heading", text: trimmed.replace(/:/g, "") });
      }
      // Check if it's a bullet point
      else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        sections.push({
          type: "bullet",
          text: trimmed.replace(/^[•\-]\s*/, ""),
        });
      }
      // Regular paragraph
      else {
        sections.push({ type: "paragraph", text: trimmed });
      }
    }

    return sections;
  };

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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg p-4 sticky top-4">
              {/* Main Image */}
              <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={String(product.images[selectedImageIndex])}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />

                {/* Discount Badge */}
                {product.discount_percentage && (
                  <Badge className="absolute top-4 left-4 bg-black text-white px-3 py-1">
                    -{product.discount_percentage}%
                  </Badge>
                )}

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? product.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === product.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex justify-center gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-20 rounded border-2 overflow-hidden mt-3 p-2 flex items-center justify-center bg-white ${
                        selectedImageIndex === idx
                          ? "border-yellow-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={String(img)}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-7">
            {/* Product Title & Price */}
            <div className="bg-white rounded-lg p-6 mb-4">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  Taille: {product.model}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Marque: {product.brand}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-black">
                    {product.price.toFixed(2)} DT
                  </span>
                  {product.old_price && (
                    <span className="text-xl text-gray-400 line-through">
                      {product.old_price.toFixed(2)} DT
                    </span>
                  )}
                </div>

                {product.inStock ? (
                  <p className="text-black text-sm font-medium">
                    En stock ({product.stock} disponibles)
                  </p>
                ) : (
                  <p className="text-black text-sm font-medium">
                    Rupture de stock
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              <div className="mt-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  size="lg"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg py-6"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.inStock ? "Ajouter au panier" : "Rupture de stock"}
                </Button>
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
                Description du produit
              </h2>

              <div className="prose prose-sm max-w-none">
                {formatDescription(product.description || "").map(
                  (section, idx) => {
                    if (section.type === "heading") {
                      return (
                        <h3
                          key={idx}
                          className="text-lg font-semibold mt-6 mb-3 text-gray-900"
                        >
                          {section.text}
                        </h3>
                      );
                    }
                    if (section.type === "bullet") {
                      return (
                        <div key={idx} className="flex gap-2 mb-2">
                          <span className="text-yellow-500 font-bold">•</span>
                          <p className="text-gray-700 text-sm">
                            {section.text}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        className="text-gray-700 mb-4 leading-relaxed text-sm"
                      >
                        {section.text}
                      </p>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
