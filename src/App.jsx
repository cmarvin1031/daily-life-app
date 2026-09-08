import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/useAuth.js';
import { GoogleCalendarProvider } from './lib/GoogleCalendarProvider.jsx';
import SignInView from './auth/SignInView.jsx';
import AppShell from './components/AppShell.jsx';
import DashboardView from './features/dashboard/DashboardView.jsx';
import PlannerView from './features/planner/PlannerView.jsx';
import HabitsView from './features/habits/HabitsView.jsx';
import JournalView from './features/journal/JournalView.jsx';
import GoalsView from './features/goals/GoalsView.jsx';
import NotesView from './features/notes/NotesView.jsx';

const queryClient = new QueryClient();

const VIEWS = {
  dashboard: DashboardView,
  planner: PlannerView,
  habits: HabitsView,
  journal: JournalView,
  goals: GoalsView,
  notes: NotesView,
};

function Gate() {
  const { session } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (session === undefined) {
    return <div className="app-splash">Loading…</div>;
  }

  if (!session) {
    return <SignInView />;
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
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
