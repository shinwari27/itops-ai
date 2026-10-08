import { useEffect } from 'react';
import Icon from './Icon.jsx';
import { initials, slaState } from '../lib/format.js';

const STATUS_TONE = {
  New: 'new', 'AI Analysis': 'ai', Triaged: 'info', 'Pending Approval': 'warn', Assigned: 'info',
  'In Progress': 'accent', Resolved: 'good', Closed: 'neutral',
};
export function StatusBadge({ status }) {
  const live = status === 'AI Analysis';
  return <span className={`badge b-${STATUS_TONE[status] || 'neutral'} ${live ? 'b-live' : ''}`}>{status}</span>;
}

const AUTO_TONE = { Queued: 'neutral', Running: 'accent', Verifying: 'accent', Succeeded: 'good', Failed: 'crit' };
export function AutomationBadge({ status }) {
  if (!status || status === 'Not Applicable') return <span className="muted small">Manual</span>;
  const live = status === 'Running' || status === 'Verifying';
  return (
    <span className={`badge b-${AUTO_TONE[status]} ${live ? 'b-live' : ''}`}>
      {status === 'Failed' ? 'Escalated' : status}
    </span>
  );
}

export function Prio({ p }) {
  const label = { P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low' }[p];
  return <span className={`prio ${p}`} title={`${p} ${label}`}>{p}</span>;
}

export function SlaBadge({ ticket }) {
  const s = slaState(ticket);
  return <span className={`badge plain b-${s.tone}`}>{s.label}</span>;
}

export function Avatar({ name, size }) {
  return <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} aria-hidden="true">{initials(name)}</span>;
}

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function Modal({ title, children, footer, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2></div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Switch({ id, checked, onChange, label }) {
  return (
    <span className="switch">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </span>
  );
}

export function AiBox({ title = 'AI summary', children }) {
  return (
    <div className="ai-box">
      <Icon name="sparkle" />
      <div>
        <div className="ai-title">{title}</div>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w }} />;
}

export function LoadingRows({ n = 4 }) {
  return (
    <div className="stack" style={{ padding: 20 }}>
      {Array.from({ length: n }, (_, i) => <Skeleton key={i} h={22} />)}
    </div>
  );
}

// Minimal markdown for KB articles: ## headings, lists, bold, italic, code, paragraphs.
function inline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) parts.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    else parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ source = '' }) {
  const blocks = [];
  const lines = source.split('\n');
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    if (line.startsWith('## ')) { blocks.push(<h2 key={key++}>{line.slice(3)}</h2>); i += 1; continue; }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(<li key={i}>{inline(lines[i].slice(2))}</li>); i += 1; }
      blocks.push(<ul key={key++}>{items}</ul>);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(<li key={i}>{inline(lines[i].replace(/^\d+\. /, ''))}</li>); i += 1; }
      blocks.push(<ol key={key++}>{items}</ol>);
      continue;
    }
    blocks.push(<p key={key++}>{inline(line)}</p>);
    i += 1;
  }
  return <div className="prose">{blocks}</div>;
}
