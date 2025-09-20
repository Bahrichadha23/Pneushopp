import Image from "next/image";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold mb-6">NOUS CONTACTER :</h3>
            <div className="space-y-3 text-sm sm:text-base">
              <p>
                <strong>Tél. :</strong> +216 29 353 666
              </p>
              <p>
                <strong>Adresse :</strong> 9 Rue El Milaha, Menzah 8, 2037, ARIANA
              </p>
              <p>
                <strong>E-mail :</strong> service.commercial@pneushop.tn
              </p>
              <p>
                <strong>Horaires :</strong> LUNDI - SAMEDI
              </p>
            </div>
          </div>

          {/* Social Media and Logo */}
          <div className="flex flex-col items-center lg:items-end space-y-6">
            <div className="text-center lg:text-right">
              <h3 className="text-lg font-bold mb-4">SUIVEZ-NOUS</h3>
              <div className="flex space-x-4 justify-center lg:justify-end">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-yellow-400 transition"
                >
                  <FaFacebookF size={18} />
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-yellow-400 transition"
                >
                  <FaInstagram size={18} />
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/21629353666"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-yellow-400 transition"
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
            </div>

            {/* Logo */}
            <div>
           <Image src="/black-logo.png" alt="Logo" width={200} height={200} />
           </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="bg-gray-100 text-black py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm leading-relaxed">
            © Droits d&apos;auteur 2024 pneushop.
            <br className="block sm:hidden" />
            par Innovation-wep.pro Tunisie
          </p>
        </div>
      </div>
    </footer>
  );
}
