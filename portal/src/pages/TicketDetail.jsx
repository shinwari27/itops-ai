import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import AutomationTrace from '../components/AutomationTrace.jsx';
import Timeline from '../components/Timeline.jsx';
import RequestDetails from '../components/RequestDetails.jsx';
import { StatusBadge, Prio, EmptyState, LoadingRows, Avatar } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { SCENARIOS, REOPEN_WINDOW_DAYS } from '../api/taxonomy.js';
import { useLive, useToast, useSession } from '../lib/session.jsx';
import { dateTime, timeAgo } from '../lib/format.js';

// Employee-facing status steps (simplified view of the lifecycle).
const JOURNEY = ['Received', 'Triaged', 'Being worked on', 'Resolved'];
function journeyIndex(s) {
  if (['New', 'AI Analysis'].includes(s)) return 0;
  if (['Triaged', 'Pending Approval', 'Assigned'].includes(s)) return 1;
  if (s === 'In Progress') return 2;
  return 3;
}

export default function TicketDetail() {
  const { id } = useParams();
  const { can } = useSession();
  const toast = useToast();
  const { data, error, loading } = useLive(() => api.getTicket(id), [id]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  if (loading && !data) return <section className="panel"><LoadingRows n={6} /></section>;
  if (error && !data) {
    return <section className="panel"><EmptyState icon="alert" title="Can't open this ticket" action={<Link to="/tickets" className="btn btn-secondary">Back to my tickets</Link>}>{error.message}</EmptyState></section>;
  }
  const { ticket: t, updates, automationRuns } = data;
  const run = automationRuns[automationRuns.length - 1];
  const ji = journeyIndex(t.status);
  const canReopen = t.status === 'Resolved' && (Date.now() - new Date(t.resolvedAt).getTime()) / 86400000 <= REOPEN_WINDOW_DAYS;

  async function send(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    try { await api.addComment(id, { body: msg }); setMsg(''); toast('Message sent'); } catch (err) { toast(err.message, 'error'); } finally { setSending(false); }
  }
  async function reopen() {
    try { await api.reopen(id); toast(`${id} reopened`); } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="stack" style={{ gap: 10 }}>
        <Link to="/tickets" className="row small" style={{ gap: 4, textDecoration: 'none', width: 'fit-content' }}><Icon name="back" style={{ width: 16, height: 16 }} />My tickets</Link>
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 10 }}><span className="mono muted">{t.ticketId}</span><StatusBadge status={t.status} /></div>
            <h1 style={{ marginTop: 6 }}>{t.title}</h1>
            <p className="lede">Opened {timeAgo(t.createdAt)} · last update {timeAgo(t.updatedAt)}</p>
          </div>
          {can('queue') ? <Link to={`/queue/${t.ticketId}`} className="btn btn-secondary"><Icon name="wrench" />Open in workspace</Link> : null}
        </div>
      </div>

      <section className="panel">
        <div className="panel-body">
          <ol className="row" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }} aria-label="Ticket progress">
            {JOURNEY.map((step, i) => (
              <li key={step} className="row" style={{ flex: 1, gap: 10, minWidth: 140, flexWrap: 'nowrap' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none',
                  background: i <= ji ? 'var(--accent)' : 'var(--surface-2)', color: i <= ji ? 'var(--accent-ink)' : 'var(--muted)', border: i <= ji ? 'none' : '1px solid var(--line-2)' }}>
                  {i < ji || (i === ji && i === 3) ? <Icon name="check" style={{ width: 14, height: 14 }} /> : <span className="small tnum">{i + 1}</span>}
                </span>
                <span style={{ fontWeight: i === ji ? 650 : 450, color: i <= ji ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{step}</span>
                {i < JOURNEY.length - 1 ? <span style={{ flex: 1, height: 2, background: i < ji ? 'var(--accent)' : 'var(--line)', margin: '0 10px', minWidth: 16 }} /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="split">
        <div className="stack" style={{ gap: 20 }}>
          {t.automationScenario && (run || t.automationStatus !== 'Not Applicable') ? (
            <section className="panel">
              <div className="panel-head">
                <div className="row" style={{ gap: 8 }}><Icon name="bolt" style={{ width: 18, height: 18, color: 'var(--accent)' }} /><h2>{SCENARIOS[t.automationScenario].name} automation</h2></div>
                <span className="small muted">{t.automationStatus === 'Failed' ? 'Escalated to a technician' : t.automationStatus}</span>
              </div>
              <div className="panel-body">
                {t.status === 'Pending Approval' ? <p className="muted" style={{ marginBottom: 12 }}>This starts as soon as a manager approves the request.</p> : null}
                <AutomationTrace run={run} scenario={t.automationScenario} />
              </div>
            </section>
          ) : null}

          {['Resolved', 'Closed'].includes(t.status) && t.resolution ? (
            <section className="panel" style={{ borderColor: 'color-mix(in srgb, var(--good) 35%, var(--line))' }}>
              <div className="panel-body row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 14 }}>
                <Icon name="checkCircle" style={{ width: 24, height: 24, color: 'var(--good)', flex: 'none' }} />
                <div className="stack" style={{ gap: 6, flex: 1 }}>
                  <h3>Resolution</h3>
                  <p>{t.resolution}</p>
                  {canReopen ? (
                    <div className="row" style={{ marginTop: 6 }}>
                      <span className="small muted">Still not fixed?</span>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={reopen}><Icon name="reopen" />Reopen ticket</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-head"><h2>Updates</h2></div>
            <div className="panel-body">
              <Timeline updates={updates} />
              {t.status !== 'Closed' ? (
                <form onSubmit={send} className="stack" style={{ gap: 10, marginTop: 8 }}>
                  <label htmlFor="reply" className="sr-only">Reply to IT</label>
                  <textarea id="reply" className="textarea" rows={3} placeholder="Add details or reply to the technician…" value={msg} onChange={(e) => setMsg(e.target.value)} />
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={sending || !msg.trim()}><Icon name="send" />Send reply</button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <div className="panel-head"><h2>Details</h2></div>
            <div className="panel-body">
              <dl className="kv">
                <dt>Priority</dt><dd><Prio p={t.priority} /></dd>
                <dt>Category</dt><dd>{t.category} / {t.subcategory}</dd>
                <dt>Team</dt><dd>{t.assignedTeam}</dd>
                <dt>Technician</dt><dd>{t.assignedTechnician ? <span className="row" style={{ gap: 8 }}><Avatar name={t.assignedTechnician.displayName} />{t.assignedTechnician.displayName}</span> : <span className="muted">{t.automationScenario && t.automationStatus !== 'Failed' ? 'Automation' : 'Not assigned yet'}</span>}</dd>
                {t.deviceName ? <><dt>Device</dt><dd className="mono">{t.deviceName}</dd></> : null}
                <dt>Opened</dt><dd>{dateTime(t.createdAt)}</dd>
                <dt>Target fix</dt><dd>{dateTime(t.slaDueAt)}</dd>
              </dl>
            </div>
          </section>
          {t.requestDetails ? (
            <section className="panel">
              <div className="panel-head"><h2>Request</h2></div>
              <div className="panel-body"><RequestDetails ticket={t} /></div>
            </section>
          ) : null}
          <section className="panel">
            <div className="panel-head"><h2>Your description</h2></div>
            <div className="panel-body stack">
              <p style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p>
              {t.attachments?.length ? (
                <div className="stack" style={{ gap: 6 }}>
                  {t.attachments.map((a) => <span key={a.name} className="row small" style={{ gap: 6 }}><Icon name="paperclip" style={{ width: 15, height: 15 }} />{a.name}</span>)}
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
