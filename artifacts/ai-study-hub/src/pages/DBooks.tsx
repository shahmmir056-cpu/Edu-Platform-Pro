import { Link, useLocation } from "wouter";
import { GraduationCap, Home, CalendarClock, FlaskConical, Brain, BookOpen, Cpu, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Life OS", path: "/life-os", icon: CalendarClock },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical },
  { name: "AI Debate", path: "/debate-mentor", icon: Brain },
  { name: "D.books", path: "/d-books", icon: BookOpen },
  { name: "Logic", path: "/logic", icon: Cpu },
  { name: "Our Vision", path: "/about", icon: Info },
  { name: "Feedback", path: "/contact", icon: MessageCircle },
];

export default function DBooks() {
  const [location] = useLocation();
  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <iframe
        src="https://stbb-live-production.up.railway.app"
        title="D.books"
        className="block w-full h-full border-0 bg-white"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />

      {/* Floating water capsule nav over the iframe */}
      <header className="fixed top-4 left-1/2 z-50 flex items-center gap-0.5 water-nav-bar"
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
