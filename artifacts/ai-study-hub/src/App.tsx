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
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import ClassroomLobby from '@/pages/ClassroomLobby';
import VirtualClassroom from '@/pages/VirtualClassroom';

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
            <Route path="/virtual-classroom" component={ClassroomLobby} />
            <Route path="/virtual-classroom/:id" component={VirtualClassroom} />
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
