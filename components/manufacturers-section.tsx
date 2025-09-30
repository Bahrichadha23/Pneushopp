"use client";
import { motion } from "framer-motion";
export default function ManufacturersSection() {
  const manufacturers = [
    { name: "BARUM", logo: "/barum-logo.jpg" },
    { name: "AMINE", logo: "/amine.png" },
    { name: "BRIDGESTONE", logo: "/bridgestone.png" },
    { name: "CONTINENTAL", logo: "/continental-logo.jpg" },
    { name: "DAYTON", logo: "/dayton.png" },
    { name: "PIRELLI", logo: "/pirelli-tire-brand-logo.png" },
    { name: "GENERAL", logo: "/general-tire-logo.jpg" },
    { name: "GOODYEAR", logo: "/goodyear-logo.jpg" },
    { name: "NEXEN", logo: "/nexen-logo.png" },
    { name: "Waterfall", logo: "/logo_waterfall.png" },
    { name: "KLEBER", logo: "/kleber.png" },
    { name: "hankook", logo: "/hankook.jpg" },
    { name: "lassa-logo", logo: "/lassa-logo.jpg" },
    { name: "fulda", logo: "/Logo_Fulda.jpg" },
  ];

  return (
    <>
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              PRINCIPAUX FABRICANTS
            </h2>
            <p className="text-lg text-gray-600">TOP VENTES</p>
          </div>

          {/* Seamless Marquee */}
          <div className="relative w-full overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap gap-12">
              {manufacturers.map((manufacturer, index) => (
                <div
                  key={`row1-${index}`}
                  className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300 min-w-[160px]"
                >
                  <div className="h-20 w-32 flex items-center justify-center">
                    <img
                      src={manufacturer.logo}
                      alt={`${manufacturer.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              ))}

              {/* Duplicate row for seamless effect */}
              {manufacturers.map((manufacturer, index) => (
                <div
                  key={`row2-${index}`}
                  className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300 min-w-[160px]"
                >
                  <div className="h-20 w-32 flex items-center justify-center">
                    <img
                      src={manufacturer.logo}
                      alt={`${manufacturer.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-marquee {
              display: flex;
              animation: marquee 30s linear infinite;
              width: max-content;
            }
          `}</style>
        </div>
      </section>
    </>
  );
}
