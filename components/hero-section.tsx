"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button"
import { ArrowDown, Mail } from "lucide-react"

const IMAGES = [
  "/images/hero-images/hero-1.webp",
  "/images/hero-images/hero-2.webp",
  "/images/hero-images/hero-3.webp",
  "/images/hero-images/hero-4.webp",
  "/images/hero-images/hero-5.webp",
  "/images/hero-images/hero-6.webp",
  "/images/hero-images/hero-7.webp",
  "/images/hero-images/hero-8.webp",
  "/images/hero-images/hero-19.webp",
  // add more images here if you want a longer slideshow
];

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const rotateSeconds = 6; // seconds between slides

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Preload images into the browser cache (non-blocking)
    IMAGES.forEach((src) => {
      const img = new Image(); 
      img.src = src;
    });

    // Start automatic rotation
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, rotateSeconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // manual controls (optional)
  const prev = () => setIndex((i) => (i - 1 + IMAGES.length) % IMAGES.length);
  const next = () => setIndex((i) => (i + 1) % IMAGES.length);
  const goTo = (i: number) => setIndex(((i % IMAGES.length) + IMAGES.length) % IMAGES.length);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background slideshow layers */}
      <div aria-hidden className="hidden md:block absolute inset-0 z-0">
        {IMAGES.map((src, i) => {
          const isActive = i === index;
          return (
          <div
            key={src + i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out transform-gpu ${
              isActive ? "opacity-60 scale-100 z-10" : "opacity-0 scale-[1.03] z-0"
            }`}
            // keep images out of accessibility tree
            aria-hidden
            role="presentation"
          >
            <NextImage
              src={src}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1920px"
              className="object-cover object-center"
              // eager-load the active slide, lazy-load the rest
              loading={isActive ? "eager" : "lazy"}
              quality={80}
              priority={false}
            />
            {/* subtle overlay to keep text readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20 pointer-events-none" />
          </div>
        );
        })}
      </div>
      {/* Background slideshow layers - for Mobile Screens*/}
      <div aria-hidden className="md:hidden absolute inset-0 z-0">
        {IMAGES.map((src, i) => {
          const isActive = i === index;
          return (
          <div
            key={src + i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out transform-gpu ${
              isActive ? "opacity-60 scale-100 z-10" : "opacity-0 scale-[1.03] z-0"
            }`}
            // keep images out of accessibility tree
            aria-hidden
            role="presentation"
          >
            <NextImage
              src={src}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1920px"
              className="object-cover object-center"
              // eager-load the active slide, lazy-load the rest
              loading={isActive ? "eager" : "lazy"}
              quality={80}
              priority={false}
            />
            {/* subtle overlay to keep text readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20 pointer-events-none" />
          </div>
        );
        })}
      </div>

      {/* Optional subtle pattern / texture (you can keep or remove) */}
      {/* <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23006e46' fillOpacity='0.06'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div> */}

      <div className="hidden md:block container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance mb-6">
            Environmental Consultant
            <span className="block text-primary mt-2">Expert Solutions</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground text-balance text-prety mb-8 max-w-2xl mx-auto">
            Over 10 years of specialized experience in hydrology, air quality & noise assessment, and GIS & remote
            sensing. Delivering professional environmental consultancy services to firms and organizations worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <a href="#contact">
                <Mail className="mr-2 h-5 w-5" />
                Get In Touch
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent" asChild>
              <a href="#portfolio">View My Work</a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            {/* <button onClick={prev} aria-label="Previous slide" className="p-2 rounded-full bg-black/30 hover:bg-black/40">
              ‹
            </button> */}
            <div className="flex items-center gap-2">
              {/* slide indicators */}
              {IMAGES.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index ? "scale-125 bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
            {/* <button onClick={next} aria-label="Next slide" className="p-2 rounded-full bg-black/30 hover:bg-black/40">
              ›
            </button> */}
          </div>

          <div className="animate-bounce">
            <Button className="bg-transparent hover:border-1 hover:bg-transparent hover:border-primary hover:rounded-full">
            <a href="#about" aria-label="Scroll to about section">
              <ArrowDown className="h-6 w-6 mx-auto text-bold text-muted-foreground" />
            </a>
            </Button>
          </div>
        </div>
      </div>

      { /* hero section - mobile screens */}
      <div className="md:hidden container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold text-balance mb-6 mt-2">
            Environmental Consultant
            <span className="block text-primary mt-2">Expert Solutions</span>
          </h1>

          <p className="text-lg sm:text-lg text-foreground text-balance text-prety mb-8 max-w-2xl mx-auto">
            Over 10 years of specialized experience in hydrology, air quality & noise assessment, and GIS & remote
            sensing. Delivering professional environmental consultancy services to firms and organizations worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-6 py-2" asChild>
              <a href="#contact">
                <Mail className="mr-2 h-5 w-5" />
                Get In Touch
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-6 py-2 bg-transparent" asChild>
              <a href="#portfolio">View My Work</a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            {/* <button onClick={prev} aria-label="Previous slide" className="p-2 rounded-full bg-black/30 hover:bg-black/40">
              ‹
            </button> */}
            <div className="flex items-center gap-2">
              {/* slide indicators */}
              {IMAGES.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`w-1 h-1 rounded-full transition-all ${
                    i === index ? "scale-125 bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
            {/* <button onClick={next} aria-label="Next slide" className="p-2 rounded-full bg-black/30 hover:bg-black/40">
              ›
            </button> */}
          </div>

          <div className="animate-bounce">
            <Button className="bg-transparent hover:border-1 hover:bg-transparent hover:border-primary hover:rounded-full">
            <a href="#about" aria-label="Scroll to about section">
              <ArrowDown className="h-6 w-6 mx-auto text-bold text-muted-foreground" />
            </a>
            </Button>
          </div>
        </div>
      </div>

    </section>
  )
}
