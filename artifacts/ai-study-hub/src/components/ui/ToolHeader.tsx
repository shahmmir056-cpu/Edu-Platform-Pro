import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

export function ToolHeader({ title, description, icon: Icon, actions }: ToolHeaderProps) {
  return (
    <div className="mb-8 text-center" style={{ animation: "fadeInUp 0.9s ease-out both" }}>
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-4"
          style={{
            background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
            color: "#ffffff",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.2), 0 4px 16px rgba(255,159,76,0.2)",
          }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h1
          className="text-3xl md:text-4xl font-serif mb-2 tracking-tight"
          style={{ color: "#FF9F4C" }}
        >
          {title}
        </h1>
        <p style={{ color: "#6B6B6B" }} className="max-w-xl text-lg">
          {description}
        </p>
        {actions && (
          <div className="flex shrink-0 mt-4">
            {actions}
          </div>
        )}
      </div>
      <div
        className="mt-6 h-px mx-auto max-w-md"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,159,76,0.3) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
