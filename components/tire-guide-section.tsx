// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import { API_URL } from "@/lib/config"; // <- make sure API_URL points to Django backend

// export default function TireGuideSection() {
//   const [filters, setFilters] = useState({
//     width: "",
//     height: "",
//     diameter: "",
//     loadIndex: "",
//     speedRating: "",
//   });

//   const [products, setProducts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const handleChange = (field: string, value: string) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSearch = async () => {
//     setLoading(true);
//     try {
//       const query = new URLSearchParams(filters).toString();
//       const res = await fetch(`${API_URL}/products/?${query}`);
//       const data = await res.json();
//       setProducts(data.results || []);
//     } catch (err) {
//       console.error("Erreur de recherche pneus:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <section className="bg-white mt-2 lg:ml-58 lg:mr-58 m-14">
//       <Image
//         src={"/tire-guide-image.jpeg"}
//         alt="Guide des pneus"
//         width={0}
//         height={0}
//         sizes="100vw"
//         className="w-full h-auto animate"
//       />
//       <div className="bg-black p-0 m-0 text-white text-center h-10 flex items-center justify-center">
//         Recherche de pneu par dimensions
//       </div>

//       <div className="max-w-7xl mx-auto">
//         {/* Form */}
//         <div className="bg-yellow-300 py-12 px-6">
//           <div className="space-y-6 text-center">
//             {/* Largeur */}
//             <div>
//               <label className="block text-sm font-bold text-black mb-1">
//                 Largeur*
//               </label>
//               <select
//                 value={filters.width}
//                 onChange={(e) => handleChange("width", e.target.value)}
//                 className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
//               >
//                 <option value="">Choisir la largeur</option>
//                 <option value="8">8</option>
//                 <option value="9">9</option>
//                 <option value="10">10</option>
//                 <option value="11">11</option>
//                 <option value="12">12</option>
//                 <option value="19">19</option>
//                 <option value="20">20</option>
//                 <option value="21">21</option>
//                 <option value="22">22</option>
//                 <option value="23">23</option>
//                 <option value="24">24</option>
//                 <option value="25">25</option>
//                 <option value="26">26</option>
//                 <option value="27">27</option>
//                 <option value="28">28</option>
//                 <option value="29">29</option>
//                 <option value="50">50</option>
//                 <option value="60">60</option>
//                 <option value="70">70</option>
//                 <option value="80">80</option>
//                 <option value="90">90</option>
//                 <option value="100">100</option>
//                 <option value="105">105</option>
//                 <option value="110">110</option>
//                 <option value="115">115</option>
//                 <option value="120">120</option>
//                 <option value="125">125</option>
//                 <option value="135">135</option>
//                 <option value="145">145</option>
//                 <option value="155">155</option>
//                 <option value="165">165</option>
//                 <option value="175">175</option>
//                 <option value="185">185</option>
//                 <option value="190">190</option>
//                 <option value="195">195</option>
//                 <option value="205">205</option>
//                 <option value="215">215</option>
//                 <option value="225">225</option>
//                 <option value="235">235</option>
//                 <option value="245">245</option>
//                 <option value="255">255</option>
//                 <option value="265">265</option>
//                 <option value="275">275</option>
//                 <option value="285">285</option>
//                 <option value="295">295</option>
//                 <option value="315">315</option>
//                 <option value="325">325</option>
//                 <option value="335">335</option>
//                 <option value="355">355</option>
//                 <option value="365">365</option>
//                 <option value="375">375</option>
//                 <option value="385">385</option>
//                 <option value="425">425</option>
//                 <option value="445">445</option>
//                 <option value="455">455</option>
//                 <option value="495">495</option>
//                 <option value="825">825</option>
//               </select>
//             </div>

//             {/* Hauteur */}
//             <div>
//               <label className="block text-sm font-bold text-black mb-1">
//                 Hauteur*
//               </label>
//               <select
//                 value={filters.height}
//                 onChange={(e) => handleChange("height", e.target.value)}
//                 className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
//               >
//                 <option value="">Choisir la hauteur</option>
//                 <option value="7">7</option>
//                 <option value="8">8</option>
//                 <option value="9">9</option>
//                 <option value="10">10</option>
//                 <option value="30">30</option>
//                 <option value="35">35</option>
//                 <option value="40">40</option>
//                 <option value="45">45</option>
//                 <option value="50">50</option>
//                 <option value="55">55</option>
//                 <option value="60">60</option>
//                 <option value="65">65</option>
//                 <option value="69">69</option>
//                 <option value="70">70</option>
//                 <option value="75">75</option>
//                 <option value="80">80</option>
//                 <option value="85">85</option>
//                 <option value="90">90</option>
//                 <option value="95">95</option>
//                 <option value="100">100</option>
//               </select>
//             </div>

//             {/* Diamètre */}
//             <div>
//               <label className="block text-sm font-bold text-black mb-1">
//                 Diamètre*
//               </label>
//               <select
//                 value={filters.diameter}
//                 onChange={(e) => handleChange("diameter", e.target.value)}
//                 className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
//               >
//                 <option value="">Choisir le diamètre</option>
//                 <option value="10">10</option>
//                 <option value="11">11</option>
//                 <option value="12">12</option>
//                 <option value="13">13</option>
//                 <option value="14">14</option>
//                 <option value="15">15</option>
//                 <option value="16">16</option>
//                 <option value="17">17</option>
//                 <option value="18">18</option>
//                 <option value="19">19</option>
//                 <option value="20">20</option>
//                 <option value="21">21</option>
//                 <option value="22">22</option>
//                 <option value="23">23</option>
//                 <option value="24">24</option>
//                 <option value="17.5">17.5</option>
//                 <option value="19.5">19.5</option>
//                 <option value="22.5">22.5</option>
//                 <option value="39.0">39.0</option>
//               </select>
//             </div>

//             {/* Charge */}
//             <div>
//               <label className="block text-sm font-bold text-black mb-1">
//                 Charge*
//               </label>
//               <select
//                 value={filters.loadIndex}
//                 onChange={(e) => handleChange("loadIndex", e.target.value)}
//                 className="w-full px-4 py-3 border text-center border-black rounded text-black focus:outline-none appearance-none"
//               >
//                 <option value="">Choisir la charge</option>
//                 <option value="19">19</option>
//                 <option value="80">80</option>
//                 <option value="81">81</option>
//                 <option value="82">82</option>
//                 <option value="83">83</option>
//                 <option value="84">84</option>
//                 <option value="85">85</option>
//                 <option value="86">86</option>
//                 <option value="87">87</option>
//                 <option value="88">88</option>
//                 <option value="89">89</option>
//                 <option value="90">90</option>
//                 <option value="91">91</option>
//                 <option value="92">92</option>
//                 <option value="93">93</option>
//                 <option value="94">94</option>
//                 <option value="95">95</option>
//                 <option value="96">96</option>
//                 <option value="97">97</option>
//                 <option value="98">98</option>
//                 <option value="99">99</option>
//                 <option value="100">100</option>
//                 <option value="101">101</option>
//                 <option value="102">102</option>
//                 <option value="103">103</option>
//                 <option value="104">104</option>
//                 <option value="105">105</option>
//                 <option value="106">106</option>
//                 <option value="107">107</option>
//                 <option value="108">108</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Button */}
//         <div className="text-center pt-8">
//           <motion.button
//             onClick={handleSearch}
//             className="bg-black text-white font-bold p-3 rounded hover:bg-gray-800 transition"
//             initial={{ opacity: 0, x: 0 }}
//             animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
//             transition={{
//               opacity: { duration: 1 },
//               x: { duration: 0.6, ease: "easeInOut", delay: 1 },
//             }}
//           >
//             {loading ? "Recherche..." : "Rechercher"}
//           </motion.button>
//         </div>

//         {/* Résultats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
//           {products.map((p) => (
//             <Link key={p.id} href={`/boutique/${p.slug}`}>
//               <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
//                 <img
//                   src={p.image}
//                   alt={p.name}
//                   className="w-full h-40 object-contain mb-2"
//                 />
//                 <h3 className="font-bold text-lg">{p.name}</h3>
//                 <p className="text-sm text-gray-600">{p.brand}</p>
//                 <p className="text-black font-bold">{p.price} DT</p>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }"

"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/config";

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

  // Curved dimension text (rendered via SVG textPath for perfect baseline)
  const dimensionText = `${filters.width || "205"} | ${filters.height || "55"} | R${filters.diameter || "16"}`;

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

      {/* Animated Tire Section */}
      <div className="relative bg-white py-6 overflow-hidden">
        <motion.div
          className="relative w-full max-w-3xl mx-auto"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <svg
            viewBox="0 0 800 250"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            style={{ filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.25))" }}
          >
            <defs>
              <radialGradient id="outerRubber" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#5a5a5a" />
                <stop offset="30%" stopColor="#3a3a3a" />
                <stop offset="70%" stopColor="#252525" />
                <stop offset="100%" stopColor="#0f0f0f" />
              </radialGradient>
              
              <radialGradient id="innerRubber" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#3a3a3a" />
                <stop offset="50%" stopColor="#1f1f1f" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </radialGradient>

              <linearGradient id="rimShine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f5f5f5" />
                <stop offset="70%" stopColor="#e8e8e8" />
                <stop offset="100%" stopColor="#d0d0d0" />
              </linearGradient>

              <clipPath id="topHalf">
                <rect x="0" y="0" width="800" height="280" />
              </clipPath>

              <filter id="innerShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Path for curved dimension text (top half arc, inside viewBox) */}
              <path id="dimArc" d="M 232 215 A 168 168 0 0 0 568 215" fill="none" />
            </defs>

            <g clipPath="url(#topHalf)">
              {/* Main tire outer circle */}
              <circle 
                cx="400" 
                cy="280" 
                r="200" 
                fill="url(#outerRubber)"
              />

              {/* Detailed tread pattern */}
              <g>
                {Array.from({ length: 70 }).map((_, i) => {
                  const angle = (i * 5.14) - 180;
                  const rad = (angle * Math.PI) / 180;
                  const x = 400 + Math.cos(rad) * 200;
                  const y = 280 + Math.sin(rad) * 200;
                  
                  if (y < 280 && angle > -180 && angle < 0) {
                    return (
                      <g key={i}>
                        <motion.rect
                          x={x - 5}
                          y={y - 8}
                          width="10"
                          height="16"
                          rx="1"
                          fill="#2a2a2a"
                          transform={`rotate(${angle + 90} ${x} ${y})`}
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: [0.6, 0.95, 0.6] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.015,
                            ease: "easeInOut"
                          }}
                        />
                        <rect
                          x={x - 2.5}
                          y={y - 5}
                          width="5"
                          height="10"
                          rx="0.5"
                          fill="#4a4a4a"
                          transform={`rotate(${angle + 90} ${x} ${y})`}
                        />
                        <line
                          x1={x - 4}
                          y1={y}
                          x2={x + 4}
                          y2={y}
                          stroke="#1a1a1a"
                          strokeWidth="1"
                          transform={`rotate(${angle + 90} ${x} ${y})`}
                        />
                      </g>
                    );
                  }
                  return null;
                })}
              </g>

              {/* Middle sidewall */}
              <circle 
                cx="400" 
                cy="280" 
                r="175" 
                fill="url(#innerRubber)"
              />

              {/* Sidewall detail lines */}
              <circle 
                cx="400" 
                cy="280" 
                r="172" 
                fill="none" 
                stroke="#1a1a1a" 
                strokeWidth="2"
                opacity="0.7"
              />
              <circle 
                cx="400" 
                cy="280" 
                r="165" 
                fill="none" 
                stroke="#2a2a2a" 
                strokeWidth="1.5"
                opacity="0.5"
              />
              <circle 
                cx="400" 
                cy="280" 
                r="158" 
                fill="none" 
                stroke="#1a1a1a" 
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Inner rim area */}
              <circle 
                cx="400" 
                cy="280" 
                r="140" 
                fill="url(#rimShine)"
                filter="url(#innerShadow)"
              />

              {/* Rim highlight edge */}
              <circle 
                cx="400" 
                cy="280" 
                r="140" 
                fill="none" 
                stroke="#c0c0c0" 
                strokeWidth="3"
              />

              {/* Inner rim shadow */}
              <circle 
                cx="400" 
                cy="280" 
                r="128" 
                fill="none" 
                stroke="#b0b0b0" 
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Curved dimension text rendered on arc for perfect baseline */}
              <text
                fontSize="40"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
                fill="white"
                textAnchor="middle"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.9)" }}
              >
                <textPath xlinkHref="#dimArc" href="#dimArc" startOffset="50%" style={{ letterSpacing: 1.5 }}>
                  {dimensionText}
                </textPath>
              </text>



              {/* Load index */}
              {filters.loadIndex && (
                <motion.text
                  x="560"
                  y="190"
                  fontSize="28"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  fill="white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                >
                  {filters.loadIndex}
                </motion.text>
              )}

              {/* Subtle shine effect */}
              <ellipse
                cx="320"
                cy="210"
                rx="80"
                ry="40"
                fill="white"
                opacity="0.08"
                transform="rotate(-25 320 210)"
              />
            </g>
          </svg>
        </motion.div>
      </div>

      <div className="bg-black p-0 m-0 text-white text-center h-10 flex items-center justify-center">
        Recherche de pneu par dimensions
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Form */}
        <div className="bg-yellow-300 py-12 px-6">
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
                <option value="235">235</option>
                <option value="245">245</option>
                <option value="255">255</option>
                <option value="265">265</option>
                <option value="275">275</option>
                <option value="285">285</option>
                <option value="295">295</option>
                <option value="315">315</option>
                <option value="325">325</option>
                <option value="335">335</option>
                <option value="355">355</option>
                <option value="365">365</option>
                <option value="375">375</option>
                <option value="385">385</option>
                <option value="425">425</option>
                <option value="445">445</option>
                <option value="455">455</option>
                <option value="495">495</option>
                <option value="825">825</option>
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