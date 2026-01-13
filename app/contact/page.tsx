"use client";

import React, { ChangeEvent } from "react";
import { useState, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Handle Form Submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    emailjs
      .send(
        "service_6b0lqyh", // Service ID
        "template_hfmwxsl", // Template ID
        {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          sujet: formData.sujet,
          message: formData.message,
        },
        "DYXz6yVXm8PzEU-2S" // Public Key
      )
      .then(
        () => {
          setSuccessMsg("✅ Votre message a été envoyé avec succès !");
          setFormData({
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            sujet: "",
            message: "",
          });
        },
        (error) => {
          setErrorMsg("❌ Une erreur s'est produite. Veuillez réessayer.");
          console.error("EmailJS Error:", error);
        }
      )
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Contactez-Nous
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Envoyez-nous un Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <Input
                      name="nom"
                      placeholder="Votre nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <Input
                      name="prenom"
                      placeholder="Votre prénom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <Input
                    name="telephone"
                    placeholder="+216 XX XXX XXX"
                    value={formData.telephone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <Input
                    name="sujet"
                    placeholder="Sujet de votre message"
                    value={formData.sujet}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <Textarea
                    name="message"
                    placeholder="Votre message..."
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                {successMsg && (
                  <p className="text-green-600 font-medium">{successMsg}</p>
                )}
                {errorMsg && (
                  <p className="text-red-600 font-medium">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600"
                  disabled={loading}
                >
                  {loading ? "Envoi en cours..." : "Envoyer le Message"}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Nos Coordonnées</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Adresse</h3>
                    <p className="text-gray-600">
                      9 Rue El Milaha, Menzah 8, 2037, ARIANA
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Téléphone</h3>
                    <p className="text-gray-600">+216 26 888 073</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">
                      service.commercial@pneushop.tn
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Horaires</h3>
                    <p className="text-gray-600">
                      Lundi - Veendredi: 8h00 - 18h00 <br />
                      Samedi: 8h00 - 15h00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}