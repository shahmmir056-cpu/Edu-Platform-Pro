export default function DGBooks() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1">
        <iframe
          src="https://stbb-live-production.up.railway.app"
          title="DG Books"
          className="w-full border-0 bg-white"
          style={{
            height: "calc(100vh - 4rem)",
            minHeight: "500px",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}
