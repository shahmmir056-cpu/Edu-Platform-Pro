import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { GraduationCap, Home, CalendarClock, FlaskConical, Brain, BookOpen, Cpu, Info, MessageCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Life OS", path: "/life-os", icon: CalendarClock },
  { name: "Math Solver", path: "/math-solver", icon: BookOpen },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical },
  { name: "AI Debate", path: "/debate-mentor", icon: Brain },
  { name: "D.books", path: "/d-books", icon: BookOpen },
  { name: "Logic", path: "/logic", icon: Cpu },
  { name: "Our Vision", path: "/about", icon: Info },
  { name: "Feedback", path: "/contact", icon: MessageCircle },
];

export default function DBooks() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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

      {/* ═══ DESKTOP: Floating capsule nav ═══ */}
      <header
        className="fixed top-4 left-1/2 z-50 hidden lg:flex items-center gap-0.5 water-nav-bar"
        style={{
          position: "fixed",
          transform: "translateX(-50%)",
          width: "min(94vw, 1100px)",
          padding: "7px 12px",
          borderRadius: "999px",
        }}
      >
          <Link href="/" className="relative z-10 flex items-center gap-2 shrink-0 group pr-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                color: "#ffffff",
                boxShadow: "0 2px 12px rgba(255,159,76,0.25), inset 0 1px 0 0 rgba(255,255,255,0.2)",
              }}
            >
              <GraduationCap size={16} />
            </div>
            <span className="font-bold text-[14px] tracking-tight hidden xl:block" style={{ color: "#FF9F4C" }}>
              Neural Sync
            </span>
          </Link>

          <div className="relative z-10 water-separator mx-0.5" />

          <nav className="relative z-10 flex items-center gap-x-px flex-1 justify-center overflow-hidden">
            {NAV_LINKS.map((link) => (
              <CapsuleNavLink key={link.path} {...link} active={location === link.path} />
            ))}
          </nav>

          <div className="relative z-10 water-separator mx-0.5" />

          <Link
            href="/#tools"
            className="relative z-10 water-nav-cta flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0"
          >
            All Tools
          </Link>
        </header>

      {/* ═══ MOBILE: Floating capsule bar + hamburger ═══ */}
      <header
        className="fixed top-4 left-0 right-0 z-50 lg:hidden flex items-center water-nav-bar"
        style={{
          position: "fixed",
          padding: "8px 12px",
          borderRadius: "999px",
        }}
      >
          <Link href="/" className="absolute left-1/2 top-1/2 z-10 flex items-center gap-2.5 shrink-0" style={{ transform: "translate(-50%, -50%)" }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                color: "#ffffff",
                boxShadow: "0 2px 12px rgba(255,159,76,0.25), inset 0 1px 0 0 rgba(255,255,255,0.2)",
              }}
            >
              <GraduationCap size={18} />
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: "#FF9F4C" }}>
              Neural Sync
            </span>
          </Link>

          <div className="ml-auto relative z-10">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="water-hamburger w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ color: "#2D2D2D" }}
                  aria-label="Toggle menu"
                >
                  <Menu size={18} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 water-sheet">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 sm:p-6" style={{ borderBottom: "1px solid rgba(255,159,76,0.08)" }}>
                    <Link href="/" className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)", color: "#ffffff" }}
                      >
                        <GraduationCap size={20} />
                      </div>
                      <span className="font-bold text-lg" style={{ color: "#FF9F4C" }}>Neural Sync</span>
                    </Link>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-3 sm:p-4 lg-scroll">
                    <div className="space-y-1">
                      {NAV_LINKS.map((link) => (
                        <Link
                          key={link.path}
                          href={link.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "water-sheet-item flex items-center gap-3 px-4 py-3 text-sm font-medium",
                            location === link.path ? "water-sheet-active" : ""
                          )}
                          style={{ color: location === link.path ? "#E8852E" : "#4b5563" }}
                        >
                          <link.icon size={16} />
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Link
                        href="/#tools"
                        onClick={() => setMobileOpen(false)}
                        className="water-nav-cta flex items-center justify-center gap-1.5 mx-4 px-3 py-2.5 rounded-full text-[13px] font-semibold"
                      >
                        All Tools
                      </Link>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
    </div>
  );
}

function CapsuleNavLink({
  name,
  path,
  active,
}: {
  name: string;
  path: string;
  active: boolean;
}) {
  return (
    <Link
      href={path}
      className={cn(
        "water-nav-item px-2 lg:px-3 py-1.5 text-[12px] font-medium",
        active ? "water-nav-active" : ""
      )}
      style={{ color: active ? "#ffffff" : "#6B6B6B" }}
    >
      {name}
    </Link>
  );
}
