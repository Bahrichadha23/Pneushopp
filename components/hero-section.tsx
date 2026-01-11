"use client";

export default function HeroSection() {
  return (
    <>
      {/* Mobile View - Original 848x480 aspect ratio, no spaces */}
      <section className="relative w-full aspect-[848/480] bg-black overflow-hidden md:hidden">
        <video
          src="/hero-video.mp4"
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

      {/* Desktop View - With padding for corners */}
      <section className="hidden md:block relative w-full h-screen overflow-hidden">
        <video
          src="/hero-video.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>
    </>
  );
}