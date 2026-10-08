// Real backend client (Phase 8+). Same function names as mockApi.js.
// Enable by setting VITE_API_BASE (for example "/api" behind Azure Static Web Apps).
// Identity comes from the Entra sign-in token, never from request bodies.

const BASE = import.meta.env.VITE_API_BASE;

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`);
    err.code = data?.error?.code || 'http_error';
    throw err;
  }
  return data;
}

const qs = (o) => {
  const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v != null && v !== '' && v !== 'All'));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const httpApi = {
  // The real API has no push channel yet; screens poll by re-fetching on focus.
  subscribe() { return () => {}; },
  getMe: () => call('GET', '/me'),
  createTicket: (b) => call('POST', '/tickets', b),
  getMyTickets: () => call('GET', '/tickets/mine'),
  getTicket: (id) => call('GET', `/tickets/${id}`),
  addComment: (id, b) => call('POST', `/tickets/${id}/comments`, b),
  reopen: (id) => call('POST', `/tickets/${id}/reopen`),
  listTickets: (f = {}) => call('GET', `/tickets${qs(f)}`),
  updateTicket: (id, patch) => call('PATCH', `/tickets/${id}`, patch),
  retryAutomation: (id) => call('POST', `/tickets/${id}/automation/retry`),
  confirmAndRun: (id) => call('POST', `/tickets/${id}/automation/confirm`),
  listApprovals: () => call('GET', '/approvals'),
  decideApproval: (id, b) => call('POST', `/approvals/${id}`, b),
  createOnboarding: (b) => call('POST', '/requests/onboarding', b),
  createOffboarding: (b) => call('POST', '/requests/offboarding', b),
  searchKb: (q) => call('GET', `/kb${qs({ q })}`),
  getKb: (id) => call('GET', `/kb/${id}`),
  saveKb: (a) => (a.articleId ? call('PUT', `/kb/${a.articleId}`, a) : call('POST', '/kb', a)),
  listCatalog: () => call('GET', '/catalog/software'),
  getMyDevices: () => call('GET', '/devices/mine'),
  getDashboardSummary: () => call('GET', '/dashboard/summary'),
  getSettings: () => call('GET', '/admin/settings'),
  updateSettings: (p) => call('PATCH', '/admin/settings', p),
  updateCatalogItem: (id, p) => call('PATCH', `/catalog/software/${id}`, p),
  listTechnicians: () => call('GET', '/technicians'),
  resetDemo: async () => {},
};
