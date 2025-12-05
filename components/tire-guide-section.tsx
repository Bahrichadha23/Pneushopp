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
    <section className="bg-white mt-2 lg:ml-58 lg:mr-58 m-14">
      <Image
        src={"/tire-guide-image.jpeg"}
        alt="Guide des pneus"
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto animate"
      />
      <div className="bg-black p-0 m-0 text-white text-center h-10 flex items-center justify-center">
        Recherche de pneu par dimensions
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form */}
        <div className="bg-zinc-200 py-12 px-6">
          <div className="space-y-6 text-center">
            {/* Largeur */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Largeur*
              </label>
              <select
                value={filters.width}
                onChange={(e) => handleChange("width", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la largeur</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="19">19</option>
                <option value="20">20</option>
                <option value="21">21</option>
                <option value="22">22</option>
                <option value="23">23</option>
                <option value="24">24</option>
                <option value="25">25</option>
                <option value="26">26</option>
                <option value="27">27</option>
                <option value="28">28</option>
                <option value="29">29</option>
                <option value="50">50</option>
                <option value="60">60</option>
                <option value="70">70</option>
                <option value="80">80</option>
                <option value="90">90</option>
                <option value="100">100</option>
                <option value="105">105</option>
                <option value="110">110</option>
                <option value="115">115</option>
                <option value="120">120</option>
                <option value="125">125</option>
                <option value="135">135</option>
                <option value="145">145</option>
                <option value="155">155</option>
                <option value="165">165</option>
                <option value="175">175</option>
                <option value="185">185</option>
                <option value="190">190</option>
                <option value="195">195</option>
                <option value="205">205</option>
                <option value="215">215</option>
                <option value="225">225</option>
              </select>
            </div>

            {/* Hauteur */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Hauteur*
              </label>
              <select
                value={filters.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la hauteur</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="30">30</option>
                <option value="35">35</option>
                <option value="40">40</option>
                <option value="45">45</option>
                <option value="50">50</option>
                <option value="55">55</option>
                <option value="60">60</option>
                <option value="65">65</option>
                <option value="69">69</option>
                <option value="70">70</option>
                <option value="75">75</option>
                <option value="80">80</option>
                <option value="85">85</option>
                <option value="90">90</option>
                <option value="95">95</option>
                <option value="100">100</option>
              </select>
            </div>

            {/* Diamètre */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Diamètre*
              </label>
              <select
                value={filters.diameter}
                onChange={(e) => handleChange("diameter", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir le diamètre</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
                <option value="19">19</option>
                <option value="20">20</option>
                <option value="21">21</option>
                <option value="22">22</option>
                <option value="23">23</option>
                <option value="24">24</option>
                <option value="17.5">17.5</option>
                <option value="19.5">19.5</option>
                <option value="22.5">22.5</option>
                <option value="39.0">39.0</option>
              </select>
            </div>

            {/* Charge */}
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Charge*
              </label>
              <select
                value={filters.loadIndex}
                onChange={(e) => handleChange("loadIndex", e.target.value)}
                className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
              >
                <option value="">Choisir la charge</option>
                <option value="19">19</option>
                <option value="80">80</option>
                <option value="81">81</option>
                <option value="82">82</option>
                <option value="83">83</option>
                <option value="84">84</option>
                <option value="85">85</option>
                <option value="86">86</option>
                <option value="87">87</option>
                <option value="88">88</option>
                <option value="89">89</option>
                <option value="90">90</option>
                <option value="91">91</option>
                <option value="92">92</option>
                <option value="93">93</option>
                <option value="94">94</option>
                <option value="95">95</option>
                <option value="96">96</option>
                <option value="97">97</option>
                <option value="98">98</option>
                <option value="99">99</option>
                <option value="100">100</option>
                <option value="101">101</option>
                <option value="102">102</option>
                <option value="103">103</option>
                <option value="104">104</option>
                <option value="105">105</option>
                <option value="106">106</option>
                <option value="107">107</option>
                <option value="108">108</option>
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
                <p className="text-black font-bold">{p.price} DT</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
