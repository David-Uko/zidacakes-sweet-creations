import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { products } from "@/data/products";

const CATEGORIES = ["All", "Wedding Cakes", "Birthday Cakes", "Custom Cakes"];

const categoryColors: Record<string, string> = {
  "Wedding Cakes": "#d4af7a",
  "Birthday Cakes": "#e8a0b4",
  "Custom Cakes": "#a8c4b8",
};

const styles: Record<string, React.CSSProperties> = {
  grainOverlay: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat",
    backgroundSize: "128px",
  },
  heroGlow: {
    background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,175,122,0.12) 0%, transparent 70%)",
  },
  heroTitle: {
    fontFamily: "'Georgia', serif",
    letterSpacing: "-0.02em",
  },
  goldText: {
    background: "linear-gradient(135deg, #d4af7a 0%, #f5e6c8 50%, #d4af7a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  goldLine: {
    width: "120px",
    background: "linear-gradient(90deg, transparent, #d4af7a, transparent)",
  },
  scrollLine: {
    background: "linear-gradient(to bottom, rgba(212,175,122,0.6), transparent)",
  },
  filterBtn: (active: boolean): React.CSSProperties => ({
    color: active ? "#d4af7a" : "rgba(255,255,255,0.4)",
  }),
  filterPill: {
    background: "rgba(212,175,122,0.06)",
  },
  cardRadius: {
    borderRadius: "2px",
  },
  vignette: (hovered: boolean): React.CSSProperties => ({
    background: "linear-gradient(to top, rgba(14,11,8,0.9) 0%, rgba(14,11,8,0.1) 50%, transparent 100%)",
    opacity: hovered ? 1 : 0.5,
  }),
  zoomBtn: {
    background: "rgba(14,11,8,0.6)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "2px",
    backdropFilter: "blur(8px)",
  },
  ctaGlow: {
    background: "radial-gradient(ellipse 60% 80% at 50% 50%, #d4af7a 0%, transparent 70%)",
  },
  ctaTitle: {
    fontFamily: "'Georgia', serif",
  },
  ctaBtn: {
    border: "1px solid #d4af7a",
    color: "#d4af7a",
    borderRadius: "2px",
  },
  lightboxOverlay: {
    background: "rgba(14,11,8,0.97)",
    backdropFilter: "blur(20px)",
  },
  lightboxNavBtn: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "2px",
  },
  lightboxImg: {
    borderRadius: "2px",
  },
  lightboxBorder: {
    boxShadow: "inset 0 0 0 1px rgba(212,175,122,0.2)",
    borderRadius: "2px",
  },
};

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const filtered = products.filter(
    (p) => activeCategory === "All" || p.subcategory === activeCategory
  );

  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  const nextImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevImage, nextImage]);

  useEffect(() => {
    setLightboxIndex(null);
  }, [activeCategory]);

  const markLoaded = (id: string) => {
    setLoaded((prev) => new Set([...prev, id]));
  };

  const columns: (typeof products)[] = [[], [], []];
  filtered.forEach((item, i) => columns[i % 3].push(item));

  return (
    <main className="min-h-screen bg-[#0e0b08] text-white overflow-x-hidden">

      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-10" style={styles.grainOverlay} />
        <div className="absolute inset-0 z-0" style={styles.heroGlow} />

        <svg className="absolute inset-0 w-full h-full z-0 opacity-10" preserveAspectRatio="none">
          <line x1="0" y1="50%" x2="35%" y2="50%" stroke="#d4af7a" strokeWidth="0.5" />
          <line x1="65%" y1="50%" x2="100%" y2="50%" stroke="#d4af7a" strokeWidth="0.5" />
          <line x1="50%" y1="0" x2="50%" y2="30%" stroke="#d4af7a" strokeWidth="0.5" />
          <line x1="50%" y1="70%" x2="50%" y2="100%" stroke="#d4af7a" strokeWidth="0.5" />
        </svg>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-20 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="tracking-[0.35em] text-xs text-[#d4af7a] uppercase mb-6 font-light">
              Zidacakes&apos;n&apos;more
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-6" style={styles.heroTitle}>
              Our{" "}
              <em className="not-italic" style={styles.goldText}>
                Gallery
              </em>
            </h1>
            <p className="text-white/40 text-sm md:text-base tracking-widest uppercase font-light">
              Handcrafted with love &middot; Every creation tells a story
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 h-px origin-center"
            style={styles.goldLine}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8"
            style={styles.scrollLine}
          />
        </motion.div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 z-30 bg-[#0e0b08]/95 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-1 py-4 overflow-x-auto"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative px-5 py-2 text-xs tracking-[0.2em] uppercase font-light whitespace-nowrap transition-all duration-300"
                style={styles.filterBtn(activeCategory === cat)}
              >
                {activeCategory === cat && (
                  <motion.span
                    layoutId="pill"
                    className="absolute inset-0 rounded-full border border-[#d4af7a]/40"
                    style={styles.filterPill}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
            <div className="ml-4 pl-4 border-l border-white/10 text-white/20 text-xs tracking-widest">
              {filtered.length} pieces
            </div>
          </motion.div>
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-3">
                {col.map((product, rowIdx) => {
                  const globalIndex = filtered.indexOf(product);
                  const isHovered = hoveredId === product.id;
                  const isLoaded = loaded.has(product.id);
                  const accentColor = categoryColors[product.subcategory] || "#d4af7a";

                  const heightClass =
                    (colIdx + rowIdx) % 3 === 0
                      ? "aspect-[3/4]"
                      : (colIdx + rowIdx) % 3 === 1
                      ? "aspect-square"
                      : "aspect-[4/3]";

                  const badgeStyle: React.CSSProperties = {
                    background: `${accentColor}20`,
                    border: `1px solid ${accentColor}40`,
                    color: accentColor,
                    borderRadius: "2px",
                  };

                  const glowStyle: React.CSSProperties = {
                    boxShadow: `inset 0 0 0 1px ${accentColor}40`,
                  };

                  const imgStyle: React.CSSProperties = {
                    transform: isHovered ? "scale(1.07)" : "scale(1)",
                    filter: isLoaded ? "none" : "blur(4px)",
                  };

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.7, delay: rowIdx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative overflow-hidden cursor-pointer group ${heightClass}`}
                      style={styles.cardRadius}
                      onMouseEnter={() => setHoveredId(product.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setLightboxIndex(globalIndex)}
                    >
                      {!isLoaded && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse" />
                      )}

                      <img
                        src={product.image}
                        alt={product.name}
                        onLoad={() => markLoaded(product.id)}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out"
                        style={imgStyle}
                      />

                      <div
                        className="absolute inset-0 transition-opacity duration-500"
                        style={styles.vignette(isHovered)}
                      />

                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={glowStyle}
                      />

                      <motion.div
                        className="absolute top-3 left-3"
                        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        <span className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 font-medium" style={badgeStyle}>
                          {product.subcategory}
                        </span>
                      </motion.div>

                      <motion.div
                        className="absolute top-3 right-3"
                        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.7 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center" style={styles.zoomBtn}>
                          <ZoomIn className="w-3.5 h-3.5 text-white/80" />
                        </div>
                      </motion.div>

                      <motion.div
                        className="absolute bottom-0 left-0 right-0 p-4"
                        animate={{ y: isHovered ? 0 : 8, opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="text-xs tracking-widest uppercase mb-1 font-light" style={{ color: accentColor }}>
                          {product.name}
                        </p>
                        <p className="text-white/60 text-[11px] leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white font-light text-sm">
                            £{product.price.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[#d4af7a] text-[10px]">★</span>
                            <span className="text-white/40 text-[10px]">
                              {product.rating} &middot; {product.reviews} reviews
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <Sparkles className="w-8 h-8 text-[#d4af7a]/40 mx-auto mb-4" />
              <p className="text-white/30 tracking-widest text-sm uppercase">No creations found</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={styles.ctaGlow} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-xl mx-auto"
        >
          <p className="text-[#d4af7a] text-xs tracking-[0.35em] uppercase mb-4">
            Commission a creation
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white" style={styles.ctaTitle}>
            Your dream cake,{" "}
            <em className="not-italic text-[#d4af7a]">made real</em>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Every cake in our gallery started as a vision. Let us bring yours to life — designed exclusively for your moment.
          </p>
          <a
            href="/customize"
            className="inline-flex items-center gap-3 px-8 py-4 text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 hover:gap-5"
            style={styles.ctaBtn}
          >
            Order a Custom Cake
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={styles.lightboxOverlay}
            onClick={closeLightbox}
          >
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-[0.3em] uppercase">
              {lightboxIndex + 1} / {filtered.length}
            </div>

            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              style={styles.lightboxNavBtn}
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 md:left-8 w-10 h-10 flex items-center justify-center text-white/40 hover:text-[#d4af7a] transition-colors"
              style={styles.lightboxNavBtn}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 md:right-8 w-10 h-10 flex items-center justify-center text-white/40 hover:text-[#d4af7a] transition-colors"
              style={styles.lightboxNavBtn}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-3xl max-h-[80vh] mx-12 md:mx-24"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filtered[lightboxIndex].image}
                alt={filtered[lightboxIndex].name}
                className="max-h-[70vh] max-w-full object-contain"
                style={styles.lightboxImg}
              />

              <div className="absolute inset-0 pointer-events-none" style={styles.lightboxBorder} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p
                    className="text-xs tracking-[0.25em] uppercase mb-1"
                    style={{ color: categoryColors[filtered[lightboxIndex].subcategory] || "#d4af7a" }}
                  >
                    {filtered[lightboxIndex].subcategory}
                  </p>
                  <p className="text-white font-light text-sm">{filtered[lightboxIndex].name}</p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed max-w-sm">
                    {filtered[lightboxIndex].description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-lg font-light">
                    £{filtered[lightboxIndex].price.toFixed(2)}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    ★ {filtered[lightboxIndex].rating} &middot; {filtered[lightboxIndex].reviews} reviews
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-xs overflow-hidden">
              {filtered
                .slice(Math.max(0, lightboxIndex - 2), Math.min(filtered.length, lightboxIndex + 3))
                .map((item, i) => {
                  const actualIndex = Math.max(0, lightboxIndex - 2) + i;
                  const thumbStyle: React.CSSProperties = {
                    borderRadius: "2px",
                    border: actualIndex === lightboxIndex
                      ? "1px solid #d4af7a"
                      : "1px solid rgba(255,255,255,0.1)",
                    opacity: actualIndex === lightboxIndex ? 1 : 0.4,
                  };
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(actualIndex); }}
                      className="w-10 h-10 overflow-hidden shrink-0 transition-all duration-200"
                      style={thumbStyle}
                    >
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Gallery;