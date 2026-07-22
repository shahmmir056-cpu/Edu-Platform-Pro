import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  PenTool,
  HelpCircle,
  Layers,
  ClipboardList,
  Wand2,
  ArrowRight,
  Sigma,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  Infinity as InfinityIcon,
  Star,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHOWCASE_TOOLS = [
  { name: "Deep Research Assistant", path: "/research", icon: BookOpen, desc: "Generate structured, academic-grade research reports on any topic.", color: "bg-blue-500/10 text-blue-700", tag: "Research" },
  { name: "Essay Writer", path: "/essay", icon: PenTool, desc: "Draft complete essays with outlines, tailored to specific styles and word counts.", color: "bg-emerald-500/10 text-emerald-700", tag: "Writing" },
  { name: "Math Solver", path: "/math-solver", icon: Sigma, desc: "Type any equation or word problem and get a clean, numbered step-by-step solution.", color: "bg-orange-500/10 text-orange-700", tag: "New" },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical, desc: "Run real PhET science simulations for physics, chemistry, biology, and math.", color: "bg-teal-500/10 text-teal-700", tag: "New" },
  { name: "Virtual Classroom", path: "/virtual-classroom", icon: Video, desc: "Live video classes with whiteboard, screen share, chat, polls, and breakout rooms.", color: "bg-rose-500/10 text-rose-700", tag: "New" },
  { name: "Quiz Generator", path: "/quiz", icon: HelpCircle, desc: "Test your knowledge with interactive multiple-choice quizzes and explanations.", color: "bg-purple-500/10 text-purple-700", tag: "Study" },
  { name: "Flashcard Deck", path: "/flashcards", icon: Layers, desc: "Instantly create flippable flashcards for rapid memorization and recall.", color: "bg-pink-500/10 text-pink-700", tag: "Study" },
  { name: "Study Notes", path: "/study-notes", icon: ClipboardList, desc: "Turn complex topics into structured notes with key terms and bullet points.", color: "bg-cyan-500/10 text-cyan-700", tag: "Study" },
];

const FEATURE_STRIP = [
  { icon: Sparkles, title: "AI Study Tools", desc: "Six writing & research tools that draft, explain, and quiz you instantly." },
  { icon: Sigma, title: "Step-by-Step Solver", desc: "Every math answer comes with the reasoning shown, not just the result." },
  { icon: FlaskConical, title: "Virtual Science Labs", desc: "Real PhET simulations you can touch, drag, and experiment with." },
  { icon: InfinityIcon, title: "Free, Forever", desc: "No account, no paywall, no limits. Just open a tool and start learning." },
];

const STATS = [
  { value: "9", label: "AI-Powered Tools" },
  { value: "26+", label: "Virtual Lab Simulations" },
  { value: "0", label: "Sign-ups Required" },
  { value: "24/7", label: "Always Available" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  return (
    <div className="pb-0 overflow-x-hidden">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 overflow-hidden">
          {/* SVG grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M0 48L48 0H24L0 24M48 48V24L24 48" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          {/* Right-side gradient */}
          <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-bl from-accent/20 via-transparent to-transparent pointer-events-none" />

          {/* Single floating orb */}
          <motion.div
            className="absolute top-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-28 md:pb-20 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm font-medium mb-8 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Welcome to Neural Sync
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl font-serif leading-[1.06] tracking-tight mb-7"
              >
                Learn{" "}
                <span className="text-accent italic">Anything.</span>
                <br />
                Solve{" "}
                <span className="text-accent italic">Anything.</span>
                <br />
                Simulate Everything.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-xl text-primary-foreground/75 max-w-xl leading-relaxed mb-10"
              >
                One free platform that writes your research, solves your math step by step,
                and hands you a real science lab to experiment in. No account. No paywalls.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-4 mb-14"
              >
                <Link
                  href="/math-solver"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-bold hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Solve a Problem
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <a
                  href="#tools"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-primary-foreground rounded-2xl font-medium backdrop-blur-sm transition-all duration-300 border border-white/10"
                >
                  Explore Tools
                </a>
              </motion.div>

              {/* Numbered feature items */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="grid grid-cols-2 gap-x-8 gap-y-4"
              >
                {[
                  { num: "01", label: "AI Tutors" },
                  { num: "02", label: "Step Solver" },
                  { num: "03", label: "Virtual Labs" },
                  { num: "04", label: "100% Free" },
                ].map((feat, i) => (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-accent font-mono text-sm font-bold">{feat.num}</span>
                    <span className="text-sm font-medium text-primary-foreground/90">{feat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right: Hero visual (hidden on mobile) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: 1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="relative hidden lg:block"
            >
              {/* Glow behind image */}
              <div className="absolute -inset-8 bg-accent/15 rounded-[2.5rem] blur-3xl" />

              {/* Main image */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/10">
                <img
                  src="/images/hero-students.jpg"
                  alt="Students studying together with laptops"
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
              </div>

              {/* Floating "Loved by learners" card */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-5 -left-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-foreground rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/20"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Star size={20} className="text-accent fill-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none mb-0.5">Loved by learners</p>
                  <p className="text-xs text-muted-foreground">Every tool, zero cost</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ============================================
          FEATURE STRIP
          ============================================ */}
      <section className="px-4 sm:px-6 -mt-10 md:-mt-14 relative z-20">
        <motion.div
          className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {FEATURE_STRIP.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <div className="group bg-card border border-card-border rounded-2xl p-6 shadow-lg shadow-primary/[0.03] hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={22} className="stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============================================
          ABOUT SECTION
          ============================================ */}
      <section className="px-4 sm:px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="/images/about-tutor.jpg"
                    alt="Tutor helping a student"
                    className="rounded-2xl object-cover h-64 w-full shadow-xl hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl mt-10">
                  <img
                    src="/images/library-group.jpg"
                    alt="Students studying in a library"
                    className="rounded-2xl object-cover h-64 w-full shadow-xl hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground rounded-2xl shadow-xl px-6 py-4 text-center w-48"
              >
                <p className="text-3xl font-serif font-bold leading-none">100%</p>
                <p className="text-xs font-bold uppercase tracking-wider mt-1">Free Access</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.15 }}
          >
            <div className="lg:pl-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider mb-6">
                <ShieldCheck size={14} /> About Neural Sync
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6 leading-tight">
                A whole learning system that{" "}
                <span className="text-primary">inspires you more.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                We combined three things students usually have to hunt for across different apps: fast AI writing
                &amp; research tools, a math tutor that actually shows its work, and a real hands-on science lab.
                Everything lives in one calm, distraction-free place.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                {[
                  { icon: Sigma, title: "Show-your-work Math", desc: "Every solution is a readable, numbered walkthrough." },
                  { icon: FlaskConical, title: "Real Simulations", desc: "Official PhET labs for physics, chemistry & biology." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Discover More
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          STATS BAND
          ============================================ */}
      <section className="relative px-4 sm:px-6 py-20 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stats-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M0 48L48 0H24L0 24M48 48V24L24 48" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stats-grid)" />
          </svg>
        </div>
        <motion.div
          className="relative z-10 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <div>
                <p className="text-4xl md:text-5xl font-serif font-bold text-sidebar-primary mb-2">
                  {s.value}
                </p>
                <p className="text-sm text-sidebar-foreground/70 uppercase tracking-wide font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============================================
          TOOLS GRID
          ============================================ */}
      <section id="tools" className="px-4 sm:px-6 py-24 md:py-32 max-w-7xl mx-auto scroll-mt-8">
        <motion.div
          className="mb-14 text-center max-w-2xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Our Toolkit</p>
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Nine Tools. One Tutor.</h2>
          <p className="text-muted-foreground text-lg">Pick a tool below — everything runs instantly, right in your browser.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {SHOWCASE_TOOLS.map((tool) => (
            <motion.div key={tool.path} variants={fadeUp}>
              <Link
                href={tool.path}
                className="group flex flex-col h-full p-6 bg-card border border-card-border rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1.5 hover:border-primary/20 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tool.color)}>
                    <tool.icon size={24} className="stroke-[1.5]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-full">
                    {tool.tag}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-medium text-foreground mb-2 group-hover:text-primary transition-colors duration-300 relative z-10">
                  {tool.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 relative z-10">{tool.desc}</p>
                <div className="mt-5 flex items-center text-sm font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10">
                  Launch Tool <ArrowRight size={14} className="ml-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============================================
          CTA
          ============================================ */}
      <section className="px-4 sm:px-6 py-24 md:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden bg-primary text-primary-foreground px-8 md:px-16 py-16 md:py-20 text-center isolate">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cta-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                    <path d="M0 48L48 0H24L0 24M48 48V24L24 48" stroke="currentColor" strokeWidth="0.5" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cta-grid)" />
              </svg>
            </div>
            <motion.div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/15 blur-[80px]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <h2 className="text-3xl md:text-5xl font-serif mb-5 relative z-10">
              Ready to <span className="text-accent italic">outsmart</span> homework?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10 relative z-10">
              Jump into the math solver, fire up a virtual lab, or let the AI draft your next essay — all for free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link
                href="/virtual-lab"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-bold hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                <FlaskConical size={20} />
                Open Virtual Lab
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/math-solver"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-medium transition-colors border border-white/10"
              >
                <Sigma size={20} /> Solve Math Now
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
