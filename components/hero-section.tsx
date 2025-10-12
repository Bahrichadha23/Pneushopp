"use client";

export default function HeroSection() {
  return (
    <>
      {/* Mobile View - Original 848x480 aspect ratio, no spaces */}
      <section className="relative w-full aspect-[848/480] bg-black overflow-hidden md:hidden">
        <video
          src="/hero-video.mp4"
          className="w-full h-full object-fill"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

      {/* Desktop View - With padding for corners */}
      <section className="hidden md:flex relative w-full h-screen overflow-hidden items-center justify-center p-10">
        <video
          src="/hero-video.mp4"
          className="max-w-full max-h-full object-contain px-10"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>
    </>
  );
}