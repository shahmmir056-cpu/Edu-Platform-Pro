import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isLogicPage = location === "/logic";
  const isLabPage = location.startsWith("/virtual-lab");

  return (
    <div className={cn("flex w-full flex-col", isLogicPage ? "h-dvh overflow-hidden" : "min-h-[100dvh]")}>
      {/* Liquid Glass animated background */}
      <div className="lg-bg" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Skip to content
      </a>
      {!isLogicPage && <Header />}
      <main
        id="main-content"
        className={cn(
          "flex-1 min-w-0 max-w-full overflow-x-hidden relative z-10",
          !isLogicPage && !isLabPage && "pt-20 pb-20 lg:pb-0",
          isLogicPage && "overflow-hidden",
          isLabPage && "pt-20"
        )}
      >
        {children}
      </main>
      {!isLogicPage && !isLabPage && <Footer />}
      {!isLogicPage && !isLabPage && <BottomNav />}
    </div>
  );
}
