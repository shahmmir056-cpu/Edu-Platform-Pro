import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1 min-w-0 max-w-full overflow-x-hidden relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
