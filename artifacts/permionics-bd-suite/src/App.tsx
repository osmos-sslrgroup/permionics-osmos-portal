import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import LoginPage from './pages/login';
import ResetPasswordPage from './pages/reset-password';
import DashboardPage from './pages/dashboard';
import LibraryPage from './pages/library/index';
import CaseStudyDetail from './pages/library/detail';
import GeneratorPage from './pages/generator/index';
import QuestionnairePage from './pages/questionnaire/index';
import AssistantPage from './pages/assistant/index';
import PacePage from './pages/pace/index';
import PaceFormatterPage from './pages/pace-formatter/index';
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
      <Route path="/reset-password" component={ResetPasswordPage} />
      
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
        <ProtectedRoute allowedRoles={["admin", "operator"]}>
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

      <Route path="/pace">
        <ProtectedRoute>
          <AppLayout>
            <PacePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pace-formatter">
        <ProtectedRoute allowedRoles={["admin", "operator"]}>
          <AppLayout>
            <PaceFormatterPage />
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
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 select-none font-sans">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
        <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] border-t-4 border-t-red-500 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Missing Configuration</h1>
          <p className="text-sm text-slate-500 mb-4">
            The application failed to start because Firebase is not configured.
          </p>
          <div className="bg-slate-50 rounded p-3 text-left border border-slate-100">
            <code className="text-[10px] text-slate-600 font-mono">
              Make sure to add <span className="font-bold text-slate-800">VITE_FIREBASE_API_KEY</span> and <span className="font-bold text-slate-800">VITE_FIREBASE_AUTH_DOMAIN</span> to your frontend .env file.
            </code>
          </div>
        </div>
      </div>
    );
  }

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
