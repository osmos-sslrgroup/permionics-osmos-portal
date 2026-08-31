import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import LibraryPage from './pages/library/index';
import CaseStudyDetail from './pages/library/detail';
import GeneratorPage from './pages/generator/index';
import QuestionnairePage from './pages/questionnaire/index';
import AssistantPage from './pages/assistant/index';
import SettingsPage from './pages/settings/index';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/library">
        <ProtectedRoute>
          <AppLayout>
            <LibraryPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/library/:id">
        <ProtectedRoute>
          <AppLayout>
            <CaseStudyDetail />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/generator" nest>
        <ProtectedRoute>
          <AppLayout>
            <GeneratorPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/questionnaire">
        <ProtectedRoute>
          <AppLayout>
            <QuestionnairePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/assistant">
        <ProtectedRoute>
          <AppLayout>
            <AssistantPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <AppLayout>
          <NotFound />
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
