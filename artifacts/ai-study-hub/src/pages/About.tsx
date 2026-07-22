import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Sigma,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Target,
  Users,
  ShieldCheck,
} from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Learn by understanding",
    desc: "Every tool is built to show reasoning, not just answers — from math steps to research outlines.",
  },
  {
    icon: Users,
    title: "Built for every student",
    desc: "No sign-up, no subscription tiers. If you can open a browser, you can use the full toolkit.",
  },
  {
    icon: ShieldCheck,
    title: "Real, verified simulations",
    desc: "Our Virtual Lab uses genuine PhET simulations, the same ones used in classrooms worldwide.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

export default function About() {
  return (
    <div>
      <section className="relative px-6 py-20 md:py-28 bg-primary text-primary-foreground overflow-hidden isolate">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="about-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-grid)" />
          </svg>
        </div>
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm font-medium mb-6">
            <GraduationCap size={16} className="text-accent" /> About Us
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-serif leading-tight mb-6">
            One tutor. <span className="text-accent italic">Every subject.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Neural Sync brings AI-powered study tools, a step-by-step math solver, and real interactive
            science labs together into a single free platform — built so learning never feels locked behind a paywall.
          </motion.p>
        </motion.div>
      </section>

      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            src="/images/math-board.jpg"
            alt="Student solving equations on a blackboard"
            className="rounded-2xl shadow-xl w-full h-96 object-cover"
          />
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-serif text-foreground mb-5">Why we built this</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Students juggle a different app for every subject — one for essays, one for math, one for science
              demos. We wanted a single home base: fast enough for a homework crunch, deep enough for genuine
              understanding.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              That's why the Math Solver never just hands you an answer, and why the Virtual Lab runs the same
              PhET simulations used in real classrooms — not stand-ins.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6 mb-24"
        >
          {VALUES.map((v) => (
            <motion.div key={v.title} variants={fadeUp} className="bg-card border border-card-border rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <v.icon size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] bg-sidebar text-sidebar-foreground p-10 md:p-16 text-center relative overflow-hidden"
        >
          <Sparkles className="mx-auto text-sidebar-primary mb-5" size={32} />
          <h2 className="text-2xl md:text-3xl font-serif mb-4">Ready to see it in action?</h2>
          <p className="text-sidebar-foreground/70 max-w-xl mx-auto mb-8">
            Solve a real problem, run a real experiment, or let an AI draft your next assignment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/math-solver" className="inline-flex items-center gap-2 px-7 py-3.5 bg-sidebar-primary text-sidebar-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all">
              <Sigma size={18} /> Try Math Solver
            </Link>
            <Link href="/virtual-lab" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors">
              <FlaskConical size={18} /> Try Virtual Lab <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
