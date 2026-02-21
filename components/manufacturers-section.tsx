"use client";

export default function ManufacturersSection() {
  const manufacturers = [
    { name: "BARUM",       logo: "/barum-logo.jpg",                w: 110, h: 80 },
    { name: "AMINE",       logo: "/amine.png",                     w: 100, h: 60 },
    { name: "BRIDGESTONE", logo: "/bridgestone.png",               w: 160, h: 32 },
    { name: "CONTINENTAL", logo: "/continental-logo.jpg",          w: 120, h: 35 },
    { name: "DAYTON",      logo: "/dayton.png",                    w: 130, h: 40 },
    { name: "PIRELLI",     logo: "/pirelli-tire-brand-logo.png",   w: 120, h: 35 },
    { name: "GENERAL",     logo: "/general-tire-logo.jpg",         w: 130, h: 65 },
    { name: "GOODYEAR",    logo: "/goodyear-logo.jpg",             w: 120, h: 60 },
    { name: "NEXEN",       logo: "/nexen-logo.png",                w: 110, h: 70 },
    { name: "WATERFALL",   logo: "/logo_waterfall.png",            w: 120, h: 90 },
    { name: "KLEBER",      logo: "/kleber.png",                    w: 110, h: 30 },
    { name: "HANKOOK",     logo: "/hankook.jpg",                   w: 120, h: 90 },
    { name: "LASSA",       logo: "/lassa-logo.jpg",                w: 100, h: 100 },
    { name: "FULDA",       logo: "/Logo_Fulda.jpg",                w: 110, h: 44 },
    { name: "ALLIANCE",    logo: "/alliance.png",                  w: 130, h: 40 },
    { name: "APOLLO",      logo: "/APOLLO.png",                    w: 120, h: 44 },
    { name: "ARMOUR",      logo: "/ARMOUR.png",                    w: 50,  h: 35 },
    { name: "BF GOODRICH", logo: "/BF GOODRICH.png",               w: 130, h: 44 },
    { name: "DEBICA",      logo: "/DEBICA.png",                    w: 110, h: 100 },
    { name: "DUNLOP",      logo: "/dunlop.png",                    w: 130, h: 44 },
    { name: "FIRESTONE",   logo: "/FIRESTONE.png",                 w: 130, h: 40 },
    { name: "LAUFENN",     logo: "/laufenn_logo.png",              w: 120, h: 100 },
    { name: "MAXXIS",      logo: "/MAXXIS.avif",                   w: 120, h: 100 },
    { name: "MICHELIN",    logo: "/MICHELIN.png",                  w: 130, h: 48 },
    { name: "SEMPERIT",    logo: "/SEMPERIT.png",                  w: 120, h: 100 },
    { name: "TIGAR",       logo: "/tigar-tire-brand-logo.png",     w: 110, h: 60 },
    { name: "WESTLAKE",    logo: "/WEST LAKE.png",                 w: 130, h: 100 },
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
          <div className="flex gap-12 animate-marquee items-center">
            {[...manufacturers, ...manufacturers].map((manufacturer, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: manufacturer.w, height: manufacturer.h }}
              >
                <img
                  src={manufacturer.logo}
                  alt={manufacturer.name}
                  style={{ width: manufacturer.w, height: manufacturer.h }}
                  className="object-contain transition-transform duration-300 hover:scale-105"
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
