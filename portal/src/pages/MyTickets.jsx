import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { StatusBadge, AutomationBadge, EmptyState, LoadingRows } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { useLive, useSession } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

const FILTERS = ['Open', 'Resolved', 'All'];

export default function MyTickets({ hrOnly = false }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Open');
  const [q, setQ] = useState('');
  const { data, loading } = useLive(() => api.getMyTickets(), [user.userId]);

  const rows = useMemo(() => {
    let list = data || [];
    if (hrOnly) list = list.filter((t) => ['Onboarding', 'Offboarding'].includes(t.requestType));
    if (filter === 'Open') list = list.filter((t) => !['Resolved', 'Closed'].includes(t.status));
    if (filter === 'Resolved') list = list.filter((t) => ['Resolved', 'Closed'].includes(t.status));
    if (q) list = list.filter((t) => `${t.ticketId} ${t.title}`.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [data, filter, q, hrOnly]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{hrOnly ? 'My people requests' : 'My tickets'}</h1>
          <p className="lede">{hrOnly ? 'Onboarding and offboarding requests you submitted, and where each one stands.' : 'Every request you have raised, with live status from the service desk.'}</p>
        </div>
        {hrOnly ? (
          <div className="row">
            <Link to="/hr/onboarding" className="btn btn-primary"><Icon name="userPlus" />Onboard a new hire</Link>
            <Link to="/hr/offboarding" className="btn btn-secondary"><Icon name="userMinus" />Offboard a leaver</Link>
          </div>
        ) : <Link to="/" className="btn btn-primary"><Icon name="plus" />New request</Link>}
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="seg" role="group" aria-label="Filter tickets">
            {FILTERS.map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
          <div style={{ position: 'relative', width: 'min(280px, 100%)' }}>
            <Icon name="search" style={{ position: 'absolute', left: 10, top: 10, width: 17, height: 17, color: 'var(--muted)' }} />
            <label htmlFor="mt-q" className="sr-only">Search tickets</label>
            <input id="mt-q" className="input" style={{ paddingLeft: 34 }} placeholder="Search by ID or title" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {loading && !data ? <LoadingRows /> : rows.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Ticket</th><th>Request</th><th>{hrOnly ? 'Type' : 'Category'}</th><th>Automation</th><th>Status</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.ticketId} onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                    <td className="mono muted">{t.ticketId}</td>
                    <td className="title-cell">
                      <Link to={`/tickets/${t.ticketId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.title}</Link>
                      <div className="sub">Opened {timeAgo(t.createdAt)}</div>
                    </td>
                    <td>{hrOnly ? t.requestType : t.category}</td>
                    <td><AutomationBadge status={t.automationStatus} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="muted small" style={{ whiteSpace: 'nowrap' }}>{timeAgo(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="inbox" title={filter === 'Open' ? 'Nothing open right now' : 'No tickets match'}
            action={hrOnly ? <Link to="/hr/onboarding" className="btn btn-primary">Onboard a new hire</Link> : <Link to="/" className="btn btn-primary">Submit a request</Link>}>
            {filter === 'Open' ? 'Everything you raised is resolved.' : 'Try another filter or search term.'}
          </EmptyState>
        )}
      </section>
    </>
  );
}
