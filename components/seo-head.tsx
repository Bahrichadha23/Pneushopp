// Composant SEO réutilisable pour optimiser chaque page individuellement
interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  ogImage?: string
}

export default function SEOHead({
  title = "PNEU SHOP - Le spécialiste du pneu pas cher en Tunisie",
  description = "Vos pneumatiques en un seul clic. Leader en Tunisie de la vente en ligne de pneumatiques.",
  keywords = "pneus tunisie, pneumatiques pas cher, pneus auto",
  canonicalUrl,
  ogImage = "/images/og-image.jpg",
}: SEOHeadProps) {
  return (
    <>
      {/* Métadonnées de base pour le référencement */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* URL canonique pour éviter le contenu dupliqué */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Balises Open Graph pour les réseaux sociaux */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />

      {/* Balises Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Optimisations pour les moteurs de recherche */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </>
  )
}
