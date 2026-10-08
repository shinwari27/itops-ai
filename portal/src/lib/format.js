export function timeAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 0) return timeUntil(iso);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export function timeUntil(iso) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  if (s <= 0) return `overdue by ${timeAgo(iso).replace(' ago', '')}`;
  if (s < 3600) return `in ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `in ${Math.round(s / 3600)} h`;
  return `in ${Math.round(s / 86400)} days`;
}

export function dateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function dateOnly(iso) {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function slaState(t) {
  if (['Resolved', 'Closed'].includes(t.status)) return { label: 'Met', tone: 'good' };
  const left = new Date(t.slaDueAt).getTime() - Date.now();
  if (left < 0) return { label: timeUntil(t.slaDueAt), tone: 'crit' };
  if (left < 60 * 60000) return { label: timeUntil(t.slaDueAt), tone: 'warn' };
  return { label: timeUntil(t.slaDueAt), tone: 'neutral' };
}
