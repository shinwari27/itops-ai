import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RequestDetails from '../components/RequestDetails.jsx';
import { EmptyState, LoadingRows, AiBox, Avatar } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { useLive, useToast } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

const TYPE = {
  Onboarding: { icon: 'userPlus', label: 'Onboarding', tone: 'b-accent' },
  Offboarding: { icon: 'userMinus', label: 'Offboarding', tone: 'b-crit' },
  'Service Request': { icon: 'box', label: 'Licensed software', tone: 'b-info' },
};

function ApprovalCard({ t }) {
  const toast = useToast();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const type = TYPE[t.requestType] || TYPE['Service Request'];

  async function decide(approve) {
    if (!approve && !comment.trim()) { setErr('Add a reason so the requester knows why.'); return; }
    setBusy(true);
    try {
      await api.decideApproval(t.ticketId, { approve, comment });
      toast(approve ? `${t.ticketId} approved${t.requestType === 'Offboarding' ? '. A technician confirms next.' : '. Automation is starting.'}` : `${t.ticketId} rejected`);
    } catch (e) { toast(e.message, 'error'); setBusy(false); }
  }

  return (
    <section className="panel raised">
      <div className="panel-head">
        <div className="row" style={{ gap: 10 }}>
          <span className={`badge ${type.tone}`}>{type.label}</span>
          <span className="mono muted small">{t.ticketId}</span>
        </div>
        <span className="small muted">Requested {timeAgo(t.createdAt)}</span>
      </div>
      <div className="panel-body stack" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ minWidth: 0 }}>{t.title}</h2>
          <span className="row small" style={{ gap: 8 }}><Avatar name={t.requester.displayName} />{t.requester.displayName}</span>
        </div>
        <RequestDetails ticket={t} />
        {t.aiSummary ? <AiBox title="AI check">{t.aiSummary}</AiBox> : null}
        {t.requestType === 'Offboarding' ? (
          <p className="small" style={{ color: 'var(--warn)' }}>After you approve, a technician still confirms before the account is disabled.</p>
        ) : null}
        <div className="field">
          <label htmlFor={`c-${t.ticketId}`}>Comment <span className="muted" style={{ fontWeight: 400 }}>(required to reject)</span></label>
          <input id={`c-${t.ticketId}`} className="input" value={comment} onChange={(e) => { setComment(e.target.value); setErr(''); }} placeholder="Visible to the requester" />
        </div>
        {err ? <p role="alert" style={{ color: 'var(--crit)' }} className="small">{err}</p> : null}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link to={`/queue/${t.ticketId}`} className="btn btn-ghost btn-sm">Open ticket</Link>
          <div className="row">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => decide(false)}><Icon name="x" />Reject</button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => decide(true)}><Icon name="check" />Approve</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Approvals() {
  const { data, loading } = useLive(() => api.listApprovals(), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p className="lede">Requests that change access or cost money wait here. Approving starts the matching automation; nothing runs until you decide.</p>
        </div>
      </div>
      {loading && !data ? <section className="panel"><LoadingRows /></section> : data?.length ? (
        <div className="grid grid-2">{data.map((t) => <ApprovalCard key={t.ticketId} t={t} />)}</div>
      ) : (
        <section className="panel"><EmptyState icon="checkCircle" title="You're all caught up">New onboarding, offboarding and licensed software requests will appear here.</EmptyState></section>
      )}
    </>
  );
}
