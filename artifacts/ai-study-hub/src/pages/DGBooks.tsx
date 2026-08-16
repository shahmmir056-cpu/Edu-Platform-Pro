import { Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";

export default function DGBooks() {
  return (
    <div className="w-full h-dvh flex flex-col">
      {/* Floating glass navbar */}
      <nav
        className="relative z-20 flex items-center gap-3 px-4 py-2 shrink-0"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/[0.04]"
          style={{ color: "#6B6B6B" }}
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div
          className="h-4 w-px"
          style={{ background: "rgba(0,0,0,0.1)" }}
        />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: "#FF9F4C" }}
        >
          DG Books
        </span>
        <div className="flex-1" />
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/[0.04]"
          style={{ color: "#6B6B6B" }}
          title="Home"
        >
          <Home size={16} />
        </Link>
      </nav>

      {/* Iframe fills remaining space */}
      <iframe
        src="https://stbb-live-production.up.railway.app"
        title="DG Books"
        className="flex-1 w-full border-0 bg-white"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
