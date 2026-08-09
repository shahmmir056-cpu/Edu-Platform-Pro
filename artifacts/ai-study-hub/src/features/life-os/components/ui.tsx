import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Camera, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   THEME CONTEXT — dark / light for Life OS
   Water Liquid Glass, matching the main site:
   warm cream + frosted glass + Orange (#FF9F4C) /
   Peach (#FFD4A8) / Deep Orange (#E8852E).
   ═══════════════════════════════════════════════════ */

export type LifeOsTheme = "dark" | "light";

export interface ThemeColors {
  bg: string;
  panel: string;
  panelStrong: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primaryDeep: string;
  peach: string;
  glow: string; // soft accent wash (used for tints, not luminance glows)
  inputBg: string;
  inputBorder: string;
  shadow: string;
  shadowStrong: string;
  innerHi: string;
  glassBorder: string; // 2px water-glass outline
  glassShadow: string; // lg-card shadow recipe
  success: string; // semantic warm green accent
}

const DARK: ThemeColors = {
  bg: "#191512",
  panel: "rgba(255,255,255,0.045)",
  panelStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  text: "#F4EFE9",
  muted: "#B4A493",
  primary: "#FF9F4C",
  primaryDeep: "#FFB366",
  peach: "#FFD4A8",
  glow: "rgba(255,159,76,0.14)",
  inputBg: "rgba(255,255,255,0.06)",
  inputBorder: "rgba(255,255,255,0.14)",
  shadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.25), 0 12px 32px -12px rgba(0,0,0,0.45)",
  shadowStrong: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.28), 0 18px 44px -14px rgba(0,0,0,0.55)",
  innerHi: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.14)",
  glassShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.25), 0 12px 32px -12px rgba(0,0,0,0.45)",
  success: "#57B088",
};

const LIGHT: ThemeColors = {
  bg: "#FFF8F0",
  panel: "rgba(255,255,255,0.50)",
  panelStrong: "rgba(255,255,255,0.68)",
  border: "rgba(255,255,255,0.72)",
  text: "#2D2D2D",
  muted: "#8A7B66",
  primary: "#FF9F4C",
  primaryDeep: "#E8852E",
  peach: "#FFD4A8",
  glow: "rgba(255,159,76,0.12)",
  inputBg: "rgba(255,255,255,0.55)",
  inputBorder: "rgba(120,90,60,0.18)",
  shadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
  shadowStrong: "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.06)",
  innerHi: "rgba(255,255,255,0.85)",
  glassBorder: "rgba(255,255,255,0.72)",
  glassShadow: "inset 0 1px 0 0 rgba(255,255,255,0.8), inset 0 -1px 0 0 rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
  success: "#3A9C6F",
};

interface ThemeCtx {
  theme: LifeOsTheme;
  setTheme: (t: LifeOsTheme) => void;
  toggleTheme: () => void;
  t: ThemeColors;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  t: LIGHT,
});

export function ThemeProvider({ theme, setTheme, children }: { theme: LifeOsTheme; setTheme: (t: LifeOsTheme) => void; children: ReactNode }) {
  const t = useMemo(() => (theme === "dark" ? DARK : LIGHT), [theme]);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, t }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/* ═══════════════════════════════════════════════════
   GLASS PANEL
   ═══════════════════════════════════════════════════ */

export function Glass({
  children,
  className,
  strong = false,
  glow = false,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const { t } = useTheme();
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-5 transition-all duration-500 hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        background: strong ? t.panelStrong : t.panel,
        border: `1.5px solid ${glow ? tint(t.primary, 0.45) : t.glassBorder}`,
        boxShadow: glow ? t.shadowStrong : t.glassShadow,
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
        ...style,
      }}
    >
      {glow && (
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${tint(t.primary, 0.5)}, transparent)` }}
        />
      )}
      {children}
    </div>
  );
}

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ═══════════════════════════════════════════════════
   SECTION TITLE
   ═══════════════════════════════════════════════════ */

export function SectionTitle({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  const { t } = useTheme();
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-6 h-px" style={{ background: tint(t.primary, 0.5) }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: t.primaryDeep }}>
            {eyebrow}
          </span>
        </div>
      )}
      <h2
        className="text-2xl md:text-3xl font-serif font-medium tracking-tight mb-1"
        style={{
          textAlign: "left",
          background: `linear-gradient(120deg, ${t.primaryDeep}, ${t.primary})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {title}
      </h2>
      {desc && (
        <p className="text-sm max-w-2xl" style={{ color: t.muted }}>
          {desc}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PANEL HEADER
   ═══════════════════════════════════════════════════ */

export function PanelHeader({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  const { t } = useTheme();
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,159,76,0.12)", color: t.primaryDeep, border: `1px solid ${t.border}` }}>
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.primary }}>
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   RING PROGRESS
   ═══════════════════════════════════════════════════ */

export function Ring({ value, size = 96, stroke = 8, label, color }: { value: number; size?: number; stroke?: number; label?: string; color?: string }) {
  const { t } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.inputBorder} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? t.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold" style={{ color: t.text }}>
          {Math.round(value)}
          {label && <span className="text-xs ml-0.5" style={{ color: t.muted }}>{label}</span>}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════ */

export function StatCard({ icon, label, value, sub, color }: { icon: ReactNode; label: string; value: string; sub?: string; color?: string }) {
  const { t } = useTheme();
  return (
    <Glass className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: tint(color ?? t.primary, 0.14), color: color ?? t.primaryDeep }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.muted }}>
          {label}
        </span>
      </div>
      <span className="text-2xl font-serif font-medium" style={{ color: t.text }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: t.muted }}>
          {sub}
        </span>
      )}
    </Glass>
  );
}

/* ═══════════════════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════════════════ */

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useTheme();
  const base = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? {
          background: "linear-gradient(135deg, #FF9F4C, #E8852E)",
          color: "#fff",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(255,159,76,0.25)",
        }
      : variant === "outline"
      ? {
          background: t.inputBg,
          color: t.text,
          border: `1.5px solid ${t.inputBorder}`,
        }
      : {
          background: "transparent",
          color: t.muted,
          border: "1.5px solid transparent",
        };
  return (
    <button className={cn(base, "hover:-translate-y-0.5", className)} style={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label?: string }) {
  const { t } = useTheme();
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text, boxShadow: t.shadow }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   INPUTS
   ═══════════════════════════════════════════════════ */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useTheme();
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300";

export function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const { t } = useTheme();
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={{
        background: t.inputBg,
        border: `1px solid ${t.inputBorder}`,
        color: t.text,
        boxShadow: t.shadow,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = t.primary)}
      onBlur={(e) => (e.currentTarget.style.borderColor = t.inputBorder)}
    />
  );
}

export function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const { t } = useTheme();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, "appearance-none cursor-pointer")}
      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text, boxShadow: t.shadow }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: t.bg, color: t.text }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTheme();
  const [h = 0, m = 0] = String(value || "").split(":").map(Number);
  const set = (hh: number, mm: number) => onChange(`${pad2(hh)}:${pad2(mm)}`);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const selectCls = cn("cursor-pointer text-sm outline-none rounded-lg px-2 py-2 appearance-none", "flex-1 min-w-0");
  const selectStyle = { background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text };
  return (
    <div className="flex items-stretch gap-1.5 w-full">
      <select value={h} onChange={(e) => set(Number(e.target.value), m)} aria-label="Hour" className={selectCls} style={selectStyle}>
        {hours.map((i) => (
          <option key={i} value={i} style={{ background: t.bg, color: t.text }}>{pad2(i)}</option>
        ))}
      </select>
      <span className="flex items-center font-mono text-sm" style={{ color: t.muted }}>:</span>
      <select value={m} onChange={(e) => set(h, Number(e.target.value))} aria-label="Minute" className={selectCls} style={selectStyle}>
        {minutes.map((i) => (
          <option key={i} value={i} style={{ background: t.bg, color: t.text }}>{pad2(i)}</option>
        ))}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   RANGE SLIDER + TOGGLE
   ═══════════════════════════════════════════════════ */

export function Slider({ value, onChange, min = 1, max = 5, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  const { t } = useTheme();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          accentColor: t.primary,
          background: `linear-gradient(90deg, ${t.primary} 0%, ${t.primary} ${pct}%, ${t.inputBorder} ${pct}%, ${t.inputBorder} 100%)`,
          borderRadius: 9999,
          height: 6,
          outline: "none",
        }}
      />
      {label && (
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: t.muted }}>
          <span>{label}</span>
          <span className="font-mono" style={{ color: t.text }}>{value}</span>
        </div>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const { t } = useTheme();
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2.5 select-none">
      <span
        className="w-11 h-6 rounded-full relative transition-all duration-300 shrink-0"
        style={{ background: checked ? "linear-gradient(135deg, #FF9F4C, #E8852E)" : t.inputBorder, border: `1px solid ${t.inputBorder}` }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all duration-300"
          style={{
            left: checked ? "calc(100% - 1.25rem)" : "0.125rem",
            background: "#fff",
            width: 18,
            height: 18,
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </span>
      {label && (
        <span className="text-sm" style={{ color: t.text }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   PARTICLES BACKGROUND — quiet warm dust
   ═══════════════════════════════════════════════════ */

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 42;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 0.8 + Math.random() * 1.6,
      a: 0.04 + Math.random() * 0.08,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 159, 76, ${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [t]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.5 }} />;
}

/* ═══════════════════════════════════════════════════
   XP BAR / LEVEL
   ═══════════════════════════════════════════════════ */

export function XpBar({ xp, level }: { xp: number; level: number }) {
  const { t } = useTheme();
  const next = Math.round(400 * Math.pow(level + 1, 1.4));
  const cur = Math.round(400 * Math.pow(level, 1.4));
  const pct = Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100));
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5" style={{ color: t.muted }}>
        <span className="font-mono">LV {level}</span>
        <span className="font-mono">
          {xp} / {next} XP
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: t.inputBorder }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #FF9F4C, #FFB366)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════ */

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  const { t } = useTheme();
  return (
    <div className="text-center py-14 px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: tint(t.primary, 0.1), border: `1px solid ${t.inputBorder}`, color: t.primaryDeep }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-serif mb-1.5" style={{ color: t.text }}>
        {title}
      </h3>
      {desc && (
        <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: t.muted }}>
          {desc}
        </p>
      )}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AVATAR + AVATAR PICKER — student profile image
   ═══════════════════════════════════════════════════ */

export function Avatar({ url, name, size = 48 }: { url?: string; name: string; size?: number }) {
  const { t } = useTheme();
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const ring = {
    background: `linear-gradient(135deg, ${t.primary}, ${t.peach})`,
    padding: 3,
    borderRadius: 9999,
    boxShadow: t.shadow,
  };
  if (url) {
    return (
      <span className="relative block overflow-hidden shrink-0 rounded-full" style={ring}>
        <img src={url} alt={name} className="block rounded-full object-cover" style={{ width: size, height: size }} />
      </span>
    );
  }
  return (
    <span className="relative flex items-center justify-center shrink-0 rounded-full font-bold" style={{ ...ring, width: size, height: size, fontSize: size * 0.42, color: "#fff" }}>
      {initial}
    </span>
  );
}

export function AvatarPicker({ url, name, size = 88, onChange }: { url?: string; name: string; size?: number; onChange: (url: string | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTheme();

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Avatar url={url} name={name} size={size} />
      <button
        onClick={() => inputRef.current?.click()}
        aria-label="Upload photo"
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 hover:scale-110"
        style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff", border: "2px solid #fff", boxShadow: t.shadow }}
      >
        <Camera size={14} />
      </button>
      {url && (
        <button
          onClick={() => onChange(undefined)}
          aria-label="Remove photo"
          className="absolute top-0 left-0 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-300 hover:scale-110"
          style={{ background: "#fff", color: "#E8852E", border: `1px solid ${t.inputBorder}`, boxShadow: t.shadow }}
        >
          <Trash2 size={12} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

/* ── tiny util re-exported for internal use ── */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ═══════════════════════════════════════════════════
   TROPHY SVG — a real rendered image, not an emoji.
   ═══════════════════════════════════════════════════ */

export type TrophyTier = "gold" | "silver" | "bronze";

const TROPHY_PALETTES: Record<TrophyTier, { c1: string; c2: string; c3: string; base: string }> = {
  gold: { c1: "#FFE2A3", c2: "#F5B83D", c3: "#C98A1B", base: "#B97F1A" },
  silver: { c1: "#FFFFFF", c2: "#CBD5E1", c3: "#94A3B8", base: "#64748B" },
  bronze: { c1: "#F3D3A8", c2: "#D39B5F", c3: "#A9742F", base: "#8A5A22" },
};

export function TrophyImage({ tier = "gold", size = 48, muted = false }: { tier?: TrophyTier; size?: number; muted?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const grad = `trophy-grad-${uid}`;
  const g = TROPHY_PALETTES[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g.c1} />
          <stop offset="0.55" stopColor={g.c2} />
          <stop offset="1" stopColor={g.c3} />
        </linearGradient>
      </defs>
      <g opacity={muted ? 0.35 : 1} filter={muted ? "saturate(0) brightness(0.85)" : undefined}>
        <path d="M21 13 h-7 a9 9 0 0 0 8.5 12.5" fill="none" stroke={g.c2} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M43 13 h7 a9 9 0 0 1 -8.5 12.5" fill="none" stroke={g.c2} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M19 9 h26 a2 2 0 0 1 2 2 v7 a14 14 0 0 1 -15 13.9 a14 14 0 0 1 -15 -13.9 v-7 a2 2 0 0 1 2 -2 z" fill={`url(#${grad})`} />
        <rect x="17" y="8.5" width="30" height="4" rx="2" fill={g.c1} />
        <rect x="28.5" y="31" width="7" height="7" fill={g.base} />
        <rect x="17.5" y="38" width="29" height="5.5" rx="2.75" fill={g.base} />
        <rect x="21.5" y="43.5" width="21" height="4.5" rx="2.25" fill={g.c2} />
        <path d="M22 13 a10 10 0 0 1 4.5 -3.5 v5 z" fill="#FFFFFF" opacity="0.45" />
      </g>
    </svg>
  );
}
