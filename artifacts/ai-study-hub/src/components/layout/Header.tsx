import { useEffect, useState } from "react";
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
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
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
];

const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Math Solver", path: "/math-solver" },
  { name: "Virtual Lab", path: "/virtual-lab" },
  { name: "Virtual Classroom", path: "/virtual-classroom" },
  { name: "About", path: "/about" },
  { name: "Feedback", path: "/contact" },
];

export function Header() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
  }, [location]);

  const isToolActive = TOOLS.some((t) => t.path === location);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled ? "bg-background/95 backdrop-blur-md" : "bg-background"
      )}
    >
      {/* Announcement bar */}
      <div className="bg-sidebar text-sidebar-foreground/80 text-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <Facebook size={13} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <Twitter size={13} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <Instagram size={13} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <Youtube size={13} />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:contact@neuralsync.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Mail size={12} />
              contact@neuralsync.com
            </a>
            <a href="tel:+1234567890" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Phone size={12} />
              +1 (234) 567-890
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">
              Neural Sync
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.slice(0, 1).map((link) => (
              <NavLink key={link.path} {...link} active={location === link.path} />
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isToolActive
                      ? "text-primary bg-primary/5"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  AI Tools
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {TOOLS.map((tool) => (
                  <DropdownMenuItem key={tool.path} asChild>
                    <Link href={tool.path} className="flex items-center gap-2 cursor-pointer">
                      <tool.icon size={16} className="text-muted-foreground" />
                      {tool.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV_LINKS.slice(1).map((link) => (
              <NavLink key={link.path} {...link} active={location === link.path} />
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/virtual-lab"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <FlaskConical size={16} />
              Try Virtual Lab
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors" aria-label="Toggle menu">
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <Link href="/" className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                        <GraduationCap size={20} />
                      </div>
                      <span className="font-bold text-lg text-foreground">Neural Sync</span>
                    </Link>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                      {NAV_LINKS.map((link) => (
                        <Link
                          key={link.path}
                          href={link.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            location === link.path
                              ? "text-primary bg-primary/5"
                              : "text-foreground/80 hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-6">
                      <p className="px-4 mb-2 text-xs font-semibold uppercase text-muted-foreground">AI Tools</p>
                      <div className="space-y-1">
                        {TOOLS.map((tool) => (
                          <Link
                            key={tool.path}
                            href={tool.path}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <tool.icon size={16} className="text-muted-foreground" />
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>
                  <div className="p-4 border-t">
                    <Link
                      href="/virtual-lab"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <FlaskConical size={16} />
                      Try Virtual Lab
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ name, path, active }: { name: string; path: string; active: boolean }) {
  return (
    <Link
      href={path}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        active ? "text-primary bg-primary/5" : "text-foreground/80 hover:text-primary hover:bg-primary/5"
      )}
    >
      {name}
    </Link>
  );
}
