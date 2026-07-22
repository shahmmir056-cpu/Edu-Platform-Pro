import { useState } from "react";
import { motion } from "framer-motion";
import { useSolveMath } from "@workspace/api-client-react";
import { Sigma, ArrowRight, CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";

const EXAMPLES = [
  "Solve for x: 3x + 7 = 22",
  "Find the derivative of 4x^3 - 2x + 5",
  "Simplify: (2x^2y)(3xy^3)",
  "What is the area of a circle with radius 7?",
  "Solve the system: x + y = 10, x - y = 4",
];

export default function MathSolver() {
  const [problem, setProblem] = useState("");
  const solveMath = useSolveMath();
  const solution = solveMath.data;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!problem.trim()) return;
    solveMath.mutate({ data: { problem } });
  };

  const reset = () => {
    solveMath.reset();
    setProblem("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <ToolHeader
        title="Math Step-by-Step Solver"
        description="Type any equation, expression, or word problem and get a full, numbered walkthrough."
        icon={Sigma}
      />

      {!solveMath.isPending && !solution && !solveMath.isError && (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary"
        >
          <label htmlFor="problem" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Your Math Problem
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g., Solve for x: 2x + 5 = 17"
            className="w-full bg-background border border-input rounded-xl p-4 min-h-[110px] font-mono text-base focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all resize-none"
            required
          />

          <div className="flex flex-wrap gap-2 mt-4 mb-8">
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => setProblem(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!problem.trim()}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
          >
            <Sigma size={20} />
            Solve Step by Step
          </button>
        </motion.form>
      )}

      {solveMath.isPending && (
        <LoadingState
          title="Working through the math..."
          messages={["Reading the problem...", "Choosing a strategy...", "Working the algebra...", "Double-checking the answer...", "Formatting the steps..."]}
        />
      )}

      {solveMath.isError && (
        <ErrorState onRetry={() => handleSubmit()} message="Couldn't solve that one. Try rephrasing the problem and try again." />
      )}

      {solution && !solveMath.isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
          <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                {solution.topic}
              </span>
              <p className="font-mono text-lg text-foreground">{solution.restatedProblem}</p>
            </div>
          </div>

          <div className="relative pl-8 md:pl-10 space-y-6 mb-10">
            <div className="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-0.5 bg-border" />
            {solution.steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                className="relative"
              >
                <div className="absolute -left-8 md:-left-10 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  {idx + 1}
                </div>
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="font-serif font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.explanation}</p>
                  <div className="bg-muted rounded-lg px-4 py-3 font-mono text-primary font-semibold text-base overflow-x-auto">
                    {step.expression}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 mb-6"
          >
            <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/70 mb-1">Final Answer</p>
              <p className="font-mono text-xl md:text-2xl font-bold">{solution.finalAnswer}</p>
            </div>
          </motion.div>

          {solution.checkNote && (
            <div className="flex gap-3 bg-accent/10 border border-accent/20 rounded-xl p-5 mb-10">
              <Lightbulb size={20} className="text-accent-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">
                <span className="font-bold">Check your work:</span> {solution.checkNote}
              </p>
            </div>
          )}

          <div className="flex justify-center pb-16">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
            >
              <RotateCcw size={18} />
              Solve Another Problem
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
