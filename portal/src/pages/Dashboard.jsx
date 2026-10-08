import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { TrendChart, BarList, Ring } from '../components/Charts.jsx';
import { AutomationBadge, Prio, LoadingRows } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { SCENARIOS } from '../api/taxonomy.js';
import { useLive, useSession } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

export default function Dashboard() {
  const { can } = useSession();
  const navigate = useNavigate();
  const { data: s } = useLive(() => api.getDashboardSummary(), []);
  const { data: all } = useLive(() => api.listTickets({}), []);

  if (!s) return <section className="panel"><LoadingRows n={8} /></section>;
  const t = s.totals;
  const activity = (all || []).filter((x) => x.automationScenario && x.automationStatus !== 'Not Applicable')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const sum14 = s.history.reduce((a, d) => a + d.created, 0);
  const auto14 = s.history.reduce((a, d) => a + d.autoResolved, 0);
  const compliance = s.devices.compliant / s.devices.managed;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Operations</h1>
          <p className="lede">Live view of the service desk. Automation resolved {Math.round((auto14 / sum14) * 100)}% of the {sum14} tickets raised in the last 14 days.</p>
        </div>
        {can('approvals') && t.pendingApproval ? (
          <Link to="/approvals" className="btn btn-secondary"><Icon name="approve" />{t.pendingApproval} waiting for approval</Link>
        ) : null}
      </div>

      <div className="stats">
        <div className="stat"><span className="k">Open tickets</span><span className="v">{t.open}</span><span className="d">{t.total} in the system</span></div>
        <div className={`stat ${t.p1 ? 'alert' : ''}`}><span className="k"><Prio p="P1" />Critical open</span><span className="v">{t.p1}</span><span className="d">{t.p2} high (P2)</span></div>
        <div className="stat"><span className="k"><Icon name="bolt" style={{ width: 15, height: 15, color: 'var(--accent)' }} />Auto-resolved today</span><span className="v" style={{ color: 'var(--accent)' }}>{t.automatedToday}</span><span className="d">Verified fixes, no technician</span></div>
        <div className="stat"><span className="k">Escalated by automation</span><span className="v">{t.escalated}</span><span className="d">Verification failed, sent to a team</span></div>
        <div className={`stat ${t.slaBreached ? 'alert' : ''}`}><span className="k"><Icon name="clock" style={{ width: 15, height: 15 }} />SLA breached</span><span className="v">{t.slaBreached}</span><span className="d">Open past target</span></div>
      </div>

      <div className="grid grid-3">
        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-head"><h2>Tickets and automation, last 14 days</h2></div>
          <div className="panel-body"><TrendChart data={s.history} /></div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Automation success</h2></div>
          <div className="panel-body stack" style={{ alignItems: 'center', gap: 14 }}>
            <Ring value={s.automation.rate} label="verified fixes" size={140} />
            <dl className="kv" style={{ width: '100%', gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <dt>Attempts</dt><dd className="tnum">{s.automation.attempts}</dd>
              <dt>Succeeded</dt><dd className="tnum" style={{ color: 'var(--good)' }}>{s.automation.succeeded}</dd>
              <dt>Failed and escalated</dt><dd className="tnum" style={{ color: 'var(--crit)' }}>{s.automation.failed}</dd>
            </dl>
          </div>
        </section>
      </div>

      <div className="grid grid-3">
        <section className="panel">
          <div className="panel-head"><h2>By category</h2><span className="small muted">All tickets</span></div>
          <div className="panel-body"><BarList rows={s.byCategory.map((c) => ({ label: c.category, value: c.count }))} /></div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Open by priority</h2></div>
          <div className="panel-body">
            <BarList rows={[
              { label: 'P1 Critical', value: s.byPriority.P1, color: 'var(--crit)' },
              { label: 'P2 High', value: s.byPriority.P2, color: 'color-mix(in srgb, var(--crit) 55%, var(--warn))' },
              { label: 'P3 Medium', value: s.byPriority.P3, color: 'var(--warn)' },
              { label: 'P4 Low', value: s.byPriority.P4, color: 'var(--line-2)' },
            ]} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Endpoint health</h2><span className="small muted">Intune</span></div>
          <div className="panel-body stack" style={{ gap: 14 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="muted small">Compliant devices</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }} className="tnum">{Math.round(compliance * 100)}%</span>
            </div>
            <div className="bar-track" style={{ height: 14 }}><div className="bar-fill" style={{ width: `${compliance * 100}%`, background: 'var(--good)' }} /></div>
            <dl className="kv" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <dt>Managed devices</dt><dd className="tnum">{s.devices.managed}</dd>
              <dt>Compliant</dt><dd className="tnum">{s.devices.compliant}</dd>
              <dt>Non-compliant</dt><dd className="tnum" style={{ color: 'var(--crit)' }}>{s.devices.nonCompliant}</dd>
            </dl>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Automation activity</h2><Link to="/queue" className="btn btn-ghost btn-sm">Open queue <Icon name="chevron" /></Link></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Ticket</th><th>Scenario</th><th>Requester</th><th>Result</th><th>Updated</th></tr></thead>
            <tbody>
              {activity.map((x) => (
                <tr key={x.ticketId} onClick={() => navigate(`/queue/${x.ticketId}`)}>
                  <td className="mono muted">{x.ticketId}</td>
                  <td className="title-cell">{SCENARIOS[x.automationScenario].name}<div className="sub">{x.title}</div></td>
                  <td className="small">{x.requester.displayName}</td>
                  <td><AutomationBadge status={x.automationStatus} /></td>
                  <td className="muted small">{timeAgo(x.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
