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
    <div className="mb-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center shrink-0 mt-1">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg">
              {description}
            </p>
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-primary/40 via-primary/15 to-transparent" />
    </div>
  );
}
