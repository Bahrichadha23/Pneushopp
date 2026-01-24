"use client";

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
    { name: "WATERFALL", logo: "/logo_waterfall.png" },
    { name: "KLEBER", logo: "/kleber.png" },
    { name: "HANKOOK", logo: "/hankook.jpg" },
    { name: "LASSA", logo: "/lassa-logo.jpg" },
    { name: "FULDA", logo: "/Logo_Fulda.jpg" },
    { name: "ALLIANCE", logo: "/alliance.png" },
    { name: "APOLLO", logo: "/APOLLO.png" },
    { name: "ARMOUR", logo: "/ARMOUR.png" },
    { name: "BF GOODRICH", logo: "/BF GOODRICH.png" },
    { name: "DEBICA", logo: "/DEBICA.png" },
    { name: "DUNLOP", logo: "/dunlop.png" },
    { name: "FIRESTONE", logo: "/FIRESTONE.png" },
    { name: "LAUFENN", logo: "/laufenn_logo.png" },
    { name: "MAXXIS", logo: "/MAXXIS.avif" },
    { name: "MICHELIN", logo: "/MICHELIN.png" },
    { name: "SEMPERIT", logo: "/SEMPERIT.png" },
    { name: "TIGAR", logo: "/tigar-tire-brand-logo.png" },
    { name: "WESTLAKE", logo: "/WEST LAKE.png" },
  ];

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            PRINCIPAUX FABRICANTS
          </h2>
          <p className="text-lg text-gray-600 mt-2">TOP VENTES</p>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden">
          <div className="flex gap-16 animate-marquee items-center">
            {[...manufacturers, ...manufacturers].map((manufacturer, index) => (
              <div
                key={index}
                className="flex items-center justify-center min-w-[180px]"
              >
                <img
                  src={manufacturer.logo}
                  alt={manufacturer.name}
                  className="
                    max-h-20 max-w-[160px]
                    object-contain
                    transition-transform duration-300
                    hover:scale-105
                  "
                />
              </div>
            ))}
          </div>
        </div>

        {/* Animation */}
        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 35s linear infinite;
            width: max-content;
          }
        `}</style>
      </div>
    </section>
  );
}
