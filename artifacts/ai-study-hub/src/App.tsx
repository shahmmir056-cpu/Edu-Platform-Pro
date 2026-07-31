import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { lazy, Suspense } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

// Layout
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/layout/PageTransition';

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
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
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
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </PageTransition>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
