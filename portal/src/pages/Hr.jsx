import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../api/client.js';
import { SCENARIOS } from '../api/taxonomy.js';
import { useToast } from '../lib/session.jsx';

const DEPARTMENTS = ['Finance', 'Engineering', 'Sales', 'Marketing', 'People & Culture', 'Operations', 'Legal'];
const LOCATIONS = ['Mississauga office', 'Toronto office', 'Remote'];
const ACCESS = ['Microsoft 365 E3', 'Teams Phone', 'VPN', 'Finance-Shared', 'Power BI Viewer', 'Engineering-All', 'GitHub Enterprise', 'Sales-CRM', 'Marketing-Assets', 'Legal-Contracts'];
const BUNDLES = {
  Finance: ['Microsoft 365 E3', 'Finance-Shared', 'Power BI Viewer'],
  Engineering: ['Microsoft 365 E3', 'Engineering-All', 'GitHub Enterprise', 'VPN'],
  Sales: ['Microsoft 365 E3', 'Sales-CRM', 'Teams Phone'],
  Marketing: ['Microsoft 365 E3', 'Marketing-Assets'],
  'People & Culture': ['Microsoft 365 E3'],
  Operations: ['Microsoft 365 E3', 'VPN'],
  Legal: ['Microsoft 365 E3', 'Legal-Contracts'],
};
const REASONS = ['Resignation', 'Retirement', 'End of contract', 'Termination', 'Internal transfer'];
const today = () => new Date().toISOString().slice(0, 10);

function NextSteps({ scenario, note }) {
  return (
    <aside className="panel" style={{ position: 'sticky', top: 80 }}>
      <div className="panel-head"><h2>What happens next</h2></div>
      <div className="panel-body stack" style={{ gap: 14 }}>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
          <li className="row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <span className="tl-icon" style={{ width: 28, height: 28, flex: 'none' }}><Icon name="approve" /></span>
            <span><b>Manager approval</b><span className="small muted" style={{ display: 'block' }}>Nothing changes in Entra ID until a manager approves.</span></span>
          </li>
          {SCENARIOS[scenario].steps.slice(1).map((s) => (
            <li key={s} className="row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <span className="tl-icon auto" style={{ width: 28, height: 28, flex: 'none' }}><Icon name="bolt" /></span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {note ? <p className="small" style={{ color: 'var(--warn)' }}>{note}</p> : null}
      </div>
    </aside>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ employeeName: '', jobTitle: '', department: 'Finance', manager: '', startDate: '', location: LOCATIONS[0], requiredAccess: BUNDLES.Finance });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  function setDept(e) {
    const d = e.target.value;
    setF((x) => ({ ...x, department: d, requiredAccess: BUNDLES[d] || ['Microsoft 365 E3'] }));
  }
  function toggle(a) {
    setF((x) => ({ ...x, requiredAccess: x.requiredAccess.includes(a) ? x.requiredAccess.filter((y) => y !== a) : [...x.requiredAccess, a] }));
  }
  async function submit(e) {
    e.preventDefault();
    const missing = [['employeeName', 'name'], ['jobTitle', 'job title'], ['manager', 'manager'], ['startDate', 'start date']].filter(([k]) => !f[k].trim()).map(([, l]) => l);
    if (missing.length) { setErr(`Add the new hire's ${missing.join(', ')}.`); return; }
    setBusy(true);
    try {
      const res = await api.createOnboarding(f);
      toast(`Onboarding ${res.ticketId} sent for approval`);
      navigate(`/tickets/${res.ticketId}`);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Onboard a new hire</h1>
          <p className="lede">Submit at least 5 business days before the start date. IT prepares the account, groups, licenses and a day-one checklist automatically.</p>
        </div>
      </div>
      <div className="split">
        <form className="panel raised" onSubmit={submit} noValidate>
          <div className="panel-body stack" style={{ gap: 20, padding: 24 }}>
            <div className="form-grid">
              <div className="field"><label htmlFor="on-name">Full name</label><input id="on-name" className="input" value={f.employeeName} onChange={set('employeeName')} placeholder="Mateo Silva" /></div>
              <div className="field"><label htmlFor="on-title">Job title</label><input id="on-title" className="input" value={f.jobTitle} onChange={set('jobTitle')} placeholder="Accounts Payable Specialist" /></div>
              <div className="field"><label htmlFor="on-dept">Department</label>
                <select id="on-dept" className="select" value={f.department} onChange={setDept}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
              </div>
              <div className="field"><label htmlFor="on-mgr">Manager</label><input id="on-mgr" className="input" value={f.manager} onChange={set('manager')} placeholder="Daniel Okafor" /></div>
              <div className="field"><label htmlFor="on-start">Start date</label><input id="on-start" type="date" min={today()} className="input" value={f.startDate} onChange={set('startDate')} /></div>
              <div className="field"><label htmlFor="on-loc">Location</label>
                <select id="on-loc" className="select" value={f.location} onChange={set('location')}>{LOCATIONS.map((d) => <option key={d}>{d}</option>)}</select>
              </div>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
              <legend style={{ fontSize: '0.85rem', fontWeight: 550, color: 'var(--ink-2)', marginBottom: 6 }}>Access to set up</legend>
              <p className="small" style={{ color: 'var(--ai)' }}><Icon name="sparkle" style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Suggested for {f.department}. Add or remove anything.</p>
              <div className="row" style={{ gap: 8 }}>
                {ACCESS.map((a) => {
                  const on = f.requiredAccess.includes(a);
                  return (
                    <button key={a} type="button" className="chip" aria-pressed={on} onClick={() => toggle(a)}
                      style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 550 } : undefined}>
                      {on ? <Icon name="check" style={{ width: 14, height: 14 }} /> : <Icon name="plus" style={{ width: 14, height: 14 }} />}{a}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {err ? <p role="alert" style={{ color: 'var(--crit)' }}>{err}</p> : null}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy}><Icon name="send" />Send for approval</button>
            </div>
          </div>
        </form>
        <NextSteps scenario="onboarding" />
      </div>
    </>
  );
}

export function Offboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ employee: '', lastWorkingDay: '', manager: '', department: 'Sales', reason: REASONS[0], keepMailbox: true });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const missing = [['employee', 'name'], ['lastWorkingDay', 'last working day'], ['manager', 'manager']].filter(([k]) => !f[k].trim()).map(([, l]) => l);
    if (missing.length) { setErr(`Add the ${missing.join(', ')}.`); return; }
    setBusy(true);
    try {
      const res = await api.createOffboarding(f);
      toast(`Offboarding ${res.ticketId} sent for approval`);
      navigate(`/tickets/${res.ticketId}`);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Offboard a leaver</h1>
          <p className="lede">Access is removed at the end of the last working day, after manager approval and a technician's confirmation.</p>
        </div>
      </div>
      <div className="split">
        <form className="panel raised" onSubmit={submit} noValidate>
          <div className="panel-body stack" style={{ gap: 20, padding: 24 }}>
            <div className="form-grid">
              <div className="field"><label htmlFor="off-name">Employee</label><input id="off-name" className="input" value={f.employee} onChange={set('employee')} placeholder="Brian Holt" /></div>
              <div className="field"><label htmlFor="off-day">Last working day</label><input id="off-day" type="date" className="input" value={f.lastWorkingDay} onChange={set('lastWorkingDay')} /></div>
              <div className="field"><label htmlFor="off-dept">Department</label>
                <select id="off-dept" className="select" value={f.department} onChange={set('department')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
              </div>
              <div className="field"><label htmlFor="off-mgr">Manager</label><input id="off-mgr" className="input" value={f.manager} onChange={set('manager')} placeholder="Carla Nunes" /></div>
              <div className="field full"><label htmlFor="off-reason">Reason</label>
                <select id="off-reason" className="select" value={f.reason} onChange={set('reason')}>{REASONS.map((d) => <option key={d}>{d}</option>)}</select>
                {f.reason === 'Termination' ? <span className="hint" style={{ color: 'var(--warn)' }}>For terminations, call the Security team as well so access can be removed immediately.</span> : null}
              </div>
              <label className="row full" style={{ gap: 10, cursor: 'pointer' }} htmlFor="off-keep">
                <input id="off-keep" type="checkbox" checked={f.keepMailbox} onChange={(e) => setF((x) => ({ ...x, keepMailbox: e.target.checked }))} />
                <span>Give the manager access to the mailbox and OneDrive for 30 days</span>
              </label>
            </div>
            {err ? <p role="alert" style={{ color: 'var(--crit)' }}>{err}</p> : null}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy}><Icon name="send" />Send for approval</button>
            </div>
          </div>
        </form>
        <NextSteps scenario="offboarding" note="Disabling an account can't be undone automatically, so a technician confirms before it runs." />
      </div>
    </>
  );
}
