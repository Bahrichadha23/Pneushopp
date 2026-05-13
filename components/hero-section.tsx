"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function HeroSection() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);

  // S'assurer que les vidéos démarrent bien muettes (autoplay exige muted)
  useEffect(() => {
    [videoRef1, videoRef2].forEach(ref => {
      if (ref.current) {
        ref.current.muted = true;
        ref.current.volume = 1;
      }
    });
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    [videoRef1, videoRef2].forEach(ref => {
      if (!ref.current) return;
      ref.current.muted = newMuted;
      ref.current.volume = 1;
      // Relancer la lecture pour débloquer l'audio (politique navigateur)
      if (!newMuted) {
        ref.current.play().catch(() => {});
      }
    });
    setIsMuted(newMuted);
  };

  return (
    <section className="w-full py-4 md:py-6 bg-gray-50 flex justify-center">
      <div className="relative w-full max-w-7xl mx-auto px-2 md:px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">

          {/* Mobile video */}
          <video
            ref={videoRef1}
            src="/hero-video.mp4"
            className="w-full block md:hidden"
            style={{ maxHeight: "75vh", objectFit: "cover" }}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Desktop video */}
          <video
            ref={videoRef2}
            src="/hero-video.mp4"
            className="w-full hidden md:block"
            style={{ maxHeight: "85vh", objectFit: "cover" }}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Bouton son */}
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-sm font-medium px-3 py-2 rounded-full transition-all duration-200 backdrop-blur-sm"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Son désactivé</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Son activé</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
