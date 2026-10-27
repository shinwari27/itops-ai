import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon, { BrandMark } from './Icon.jsx';
import { Avatar } from './ui.jsx';
import { useSession, useLive, ROLE_KEYS } from '../lib/session.jsx';
import { USERS } from '../api/seed.js';
import { api } from '../api/client.js';

export const LANDING = { emp: '/', l1: '/queue', l2: '/queue', mgr: '/dashboard', hr: '/hr/requests', admin: '/dashboard' };

function useNav(role, counts) {
  const help = { label: 'Get help', items: [
    { to: '/', icon: 'home', text: 'Home', end: true },
    { to: '/tickets', icon: 'ticket', text: 'My tickets', count: counts.mine },
    { to: '/kb', icon: 'book', text: 'Knowledge base' },
    { to: '/software', icon: 'box', text: 'Software' },
  ] };
  const desk = { label: 'Service desk', items: [
    { to: '/queue', icon: 'queue', text: 'All tickets', count: counts.open },
    { to: '/dashboard', icon: 'chart', text: 'Operations' },
  ] };
  const mgr = { label: 'Management', items: [
    { to: '/approvals', icon: 'approve', text: 'Approvals', count: counts.approvals },
  ] };
  const hr = { label: 'People requests', items: [
    { to: '/hr/onboarding', icon: 'userPlus', text: 'Onboard a new hire' },
    { to: '/hr/offboarding', icon: 'userMinus', text: 'Offboard a leaver' },
    { to: '/hr/requests', icon: 'inbox', text: 'My requests' },
  ] };
  const admin = { label: 'Administration', items: [
    { to: '/admin/kb', icon: 'edit', text: 'Knowledge editor' },
    { to: '/admin/settings', icon: 'settings', text: 'Automation settings' },
  ] };
  const selfService = { label: 'Self-service', items: [
    { to: '/', icon: 'plus', text: 'Submit a request', end: true },
    { to: '/tickets', icon: 'ticket', text: 'My tickets', count: counts.mine },
    { to: '/kb', icon: 'book', text: 'Knowledge base' },
    { to: '/software', icon: 'box', text: 'Software' },
  ] };
  switch (role) {
    case 'Employee': return [help];
    case 'L1 Technician':
    case 'L2 Technician': return [desk, selfService];
    case 'IT Manager': return [desk, mgr, selfService];
    case 'HR Requester': return [hr, { label: 'Get help', items: [help.items[0], help.items[1], help.items[2]] }];
    case 'Administrator': return [desk, mgr, hr, admin, selfService];
    default: return [help];
  }
}

function RoleSwitcher() {
  const { user, userKey, switchUser } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="role-switch" ref={ref}>
      <button type="button" className="role-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar name={user.displayName} />
        <span className="who"><b>{user.displayName}</b><span>{user.role}</span></span>
        <Icon name="chevronDown" style={{ width: 16, height: 16, color: 'var(--muted)' }} />
      </button>
      {open ? (
        <div className="menu" role="menu">
          <div className="menu-head">Demo: view the portal as</div>
          {ROLE_KEYS.map((k) => (
            <button key={k} type="button" role="menuitemradio" aria-checked={k === userKey} className="menu-item"
              onClick={() => { switchUser(k); setOpen(false); navigate(LANDING[k]); }}>
              <Avatar name={USERS[k].displayName} />
              <span className="who">{USERS[k].displayName}<span>{USERS[k].role}</span></span>
              {k === userKey ? <Icon name="check" className="check" style={{ width: 18, height: 18 }} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useSession();
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

export default function Shell({ title, children }) {
  const { user, usingMock } = useSession();
  const [navOpen, setNavOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setNavOpen(false), [loc.pathname]);

  const { data: summary } = useLive(async () => {
    const isStaff = ['L1 Technician', 'L2 Technician', 'IT Manager', 'Administrator'].includes(user.role);
    const mine = await api.getMyTickets();
    const s = isStaff ? await api.getDashboardSummary() : null;
    return {
      mine: mine.filter((t) => !['Resolved', 'Closed'].includes(t.status)).length,
      // Live mode: count real open tickets from SharePoint instead of the demo summary.
      open: isStaff && import.meta.env.VITE_LIVE_SUBMIT === '1'
        ? (await api.listTickets({ status: 'Open' })).length
        : s?.totals.open,
      approvals: s?.totals.pendingApproval,
    };
  }, [user.userId]);

  const groups = useNav(user.role, summary || {});

  return (
    <div className="app">
      {navOpen ? <div className="side-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}
      <aside className={`side ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
        <NavLink to="/" className="brand">
          <BrandMark className="brand-mark" />
          <span>
            <span className="brand-name">ITOps AI</span>
            <span className="brand-sub" style={{ display: 'block' }}>IT Support Portal</span>
          </span>
        </NavLink>
        {groups.map((g) => (
          <nav key={g.label} className="nav-group" aria-label={g.label}>
            <div className="nav-label">{g.label}</div>
            {g.items.map((it) => (
              <NavLink key={it.to + it.text} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon name={it.icon} />
                <span>{it.text}</span>
                {it.count ? <span className="nav-count">{it.count}</span> : null}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="side-foot">
          <div><span className="pulse-dot" />Automation engine online</div>
          <div style={{ marginTop: 4 }}>10 approved automations · <strong>V1</strong></div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <Icon name="menu" />
          </button>
          <div className="crumb">{title}</div>
          <div className="spacer" />
          {usingMock ? (
            <span className="mock-banner" title="Data comes from the in-browser mock API until the Azure backend is connected.">
              <Icon name="sparkle" style={{ width: 14, height: 14 }} /><span>Demo data</span>
            </span>
          ) : null}
          <ThemeToggle />
          <RoleSwitcher />
        </header>
        <main className="content" id="main">{children}</main>
      </div>
    </div>
  );
}
