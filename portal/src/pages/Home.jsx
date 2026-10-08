import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import AutomationTrace from '../components/AutomationTrace.jsx';
import { StatusBadge, Prio, AutomationBadge } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { classify } from '../api/classifier.js';
import { SCENARIOS, URGENCY } from '../api/taxonomy.js';
import { useLive, useSession, useToast } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

const EXAMPLES = [
  { label: 'Laptop is slow', text: 'My laptop is running very slowly and apps take minutes to open.' },
  { label: 'Account locked', text: "I can't sign in. It says my account is locked." },
  { label: 'Need 7-Zip', text: 'I need 7-Zip installed to open archive files from a supplier.' },
  { label: "Outlook won't open", text: "Outlook isn't opening. It hangs on the loading screen." },
  { label: 'Wi-Fi keeps dropping', text: 'Wi-Fi keeps disconnecting in the meeting rooms on floor 4.' },
  { label: 'Suspicious link', text: 'I think I clicked a phishing link in an invoice email.' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function TriagePreview({ text, urgency }) {
  const debounced = useDebounced(text, 350);
  const ai = useMemo(() => (debounced.trim().length > 8 ? classify(debounced, urgency) : null), [debounced, urgency]);
  const [articles, setArticles] = useState([]);
  useEffect(() => {
    let live = true;
    if (!ai) { setArticles([]); return undefined; }
    const words = `${ai.subcategory} ${debounced}`.split(/\W+/).filter((w) => w.length > 3).slice(0, 6).join(' ');
    api.searchKb(words).then((r) => live && setArticles(r.slice(0, 2)));
    return () => { live = false; };
  }, [ai, debounced]);

  return (
    <section className="panel" aria-live="polite" style={{ overflow: 'hidden' }}>
      <div className="panel-head" style={{ background: 'var(--ai-soft)', borderBottomColor: 'transparent' }}>
        <div className="row" style={{ gap: 8 }}>
          <Icon name="sparkle" style={{ width: 18, height: 18, color: 'var(--ai)' }} />
          <h3 style={{ color: 'var(--ai)' }}>Live triage preview</h3>
        </div>
      </div>
      <div className="panel-body stack" style={{ gap: 16 }}>
        {!ai ? (
          <p className="muted">Start describing your problem. You'll see how ITOps AI will classify and route it before you submit.</p>
        ) : (
          <>
            <dl className="kv" style={{ gridTemplateColumns: '96px minmax(0,1fr)' }}>
              <dt>Category</dt><dd><b>{ai.category}</b> <span className="muted">/ {ai.subcategory}</span></dd>
              <dt>Priority</dt><dd className="row" style={{ gap: 8 }}><Prio p={ai.priority} /><span className="muted small">{{ P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low' }[ai.priority]}</span></dd>
              <dt>Handled by</dt><dd>{ai.assignedTeam}</dd>
            </dl>
            <div style={{ padding: 14, borderRadius: 12, background: ai.automationScenario ? 'var(--accent-soft)' : 'var(--surface-2)', display: 'flex', gap: 12 }}>
              <Icon name={ai.automationScenario ? 'bolt' : 'user'} style={{ width: 20, height: 20, flex: 'none', marginTop: 2, color: ai.automationScenario ? 'var(--accent)' : 'var(--muted)' }} />
              <div>
                <b style={{ color: ai.automationScenario ? 'var(--accent)' : 'var(--ink)' }}>
                  {ai.automationScenario ? 'Can be fixed automatically' : 'A technician will handle this'}
                </b>
                <p className="small" style={{ marginTop: 2 }}>
                  {ai.automationScenario ? `${SCENARIOS[ai.automationScenario].name} automation, verified before your ticket closes.` : ai.reason}
                </p>
              </div>
            </div>
            <div>
              <div className="row small muted" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span>AI confidence</span><span className="tnum">{Math.round(ai.confidence * 100)}%</span>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${ai.confidence * 100}%`, background: ai.confidence >= 0.7 ? 'var(--ai)' : 'var(--line-2)' }} /></div>
            </div>
            {articles.length ? (
              <div className="stack" style={{ gap: 6 }}>
                <span className="small muted">Might help right now</span>
                {articles.map((a) => (
                  <Link key={a.articleId} to={`/kb/${a.articleId}`} className="row" style={{ gap: 8, textDecoration: 'none', fontWeight: 550 }}>
                    <Icon name="book" style={{ width: 16, height: 16 }} />{a.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function SubmissionTracker({ ticketId, onReset }) {
  const { data } = useLive(() => api.getTicket(ticketId), [ticketId]);
  const t = data?.ticket;
  const run = data?.automationRuns?.[data.automationRuns.length - 1];
  const done = t && ['Resolved', 'Closed'].includes(t.status);
  const headline = !t ? 'Submitting…'
    : t.status === 'New' ? 'Ticket received'
      : t.status === 'AI Analysis' ? 'ITOps AI is reading your request'
        : t.status === 'Pending Approval' ? 'Waiting for manager approval'
          : t.automationStatus === 'Running' || t.automationStatus === 'Verifying' || t.automationStatus === 'Queued' ? 'Fixing it automatically'
            : done ? 'Fixed and verified'
              : t.automationStatus === 'Failed' ? 'Passed to a technician'
                : `Assigned to ${t.assignedTeam}`;

  return (
    <section className="panel raised" aria-live="polite">
      <div className="panel-body stack" style={{ gap: 20, padding: 24 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: 4 }}>
            <span className="mono muted">{ticketId}</span>
            <h2 style={{ fontSize: '1.5rem' }}>{headline}</h2>
          </div>
          {t ? <StatusBadge status={t.status} /> : null}
        </div>
        {t && t.status !== 'New' && t.status !== 'AI Analysis' ? (
          <div className="row" style={{ gap: 18 }}>
            <span className="row small" style={{ gap: 6 }}><span className="muted">Category</span><b>{t.category}</b></span>
            <span className="row small" style={{ gap: 6 }}><span className="muted">Priority</span><Prio p={t.priority} /></span>
            <span className="row small" style={{ gap: 6 }}><span className="muted">Team</span><b>{t.assignedTeam}</b></span>
          </div>
        ) : (
          <div className="row small muted" style={{ gap: 8 }}><Icon name="loader" className="spin" style={{ width: 16, height: 16 }} /> Classifying, prioritizing and checking for an approved automation…</div>
        )}
        {t?.automationScenario ? <AutomationTrace run={run} scenario={t.automationScenario} /> : null}
        {t && !t.automationScenario && t.status === 'Assigned' ? (
          <p className="muted">There's no safe automation for this one, so a {t.assignedTeam} technician has it. They'll reply on your ticket.</p>
        ) : null}
        {t?.automationStatus === 'Failed' ? (
          <p className="muted">The automation couldn't confirm the fix. A {t.assignedTeam} technician has your ticket and the full history.</p>
        ) : null}
        {done ? <p style={{ color: 'var(--good)', fontWeight: 550 }}>{t.resolution}</p> : null}
        <div className="row">
          <Link to={`/tickets/${ticketId}`} className="btn btn-primary">Open ticket</Link>
          <button type="button" className="btn btn-secondary" onClick={onReset}>Submit another request</button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [description, setDescription] = useState(location.state?.prefill || '');
  const [title, setTitle] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [urgency, setUrgency] = useState('Medium');
  const [device, setDevice] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');

  const { data: devices } = useLive(() => api.getMyDevices(), [user.userId]);
  const { data: mine } = useLive(() => api.getMyTickets(), [user.userId]);
  const { data: popular } = useLive(() => api.searchKb(''), []);

  useEffect(() => { if (devices?.length && !device) setDevice(devices[0].deviceName); }, [devices, device]);
  useEffect(() => {
    if (titleEdited) return;
    const first = description.split(/[.!?\n]/)[0].trim();
    setTitle(first.length > 70 ? `${first.slice(0, 67)}…` : first);
  }, [description, titleEdited]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (description.trim().length < 10) { setError('Describe the problem in a sentence or two so we can route it.'); return; }
    setBusy(true);
    try {
      const res = await api.createTicket({
        title: title || description.slice(0, 60), description, urgency, deviceName: device || null,
        attachments: files.map((f) => ({ name: f.name, size: f.size, url: '' })),
      });
      setSubmitted(res.ticketId);
      toast(`Ticket ${res.ticketId} submitted`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setSubmitted(null); setDescription(''); setTitle(''); setTitleEdited(false); setFiles([]); setUrgency('Medium');
  }

  const recent = (mine || []).slice(0, 4);
  const first = user.displayName.split(' ')[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting()}, {first}. What's not working?</h1>
          <p className="lede">Describe it in your own words. ITOps AI sorts your request, fixes what it safely can, and gets the right technician on everything else.</p>
        </div>
      </div>

      <div className="split">
        {submitted ? (
          <SubmissionTracker ticketId={submitted} onReset={reset} />
        ) : (
          <form className="panel raised" onSubmit={submit} noValidate>
            <div className="panel-body stack" style={{ gap: 18, padding: 24 }}>
              <div className="field">
                <label htmlFor="desc" className="sr-only">Describe your problem</label>
                <textarea id="desc" className="textarea" rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="My laptop is running very slowly and Excel freezes when I open large files…"
                  style={{ fontSize: '1.08rem', minHeight: 150, padding: 16, borderRadius: 14 }} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="small muted">Try:</span>
                {EXAMPLES.map((ex) => (
                  <button key={ex.label} type="button" className="chip" onClick={() => { setDescription(ex.text); setTitleEdited(false); }}>{ex.label}</button>
                ))}
              </div>
              <hr className="divider" />
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="title">Short title</label>
                  <input id="title" className="input" value={title} maxLength={120} onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }} placeholder="Filled in from your description" />
                </div>
                <div className="field full">
                  <label htmlFor="device">Affected device</label>
                  <select id="device" className="select" value={device} onChange={(e) => setDevice(e.target.value)}>
                    {(devices || []).map((d) => <option key={d.deviceName} value={d.deviceName}>{d.deviceName} · {d.model}</option>)}
                    <option value="">Not about a device</option>
                  </select>
                </div>
                <div className="field full">
                  <span id="urg-label" style={{ fontSize: '0.85rem', fontWeight: 550, color: 'var(--ink-2)' }}>How much is this blocking you?</span>
                  <div className="seg" role="group" aria-labelledby="urg-label">
                    {URGENCY.map((u) => (
                      <button key={u} type="button" aria-pressed={urgency === u} onClick={() => setUrgency(u)}>
                        {{ Low: 'A little', Medium: 'Slowing me down', High: "Can't work" }[u]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field full">
                  <label htmlFor="files">Screenshot or file <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="files" type="file" multiple className="input" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                </div>
              </div>
              {error ? <p role="alert" style={{ color: 'var(--crit)' }}>{error}</p> : null}
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="small muted">You'll see live progress as soon as you submit.</span>
                <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                  {busy ? <Icon name="loader" className="spin" /> : <Icon name="send" />} Submit request
                </button>
              </div>
            </div>
          </form>
        )}
        <TriagePreview text={submitted ? '' : description} urgency={urgency} />
      </div>

      <div className="grid grid-3">
        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-head">
            <h2>Your recent tickets</h2>
            <Link to="/tickets" className="btn btn-ghost btn-sm">All tickets <Icon name="chevron" /></Link>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table className="data">
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.ticketId} onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                      <td className="mono muted" style={{ width: 100 }}>{t.ticketId}</td>
                      <td className="title-cell"><Link to={`/tickets/${t.ticketId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.title}</Link><div className="sub">{timeAgo(t.updatedAt)}</div></td>
                      <td><AutomationBadge status={t.automationStatus} /></td>
                      <td style={{ textAlign: 'right' }}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="panel-body muted">No tickets yet. When you submit one, it shows up here.</div>}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Your devices</h2></div>
          <div className="panel-body stack" style={{ gap: 18 }}>
            {(devices || []).map((d) => {
              const free = d.freeDiskGB / d.totalDiskGB;
              const low = free < 0.1;
              return (
                <div key={d.deviceName} className="stack" style={{ gap: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="row" style={{ gap: 8 }}><Icon name="laptop" style={{ width: 18, height: 18, color: 'var(--muted)' }} /><b className="mono">{d.deviceName}</b></span>
                    <span className={`badge ${d.complianceState === 'Compliant' ? 'b-good' : 'b-crit'}`}>{d.complianceState}</span>
                  </div>
                  <span className="small muted">{d.model}</span>
                  <div>
                    <div className="row small" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="muted">Disk</span><span className="tnum">{d.freeDiskGB} GB free of {d.totalDiskGB} GB</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(1 - free) * 100}%`, background: low ? 'var(--crit)' : free < 0.2 ? 'var(--warn)' : 'var(--accent)' }} /></div>
                  </div>
                  <span className="small muted">Last check-in {timeAgo(d.lastCheckIn)}</span>
                </div>
              );
            })}
            {!devices?.length ? <p className="muted small">No managed devices assigned to you.</p> : null}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Fix it yourself</h2>
          <Link to="/kb" className="btn btn-ghost btn-sm">Knowledge base <Icon name="chevron" /></Link>
        </div>
        <div className="panel-body grid grid-3" style={{ gap: 12 }}>
          {(popular || []).slice(0, 6).map((a) => (
            <Link key={a.articleId} to={`/kb/${a.articleId}`} className="row" style={{ gap: 12, padding: 12, borderRadius: 12, border: '1px solid var(--line)', textDecoration: 'none', color: 'var(--ink)', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <Icon name="book" style={{ width: 18, height: 18, color: 'var(--accent)', flex: 'none', marginTop: 2 }} />
              <span><b style={{ fontWeight: 550 }}>{a.title}</b><span className="small muted" style={{ display: 'block' }}>{a.category}</span></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
