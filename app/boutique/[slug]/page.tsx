import ProductDetailsPage from "./product";
import { API_URL } from "@/lib/config";

export async function generateStaticParams() {
  const res = await fetch(`${API_URL}/products/`);
  if (!res.ok) {
    console.error("Failed to fetch product slugs from API");
    return [];
  }

  const data = await res.json();

  // Handle both possible formats: array or object with "results"
  const products = Array.isArray(data) ? data : data.results || [];

  // Map over the array safely
  return products.map((p: any) => ({
    slug: p.slug,
  }));
}

export default function Page() {
  return <ProductDetailsPage />;
}
