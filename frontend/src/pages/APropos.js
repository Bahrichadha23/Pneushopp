const APropos = () => {
  return (
    <div className="container">
      <h1 style={{ textAlign: "center", margin: "2rem 0", color: "#333" }}>À Propos de PneuShop</h1>

      {/* Hero Section */}
      <div
        style={{ background: "white", padding: "3rem", borderRadius: "10px", margin: "2rem 0", textAlign: "center" }}
      >
        <h2 style={{ color: "#333", marginBottom: "1rem" }}>Vos pneumatiques en un seul clic</h2>
        <p style={{ fontSize: "1.1rem", color: "#666", maxWidth: "800px", margin: "0 auto" }}>
          PneuShop est votre partenaire de confiance pour tous vos besoins en pneumatiques en Tunisie. Nous nous
          engageons à vous offrir les meilleurs produits aux prix les plus compétitifs, avec un service client
          exceptionnel.
        </p>
      </div>

      {/* Our Story */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "3rem",
          margin: "3rem 0",
        }}
      >
        <div style={{ background: "white", padding: "2rem", borderRadius: "10px" }}>
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>Notre Histoire</h2>
          <p style={{ lineHeight: "1.6", color: "#666" }}>
            Fondée avec la vision de révolutionner l'achat de pneumatiques en Tunisie, PneuShop combine expertise
            traditionnelle et innovation numérique. Notre équipe passionnée travaille chaque jour pour vous offrir une
            expérience d'achat simple, rapide et fiable.
          </p>
        </div>

        <div style={{ background: "white", padding: "2rem", borderRadius: "10px" }}>
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>Notre Mission</h2>
          <p style={{ lineHeight: "1.6", color: "#666" }}>
            Démocratiser l'accès aux pneumatiques de qualité en Tunisie en proposant une plateforme en ligne intuitive,
            des prix transparents et un service de livraison rapide. Nous voulons que chaque conducteur puisse rouler en
            toute sécurité avec les meilleurs pneus.
          </p>
        </div>
      </div>

      {/* Our Values */}
      <div style={{ background: "white", padding: "3rem", borderRadius: "10px", margin: "2rem 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "3rem", color: "#333" }}>Nos Valeurs</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
            <h3>Excellence</h3>
            <p>Nous sélectionnons uniquement les meilleures marques et produits pour nos clients.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤝</div>
            <h3>Confiance</h3>
            <p>Transparence dans nos prix, nos délais et notre service client.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
            <h3>Rapidité</h3>
            <p>Livraison express et service client réactif pour répondre à vos besoins.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔧</div>
            <h3>Service</h3>
            <p>Accompagnement complet de l'achat à l'installation de vos pneumatiques.</p>
          </div>
        </div>
      </div>

      {/* Our Services */}
      <div style={{ background: "white", padding: "3rem", borderRadius: "10px", margin: "2rem 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "3rem", color: "#333" }}>Nos Services</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>🛒 Vente en ligne</h3>
            <p>Large gamme de pneumatiques pour tous types de véhicules avec recherche facile par dimensions.</p>
          </div>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>🚚 Livraison rapide</h3>
            <p>Livraison en 2-5 jours ouvrables partout en Tunisie avec option express disponible.</p>
          </div>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>🔧 Installation</h3>
            <p>Service d'installation professionnel avec équilibrage et géométrie.</p>
          </div>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>💬 Conseil expert</h3>
            <p>Notre équipe vous conseille pour choisir les pneumatiques adaptés à votre véhicule et usage.</p>
          </div>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>✅ Garantie</h3>
            <p>Tous nos produits sont garantis constructeur avec service après-vente dédié.</p>
          </div>
          <div>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>💰 Prix compétitifs</h3>
            <p>Meilleurs prix du marché avec promotions régulières et programme de fidélité.</p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div
        style={{
          background: "#333",
          color: "white",
          padding: "3rem",
          borderRadius: "10px",
          textAlign: "center",
          margin: "2rem 0",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Une question ? Besoin d'un conseil ?</h2>
        <p style={{ marginBottom: "2rem", opacity: "0.9" }}>
          Notre équipe d'experts est à votre disposition pour vous accompagner dans votre choix.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/contact" className="btn btn-primary">
            Nous contacter
          </a>
          <a href="tel:26888073" className="btn" style={{ background: "transparent", border: "2px solid white" }}>
            📞 26 888 073
          </a>
        </div>
      </div>
    </div>
  )
}

export default APropos
