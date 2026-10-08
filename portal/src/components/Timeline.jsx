import Icon from './Icon.jsx';
import { dateTime, timeAgo } from '../lib/format.js';

const ICON = {
  User: ['user', ''], Technician: ['user', 'tech'], AI: ['sparkle', 'ai'], Automation: ['bolt', 'auto'], System: ['refresh', ''],
};

export default function Timeline({ updates }) {
  return (
    <ol className="timeline" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {updates.map((u) => {
        const [icon, cls] = ICON[u.actorType] || ICON.System;
        const isComment = u.updateType === 'Comment';
        return (
          <li key={u.updateId} className="tl-item">
            <span className={`tl-icon ${cls}`}><Icon name={icon} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="tl-meta">
                <b>{u.actorName}</b>
                <time dateTime={u.timestamp} title={dateTime(u.timestamp)}>{timeAgo(u.timestamp)}</time>
                {u.visibility === 'Internal' ? <span className="tl-internal">Internal note</span> : null}
              </div>
              <div className={`tl-msg ${isComment ? 'bubble' : ''}`}>{u.message}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
