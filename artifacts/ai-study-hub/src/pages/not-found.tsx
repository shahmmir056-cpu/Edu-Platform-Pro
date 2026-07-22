import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Home } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="text-center max-w-lg"
      >
        <motion.div variants={fadeUp} className="mb-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="text-8xl font-serif font-bold text-primary mb-4">
          404
        </motion.p>

        <motion.h1 variants={fadeUp} className="text-2xl md:text-3xl font-serif text-foreground mb-4">
          Page not found
        </motion.h1>

        <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            <Home size={18} /> Back to Home
          </Link>
          <Link
            href="/math-solver"
            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
          >
            Try Math Solver <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
