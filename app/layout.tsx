import type React from "react";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import { OrderProvider } from "@/contexts/order-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "PNEU SHOP - Le spécialiste du pneu pas cher en Tunisie | Pneumatiques en ligne",
  description:
    "Vos pneumatiques en un seul clic. Leader en Tunisie de la vente en ligne de pneumatiques. Livraison gratuite 24h/72h à partir de 2 pneus. Pneus auto, SUV, camionnette, agricole aux meilleurs prix.",
  keywords:
    "pneus tunisie, pneumatiques pas cher, pneus auto, pneus SUV, livraison gratuite, pneus agricoles, pneus camionnette, vente pneus en ligne",
  authors: [{ name: "PNEU SHOP" }],
  creator: "PNEU SHOP",
  publisher: "PNEU SHOP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://pneushop.tn"),
  alternates: {
    canonical: "/",
    languages: {
      "fr-TN": "/",
      "ar-TN": "/ar",
    },
  },
  openGraph: {
    title: "PNEU SHOP - Le spécialiste du pneu pas cher en Tunisie",
    description:
      "Vos pneumatiques en un seul clic. Leader en Tunisie de la vente en ligne de pneumatiques. Livraison gratuite 24h/72h à partir de 2 pneus.",
    url: "https://pneushop.tn",
    siteName: "PNEU SHOP",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PNEU SHOP - Pneumatiques en ligne en Tunisie",
      },
    ],
    locale: "fr_TN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNEU SHOP - Le spécialiste du pneu pas cher en Tunisie",
    description:
      "Vos pneumatiques en un seul clic. Livraison gratuite 24h/72h à partir de 2 pneus.",
    images: ["/images/twitter-image.jpg"],
    creator: "@pneushop_tn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PNEU SHOP",
              url: "https://pneushop.tn",
              logo: "https://pneushop.tn/images/logo.png",
              description:
                "Leader en Tunisie de la vente en ligne de pneumatiques",
              address: {
                "@type": "PostalAddress",
                streetAddress: "9 Rue El Milaha, Menzah 8",
                addressLocality: "Ariana",
                postalCode: "2037",
                addressCountry: "TN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+216-29-353-666",
                contactType: "customer service",
                availableLanguage: ["French", "Arabic"],
              },
              sameAs: [
                "https://www.facebook.com/pneushop.tn",
                "https://www.instagram.com/pneushop.tn",
              ],
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${inter.className}`}
      >
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <Suspense fallback={<div>Loading...</div>}>
                {children}
                <Toaster position="top-right" />
              </Suspense>
              <Analytics />
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
