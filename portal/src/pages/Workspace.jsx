import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import AutomationTrace from '../components/AutomationTrace.jsx';
import Timeline from '../components/Timeline.jsx';
import RequestDetails from '../components/RequestDetails.jsx';
import { StatusBadge, AutomationBadge, Prio, SlaBadge, EmptyState, LoadingRows, Avatar, Modal } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { recommend } from '../api/classifier.js';
import { SCENARIOS, TEAMS, RESOLUTION_CODES } from '../api/taxonomy.js';
import { useLive, useSession, useToast } from '../lib/session.jsx';
import { dateTime, timeAgo } from '../lib/format.js';

const WORK_STATUSES = ['Triaged', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

function ResolveModal({ ticket, onClose, onDone }) {
  const [resolution, setResolution] = useState(ticket.resolution || '');
  const [code, setCode] = useState('Fixed by Technician');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function save() {
    if (!resolution.trim()) { setErr('Describe what fixed it. The requester sees this.'); return; }
    setBusy(true);
    try { await api.updateTicket(ticket.ticketId, { status: 'Resolved', resolution, resolutionCode: code }); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  // AI #5: turn the conversation into a clean resolution record.
  function draft() {
    setResolution(`${ticket.aiRecommendation ? `${ticket.aiRecommendation.split('.')[0]}. ` : ''}Confirmed with ${ticket.requester.displayName.split(' ')[0]} that the issue is fixed.`);
  }
  return (
    <Modal title={`Resolve ${ticket.ticketId}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}><Icon name="check" />Resolve ticket</button>
      </>}>
      <div className="field">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <label htmlFor="res-text" style={{ fontSize: '0.85rem', fontWeight: 550 }}>Resolution</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={draft} style={{ color: 'var(--ai)' }}><Icon name="sparkle" />Draft with AI</button>
        </div>
        <textarea id="res-text" className="textarea" rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What fixed it, in words the requester understands" />
      </div>
      <div className="field">
        <label htmlFor="res-code">Resolution code</label>
        <select id="res-code" className="select" value={code} onChange={(e) => setCode(e.target.value)}>
          {RESOLUTION_CODES.filter((c) => c !== 'Auto-Resolved').map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {err ? <p role="alert" style={{ color: 'var(--crit)' }}>{err}</p> : null}
    </Modal>
  );
}

export default function Workspace() {
  const { id } = useParams();
  const { user, can } = useSession();
  const toast = useToast();
  const { data, error, loading } = useLive(() => api.getTicket(id), [id]);
  const { data: techs } = useLive(() => api.listTechnicians(), []);
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState(true);
  const [resolving, setResolving] = useState(false);

  if (loading && !data) return <section className="panel"><LoadingRows n={8} /></section>;
  if (error && !data) return <section className="panel"><EmptyState icon="alert" title="Ticket not found" action={<Link to="/queue" className="btn btn-secondary">Back to queue</Link>}>{error.message}</EmptyState></section>;

  const { ticket: t, updates, automationRuns } = data;
  const run = automationRuns[automationRuns.length - 1];
  const rec = t.aiRecommendation ? { text: t.aiRecommendation, kbIds: recommend(t).kbIds } : recommend(t);
  const closed = ['Resolved', 'Closed'].includes(t.status);
  const awaitingConfirm = t.automationScenario === 'offboarding' && t.status === 'Assigned' && t.automationStatus === 'Queued';

  async function patch(p, okMsg) {
    try { await api.updateTicket(t.ticketId, p); if (okMsg) toast(okMsg); } catch (e) { toast(e.message, 'error'); }
  }
  async function sendNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    try { await api.addComment(t.ticketId, { body: note, visibility: internal ? 'Internal' : 'Public' }); setNote(''); toast(internal ? 'Internal note added' : 'Reply sent to requester'); } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="stack" style={{ gap: 10 }}>
        <Link to="/queue" className="row small" style={{ gap: 4, textDecoration: 'none', width: 'fit-content' }}><Icon name="back" style={{ width: 16, height: 16 }} />All tickets</Link>
        <div className="page-head">
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <Prio p={t.priority} /><span className="mono muted">{t.ticketId}</span><StatusBadge status={t.status} /><AutomationBadge status={t.automationStatus} />
            </div>
            <h1 style={{ marginTop: 8 }}>{t.title}</h1>
            <p className="lede">{t.requester.displayName} · opened {timeAgo(t.createdAt)} · SLA <SlaBadge ticket={t} /></p>
          </div>
          <div className="row">
            {!t.assignedTechnician && !closed ? (
              <button type="button" className="btn btn-secondary" onClick={() => patch({ assignedTechnician: { userId: user.userId, displayName: user.displayName }, status: t.status === 'Triaged' || t.status === 'Assigned' ? 'In Progress' : t.status }, 'Assigned to you')}>
                <Icon name="user" />Assign to me
              </button>
            ) : null}
            {t.automationStatus === 'Failed' && !closed && can('queue') ? (
              <button type="button" className="btn btn-secondary" onClick={async () => { await api.retryAutomation(t.ticketId); toast('Automation re-run started'); }}><Icon name="refresh" />Retry automation</button>
            ) : null}
            {!closed ? <button type="button" className="btn btn-primary" onClick={() => setResolving(true)}><Icon name="check" />Resolve</button> : null}
            {t.status === 'Resolved' ? <button type="button" className="btn btn-secondary" onClick={() => patch({ status: 'Closed' }, 'Ticket closed')}>Close ticket</button> : null}
          </div>
        </div>
      </div>

      {awaitingConfirm ? (
        <section className="panel" style={{ borderColor: 'color-mix(in srgb, var(--warn) 45%, var(--line))', background: 'var(--warn-soft)' }}>
          <div className="panel-body row" style={{ justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <Icon name="shield" style={{ width: 22, height: 22, color: 'var(--warn)', flex: 'none' }} />
              <div>
                <b>Manager approved. A technician must confirm before accounts are disabled.</b>
                <p className="small" style={{ color: 'var(--ink-2)' }}>Offboarding is destructive, so it never runs on approval alone. Check the leaver and date below, then confirm.</p>
              </div>
            </div>
            <button type="button" className="btn btn-danger" onClick={async () => { await api.confirmAndRun(t.ticketId); toast('Offboarding automation started'); }}>Confirm and run offboarding</button>
          </div>
        </section>
      ) : null}

      <div className="split">
        <div className="stack" style={{ gap: 20 }}>
          <section className="panel" style={{ borderColor: 'color-mix(in srgb, var(--ai) 30%, var(--line))' }}>
            <div className="panel-head" style={{ background: 'var(--ai-soft)', borderTopLeftRadius: 'var(--r-lg)', borderTopRightRadius: 'var(--r-lg)' }}>
              <div className="row" style={{ gap: 8 }}><Icon name="sparkle" style={{ width: 18, height: 18, color: 'var(--ai)' }} /><h2 style={{ color: 'var(--ai)' }}>AI analysis</h2></div>
              <span className="small" style={{ color: 'var(--ai)' }}>Confidence {Math.round((t.aiConfidence || 0) * 100)}%</span>
            </div>
            <div className="panel-body stack" style={{ gap: 16 }}>
              <div className="grid grid-3" style={{ gap: 12 }}>
                <div><div className="small muted">Category</div><b>{t.category}</b><div className="small muted">{t.subcategory}</div></div>
                <div><div className="small muted">Routed to</div><b>{t.assignedTeam}</b><div className="small muted mono">{TEAMS[t.assignedTeam]}</div></div>
                <div><div className="small muted">Automation</div><b>{t.automationScenario ? SCENARIOS[t.automationScenario].name : 'Not supported'}</b><div className="small muted">{t.automationScenario ? 'Approved scenario' : 'Human escalation'}</div></div>
              </div>
              {t.aiSummary ? <p><b>Summary. </b>{t.aiSummary}</p> : null}
              <div style={{ padding: 14, borderRadius: 12, border: '1px dashed color-mix(in srgb, var(--ai) 45%, var(--line))' }}>
                <div className="small" style={{ color: 'var(--ai)', fontWeight: 650, marginBottom: 4 }}>Recommended next steps</div>
                <p>{rec.text}</p>
                <div className="row small" style={{ marginTop: 8, gap: 6 }}>
                  <span className="muted">Grounded in</span>
                  {rec.kbIds.map((k) => <Link key={k} to={`/kb/${k}`} className="mono">{k}</Link>)}
                </div>
              </div>
            </div>
          </section>

          {t.automationScenario ? (
            <section className="panel">
              <div className="panel-head">
                <div className="row" style={{ gap: 8 }}><Icon name="bolt" style={{ width: 18, height: 18, color: 'var(--accent)' }} /><h2>{SCENARIOS[t.automationScenario].name}</h2></div>
                <span className="small muted">{automationRuns.length} run{automationRuns.length === 1 ? '' : 's'}{run?.startedAt ? ` · last started ${timeAgo(run.startedAt)}` : ''}</span>
              </div>
              <div className="panel-body stack" style={{ gap: 16 }}>
                <AutomationTrace run={run} scenario={t.automationScenario} />
                {run ? (
                  <div className="table-wrap">
                    <table className="data" style={{ fontSize: '0.84rem' }}>
                      <thead><tr><th>Step</th><th>Result</th><th>Detail</th><th>Time</th></tr></thead>
                      <tbody>
                        {run.steps.map((s) => (
                          <tr key={s.name} style={{ cursor: 'default' }}>
                            <td>{s.name}</td>
                            <td><span className={`badge ${{ Succeeded: 'b-good', Failed: 'b-crit', Running: 'b-accent b-live', Pending: 'b-neutral' }[s.status]}`}>{s.status}</span></td>
                            <td className="muted">{s.detail || '—'}</td>
                            <td className="muted" style={{ whiteSpace: 'nowrap' }}>{s.at ? dateTime(s.at) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="muted small">No run yet{t.status === 'Pending Approval' ? ' — waiting for approval.' : '.'}</p>}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-head"><h2>Activity</h2><span className="small muted">{updates.length} updates</span></div>
            <div className="panel-body">
              <Timeline updates={updates} />
              {t.status !== 'Closed' ? (
                <form onSubmit={sendNote} className="stack" style={{ gap: 10, marginTop: 8 }}>
                  <div className="seg" role="group" aria-label="Note visibility" style={{ width: 'fit-content' }}>
                    <button type="button" aria-pressed={internal} onClick={() => setInternal(true)}>Internal note</button>
                    <button type="button" aria-pressed={!internal} onClick={() => setInternal(false)}>Reply to requester</button>
                  </div>
                  <label htmlFor="ws-note" className="sr-only">{internal ? 'Internal note' : 'Reply to requester'}</label>
                  <textarea id="ws-note" className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder={internal ? 'Only IT staff see internal notes' : `Message ${t.requester.displayName.split(' ')[0]}`}
                    style={internal ? { background: 'var(--warn-soft)' } : undefined} />
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={!note.trim()}><Icon name="send" />{internal ? 'Add note' : 'Send reply'}</button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <div className="panel-body row" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <Avatar name={t.requester.displayName} size="lg" />
              <div style={{ minWidth: 0 }}>
                <b>{t.requester.displayName}</b>
                <div className="small muted" style={{ overflowWrap: 'anywhere' }}>{t.requester.email}</div>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>Ticket fields</h2></div>
            <div className="panel-body stack" style={{ gap: 14 }}>
              <div className="field">
                <label htmlFor="ws-status">Status</label>
                <select id="ws-status" className="select" value={WORK_STATUSES.includes(t.status) ? t.status : ''} disabled={closed}
                  onChange={(e) => (e.target.value === 'Resolved' ? setResolving(true) : patch({ status: e.target.value }, `Status set to ${e.target.value}`))}>
                  {!WORK_STATUSES.includes(t.status) ? <option value="">{t.status}</option> : null}
                  {WORK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-grid" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="ws-prio">Priority</label>
                  <select id="ws-prio" className="select" value={t.priority} disabled={closed} onChange={(e) => patch({ priority: e.target.value }, `Priority changed to ${e.target.value}`)}>
                    {['P1', 'P2', 'P3', 'P4'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ws-team">Team</label>
                  <select id="ws-team" className="select" value={t.assignedTeam} disabled={closed} onChange={(e) => patch({ assignedTeam: e.target.value, assignedTechnician: null }, `Moved to ${e.target.value}`)}>
                    {Object.keys(TEAMS).map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="ws-tech">Technician</label>
                <select id="ws-tech" className="select" value={t.assignedTechnician?.userId || ''} disabled={closed}
                  onChange={(e) => {
                    const tech = (techs || []).find((x) => x.userId === e.target.value);
                    patch({ assignedTechnician: tech ? { userId: tech.userId, displayName: tech.displayName } : null }, tech ? `Assigned to ${tech.displayName}` : 'Unassigned');
                  }}>
                  <option value="">Unassigned</option>
                  {(techs || []).map((x) => <option key={x.userId} value={x.userId}>{x.displayName} · {x.team}</option>)}
                </select>
              </div>
              <hr className="divider" />
              <dl className="kv" style={{ gridTemplateColumns: '100px minmax(0,1fr)' }}>
                <dt>Type</dt><dd>{t.requestType}</dd>
                <dt>Urgency</dt><dd>{t.urgency}</dd>
                {t.deviceName ? <><dt>Device</dt><dd className="mono">{t.deviceName}</dd></> : null}
                <dt>Opened</dt><dd>{dateTime(t.createdAt)}</dd>
                <dt>SLA due</dt><dd>{dateTime(t.slaDueAt)}</dd>
                {t.resolutionCode ? <><dt>Resolution</dt><dd>{t.resolutionCode}</dd></> : null}
              </dl>
            </div>
          </section>
          {t.requestDetails ? (
            <section className="panel"><div className="panel-head"><h2>Request details</h2></div><div className="panel-body"><RequestDetails ticket={t} /></div></section>
          ) : null}
          <section className="panel">
            <div className="panel-head"><h2>Description</h2></div>
            <div className="panel-body"><p style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p></div>
          </section>
        </aside>
      </div>

      {resolving ? <ResolveModal ticket={t} onClose={() => setResolving(false)} onDone={() => { setResolving(false); toast(`${t.ticketId} resolved`); }} /> : null}
    </>
  );
}
