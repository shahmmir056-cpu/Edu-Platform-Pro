import { BookOpen } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";

export default function DGBooks() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <ToolHeader
        title="DG Books"
        description="Access digital books and reading materials."
        icon={BookOpen}
      />
      <div className="flex-1 px-4 pb-8">
        <iframe
          src="https://stbb-live-production.up.railway.app"
          title="DG Books"
          className="w-full rounded-2xl border border-black/[0.06] bg-white"
          style={{
            height: "calc(100vh - 220px)",
            minHeight: "500px",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}
