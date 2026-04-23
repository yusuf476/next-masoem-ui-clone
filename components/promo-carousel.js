"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop",
    badge: "Diskon Kampus 🎓",
    title: "Sale Akhir Semester",
    desc: "Diskon hingga 50% untuk semua merchandise resmi dan kebutuhan wisuda Anda.",
    link: "/products?category=merchandise",
    cta: "Belanja Sekarang"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2574&auto=format&fit=crop",
    badge: "Menu Baru 🍔",
    title: "Kuliner Kantin Cepat",
    desc: "Lapar setelah matkul? Banyak pilihan makanan siap saji yang bikin semangat lagi.",
    link: "/products?category=makanan",
    cta: "Lihat Menu"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop",
    badge: "Restock 📚",
    title: "Alat Tulis & Buku",
    desc: "Perlengkapan komplit untuk tugas akhir dan presentasi tersedia kembali.",
    link: "/products?category=atk",
    cta: "Cek Stok"
  }
];

export default function PromoCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="carousel-container">
      <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div key={slide.id} className="carousel-slide">
            <div className="carousel-bg" style={{ backgroundImage: `url(${slide.image})` }}>
              <div className="carousel-overlay"></div>
            </div>
            <div className="carousel-content">
              <span className="badge badge-strong" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', marginBottom: '16px', display: 'inline-block' }}>{slide.badge}</span>
              <h1 className="hero-title">{slide.title}</h1>
              <p style={{ maxWidth: '440px', color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '24px' }}>{slide.desc}</p>
              <Link href={slide.link} className="button button-primary" style={{ background: 'white', color: 'var(--primary-dark)', display: 'inline-flex' }}>
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === current ? "active" : ""}`}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
