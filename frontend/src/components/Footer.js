const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-social">
            <a href="#" className="social-icon" title="Facebook">
              📘
            </a>
            <a href="#" className="social-icon" title="Instagram">
              📷
            </a>
            <a href="#" className="social-icon" title="TikTok">
              🎵
            </a>
          </div>

          <nav>
            <ul className="footer-nav">
              <li>
                <a href="/">ACCUEIL</a>
              </li>
              <li>
                <a href="/boutique">BOUTIQUE</a>
              </li>
              <li>
                <a href="/contact">CONTACTEZ-NOUS</a>
              </li>
              <li>
                <a href="/a-propos">À PROPOS</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-content">
          <div className="footer-section">
            <h3>Affiliation</h3>
            <p>Boostez Votre Revenus avec des Partenariats Efficaces</p>
            <a href="#">Connexion</a>
            <a href="#">Inscription</a>
            <a href="#">Dashboard</a>
          </div>

          <div className="footer-section">
            <h3>Liens Importants</h3>
            <a href="#">Conditions Générales</a>
            <a href="#">Politique de Confidentialité</a>

            <h3 style={{ marginTop: "2rem" }}>Informations sur la livraison</h3>
            <p>
              Livraison rapide partout en Tunisie en 2 à 5 jours ouvrables. Livraison express entre 1 et 3 jours
              disponible.
            </p>
          </div>

          <div className="footer-section">
            <h3>Contact Info</h3>
            <p>Trouvez les pneus parfaits pour votre véhicule en un clic. Qualité et prix compétitifs garantis.</p>

            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <strong>Address:</strong>
                <br />
                9, Rue El Milaha, El Menzeh 8, Ariana.
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div>
                <strong>Téléphone:</strong>
                <br />
                26888073 / 24353666
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div>
                <strong>Email:</strong>
                <br />
                service.commercial@pneusshop.tn
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>Copyright © 2025 - PneuShop.tn - Tous droits réservés</div>
          <div className="footer-logo">
            PNEU SHOP 🛞<span style={{ fontSize: "0.8rem", marginLeft: "5px" }}>Vos pneumatiques en un seul clic</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
