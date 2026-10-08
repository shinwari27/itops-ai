import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Modal, LoadingRows } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { useLive, useSession, useToast } from '../lib/session.jsx';

// App tiles get a monogram tinted per publisher so the grid reads at a glance.
const TINT = ['var(--accent)', 'var(--info)', 'var(--ai)', 'var(--good)', 'var(--crit)'];

export default function Software() {
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: apps, loading } = useLive(() => api.listCatalog(), []);
  const { data: devices } = useLive(() => api.getMyDevices(), [user.userId]);
  const [picked, setPicked] = useState(null);
  const [device, setDevice] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  function open(app) { setPicked(app); setDevice(devices?.[0]?.deviceName || ''); setReason(''); }

  async function request() {
    setBusy(true);
    try {
      const res = await api.createTicket({
        title: `Install ${picked.name}`,
        description: `Please install ${picked.name}.${reason ? ` Reason: ${reason}` : ''}`,
        requestType: 'Service Request', urgency: 'Low', deviceName: device || null,
        requestDetails: { itemId: picked.itemId, appName: picked.name },
      });
      toast(picked.requiresApproval ? `Requested ${picked.name}. Waiting for manager approval.` : `Requested ${picked.name}. Installing shortly.`);
      setPicked(null);
      navigate(`/tickets/${res.ticketId}`);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Software</h1>
          <p className="lede">Approved apps install through Intune without a technician. Free apps arrive in about 15 minutes; licensed apps need your manager's approval first.</p>
        </div>
      </div>
      {loading && !apps ? <section className="panel"><LoadingRows /></section> : (
        <div className="grid grid-3">
          {(apps || []).map((a, i) => (
            <section key={a.itemId} className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-body stack" style={{ gap: 12, flex: 1 }}>
                <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem',
                    background: `color-mix(in srgb, ${TINT[i % TINT.length]} 14%, transparent)`, color: TINT[i % TINT.length] }}>
                    {a.name.replace('Microsoft ', '').replace('Google ', '').replace('Adobe ', '').slice(0, 2)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{a.name}</h3>
                    <span className="small muted">{a.publisher} · v{a.version}</span>
                  </div>
                </div>
                <p className="small" style={{ color: 'var(--ink-2)', flex: 1 }}>{a.summary}</p>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  {a.requiresApproval ? <span className="badge b-warn">Needs approval</span> : <span className="badge b-good">Instant install</span>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => open(a)}>Request</button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="small muted">Need something not listed? <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/', { state: { prefill: 'I need software that is not in the catalog: ' } })}>Describe it in a request</button></p>

      {picked ? (
        <Modal title={`Request ${picked.name}`} onClose={() => setPicked(null)}
          footer={<>
            <button type="button" className="btn btn-ghost" onClick={() => setPicked(null)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={request} disabled={busy}>{busy ? <Icon name="loader" className="spin" /> : null}Request {picked.name}</button>
          </>}>
          <p className="muted">{picked.requiresApproval
            ? 'This app needs a paid license. Your manager approves it, then it installs automatically.'
            : 'This app installs automatically through Intune, usually within 15 minutes.'}</p>
          <div className="field">
            <label htmlFor="sw-device">Install on</label>
            <select id="sw-device" className="select" value={device} onChange={(e) => setDevice(e.target.value)}>
              {(devices || []).map((d) => <option key={d.deviceName} value={d.deviceName}>{d.deviceName} · {d.model}</option>)}
              {!devices?.length ? <option value="">No managed device</option> : null}
            </select>
          </div>
          {picked.requiresApproval ? (
            <div className="field">
              <label htmlFor="sw-reason">Why do you need it?</label>
              <textarea id="sw-reason" className="textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Helps your manager approve faster" />
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
