// In-browser mock of the ITOps AI API (Phase 0.5).
// Same function names and response shapes as httpApi.js, so the UI never changes
// when the real Azure Functions backend replaces this file.

import { buildSeed, USERS, TECHNICIANS } from './seed.js';
import { classify, recommend } from './classifier.js';
import { SCENARIOS, AI_CONFIDENCE_THRESHOLD, PRIORITIES, REOPEN_WINDOW_DAYS } from './taxonomy.js';

const STORE_KEY = 'itops-ai-demo-v1';
let db = load();
const listeners = new Set();
const running = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable: fall back to fresh seed */ }
  return buildSeed();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
function emit() { save(); listeners.forEach((fn) => fn()); }

const clone = (x) => JSON.parse(JSON.stringify(x));
const nowIso = () => new Date().toISOString();
const wait = (ms) => new Promise((r) => setTimeout(r, ms / (db.settings.speed || 1)));
const latency = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 220));

class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

let currentUserKey = 'emp';
export function _setMockUser(key) { currentUserKey = key; }
const me = () => USERS[currentUserKey];
const isTech = () => ['L1 Technician', 'L2 Technician', 'IT Manager', 'Administrator'].includes(me().role);

function findTicket(id) {
  const t = db.tickets.find((x) => x.ticketId === id);
  if (!t) throw new ApiError('not_found', `Ticket ${id} does not exist.`);
  return t;
}

let updateSeq = 0;
function addUpdate(ticketId, actorType, actorName, updateType, message, visibility = 'Public') {
  updateSeq += 1;
  db.updates.push({
    updateId: `UPD${Date.now().toString(36)}${updateSeq}`,
    ticketId, timestamp: nowIso(), actorType, actorName, updateType, visibility, message,
  });
}

function touch(t, patch) { Object.assign(t, patch, { updatedAt: nowIso() }); }

function slaDue(priority, createdAt) {
  return new Date(new Date(createdAt).getTime() + PRIORITIES[priority].resolve * 60000).toISOString();
}

function needsApproval(t) {
  if (t.automationScenario === 'onboarding' || t.automationScenario === 'offboarding') return true;
  if (t.automationScenario === 'software-install') {
    const item = db.catalog.find((c) => c.itemId === t.requestDetails?.itemId);
    return Boolean(item?.requiresApproval);
  }
  return false;
}

const ALIASES = {
  'app-7zip': ['7-zip', '7zip'], 'app-chrome': ['chrome'], 'app-vlc': ['vlc'], 'app-reader': ['reader', 'acrobat', 'pdf'],
  'app-teams': ['teams'], 'app-visio': ['visio'], 'app-powerbi': ['power bi', 'powerbi'],
};
function matchCatalog(text) {
  const lower = text.toLowerCase();
  return db.catalog.find((c) => (ALIASES[c.itemId] || [c.name.toLowerCase()]).some((a) => lower.includes(a)));
}

// ---------- Automation engine simulation ----------

const RESOLUTIONS = {
  'account-lockout': ['User completed a secure reset through SSPR and signed in successfully.', 'Auto-Resolved'],
  'password-sspr': ['SSPR guidance sent; password last-changed date updated.', 'Auto-Resolved'],
  'low-disk': ['Cleanup removed temporary files. Free space is now above 10%.', 'Auto-Resolved'],
  'device-checkin': ['Device synced and checked in with Intune.', 'Auto-Resolved'],
  'device-compliance': ['Approved fix applied. Device is compliant again.', 'Auto-Resolved'],
  'software-install': ['App assigned through Intune and installed on the device.', 'Request Fulfilled'],
  'teams-basic': ['Teams cache cleared; user confirmed Teams works.', 'Auto-Resolved'],
  'outlook-basic': ['Outlook cache reset; user confirmed Outlook opens.', 'Auto-Resolved'],
  onboarding: ['Account created, groups and licenses assigned, checklist posted to Teams.', 'Request Fulfilled'],
  offboarding: ['Account disabled, sessions revoked, access removed. Device recovery checklist sent to manager.', 'Request Fulfilled'],
};

const STEP_DETAIL = {
  'low-disk': ['{device} found in Intune.', 'Free space 6% (below 10% threshold).', 'Cleared temp, update cache and browser caches.', 'Free space now 22%.', ''],
  'device-compliance': ['{device} found in Intune.', 'Failing setting: BitLocker off (approved fix exists).', 'BitLocker enabled, sync requested.', 'Compliance state: Compliant.', ''],
  'device-checkin': ['Last check-in 31 h ago.', 'Older than 24 h threshold.', 'Sync command sent.', 'Device checked in.', ''],
};

function sideEffects(t) {
  const dev = db.devices.find((d) => d.deviceName === t.deviceName);
  if (!dev) return;
  if (t.automationScenario === 'low-disk') dev.freeDiskGB = Math.max(dev.freeDiskGB, Math.round(dev.totalDiskGB * 0.24));
  if (t.automationScenario === 'device-compliance') { dev.complianceState = 'Compliant'; dev.lastCheckIn = nowIso(); }
  if (t.automationScenario === 'device-checkin') dev.lastCheckIn = nowIso();
}

async function runAutomation(ticketId, { fresh = false } = {}) {
  if (running.has(ticketId)) return;
  running.add(ticketId);
  try {
    const t = findTicket(ticketId);
    const scenario = SCENARIOS[t.automationScenario];
    let run = db.runs.find((r) => r.ticketId === ticketId && !r.result);
    if (!run || fresh) {
      run = {
        runId: `RUN${Date.now().toString(36).toUpperCase()}`,
        ticketId, scenario: t.automationScenario, startedAt: nowIso(), endedAt: null, result: null,
        steps: scenario.steps.map((name) => ({ name, status: 'Pending', detail: '', at: null })),
      };
      db.runs.push(run);
      addUpdate(ticketId, 'Automation', 'Automation engine', 'AutomationStep', `${scenario.name} automation started.`);
    }
    touch(t, { status: 'In Progress', automationStatus: 'Running' });
    emit();

    for (let i = 0; i < run.steps.length; i += 1) {
      const step = run.steps[i];
      if (step.status === 'Succeeded') continue;
      step.status = 'Running'; step.at = nowIso();
      if (i === 3) touch(t, { automationStatus: 'Verifying' });
      emit();
      await wait(1300);
      const fail = i === 3 && db.settings.simulateFailure;
      if (fail) {
        step.status = 'Failed';
        step.detail = 'Verification did not pass.';
        run.result = 'Failed'; run.endedAt = nowIso();
        const team = scenario.team;
        const rec = recommend(t);
        touch(t, {
          automationStatus: 'Failed', status: 'Assigned', assignedTeam: team,
          aiSummary: `${scenario.name} ran but verification failed at "${step.name}". The issue needs a technician.`,
          aiRecommendation: rec.text,
        });
        addUpdate(ticketId, 'System', 'ITOps AI', 'Assignment', `Verification failed. Escalated to ${team} with an AI summary.`);
        emit();
        return;
      }
      step.status = 'Succeeded';
      step.detail = (STEP_DETAIL[t.automationScenario]?.[i] || '').replace('{device}', t.deviceName || 'Device');
      emit();
    }
    const [resolution, code] = RESOLUTIONS[t.automationScenario];
    run.result = 'Succeeded'; run.endedAt = nowIso();
    sideEffects(t);
    touch(t, { automationStatus: 'Succeeded', status: 'Resolved', resolution, resolutionCode: code, resolvedAt: nowIso() });
    addUpdate(ticketId, 'Automation', 'Automation engine', 'StatusChange', `Verified. ${resolution}`);
    emit();
  } finally {
    running.delete(ticketId);
  }
}

async function triage(ticketId) {
  await wait(900);
  let t = findTicket(ticketId);
  touch(t, { status: 'AI Analysis' });
  emit();
  await wait(1600);
  t = findTicket(ticketId);
  const ai = classify(`${t.title} ${t.description}`, t.urgency);
  if (t.requestDetails?.itemId) {
    // Catalog requests are unambiguous: the employee picked the app.
    Object.assign(ai, { category: 'Software', subcategory: 'Install Request', priority: 'P4', assignedTeam: 'Endpoint',
      automationCandidate: true, automationScenario: 'software-install', confidence: 0.98,
      reason: `${t.requestDetails.appName} requested from the approved catalog.` });
  } else if (ai.automationScenario === 'software-install') {
    const item = matchCatalog(`${t.title} ${t.description}`);
    if (item) t.requestDetails = { itemId: item.itemId, appName: item.name };
    else { ai.automationScenario = null; ai.automationCandidate = false; }
  }
  const rec = recommend({ subcategory: ai.subcategory });
  touch(t, {
    category: ai.category, subcategory: ai.subcategory, priority: ai.priority, assignedTeam: ai.assignedTeam,
    automationCandidate: ai.automationCandidate, automationScenario: ai.automationScenario, aiConfidence: ai.confidence,
    aiSummary: ai.reason, aiRecommendation: rec.text, status: 'Triaged', slaDueAt: slaDue(ai.priority, t.createdAt),
  });
  addUpdate(ticketId, 'AI', 'ITOps AI', 'AIAnalysis',
    `Classified as ${ai.category} / ${ai.subcategory}, ${ai.priority}, routed to ${ai.assignedTeam} (confidence ${Math.round(ai.confidence * 100)}%).`, 'Internal');
  emit();
  await wait(500);
  route(ticketId);
}

function route(ticketId) {
  const t = findTicket(ticketId);
  const enabled = t.automationScenario && db.settings.scenarios[t.automationScenario];
  if (t.automationCandidate && enabled && t.aiConfidence >= AI_CONFIDENCE_THRESHOLD) {
    if (needsApproval(t)) {
      touch(t, { status: 'Pending Approval', automationStatus: 'Queued' });
      addUpdate(ticketId, 'System', 'ITOps AI', 'StatusChange', 'Waiting for manager approval before automation runs.');
      emit();
      return;
    }
    touch(t, { automationStatus: 'Queued' });
    emit();
    runAutomation(ticketId);
    return;
  }
  const why = !t.automationCandidate ? 'No approved automation for this issue.'
    : !enabled ? 'This automation is switched off.'
      : 'AI confidence is below the threshold, so a person will triage.';
  touch(t, { status: 'Assigned', automationStatus: 'Not Applicable' });
  addUpdate(ticketId, 'System', 'ITOps AI', 'Assignment', `${why} Assigned to ${t.assignedTeam}.`);
  emit();
}

function newTicketId() {
  const id = `INC${String(db.nextTicket).padStart(5, '0')}`;
  db.nextTicket += 1;
  return id;
}

function baseTicket(fields) {
  const createdAt = nowIso();
  return {
    ticketId: newTicketId(),
    requestType: 'Incident', urgency: 'Medium', category: 'Other', subcategory: 'General Question',
    priority: 'P4', status: 'New', assignedTeam: 'Help Desk', assignedTechnician: null, deviceName: null,
    automationCandidate: false, automationScenario: null, automationStatus: 'Not Applicable',
    aiConfidence: 0, aiSummary: '', aiRecommendation: '', requestDetails: null, attachments: [],
    resolution: '', resolutionCode: null, slaDueAt: slaDue('P4', createdAt),
    createdAt, updatedAt: createdAt, resolvedAt: null, closedAt: null,
    requester: { userId: me().userId, displayName: me().displayName, email: me().email },
    ...fields,
  };
}

// Resume any automation that was mid-flight when the page loaded.
setTimeout(() => {
  db.tickets
    .filter((t) => ['Queued', 'Running', 'Verifying'].includes(t.automationStatus) && ['Triaged', 'In Progress'].includes(t.status))
    .forEach((t) => runAutomation(t.ticketId));
}, 1500);

// ---------- Public API (mirrors the spec's API contract) ----------

export const mockApi = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // GET /api/me
  async getMe() { await latency(); return clone(me()); },

  // POST /api/tickets
  async createTicket({ title, description, urgency = 'Medium', deviceName = null, category = null, attachments = [], requestType = 'Incident', requestDetails = null }) {
    await latency();
    if (!title?.trim() || !description?.trim()) throw new ApiError('validation', 'Add a title and a description.');
    const t = baseTicket({ title: title.trim().slice(0, 120), description: description.trim(), urgency, deviceName, attachments, requestType, requestDetails });
    if (category) t.category = category;
    // Live mode: also create the real ticket in SharePoint via the "ITOps - Portal Submit" flow.
    // The flow URL never reaches the browser: Vite's dev server proxies /live/submit to it.
    if (import.meta.env.VITE_LIVE_SUBMIT === '1') {
      let data = null;
      try {
        const res = await fetch('/live/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: t.title,
            description: t.description,
            requesterEmail: import.meta.env.VITE_LIVE_REQUESTER || 'ali@shinwari260.onmicrosoft.com',
          }),
        });
        data = await res.json().catch(() => null);
        if (!res.ok) throw new ApiError('live_submit', data?.error?.message || `Live submit failed (${res.status})`);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError('live_submit', 'Could not reach the ITOps AI backend. Check the flow URL in .env.local.');
      }
      if (data?.ticketId) t.ticketId = data.ticketId;
    }
    db.tickets.unshift(t);
    addUpdate(t.ticketId, 'User', me().displayName, 'StatusChange', 'Ticket submitted.');
    emit();
    triage(t.ticketId);
    return { ticketId: t.ticketId, status: t.status, automationStatus: t.automationStatus, createdAt: t.createdAt };
  },

  // GET /api/tickets/mine
  async getMyTickets() {
    await latency();
    return clone(db.tickets.filter((t) => t.requester.userId === me().userId));
  },

  // GET /api/tickets/{id}
  async getTicket(id) {
    await latency();
    const t = findTicket(id);
    if (!isTech() && t.requester.userId !== me().userId) throw new ApiError('forbidden', 'You can only view your own tickets.');
    return {
      ticket: clone(t),
      updates: clone(db.updates.filter((u) => u.ticketId === id && (isTech() || u.visibility === 'Public')).sort((a, b) => a.timestamp.localeCompare(b.timestamp))),
      automationRuns: clone(db.runs.filter((r) => r.ticketId === id)),
    };
  },

  // POST /api/tickets/{id}/comments
  async addComment(id, { body, visibility = 'Public' }) {
    await latency();
    if (!body?.trim()) throw new ApiError('validation', 'Write a message first.');
    const t = findTicket(id);
    const actorType = isTech() ? 'Technician' : 'User';
    addUpdate(id, actorType, me().displayName, 'Comment', body.trim(), isTech() ? visibility : 'Public');
    touch(t, {});
    emit();
  },

  // POST /api/tickets/{id}/reopen
  async reopen(id) {
    await latency();
    const t = findTicket(id);
    const age = (Date.now() - new Date(t.resolvedAt || 0).getTime()) / 86400000;
    if (t.status !== 'Resolved' || age > REOPEN_WINDOW_DAYS) throw new ApiError('conflict', 'Only tickets resolved in the last 3 days can be reopened.');
    touch(t, { status: 'In Progress', resolvedAt: null, resolution: '', resolutionCode: null });
    addUpdate(id, 'User', me().displayName, 'StatusChange', 'Reopened by requester.');
    emit();
  },

  // GET /api/tickets?team=&status=&priority=&assignee=
  async listTickets(filter = {}) {
    await latency();
    let list = db.tickets;
    if (filter.team && filter.team !== 'All') list = list.filter((t) => t.assignedTeam === filter.team);
    if (filter.status && filter.status !== 'All') {
      list = filter.status === 'Open' ? list.filter((t) => !['Resolved', 'Closed'].includes(t.status)) : list.filter((t) => t.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'All') list = list.filter((t) => t.priority === filter.priority);
    if (filter.assignee === 'me') list = list.filter((t) => t.assignedTechnician?.userId === me().userId);
    if (filter.assignee === 'unassigned') list = list.filter((t) => !t.assignedTechnician);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((t) => `${t.ticketId} ${t.title} ${t.requester.displayName} ${t.deviceName || ''}`.toLowerCase().includes(q));
    }
    return clone(list);
  },

  // PATCH /api/tickets/{id}
  async updateTicket(id, patch) {
    await latency();
    if (!isTech()) throw new ApiError('forbidden', 'Only IT staff can change tickets.');
    const t = findTicket(id);
    if (patch.status === 'Resolved' && !(patch.resolution || t.resolution)) throw new ApiError('validation', 'Add a resolution before resolving.');
    const msgs = [];
    if (patch.status && patch.status !== t.status) msgs.push(`Status ${t.status} → ${patch.status}.`);
    if (patch.assignedTeam && patch.assignedTeam !== t.assignedTeam) msgs.push(`Team → ${patch.assignedTeam}.`);
    if (patch.priority && patch.priority !== t.priority) msgs.push(`Priority ${t.priority} → ${patch.priority}.`);
    if ('assignedTechnician' in patch && patch.assignedTechnician?.userId !== t.assignedTechnician?.userId) {
      msgs.push(patch.assignedTechnician ? `Assigned to ${patch.assignedTechnician.displayName}.` : 'Unassigned.');
    }
    const extra = {};
    if (patch.status === 'Resolved') extra.resolvedAt = nowIso();
    if (patch.status === 'Closed') extra.closedAt = nowIso();
    if (patch.priority) extra.slaDueAt = slaDue(patch.priority, t.createdAt);
    touch(t, { ...patch, ...extra });
    if (msgs.length) addUpdate(id, 'Technician', me().displayName, patch.assignedTechnician !== undefined ? 'Assignment' : 'StatusChange', msgs.join(' '), 'Internal');
    if (patch.status === 'Resolved') addUpdate(id, 'Technician', me().displayName, 'StatusChange', `Resolved: ${t.resolution}`);
    emit();
    return clone(t);
  },

  // POST /api/tickets/{id}/automation/retry
  async retryAutomation(id) {
    await latency();
    const t = findTicket(id);
    if (!t.automationScenario) throw new ApiError('conflict', 'This ticket has no automation to run.');
    addUpdate(id, 'Technician', me().displayName, 'AutomationStep', 'Automation re-run requested.', 'Internal');
    runAutomation(id, { fresh: true });
  },

  // Offboarding needs a technician confirmation after manager approval.
  async confirmAndRun(id) {
    await latency();
    addUpdate(id, 'Technician', me().displayName, 'AutomationStep', 'Technician confirmed. Offboarding automation starting.', 'Internal');
    runAutomation(id, { fresh: true });
  },

  // GET /api/approvals
  async listApprovals() {
    await latency();
    return clone(db.tickets.filter((t) => t.status === 'Pending Approval'));
  },

  // POST /api/approvals/{id}
  async decideApproval(id, { approve, comment = '' }) {
    await latency();
    const t = findTicket(id);
    if (t.status !== 'Pending Approval') throw new ApiError('conflict', 'This request is no longer waiting for approval.');
    if (!approve) {
      touch(t, { status: 'Closed', automationStatus: 'Not Applicable', closedAt: nowIso(), resolution: `Rejected by ${me().displayName}${comment ? `: ${comment}` : '.'}` });
      addUpdate(id, 'Technician', me().displayName, 'StatusChange', `Request rejected.${comment ? ` ${comment}` : ''}`);
      emit();
      return;
    }
    addUpdate(id, 'Technician', me().displayName, 'StatusChange', `Approved.${comment ? ` ${comment}` : ''}`);
    if (t.automationScenario === 'offboarding') {
      touch(t, { status: 'Assigned', assignedTeam: 'IT Operations' });
      addUpdate(id, 'System', 'ITOps AI', 'Assignment', 'Waiting for a technician to confirm before accounts are disabled.', 'Internal');
      emit();
      return;
    }
    touch(t, { status: 'Triaged' });
    emit();
    runAutomation(id);
  },

  // POST /api/requests/onboarding
  async createOnboarding(d) {
    await latency();
    const t = baseTicket({
      title: `New hire: ${d.employeeName}, ${d.department}`, description: `Onboarding request for ${d.employeeName} (${d.jobTitle}) starting ${d.startDate}.`,
      requestType: 'Onboarding', category: 'Onboarding', subcategory: 'New Hire', priority: 'P3', assignedTeam: 'IT Operations',
      automationCandidate: true, automationScenario: 'onboarding', aiConfidence: 0.99, requestDetails: d,
      aiSummary: `Standard ${d.department} bundle with ${d.requiredAccess.length} access items.`, status: 'Pending Approval', automationStatus: 'Queued',
    });
    db.tickets.unshift(t);
    addUpdate(t.ticketId, 'User', me().displayName, 'StatusChange', 'Onboarding request submitted. Waiting for manager approval.');
    emit();
    return { ticketId: t.ticketId };
  },

  // POST /api/requests/offboarding
  async createOffboarding(d) {
    await latency();
    const t = baseTicket({
      title: `Leaver: ${d.employee}, ${d.department}`, description: `Offboarding request for ${d.employee}, last working day ${d.lastWorkingDay}. Reason: ${d.reason}.`,
      requestType: 'Offboarding', category: 'Offboarding', subcategory: 'Leaver', priority: 'P3', assignedTeam: 'IT Operations',
      automationCandidate: true, automationScenario: 'offboarding', aiConfidence: 0.99, requestDetails: d,
      aiSummary: 'Leaver request. Account disable and access removal run only after approval and technician confirmation.', status: 'Pending Approval', automationStatus: 'Queued',
    });
    db.tickets.unshift(t);
    addUpdate(t.ticketId, 'User', me().displayName, 'StatusChange', 'Offboarding request submitted. Waiting for manager approval.');
    emit();
    return { ticketId: t.ticketId };
  },

  // GET /api/kb?q=
  async searchKb(q = '') {
    await latency();
    const admin = me().role === 'Administrator';
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = db.kb.filter((a) => admin || a.published);
    if (!terms.length) return clone(list);
    return clone(list
      .map((a) => {
        const hay = `${a.title} ${a.tags.join(' ')} ${a.category}`.toLowerCase();
        const body = a.body.toLowerCase();
        const score = terms.reduce((s, w) => s + (hay.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0), 0);
        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .map((x) => x.a));
  },

  // GET /api/kb/{id}
  async getKb(id) {
    await latency();
    const a = db.kb.find((x) => x.articleId === id);
    if (!a) throw new ApiError('not_found', 'Article not found.');
    return clone(a);
  },

  // POST / PUT /api/kb
  async saveKb(article) {
    await latency();
    if (me().role !== 'Administrator') throw new ApiError('forbidden', 'Only administrators can edit articles.');
    if (!article.title?.trim()) throw new ApiError('validation', 'Give the article a title.');
    const existing = db.kb.find((x) => x.articleId === article.articleId);
    const record = { ...article, updatedAt: nowIso() };
    if (existing) Object.assign(existing, record);
    else {
      record.articleId = `KB${String(db.kb.length + 1).padStart(4, '0')}`;
      db.kb.push(record);
    }
    emit();
    return clone(record);
  },

  // GET /api/catalog/software
  async listCatalog() { await latency(); return clone(db.catalog); },

  // GET /api/devices/mine
  async getMyDevices() {
    await latency();
    return clone(db.devices.filter((d) => d.primaryUser === me().userId));
  },

  // GET /api/dashboard/summary
  async getDashboardSummary() {
    await latency();
    const ts = db.tickets;
    const open = ts.filter((t) => !['Resolved', 'Closed'].includes(t.status));
    const today = new Date().toISOString().slice(0, 10);
    const autoRuns = db.runs;
    const succeeded = autoRuns.filter((r) => r.result === 'Succeeded').length;
    const failed = autoRuns.filter((r) => r.result === 'Failed').length;
    const byCat = {};
    ts.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + 1; });
    const byPri = { P1: 0, P2: 0, P3: 0, P4: 0 };
    open.forEach((t) => { byPri[t.priority] += 1; });
    const breached = open.filter((t) => new Date(t.slaDueAt) < new Date()).length;
    const hist = clone(db.history);
    const todayCreated = ts.filter((t) => t.createdAt.slice(0, 10) === today).length;
    const todayAuto = autoRuns.filter((r) => r.result === 'Succeeded' && (r.endedAt || '').slice(0, 10) === today).length;
    hist[hist.length - 1] = { date: today, created: Math.max(hist[hist.length - 1].created, todayCreated), autoResolved: Math.max(hist[hist.length - 1].autoResolved, todayAuto) };
    return {
      totals: {
        total: ts.length,
        open: open.length,
        p1: byPri.P1,
        p2: byPri.P2,
        resolved: ts.filter((t) => t.status === 'Resolved').length,
        escalated: ts.filter((t) => t.automationStatus === 'Failed').length,
        automatedToday: todayAuto,
        pendingApproval: ts.filter((t) => t.status === 'Pending Approval').length,
        slaBreached: breached,
      },
      automation: { attempts: succeeded + failed, succeeded, failed, rate: succeeded + failed ? succeeded / (succeeded + failed) : 0 },
      byCategory: Object.entries(byCat).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
      byPriority: byPri,
      history: hist,
      devices: { managed: 248, compliant: 231, nonCompliant: 17 },
    };
  },

  // Admin settings (automation switches, demo controls)
  async getSettings() { await latency(); return clone(db.settings); },
  async updateSettings(patch) {
    await latency();
    if (me().role !== 'Administrator') throw new ApiError('forbidden', 'Only administrators can change settings.');
    db.settings = { ...db.settings, ...patch, scenarios: { ...db.settings.scenarios, ...(patch.scenarios || {}) } };
    emit();
    return clone(db.settings);
  },
  async updateCatalogItem(itemId, patch) {
    await latency();
    const item = db.catalog.find((c) => c.itemId === itemId);
    Object.assign(item, patch);
    emit();
    return clone(item);
  },
  async listTechnicians() { await latency(); return clone(TECHNICIANS); },
  async resetDemo() {
    db = buildSeed();
    emit();
  },
};
