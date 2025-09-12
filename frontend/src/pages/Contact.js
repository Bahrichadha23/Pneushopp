const Contact = () => {
  return (
    <div className="container">
      <h1 style={{ textAlign: "center", margin: "2rem 0", color: "#333" }}>Contactez-Nous</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "3rem",
          margin: "3rem 0",
        }}
      >
        {/* Contact Info */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "10px" }}>
          <h2 style={{ marginBottom: "2rem", color: "#333" }}>Nos Coordonnées</h2>

          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div>
              <strong>Adresse:</strong>
              <br />
              9, Rue El Milaha, El Menzeh 8, Ariana, Tunisie
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div>
              <strong>Téléphone:</strong>
              <br />
              26 888 073 / 24 353 666
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

          <div className="contact-item">
            <div className="contact-icon">🕒</div>
            <div>
              <strong>Horaires:</strong>
              <br />
              Lun - Ven: 8h00 - 18h00
              <br />
              Sam: 8h00 - 13h00
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "10px" }}>
          <h2 style={{ marginBottom: "2rem", color: "#333" }}>Envoyez-nous un message</h2>

          <form>
            <div className="form-group">
              <label>Nom complet</label>
              <input type="text" required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" required />
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" />
            </div>

            <div className="form-group">
              <label>Sujet</label>
              <select>
                <option>Demande d'information</option>
                <option>Devis personnalisé</option>
                <option>Service après-vente</option>
                <option>Réclamation</option>
                <option>Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                rows="5"
                placeholder="Décrivez votre demande..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  resize: "vertical",
                }}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Envoyer le message
            </button>
          </form>
        </div>
      </div>

      {/* Map or additional info */}
      <div style={{ background: "white", padding: "2rem", borderRadius: "10px", textAlign: "center" }}>
        <h2 style={{ marginBottom: "2rem", color: "#333" }}>Pourquoi nous choisir ?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏆</div>
            <h3>Expertise</h3>
            <p>Plus de 10 ans d'expérience dans le domaine des pneumatiques</p>
          </div>
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🚚</div>
            <h3>Livraison</h3>
            <p>Livraison rapide partout en Tunisie</p>
          </div>
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💯</div>
            <h3>Qualité</h3>
            <p>Produits certifiés et garantis</p>
          </div>
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔧</div>
            <h3>Service</h3>
            <p>Installation et service après-vente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
