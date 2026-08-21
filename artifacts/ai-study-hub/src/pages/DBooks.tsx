import { useRef } from "react";

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
    </div>
  );
}
