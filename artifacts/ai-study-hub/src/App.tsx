import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AnimatePresence } from 'framer-motion';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

// Layout
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/layout/PageTransition';
import { GestureProvider } from '@/gesture/GestureProvider';

// Pages
import Home from '@/pages/Home';
import Research from '@/pages/Research';
import Essay from '@/pages/Essay';
import Quiz from '@/pages/Quiz';
import Flashcards from '@/pages/Flashcards';
import StudyNotes from '@/pages/StudyNotes';
import Presentation from '@/pages/Presentation';
import TextPlayground from '@/pages/TextPlayground';
import MathSolver from '@/pages/MathSolver';
import VirtualLab from '@/pages/VirtualLab';
import Logic from '@/pages/Logic';
import StudyGames from '@/pages/StudyGames';
import TestConductor from '@/pages/TestConductor';
import SimulationsPage from '@/features/simulations/SimulationsPage';
import DebateMentorPage from '@/features/debate-mentor/DebateMentorPage';
import SimulationsV2Page from '@/features/simulations/SimulationsV2Page';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

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
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location}>
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
        </PageTransition>
      </AnimatePresence>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollToTop />
          <GestureProvider>
            <Router />
          </GestureProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
