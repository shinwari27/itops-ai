import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setMockUser, USING_MOCK } from '../api/client.js';
import { USERS } from '../api/seed.js';
import Icon from '../components/Icon.jsx';

// Roles map to Entra groups in production; here a dev-only switcher picks the mock user.
export const ROLE_KEYS = ['emp', 'l1', 'l2', 'mgr', 'hr', 'admin'];

export const CAN = {
  submit: ['Employee', 'L1 Technician', 'L2 Technician', 'IT Manager', 'HR Requester', 'Administrator'],
  queue: ['L1 Technician', 'L2 Technician', 'IT Manager', 'Administrator'],
  dashboard: ['L1 Technician', 'L2 Technician', 'IT Manager', 'Administrator'],
  approvals: ['IT Manager', 'Administrator'],
  hr: ['HR Requester', 'Administrator'],
  admin: ['Administrator'],
  catalog: ['Employee', 'L1 Technician', 'L2 Technician', 'IT Manager', 'HR Requester', 'Administrator'],
};

const SessionCtx = createContext(null);
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function SessionProvider({ children }) {
  const [userKey, setUserKey] = useState(() => {
    const k = safeGet('itops-role');
    return ROLE_KEYS.includes(k) ? k : 'emp';
  });
  setMockUser(userKey);
  const user = USERS[userKey];

  const [theme, setTheme] = useState(() => safeGet('itops-theme') || 'system');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    safeSet('itops-theme', theme);
  }, [theme]);

  const switchUser = useCallback((k) => { setMockUser(k); setUserKey(k); safeSet('itops-role', k); }, []);
  const can = useCallback((perm) => CAN[perm]?.includes(user.role), [user.role]);

  const value = useMemo(() => ({ user, userKey, switchUser, can, theme, setTheme, usingMock: USING_MOCK }), [user, userKey, switchUser, can, theme]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
export const useSession = () => useContext(SessionCtx);

// Fetch helper that re-runs whenever the mock store changes (live automation updates).
export function useLive(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const load = useCallback(async () => {
    try {
      const data = await fetchRef.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ data: s.data, error, loading: false }));
    }
  }, []);
  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    load();
    const off = api.subscribe(load);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ...state, reload: load };
}

// ---------- Toasts ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            <Icon name={t.kind === 'error' ? 'alert' : 'checkCircle'} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
