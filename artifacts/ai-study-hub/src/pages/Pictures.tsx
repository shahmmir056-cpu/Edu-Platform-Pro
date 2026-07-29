import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

const CATEGORIES = ["All", "Learning", "Science", "Technology", "Nature", "Creative"];

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
    full: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&q=85",
    title: "Library of Knowledge",
    desc: "Endless stories waiting to be discovered",
    category: "Learning",
    span: "col-span-2 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    full: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&q=85",
    title: "Scientific Discovery",
    desc: "Hands-on experiments in modern labs",
    category: "Science",
    span: "col-span-1 row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    full: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=85",
    title: "Circuit of Ideas",
    desc: "Where technology meets imagination",
    category: "Technology",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1504215680853-0269b3f1892f?w=800&q=80",
    full: "https://images.unsplash.com/photo-1504215680853-0269b3f1892f?w=1600&q=85",
    title: "Nature's Classroom",
    desc: "Learning from the world around us",
    category: "Nature",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    full: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1600&q=85",
    title: "Art of Creation",
    desc: "Creative expression through every medium",
    category: "Creative",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    full: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=85",
    title: "Focused Learning",
    desc: "Deep concentration in modern study spaces",
    category: "Learning",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    full: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600&q=85",
    title: "Mathematical Beauty",
    desc: "The universal language of patterns",
    category: "Science",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    full: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1600&q=85",
    title: "Digital Frontier",
    desc: "Code that shapes our future",
    category: "Technology",
    span: "col-span-2 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=800&q=80",
    full: "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=1600&q=85",
    title: "Milestone Moments",
    desc: "Celebrating educational achievements",
    category: "Learning",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=800&q=80",
    full: "https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=1600&q=85",
    title: "Modern Classroom",
    desc: "Where ideas come to life",
    category: "Learning",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    full: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=85",
    title: "Focused Study",
    desc: "Deep concentration leads to mastery",
    category: "Learning",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80",
    full: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1600&q=85",
    title: "Innovation Hub",
    desc: "Building tomorrow's technology today",
    category: "Technology",
    span: "col-span-1 row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
    full: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&q=85",
    title: "Natural Wonders",
    desc: "Exploring the beauty of our world",
    category: "Nature",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    full: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=85",
    title: "Global Connection",
    desc: "Technology bridging minds worldwide",
    category: "Technology",
    span: "col-span-1 row-span-1",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function Pictures() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = IMAGES.filter(
    (img) => activeCategory === "All" || img.category === activeCategory
  );
  const displayed = shuffleArray(filtered);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % displayed.length);
    }
  };
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + displayed.length) % displayed.length);
    }
  };

  const current = lightboxIndex !== null ? displayed[lightboxIndex] : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center mb-10 sm:mb-14">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ background: "rgba(255,159,76,0.1)", color: "#E8852E" }}>
            <ImageIcon size={14} /> Gallery
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "#2D2D2D" }}>
            Pictures That{" "}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
            }}>
              Inspire Learning
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "#6B6B6B" }}>
            A curated collection of high-quality images capturing the beauty of education, science, technology, and creativity.
          </motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              variants={fadeUp}
              onClick={() => setActiveCategory(cat)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                background: activeCategory === cat
                  ? "linear-gradient(135deg, #FF9F4C 0%, #E8852E 100%)"
                  : "rgba(255,255,255,0.5)",
                color: activeCategory === cat ? "#ffffff" : "#6B6B6B",
                border: activeCategory === cat ? "none" : "1px solid rgba(0,0,0,0.06)",
                boxShadow: activeCategory === cat ? "0 4px 16px rgba(255,159,76,0.25)" : "none",
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          key={activeCategory}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[180px] sm:auto-rows-[220px]"
        >
          {displayed.map((img, index) => (
            <motion.div
              key={`${img.src}-${index}`}
              variants={fadeUp}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${img.span}`}
              onClick={() => openLightbox(index)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "rgba(255,255,255,0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="text-white text-sm sm:text-base font-semibold truncate">{img.title}</h3>
                <p className="text-white/70 text-xs truncate">{img.desc}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white bg-white/20 backdrop-blur-sm" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                  {img.category}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <X size={20} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <ChevronRight size={20} />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={current.full}
                alt={current.title}
                className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
                style={{ boxShadow: "0 20px 80px rgba(0,0,0,0.5)" }}
              />
              <div className="mt-4 text-center text-white">
                <h3 className="text-lg sm:text-xl font-semibold">{current.title}</h3>
                <p className="text-sm text-white/60 mt-1">{current.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
