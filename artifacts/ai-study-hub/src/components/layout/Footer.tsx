import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Twitter, label: "X (Twitter)", href: "https://x.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
];

const TOOL_LINKS = [
  { name: "Deep Research", path: "/research" },
  { name: "Essay Writer", path: "/essay" },
  { name: "Quiz Generator", path: "/quiz" },
  { name: "Flashcards", path: "/flashcards" },
  { name: "Math Solver", path: "/math-solver" },
  { name: "Virtual Lab", path: "/virtual-lab" },
];

const COMPANY_LINKS = [
  { name: "About Us", path: "/about" },
  { name: "Feedback", path: "/contact" },
  { name: "All Tools", path: "/#tools" },
  { name: "Home", path: "/" },
];

export function Footer() {
  return (
    <footer className="relative bg-sidebar text-sidebar-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M0 36L36 0H18L0 18M36 36V18L18 36" stroke="currentColor" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20">
                <GraduationCap size={22} className="stroke-[1.5]" />
              </div>
              <span className="font-serif text-xl tracking-tight leading-none text-white">
                Neural Sync
              </span>
            </Link>
            <p className="text-sm text-sidebar-foreground/60 leading-relaxed mb-6 max-w-xs">
              A free, no-login learning universe — AI study tools, a step-by-step math solver, and
              real interactive science labs, all in one place.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-sidebar-accent/60 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sidebar-primary mb-5">
              Tools
            </h4>
            <ul className="space-y-3">
              {TOOL_LINKS.map((l) => (
                <li key={l.path}>
                  <Link
                    href={l.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    {l.name}
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sidebar-primary mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.path}>
                  <Link
                    href={l.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    {l.name}
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sidebar-primary mb-5">
              Get in Touch
            </h4>
            <ul className="space-y-4 text-sm text-sidebar-foreground/70">
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-sidebar-primary mt-0.5 shrink-0" />
                <span>hello@neuralsync.ai</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-sidebar-primary mt-0.5 shrink-0" />
                <span>+1 (212) 555-0198</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-sidebar-primary mt-0.5 shrink-0" />
                <span>Available online, everywhere — 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-sidebar-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sidebar-foreground/50">
          <p>&copy; {new Date().getFullYear()} Neural Sync. Free forever. No account required.</p>
          <p>Built for curious minds, powered by AI.</p>
        </div>
      </div>
    </footer>
  );
}
