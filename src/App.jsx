import { useState } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/useAuth.js';
import { GoogleCalendarProvider } from './lib/GoogleCalendarProvider.jsx';
import { friendlyErrorMessage, showToast } from './lib/toastStore.js';
import SignInView from './auth/SignInView.jsx';
import UpdatePasswordView from './auth/UpdatePasswordView.jsx';
import AppShell from './components/AppShell.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Toaster from './components/Toaster.jsx';
import DashboardView from './features/dashboard/DashboardView.jsx';
import PlannerView from './features/planner/PlannerView.jsx';
import HabitsView from './features/habits/HabitsView.jsx';
import JournalView from './features/journal/JournalView.jsx';
import GoalsView from './features/goals/GoalsView.jsx';
import NotesView from './features/notes/NotesView.jsx';

// Every failed read or write in the app funnels through here. Individual
// hooks don't need their own onError just to tell the user something broke;
// they only add one when they have something more specific to do.
const reportError = (error) => showToast(friendlyErrorMessage(error));

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportError }),
  mutationCache: new MutationCache({ onError: reportError }),
});

const VIEWS = {
  dashboard: DashboardView,
  planner: PlannerView,
  habits: HabitsView,
  journal: JournalView,
  goals: GoalsView,
  notes: NotesView,
};

function Gate() {
  const { session, passwordRecovery, clearPasswordRecovery } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (session === undefined) {
    return <div className="app-splash">Loading…</div>;
  }

  if (!session) {
    return <SignInView />;
  }

  if (passwordRecovery) {
    return <UpdatePasswordView onDone={clearPasswordRecovery} />;
  }

  const ActiveView = VIEWS[tab];

  return (
    <GoogleCalendarProvider>
      <AppShell activeTab={tab} onSelectTab={setTab}>
        <ActiveView onNavigate={setTab} />
      </AppShell>
    </GoogleCalendarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
