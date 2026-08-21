import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Sigma,
  FlaskConical,
  Eye,
  ArrowRight,
  Target,
  Users,
  Lightbulb,
  Sparkles,
  Play,
  Cpu,
  MessageSquare,
  Mic,
  Trophy,
  BookOpen,
} from "lucide-react";

const PILLARS = [
  {
    icon: Eye,
    title: "See It, Don't Memorize It",
    desc: "We turn abstract concepts into visual, interactive experiences — so students don't just read about science, they live it.",
  },
  {
    icon: Cpu,
    title: "Build Real Circuits",
    desc: "A full logic simulator with 60+ components — from gates to robotics — with truth tables, K-Maps, and Verilog export.",
  },
  {
    icon: Target,
    title: "Understanding Over Grades",
    desc: "Every tool shows the reasoning behind the answer. We believe real understanding beats memorization every time.",
  },
  {
    icon: Users,
    title: "Built for Every Student",
    desc: "No sign-up, no subscription tiers, no paywall. If you can open a browser, you have the full toolkit — free, forever.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

export default function About() {
  return (
    <div className="pb-0 overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden" style={{ background: "#FFF8F0" }}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full blur-[160px]" style={{ width: 500, height: 500, top: "-10%", left: "5%", background: "rgba(255,159,76,0.06)" }} />
          <div className="absolute rounded-full blur-[140px]" style={{ width: 400, height: 400, bottom: "-5%", right: "10%", background: "rgba(255,212,168,0.04)" }} />
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: "radial-gradient(rgba(255,159,76,0.1) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6" style={{ background: "rgba(255,159,76,0.08)", border: "1px solid rgba(255,159,76,0.15)", color: "#FF9F4C" }}>
            <Eye size={15} /> Our Vision
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[0.95] tracking-tight mb-6" style={{ color: "#2D2D2D" }}>
            The future of education is
            <br />
            <span style={{ color: "#FF9F4C" }}>
              not inside textbooks.
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "#6B6B6B" }}>
            It exists in experiences. We're on a mission to replace boring, one-way learning with immersive, real-world experiences — from circuit building to virtual labs — where every concept comes to life.
          </motion.p>
        </motion.div>
      </section>

      {/* ═══ VISION IMAGES ═══ */}
      <section className="px-4 sm:px-6 -mt-8 md:-mt-12 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=85&fit=crop", alt: "Student exploring interactive learning on a tablet", span: "md:col-span-2 md:row-span-2", height: "h-64 md:h-full" },
            { src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=85&fit=crop", alt: "Colorful science lab equipment for virtual experiments", span: "", height: "h-64" },
            { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=85&fit=crop", alt: "Logic circuits and AI-powered learning", span: "", height: "h-64" },
          ].map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-2xl ${img.span}`}
              style={{ border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}
            >
              <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className={`w-full ${img.height} object-cover hover:scale-105 transition-transform duration-700`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ MISSION STATEMENT ═══ */}
      <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2rem] p-10 md:p-16 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1.5px solid rgba(255,255,255,0.72)",
            boxShadow: "inset 0 0 0 1.5px rgba(45,45,45,0.06), inset 0 0 24px rgba(255,159,76,0.03), inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.03)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,159,76,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Lightbulb size={32} className="mx-auto mb-6" style={{ color: "#FF9F4C" }} />
            <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: "#2D2D2D" }}>
              Instead of asking students to memorize facts, we help them <strong style={{ color: "#FF9F4C" }}>see, explore, and understand</strong> through realistic simulations, interactive AI, circuit building, and practical examples.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#6B6B6B" }}>
              Because when learning feels real, curiosity grows, confidence follows, and knowledge stays with you long after the exam is over.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══ THREE PILLARS ═══ */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {PILLARS.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1.5px solid rgba(255,255,255,0.72)",
                boxShadow: "inset 0 0 20px rgba(255,159,76,0.03), inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.03)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(255,159,76,0.08)", border: "1px solid rgba(255,159,76,0.15)" }}>
                <p.icon size={24} style={{ color: "#FF9F4C" }} />
              </div>
              <h3 className="font-serif text-lg font-medium mb-3" style={{ color: "#2D2D2D" }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ SECOND IMAGERY ═══ */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}
          >
            <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=85&fit=crop" alt="AI-powered tutor helping a student" loading="lazy" decoding="async" className="w-full h-80 object-cover hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(255,255,255,0.72)", color: "#FF9F4C", backdropFilter: "blur(8px)" }}>
                <Sparkles size={12} /> AI-Powered Learning
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}
          >
            <img src="https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=800&q=85&fit=crop" alt="Students conducting research experiments" loading="lazy" decoding="async" className="w-full h-80 object-cover hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(255,255,255,0.72)", color: "#FF9F4C", backdropFilter: "blur(8px)" }}>
                <FlaskConical size={12} /> Real Simulations
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ AI DEBATE MENTOR ═══ */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}
          >
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=85&fit=crop" alt="AI Debate Mentor — interactive voice-powered debate practice" loading="lazy" decoding="async" className="w-full h-80 md:h-96 object-cover hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.72)", color: "#FF9F4C", backdropFilter: "blur(8px)" }}>
                <MessageSquare size={12} /> AI Debate Mentor
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.72)", color: "#4CAF50", backdropFilter: "blur(8px)" }}>
                <Mic size={11} /> Voice Enabled
              </div>
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5" style={{ background: "rgba(255,159,76,0.08)", border: "1px solid rgba(255,159,76,0.15)", color: "#FF9F4C" }}>
              <Sparkles size={13} /> New Feature
            </div>
            <h2 className="text-2xl md:text-3xl font-serif leading-tight mb-4" style={{ color: "#2D2D2D" }}>
              Train your mind with an{" "}
              <span style={{ color: "#FF9F4C" }}>AI Debate Mentor</span>
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B6B6B" }}>
              Learning isn't just about absorbing information — it's about defending ideas, challenging assumptions, and thinking on your feet. Our AI Debate Mentor puts you in the hot seat with four powerful modes designed to sharpen every aspect of your communication.
            </p>

            <div className="space-y-3.5 mb-6">
              {[
                { icon: MessageSquare, label: "Debate Mode", desc: "AI takes the opposite side. Argue your case and get scored on logic, evidence, and delivery.", color: "#FF9F4C" },
                { icon: BookOpen, label: "AI Teacher", desc: "Step-by-step interactive learning with mini-quizzes that adapt to your level.", color: "#4CAF50" },
                { icon: Trophy, label: "Viva Examiner", desc: "University oral exam simulation — one question at a time, with hints and a final report.", color: "#2196F3" },
                { icon: Mic, label: "Interview Prep", desc: "Practice HR, technical, or behavioral interviews with realistic AI follow-ups.", color: "#CE93D8" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${item.color}10`, border: `1.5px solid ${item.color}25` }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "#2D2D2D" }}>{item.label}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/debate-mentor"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 16px rgba(255,159,76,0.2)",
              }}
            >
              <MessageSquare size={16} />
              Try AI Debate Mentor
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-4 sm:px-6 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden px-8 md:px-16 py-16 md:py-20 text-center isolate"
            style={{
              background: "linear-gradient(135deg, rgba(255,159,76,0.04) 0%, rgba(255,255,255,0.5) 30%, rgba(255,212,168,0.04) 100%)",
              border: "1.5px solid rgba(255,255,255,0.72)",
              boxShadow: "inset 0 0 0 1.5px rgba(45,45,45,0.06), inset 0 0 24px rgba(255,159,76,0.03), inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,159,76,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            <h2 className="text-3xl md:text-5xl font-serif mb-5 relative z-10" style={{ color: "#2D2D2D" }}>
              Ready to{" "}
              <span style={{ color: "#FF9F4C" }}>
                experience
              </span>{" "}
              it yourself?
            </h2>
            <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 relative z-10" style={{ color: "#6B6B6B" }}>
              Jump into the math solver, fire up a virtual lab, or let the AI draft your next essay — all for free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link
                href="/virtual-lab"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-500 hover:-translate-y-0.5 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(255,159,76,0.2)",
                }}
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Play size={18} className="relative z-10" />
                <span className="relative z-10">Open Virtual Lab</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-500" />
              </Link>
              <Link
                href="/math-solver"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-500 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))",
                  border: "1.5px solid rgba(255,255,255,0.72)",
                  color: "#2D2D2D",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                <Sigma size={18} className="relative z-10" />
                <span className="relative z-10">Solve Math Now</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
