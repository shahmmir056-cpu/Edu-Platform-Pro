import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export const PANEL_STYLE: CSSProperties = {
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(20px) saturate(180%)",
  border: "1.5px solid rgba(255,255,255,0.72)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
};

export const INPUT_STYLE: CSSProperties = {
  background: "rgba(255,255,255,0.8)",
  border: "1px solid rgba(0,0,0,0.08)",
  color: "#2D2D2D",
};

export function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 sm:p-6 backdrop-blur-xl", className)}
      style={{ ...PANEL_STYLE, ...style }}
    >
      {children}
    </div>
  );
}

export function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy"
      className={cn(
        "shrink-0 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all duration-300",
        copied
          ? "bg-emerald-500/15 text-emerald-600"
          : "bg-white/60 text-[#6B6B6B] hover:bg-primary/15 hover:text-primary border border-black/10",
        className
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {label ?? (copied ? "Copied" : "Copy")}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <label
      className="block text-sm font-bold uppercase tracking-wider mb-2"
      style={{ color: "#6B6B6B" }}
    >
      {children}
    </label>
  );
}

export function MathTextInput({
  value,
  onChange,
  placeholder,
  mono = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className={cn(
        "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none input-ring transition-all duration-300",
        mono && "font-mono"
      )}
      style={INPUT_STYLE}
    />
  );
}
