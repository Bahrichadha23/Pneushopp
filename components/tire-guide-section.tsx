
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/config"; // <- make sure API_URL points to Django backend

export default function TireGuideSection() {
  const [filters, setFilters] = useState({
    width: "",
    height: "",
    diameter: "",
    loadIndex: "",
    speedRating: "",
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_URL}/products/?${query}`);
      const data = await res.json();
      setProducts(data.results || []);
    } catch (err) {
      console.error("Erreur de recherche pneus:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white bg-white mt-2 lg:ml-58 lg:mr-58 m-14">
      <Image
        src={"/tire-guide-image.jpeg"}
        alt="Tire Guide"
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto"
      />
      <div className="bg-black p-0 m-0 text-white text-center h-10 flex items-center justify-center">
        Recherche de pneu par dimensions
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form */}
        <div className="bg-yellow-400 py-12 px-6">
          <div className="space-y-6 text-center">
            {/* Largeur */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Largeur *
              </label>
              <select
                value={filters.width}
                onChange={(e) => handleChange("width", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la largeur</option>
                <option value="225">225</option>
                <option value="235">235</option>
                <option value="245">245</option>
              </select>
            </div>

            {/* Hauteur */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Hauteur *
              </label>
              <select
                value={filters.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la hauteur</option>
                <option value="45">45</option>
                <option value="50">50</option>
                <option value="55">55</option>
              </select>
            </div>

            {/* Diamètre */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Diamètre *
              </label>
              <select
                value={filters.diameter}
                onChange={(e) => handleChange("diameter", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir le diamètre</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
              </select>
            </div>

            {/* Charge */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Charge
              </label>
              <select
                value={filters.loadIndex}
                onChange={(e) => handleChange("loadIndex", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la charge</option>
                <option value="91">91</option>
                <option value="95">95</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="text-center pt-8">
          <motion.button
            onClick={handleSearch}
            className="bg-black text-white font-bold p-3 rounded hover:bg-gray-800 transition"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
            transition={{
              opacity: { duration: 1 },
              x: { duration: 0.6, ease: "easeInOut", delay: 1 },
            }}
          >
            {loading ? "Recherche..." : "Rechercher"}
          </motion.button>
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {products.map((p) => (
            <Link key={p.id} href={`/boutique/${p.slug}`}>
              <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-40 object-contain mb-2"
                />
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.brand}</p>
                <p className="text-black font-bold">{p.price} €</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
