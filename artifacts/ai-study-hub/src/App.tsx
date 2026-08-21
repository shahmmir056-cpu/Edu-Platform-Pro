import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { lazy, Suspense, Component, type ReactNode } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

// Layout
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/layout/PageTransition';

// Global Life OS activity tracker (records real time in every tool)
import { RouteTracker } from '@/features/life-os/tracker';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
          <p className="text-lg font-semibold" style={{ color: "#2D2D2D" }}>Something went wrong</p>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>Try refreshing the page.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="px-4 py-2 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)" }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages (lazy-loaded for code-splitting)
const Home = lazy(() => import('@/pages/Home'));
const Research = lazy(() => import('@/pages/Research'));
const Essay = lazy(() => import('@/pages/Essay'));
const Quiz = lazy(() => import('@/pages/Quiz'));
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const StudyNotes = lazy(() => import('@/pages/StudyNotes'));
const Presentation = lazy(() => import('@/pages/Presentation'));
const TextPlayground = lazy(() => import('@/pages/TextPlayground'));
const MathSolver = lazy(() => import('@/pages/MathSolver'));
const VirtualLab = lazy(() => import('@/pages/VirtualLab'));
const Logic = lazy(() => import('@/pages/Logic'));
const StudyGames = lazy(() => import('@/pages/StudyGames'));
const TestConductor = lazy(() => import('@/pages/TestConductor'));
const SimulationsPage = lazy(() => import('@/features/simulations/SimulationsPage'));
const DebateMentorPage = lazy(() => import('@/features/debate-mentor/DebateMentorPage'));
const SimulationsV2Page = lazy(() => import('@/features/simulations/SimulationsV2Page'));
const LifeOsPage = lazy(() => import('@/features/life-os/LifeOsPage'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const DBooks = lazy(() => import('@/pages/DBooks'));
const NotFound = lazy(() => import('@/pages/not-found'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  const [location] = useLocation();
  return (
    <AppLayout>
        <PageTransition key={location}>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
              <Switch>
              <Route path="/" component={Home} />
              <Route path="/research" component={Research} />
              <Route path="/essay" component={Essay} />
              <Route path="/quiz" component={Quiz} />
              <Route path="/flashcards" component={Flashcards} />
              <Route path="/study-notes" component={StudyNotes} />
              <Route path="/presentation" component={Presentation} />
              <Route path="/text-playground" component={TextPlayground} />
              <Route path="/math-solver" component={MathSolver} />
              <Route path="/virtual-lab" component={VirtualLab} />
              <Route path="/logic" component={Logic} />
              <Route path="/study-games" component={StudyGames} />
              <Route path="/test-conductor" component={TestConductor} />
              <Route path="/simulations" component={SimulationsPage} />
              <Route path="/simulations-v2" component={SimulationsV2Page} />
              <Route path="/debate-mentor" component={DebateMentorPage} />
              <Route path="/life-os" component={LifeOsPage} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/d-books" component={DBooks} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </PageTransition>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RouteTracker />
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
