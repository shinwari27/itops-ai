import { dateOnly } from '../lib/format.js';

// Shows onboarding, offboarding or software request fields.
export default function RequestDetails({ ticket }) {
  const d = ticket.requestDetails;
  if (!d) return null;
  if (ticket.requestType === 'Onboarding') {
    return (
      <dl className="kv">
        <dt>New hire</dt><dd><b>{d.employeeName}</b></dd>
        <dt>Job title</dt><dd>{d.jobTitle}</dd>
        <dt>Department</dt><dd>{d.department}</dd>
        <dt>Manager</dt><dd>{d.manager}</dd>
        <dt>Start date</dt><dd>{dateOnly(d.startDate)}</dd>
        <dt>Location</dt><dd>{d.location}</dd>
        <dt>Access</dt><dd className="row" style={{ gap: 6 }}>{(d.requiredAccess || []).map((a) => <span key={a} className="badge plain b-neutral">{a}</span>)}</dd>
      </dl>
    );
  }
  if (ticket.requestType === 'Offboarding') {
    return (
      <dl className="kv">
        <dt>Leaver</dt><dd><b>{d.employee}</b></dd>
        <dt>Last day</dt><dd>{dateOnly(d.lastWorkingDay)}</dd>
        <dt>Department</dt><dd>{d.department}</dd>
        <dt>Manager</dt><dd>{d.manager}</dd>
        <dt>Reason</dt><dd>{d.reason}</dd>
      </dl>
    );
  }
  if (d.appName) {
    return (
      <dl className="kv">
        <dt>Software</dt><dd><b>{d.appName}</b></dd>
        <dt>Device</dt><dd className="mono">{ticket.deviceName || 'Not specified'}</dd>
      </dl>
    );
  }
  return null;
}
