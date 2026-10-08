import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { StatusBadge, AutomationBadge, Prio, SlaBadge, EmptyState, LoadingRows, Avatar } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { TEAMS } from '../api/taxonomy.js';
import { useLive, useSession } from '../lib/session.jsx';
import { timeAgo, slaState } from '../lib/format.js';

const PRIO_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 };

export default function Queue() {
  const { user } = useSession();
  const navigate = useNavigate();
  const defaultTeam = user.role === 'L1 Technician' ? 'Help Desk' : user.role === 'L2 Technician' ? user.team : 'All';
  const [team, setTeam] = useState(defaultTeam);
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('All');
  const [assignee, setAssignee] = useState('All');
  const [q, setQ] = useState('');
  const { data, loading } = useLive(() => api.listTickets({ team, status, priority, assignee, q }), [team, status, priority, assignee, q]);
  const { data: allOpen } = useLive(() => api.listTickets({ team, status: 'Open' }), [team]);

  const rows = (data || []).slice().sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || a.slaDueAt.localeCompare(b.slaDueAt));
  const open = allOpen || [];
  const atRisk = open.filter((t) => ['crit', 'warn'].includes(slaState(t).tone)).length;
  const automating = open.filter((t) => ['Running', 'Verifying', 'Queued'].includes(t.automationStatus) && t.status !== 'Pending Approval').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ticket queue</h1>
          <p className="lede">Sorted by priority, then by time left on the SLA. Automation handles its own tickets; you'll see them here only if they escalate.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="k">Open{team !== 'All' ? ` in ${team}` : ''}</span><span className="v">{open.length}</span></div>
        <div className={`stat ${open.some((t) => t.priority === 'P1') ? 'alert' : ''}`}><span className="k"><Prio p="P1" />Critical</span><span className="v">{open.filter((t) => t.priority === 'P1').length}</span></div>
        <div className={`stat ${atRisk ? 'alert' : ''}`}><span className="k"><Icon name="clock" style={{ width: 15, height: 15 }} />SLA at risk</span><span className="v">{atRisk}</span><span className="d">Due within an hour or overdue</span></div>
        <div className="stat"><span className="k"><Icon name="bolt" style={{ width: 15, height: 15, color: 'var(--accent)' }} />Automating now</span><span className="v" style={{ color: 'var(--accent)' }}>{automating}</span></div>
      </div>

      <section className="panel">
        <div className="panel-head" style={{ alignItems: 'flex-end' }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ width: 170 }}>
              <label htmlFor="f-team">Team</label>
              <select id="f-team" className="select" value={team} onChange={(e) => setTeam(e.target.value)}>
                <option>All</option>{Object.keys(TEAMS).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field" style={{ width: 160 }}>
              <label htmlFor="f-status">Status</label>
              <select id="f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['Open', 'All', 'Triaged', 'Pending Approval', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field" style={{ width: 110 }}>
              <label htmlFor="f-prio">Priority</label>
              <select id="f-prio" className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {['All', 'P1', 'P2', 'P3', 'P4'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="seg" role="group" aria-label="Assignee">
              {[['All', 'Anyone'], ['me', 'Mine'], ['unassigned', 'Unassigned']].map(([v, l]) => (
                <button key={v} type="button" aria-pressed={assignee === v} onClick={() => setAssignee(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', width: 'min(260px, 100%)' }}>
            <Icon name="search" style={{ position: 'absolute', left: 10, top: 10, width: 17, height: 17, color: 'var(--muted)' }} />
            <label htmlFor="q-q" className="sr-only">Search the queue</label>
            <input id="q-q" className="input" style={{ paddingLeft: 34 }} placeholder="ID, title, requester, device" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {loading && !data ? <LoadingRows n={6} /> : rows.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Pri</th><th>Ticket</th><th>Request</th><th>Category</th><th>Team</th><th>Automation</th><th>Status</th><th>SLA</th><th>Owner</th></tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.ticketId} onClick={() => navigate(`/queue/${t.ticketId}`)}>
                    <td><Prio p={t.priority} /></td>
                    <td className="mono muted">{t.ticketId}</td>
                    <td className="title-cell">
                      <Link to={`/queue/${t.ticketId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.title}</Link>
                      <div className="sub">{t.requester.displayName} · {timeAgo(t.createdAt)}</div>
                    </td>
                    <td className="small">{t.category}<div className="muted">{t.subcategory}</div></td>
                    <td className="small">{t.assignedTeam}</td>
                    <td><AutomationBadge status={t.automationStatus} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaBadge ticket={t} /></td>
                    <td>{t.assignedTechnician ? <span title={t.assignedTechnician.displayName}><Avatar name={t.assignedTechnician.displayName} /></span> : <span className="muted small">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="checkCircle" title="Queue is clear">No tickets match these filters. Automation may have resolved them already.</EmptyState>
        )}
      </section>
    </>
  );
}
