import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Shell from './components/Shell.jsx';
import { EmptyState } from './components/ui.jsx';
import { SessionProvider, ToastProvider, useSession } from './lib/session.jsx';
import Home from './pages/Home.jsx';
import MyTickets from './pages/MyTickets.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import { KnowledgeBase, Article } from './pages/KnowledgeBase.jsx';
import Software from './pages/Software.jsx';
import Queue from './pages/Queue.jsx';
import Workspace from './pages/Workspace.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Approvals from './pages/Approvals.jsx';
import { Onboarding, Offboarding } from './pages/Hr.jsx';
import { KbAdmin, KbEdit, Settings } from './pages/Admin.jsx';

// Static Web Apps uses BrowserRouter; the single-file preview build uses an in-memory router.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;

const ROUTES = [
  { path: '/', title: 'Home', el: <Home />, perm: 'submit' },
  { path: '/tickets', title: 'My tickets', el: <MyTickets />, perm: 'submit' },
  { path: '/tickets/:id', title: 'Ticket', el: <TicketDetail />, perm: 'submit' },
  { path: '/kb', title: 'Knowledge base', el: <KnowledgeBase /> },
  { path: '/kb/:id', title: 'Knowledge base · Article', el: <Article /> },
  { path: '/software', title: 'Software', el: <Software />, perm: 'catalog' },
  { path: '/queue', title: 'Service desk · Ticket queue', el: <Queue />, perm: 'queue' },
  { path: '/queue/:id', title: 'Service desk · Ticket workspace', el: <Workspace />, perm: 'queue' },
  { path: '/dashboard', title: 'Service desk · Operations', el: <Dashboard />, perm: 'dashboard' },
  { path: '/approvals', title: 'Management · Approvals', el: <Approvals />, perm: 'approvals' },
  { path: '/hr/onboarding', title: 'People requests · Onboarding', el: <Onboarding />, perm: 'hr' },
  { path: '/hr/offboarding', title: 'People requests · Offboarding', el: <Offboarding />, perm: 'hr' },
  { path: '/hr/requests', title: 'People requests · My requests', el: <MyTickets hrOnly />, perm: 'hr' },
  { path: '/admin/kb', title: 'Administration · Knowledge editor', el: <KbAdmin />, perm: 'admin' },
  { path: '/admin/kb/:id', title: 'Administration · Edit article', el: <KbEdit />, perm: 'admin' },
  { path: '/admin/settings', title: 'Administration · Automation settings', el: <Settings />, perm: 'admin' },
];

function Guard({ perm, children }) {
  const { can, user } = useSession();
  if (perm && !can(perm)) {
    return (
      <section className="panel">
        <EmptyState icon="lock" title="Not available for your role" action={<Link to="/" className="btn btn-secondary">Go to home</Link>}>
          {user.role}s don't have access to this page. Switch roles from the menu in the top right to explore it.
        </EmptyState>
      </section>
    );
  }
  return children;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <SessionProvider>
        <ToastProvider>
          <ScrollTop />
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<Shell title={r.title}><Guard perm={r.perm}>{r.el}</Guard></Shell>} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </Router>
  );
}
