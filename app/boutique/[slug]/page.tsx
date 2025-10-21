import ProductDetailsPage from "./product";

// ✅ Temporary dummy params for static export
export async function generateStaticParams() {
  // Returning a few dummy slugs so Next.js can statically export pages
  return [
    { slug: "dummy-product-1" },
  ];
}

export default function Page() {
  return <ProductDetailsPage />;
}
