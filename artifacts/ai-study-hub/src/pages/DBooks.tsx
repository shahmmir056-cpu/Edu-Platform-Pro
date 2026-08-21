import { useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, X } from "lucide-react";

export default function DBooks() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="relative w-full h-dvh overflow-hidden" style={{ padding: 0, margin: 0 }}>
      <iframe
        ref={iframeRef}
        src="https://stbb-live-production.up.railway.app"
        title="D.books"
        className="block w-full h-full border-0 bg-white"
        style={{ margin: 0, padding: 0, width: "100%", height: "100%" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />

      {/* Floating controls */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
          style={{ color: "#FF9F4C" }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
          style={{ color: "#EF4444" }}
          aria-label="Close"
        >
          <X size={20} />
        </Link>
      </div>
    </div>
  );
}
