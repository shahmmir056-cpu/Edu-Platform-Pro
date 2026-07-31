import { motion } from "framer-motion";
import { Panel, CopyButton } from "@/components/math/shared";

const FORMULAS: { category: string; items: { name: string; formula: string }[] }[] = [
  {
    category: "Algebra",
    items: [
      { name: "Quadratic Formula", formula: "x = (−b ± √(b² − 4ac)) / 2a" },
      { name: "Difference of Squares", formula: "a² − b² = (a + b)(a − b)" },
      { name: "Slope", formula: "m = (y₂ − y₁) / (x₂ − x₁)" },
      { name: "Pythagorean Theorem", formula: "a² + b² = c²" },
      { name: "Distance Formula", formula: "d = √((x₂ − x₁)² + (y₂ − y₁)²)" },
    ],
  },
  {
    category: "Geometry",
    items: [
      { name: "Area of Circle", formula: "A = πr²" },
      { name: "Circumference", formula: "C = 2πr" },
      { name: "Area of Triangle", formula: "A = ½ · b · h" },
      { name: "Volume of Sphere", formula: "V = (4/3)πr³" },
      { name: "Volume of Cylinder", formula: "V = πr²h" },
    ],
  },
  {
    category: "Trigonometry",
    items: [
      { name: "Sine", formula: "sin θ = opposite / hypotenuse" },
      { name: "Cosine", formula: "cos θ = adjacent / hypotenuse" },
      { name: "Tangent", formula: "tan θ = opposite / adjacent" },
      { name: "Pythagorean Identity", formula: "sin²θ + cos²θ = 1" },
      { name: "Double Angle", formula: "sin(2θ) = 2 sin θ cos θ" },
    ],
  },
  {
    category: "Calculus",
    items: [
      { name: "Power Rule", formula: "d/dx [xⁿ] = n·xⁿ⁻¹" },
      { name: "Derivative of sin", formula: "d/dx [sin x] = cos x" },
      { name: "Chain Rule", formula: "d/dx [f(g(x))] = f′(g(x)) · g′(x)" },
      { name: "Integral Power Rule", formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C" },
      { name: "Fundamental Theorem", formula: "∫ₐᵇ f(x) dx = F(b) − F(a)" },
    ],
  },
  {
    category: "Statistics",
    items: [
      { name: "Mean", formula: "x̄ = (Σxᵢ) / n" },
      { name: "Variance", formula: "σ² = Σ(xᵢ − x̄)² / n" },
      { name: "Standard Deviation", formula: "σ = √(Σ(xᵢ − x̄)² / n)" },
      { name: "Binomial Probability", formula: "P(X=k) = C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ" },
      { name: "Z-Score", formula: "z = (x − μ) / σ" },
    ],
  },
];

export default function FormulaReference() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {FORMULAS.map((group, gi) => (
        <motion.div
          key={group.category}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.08, duration: 0.5 }}
        >
          <Panel className="p-6">
            <h3 className="font-serif font-medium text-xl mb-4 flex items-center gap-2" style={{ color: "#FF9F4C" }}>
              <span
                className="w-1.5 h-6 rounded-full"
                style={{ background: "linear-gradient(180deg, #FF9F4C, #FFD4A8)" }}
              />
              {group.category}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className="group rounded-xl p-4 transition-all duration-300 hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#6B6B6B" }}>
                      {item.name}
                    </p>
                    <CopyButton text={item.formula} className="opacity-0 group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 font-mono text-sm font-semibold break-words" style={{ color: "#2D2D2D" }}>
                    {item.formula}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      ))}
    </motion.div>
  );
}
