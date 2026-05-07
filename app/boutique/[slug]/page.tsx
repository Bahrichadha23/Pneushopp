import ProductDetailsPage from "./product";
import { API_URL } from "@/lib/config";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/products/`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data) ? data : data.results || [];
    return products.map((p: any) => ({ slug: p.slug }));
  } catch {
    // API not reachable during build — pages will be generated on-demand
    return [];
  }
}

export default function Page() {
  return <ProductDetailsPage />;
}
