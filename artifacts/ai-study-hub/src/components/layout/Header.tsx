import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  GraduationCap,
  Menu,
  ChevronDown,
  BookOpen,
  PenTool,
  HelpCircle,
  Layers,
  ClipboardList,
  Wand2,
  FlaskConical,
  Gamepad2,
  ClipboardCheck,
  Home,
  Cpu,
  Info,
  MessageCircle,
  MonitorPlay,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const TOOLS = [
  { name: "Deep Research", path: "/research", icon: BookOpen },
  { name: "Essay Writer", path: "/essay", icon: PenTool },
  { name: "Quiz Generator", path: "/quiz", icon: HelpCircle },
  { name: "Flashcards", path: "/flashcards", icon: Layers },
  { name: "Study Notes", path: "/study-notes", icon: ClipboardList },
  { name: "Text Playground", path: "/text-playground", icon: Wand2 },
  { name: "Study Games", path: "/study-games", icon: Gamepad2 },
  { name: "Test Conductor", path: "/test-conductor", icon: ClipboardCheck },
  { name: "Presentation", path: "/presentation", icon: MonitorPlay },
];

const NAV_LINKS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Math Solver", path: "/math-solver", icon: BookOpen },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical },
  { name: "AI Debate", path: "/debate-mentor", icon: Brain },
  { name: "Logic", path: "/logic", icon: Cpu },
  { name: "Our Vision", path: "/about", icon: Info },
  { name: "Feedback", path: "/contact", icon: MessageCircle },
];

export function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const atTop = currentY < 60;
          const delta = currentY - lastScrollY.current;

          setScrolled(currentY > 16);

          if (atTop) {
            setHeaderVisible(true);
          } else if (delta > 8) {
            setHeaderVisible(false);
          } else if (delta < -8) {
            setHeaderVisible(true);
          }

          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "";
  }, [location]);

  useEffect(() => {
    setMobileOpen(false);
    setHeaderVisible(true);
    lastScrollY.current = 0;
    window.scrollTo(0, 0);
  }, [location]);

  const isToolActive = TOOLS.some((t) => t.path === location);

  return (
    <>
      {/* ══════════ DESKTOP: Floating Water Capsule Bar ══════════ */}
      <header
        className={cn(
          "fixed top-4 left-1/2 z-50 hidden lg:flex items-center gap-0.5 transition-all duration-500 ease-out water-nav-bar",
          scrolled ? "water-nav-bar-scrolled" : "",
          headerVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-[120%] opacity-0 pointer-events-none"
        )}
        style={{
          transform: `translateX(-50%) ${headerVisible ? "" : "translateY(-120%)"}`,
          width: "min(94vw, 1100px)",
          padding: scrolled ? "6px 10px" : "7px 12px",
          borderRadius: "999px",
        }}
      >
        {/* Logo */}
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
          <span
            className="font-bold text-[14px] tracking-tight hidden xl:block"
            style={{ color: "#FF9F4C" }}
          >
            Neural Sync
          </span>
        </Link>

        {/* Water separator */}
        <div className="relative z-10 water-separator mx-0.5" />

        {/* Nav links as water capsule tabs */}
        <nav className="relative z-10 flex items-center gap-x-px lg:gap-x-0.5 xl:gap-x-1 flex-1 justify-center overflow-hidden">
          {NAV_LINKS.slice(0, 1).map((link) => (
            <CapsuleNavLink key={link.path} {...link} active={location === link.path} />
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                   "water-nav-item flex items-center gap-1 px-2 lg:px-3 py-1.5 text-[12px] font-medium",
                  isToolActive && "water-nav-active"
                )}
                style={{ color: isToolActive ? "#ffffff" : "#6B6B6B" }}
              >
                <span className="hidden xl:inline">AI </span>Tools
                <ChevronDown size={11} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 p-2 mt-2 water-nav-dropdown"
            >
              {TOOLS.map((tool) => (
                <DropdownMenuItem key={tool.path} asChild className="rounded-xl">
                  <Link
                    href={tool.path}
                    className="water-nav-dropdown-item flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm"
                    style={{ color: "#2D2D2D" }}
                  >
                    <tool.icon size={16} style={{ color: "#FF9F4C" }} />
                    <span>{tool.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {NAV_LINKS.slice(1).map((link) => (
            <CapsuleNavLink key={link.path} {...link} active={location === link.path} />
          ))}
        </nav>

        {/* Water separator */}
        <div className="relative z-10 water-separator mx-0.5" />

        {/* CTA */}
        <Link
          href="/#tools"
          className="relative z-10 water-nav-cta flex items-center gap-1.5 px-2 lg:px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0"
        >
          <span className="hidden xl:inline">All </span><span>Tools</span>
        </Link>
      </header>

      {/* ══════════ MOBILE: Floating Water Capsule Bar ══════════ */}
      <header
        className={cn(
          "fixed top-4 left-2 right-8 z-50 lg:hidden flex items-center justify-between transition-all duration-500 ease-out water-nav-bar",
          scrolled ? "water-nav-bar-scrolled" : "",
          headerVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-[120%] opacity-0 pointer-events-none"
        )}
        style={{
          padding: "8px 10px 8px 12px",
          borderRadius: "999px",
          border: "none",
        }}
      >
        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 shrink-0">
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
          <span
            className="font-bold text-[15px] tracking-tight"
            style={{ color: "#FF9F4C" }}
          >
            Neural Sync
          </span>
        </Link>

        {/* Mobile water hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="relative z-10 water-hamburger w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: "#2D2D2D" }}
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] p-0 water-sheet"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col h-full">
              <div
                    className="p-4 sm:p-6"
                    style={{ borderBottom: "1px solid rgba(255,159,76,0.08)" }}
                  >
                    <Link href="/" className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                          color: "#ffffff",
                        }}
                      >
                        <GraduationCap size={20} />
                      </div>
                      <span
                        className="font-bold text-lg"
                        style={{ color: "#FF9F4C" }}
                      >
                    Neural Sync
                  </span>
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
                      style={{
                        color: location === link.path ? "#E8852E" : "#4b5563",
                      }}
                    >
                      <link.icon size={16} />
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-6">
                  <p
                    className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#9A9A9A" }}
                  >
                    AI Tools
                  </p>
                  <div className="space-y-1">
                    {TOOLS.map((tool) => (
                      <Link
                        key={tool.path}
                        href={tool.path}
                        onClick={() => setMobileOpen(false)}
                        className="water-sheet-item flex items-center gap-3 px-4 py-2.5 text-sm"
                        style={{ color: "#6B6B6B" }}
                      >
                        <tool.icon size={16} style={{ color: "#FF9F4C" }} />
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
              <div
                className="p-3 sm:p-4"
                style={{ borderTop: "1px solid rgba(255,159,76,0.08)" }}
              >
                <Link
                  href="/virtual-lab"
                  onClick={() => setMobileOpen(false)}
                  className="water-nav-cta flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-semibold"
                >
                  <FlaskConical size={16} />
                  Try Virtual Lab
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}

function CapsuleNavLink({
  name,
  path,
  active,
  icon: _icon,
}: {
  name: string;
  path: string;
  active: boolean;
  icon?: any;
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
