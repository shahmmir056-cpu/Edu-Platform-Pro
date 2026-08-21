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
  Heart,
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
  { name: "Study Notes", path: "/study-notes" },
  { name: "Text Playground", path: "/text-playground" },
  { name: "Study Games", path: "/study-games" },
  { name: "Test Conductor", path: "/test-conductor" },
  { name: "Math Solver", path: "/math-solver" },
  { name: "Virtual Lab", path: "/virtual-lab" },
  { name: "Logic", path: "/logic" },
];

const COMPANY_LINKS = [
  { name: "Our Vision", path: "/about" },
  { name: "Feedback", path: "/contact" },
  { name: "All Tools", path: "/#tools" },
  { name: "Home", path: "/" },
];

const COL = "flex flex-col";
const HEADING = "text-sm font-bold uppercase tracking-wider mb-4 text-left";
const LIST = "flex flex-col gap-2.5 list-none m-0 p-0";

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden text-left footer-root"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        color: "#2D2D2D",
        borderTop: "1px solid rgba(255,255,255,0.5)",
        textAlign: "left",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(255,159,76,0.15) 50%, rgba(255,255,255,0.8) 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-0 left-1/4 w-96 h-48 rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(255,159,76,0.04)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-40 rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(255,212,168,0.03)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">

          {/* Brand */}
          <div className={COL}>
            <h4 className={`${HEADING} invisible`} style={{ textAlign: "left" }}>&nbsp;</h4>
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0"
                style={{
                  background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)",
                  color: "#ffffff",
                  boxShadow: "0 2px 12px rgba(255,159,76,0.2), inset 0 1px 0 0 rgba(255,255,255,0.2)",
                }}
              >
                <GraduationCap size={20} />
              </div>
              <span
                className="font-serif text-lg tracking-tight leading-none"
                style={{ color: "#FF9F4C" }}
              >
                Neural Sync
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4 max-w-[220px]" style={{ color: "#6B6B6B" }}>
              A free, no-login learning universe — AI study tools, a step-by-step math solver,
              and real interactive science labs, all in one place.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    border: "1.5px solid rgba(255,255,255,0.72)",
                    color: "#9A9A9A",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,159,76,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,159,76,0.2)";
                    e.currentTarget.style.color = "#E8852E";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.4)";
                    e.currentTarget.style.borderColor = "rgba(120,90,60,0.3)";
                    e.currentTarget.style.color = "#9A9A9A";
                  }}
                >
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className={COL} style={{ textAlign: "left" }}>
            <h4 className={HEADING} style={{ color: "#FF9F4C", textAlign: "left" }}>Tools</h4>
            <ul className={LIST} style={{ textAlign: "left" }}>
              {TOOL_LINKS.map((l) => (
                <li key={l.path}>
                  <Link
                    href={l.path}
                    className="text-sm inline-flex items-center gap-1 group transition-colors"
                    style={{ color: "#6B6B6B" }}
                  >
                    <span className="group-hover:text-[#FF9F4C] transition-colors duration-300">{l.name}</span>
                    <ArrowUpRight
                      size={11}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={COL} style={{ textAlign: "left" }}>
            <h4 className={HEADING} style={{ color: "#FFD4A8", textAlign: "left" }}>Company</h4>
            <ul className={LIST} style={{ textAlign: "left" }}>
              {COMPANY_LINKS.map((l) => (
                <li key={l.path}>
                  <Link
                    href={l.path}
                    className="text-sm inline-flex items-center gap-1 group transition-colors"
                    style={{ color: "#6B6B6B" }}
                  >
                    <span className="group-hover:text-[#FF9F4C] transition-colors duration-300">{l.name}</span>
                    <ArrowUpRight
                      size={11}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={COL} style={{ textAlign: "left" }}>
            <h4 className={HEADING} style={{ color: "#E8852E", textAlign: "left" }}>Get in Touch</h4>
            <ul className={LIST} style={{ color: "#6B6B6B", textAlign: "left" }}>
              <li className="flex items-start gap-2.5 text-sm">
                <Mail size={15} className="mt-0.5 shrink-0" style={{ color: "#FF9F4C" }} />
                <span>hello@neuralsync.ai</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <Phone size={15} className="mt-0.5 shrink-0" style={{ color: "#FF9F4C" }} />
                <span>+1 (212) 555-0198</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: "#FF9F4C" }} />
                <span>Available online, everywhere — 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.06)",
            color: "#9A9A9A",
          }}
        >
          <p>&copy; {new Date().getFullYear()} Neural Sync. Free forever. No account required.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={12} style={{ color: "#FFD4A8" }} /> for curious minds
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-root {
            text-align: center !important;
          }
          .footer-root .grid {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 2.5rem !important;
          }
          .footer-root .grid > div {
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
          }
          .footer-root .grid > div > * {
            text-align: center !important;
          }
          .footer-root h4 {
            text-align: center !important;
          }
          .footer-root ul {
            align-items: center !important;
          }
          .footer-root .flex.items-center.gap-2.flex-wrap {
            justify-content: center !important;
          }
          .footer-root .flex.items-center.gap-2.flex-wrap a {
            margin: 0 4px !important;
          }
          .footer-root .mt-14 {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 0.75rem !important;
          }
          .footer-root .mt-14 p {
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
}
