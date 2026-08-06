import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Search,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Tools", path: "/research", icon: Search },
  { name: "Lab", path: "/virtual-lab", icon: FlaskConical },
  { name: "More", path: "/about", icon: BookOpen },
];

export function BottomNav() {
  const [location] = useLocation();
  const [compact, setCompact] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      if (y < 60) {
        setCompact(false);
        setVisible(true);
      } else if (delta > 12) {
        setCompact(true);
      } else if (delta < -8) {
        setCompact(false);
        setVisible(true);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed bottom-5 left-1/2 z-50 flex items-center gap-0.5 sm:gap-1.5 transition-all duration-500 lg:hidden water-bottom-bar",
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}
      style={{
        transform: `translateX(-50%) ${visible ? "" : "translateY(80px)"}`,
        padding: compact ? "6px 8px" : "8px 12px",
        borderRadius: "999px",
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === "/"
            ? location === "/"
            : location.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "water-bottom-tab flex items-center gap-1 sm:gap-2",
              compact ? "px-1.5 sm:px-3 py-1 sm:py-2" : "px-2 sm:px-4 py-1.5 sm:py-2.5",
              isActive ? "water-bottom-tab-active" : ""
            )}
            style={{
              color: isActive ? "#ffffff" : "#6B6B6B",
              fontSize: "13px",
            }}
          >
            <tab.icon size={compact ? 16 : 20} strokeWidth={isActive ? 2.5 : 2} />
            <span
              className={cn(
                "transition-all duration-500 overflow-hidden whitespace-nowrap",
                compact ? "max-w-0 opacity-0 ml-0" : "max-w-[80px] opacity-100 ml-1"
              )}
              style={{ lineHeight: 1 }}
            >
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
