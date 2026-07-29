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
  Hand,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGesture } from "@/gesture/GestureProvider";
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

const GESTURE_INSTRUCTIONS = [
  { gesture: "thumbs_up", emoji: "👍", name: "Thumbs Up", action: "Open quiz / get started" },
  { gesture: "victory", emoji: "✌️", name: "Victory", action: "Open mobile navigation menu" },
  { gesture: "palm_stop", emoji: "✋", name: "Open Palm", action: "Scroll to top of page" },
  { gesture: "index_point", emoji: "☝️", name: "Index Point", action: "Focus first link or button" },
  { gesture: "ok_sign", emoji: "👌", name: "OK Sign", action: "Submit form / confirm" },
  { gesture: "pinch", emoji: "🤏", name: "Pinch", action: "Toggle special feature" },
  { gesture: "swipe_left", emoji: "👉", name: "Swipe Left", action: "Go to next page / section" },
  { gesture: "swipe_right", emoji: "👈", name: "Swipe Right", action: "Go to previous page / section" },
  { gesture: "scroll_up", emoji: "👆", name: "Hand Up", action: "Scroll page up" },
  { gesture: "scroll_down", emoji: "👇", name: "Hand Down", action: "Scroll page down" },
  { gesture: "three", emoji: "🤟", name: "Three Fingers", action: "Focus search input" },
  { gesture: "wave", emoji: "👋", name: "Wave", action: "Go to Home page" },
  { gesture: "fist_hold", emoji: "✊", name: "Hold Fist (2s)", action: "Disable gesture control" },
];

export function Header() {
  const [location] = useLocation();
  const { state: gestureState, enable: enableGesture, disable: disableGesture } = useGesture();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "";
  }, [location]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  const isToolActive = TOOLS.some((t) => t.path === location);

  return (
    <>
      {/* ══════════ DESKTOP: Floating Water Capsule Bar ══════════ */}
      <header
        className={cn(
          "fixed top-4 left-1/2 z-50 hidden lg:flex items-center gap-0.5 transition-all duration-500 ease-out water-nav-bar",
          scrolled ? "water-nav-bar-scrolled" : ""
        )}
        style={{
          transform: "translateX(-50%)",
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

        {/* Gesture toggle with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative z-10 flex items-center gap-1.5 px-2 lg:px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0 transition-all"
              style={{
                color: gestureState.enabled ? "#ffffff" : "#6B6B6B",
                background: gestureState.enabled
                  ? "linear-gradient(135deg, #FF9F4C, #E8852E)"
                  : "transparent",
                boxShadow: gestureState.enabled ? "0 2px 8px rgba(255,159,76,0.3)" : "none",
              }}
            >
              <Hand size={14} className={gestureState.enabled ? "animate-pulse" : ""} />
              <span className="hidden xl:inline">{gestureState.enabled ? "Gestures On" : "Gestures"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="mt-2"
            style={{ width: "280px", borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,159,76,0.1)" }}
          >
            {/* Header */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,159,76,0.08)" }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Gesture Control</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                  background: gestureState.enabled ? "rgba(74,222,128,0.12)" : "rgba(156,163,175,0.1)",
                  color: gestureState.enabled ? "#4ADE80" : "#9CA3AF",
                }}>
                  {gestureState.enabled ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "#9A9A9A" }}>
                {gestureState.enabled
                  ? `Camera: ${gestureState.cameraReady ? "✅" : "⏳"} | Hand: ${gestureState.handDetected ? "✅" : "⏳"}`
                  : "Control the site with hand gestures via your camera"}
              </p>
              {gestureState.error && (
                <p className="text-[10px] mt-1" style={{ color: "#E8852E" }}>{gestureState.error}</p>
              )}
            </div>

            {/* Gesture list */}
            <div className="px-3 py-2 space-y-0.5 max-h-[260px] overflow-y-auto">
              <p className="text-[9px] font-bold uppercase tracking-wider px-1 py-1" style={{ color: "#6B6B6B" }}>Available Gestures</p>
              {GESTURE_INSTRUCTIONS.map((g) => (
                <div
                  key={g.gesture}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all"
                  style={{
                    background: gestureState.activeGesture === g.gesture ? "rgba(255,159,76,0.08)" : "transparent",
                  }}
                >
                  <span className="text-base w-5 text-center shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium leading-tight" style={{ color: "#2D2D2D" }}>{g.name}</p>
                    <p className="text-[9px] leading-tight" style={{ color: "#9A9A9A" }}>{g.action}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Start / Stop button */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,159,76,0.08)" }}>
              <button
                onClick={() => gestureState.enabled ? disableGesture() : enableGesture().catch(() => {})}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.02] active:scale-98"
                style={{
                  background: gestureState.enabled
                    ? "rgba(232,133,46,0.1)"
                    : "linear-gradient(135deg, #FF9F4C, #E8852E)",
                  color: gestureState.enabled ? "#E8852E" : "#ffffff",
                  border: gestureState.enabled ? "1px solid rgba(232,133,46,0.2)" : "none",
                }}
              >
                {gestureState.enabled ? (
                  <><Hand size={14} /> Stop Gesture Control</>
                ) : (
                  <><Camera size={14} /> Start Gesture Control</>
                )}
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
          scrolled ? "water-nav-bar-scrolled" : ""
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
              data-nav-toggle
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
              <div className="space-y-2 p-3 sm:p-4" style={{ borderTop: "1px solid rgba(255,159,76,0.08)" }}>
                <button
                  onClick={() => {
                    gestureState.enabled ? disableGesture() : enableGesture().catch(() => {});
                    setMobileOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold rounded-xl transition-all"
                  style={{
                    background: gestureState.enabled
                      ? "rgba(232,133,46,0.1)"
                      : "linear-gradient(135deg, #FF9F4C, #E8852E)",
                    color: gestureState.enabled ? "#E8852E" : "#ffffff",
                    border: gestureState.enabled ? "1px solid rgba(232,133,46,0.2)" : "none",
                  }}
                >
                  {gestureState.enabled ? <><Hand size={16} /> Stop Gesture Control</> : <><Camera size={16} /> Start Gesture Control</>}
                </button>
                {gestureState.enabled && (
                  <div className="px-2 py-2 rounded-xl" style={{ background: "rgba(255,159,76,0.04)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: "#6B6B6B" }}>Active Gesture: {gestureState.activeGesture !== "none" ? gestureState.activeGesture : "None"}</p>
                    <p className="text-[10px] px-1" style={{ color: "#9A9A9A" }}>
                      Camera: {gestureState.cameraReady ? "✅" : "⏳"} | Hand: {gestureState.handDetected ? "✅" : "⏳"}
                    </p>
                    {gestureState.error && <p className="text-[10px] mt-1 px-1" style={{ color: "#E8852E" }}>{gestureState.error}</p>}
                  </div>
                )}
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
