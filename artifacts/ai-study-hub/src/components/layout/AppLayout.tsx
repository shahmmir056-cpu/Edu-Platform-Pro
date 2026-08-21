import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { useSimFullscreen } from "@/features/simulations/simFullscreen";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isLogicPage = location === "/logic";
  const isLabPage = location.startsWith("/virtual-lab");
  const isDebatePage = location.startsWith("/debate-mentor");
  const isLifeOsPage = location.startsWith("/life-os");
  const isAppPage = isLogicPage || isDebatePage || isLifeOsPage;
  const isSimFullscreen = useSimFullscreen();

  return (
    <div className={cn("flex w-full flex-col", isAppPage ? "h-dvh overflow-hidden" : "min-h-[100dvh]")}>
      <div className="lg-bg" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Skip to content
      </a>
      {!isAppPage && !isSimFullscreen && <Header />}
      <main
        id="main-content"
        className={cn(
          "flex-1 min-w-0 max-w-full overflow-x-hidden relative z-10",
          !isAppPage && !isLabPage && "pt-20 pb-20 lg:pb-0",
          isAppPage && "overflow-hidden",
          isLabPage && "pt-20"
        )}
      >
        {children}
      </main>
      {!isAppPage && !isSimFullscreen && !isLabPage && <BottomNav />}
    </div>
  );
}
