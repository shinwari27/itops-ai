import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { EmptyState, LoadingRows, Markdown } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { useLive, useSession } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

const CAT_ICON = {
  Identity: 'key', Endpoint: 'laptop', Software: 'box', 'Microsoft 365': 'mail', Network: 'wifi',
  Hardware: 'printer', Security: 'shield', Onboarding: 'userPlus', Other: 'book',
};

export function KnowledgeBase() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const { data, loading } = useLive(() => api.searchKb(q), [q]);
  const cats = useMemo(() => ['All', ...new Set((data || []).map((a) => a.category))], [data]);
  const list = (data || []).filter((a) => cat === 'All' || a.category === cat);

  return (
    <>
      <section className="panel raised" style={{ overflow: 'hidden' }}>
        <div className="panel-body stack" style={{ gap: 16, padding: '32px 28px', background: 'linear-gradient(135deg, var(--accent-soft), transparent 60%)' }}>
          <h1>How can we help?</h1>
          <p className="muted" style={{ maxWidth: '58ch' }}>Step-by-step fixes written by the IT team. These are the same approved articles the AI uses when it advises technicians.</p>
          <div style={{ position: 'relative', maxWidth: 640 }}>
            <Icon name="search" style={{ position: 'absolute', left: 16, top: 15, width: 20, height: 20, color: 'var(--muted)' }} />
            <label htmlFor="kb-q" className="sr-only">Search the knowledge base</label>
            <input id="kb-q" className="input" style={{ padding: '14px 16px 14px 46px', fontSize: '1.05rem', borderRadius: 14 }}
              placeholder="Try “reset password”, “Wi-Fi” or “Outlook”" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="seg" role="group" aria-label="Filter by category" style={{ width: 'fit-content', maxWidth: '100%' }}>
            {cats.map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        </div>
      </section>

      {loading && !data ? <section className="panel"><LoadingRows /></section> : list.length ? (
        <div className="grid grid-3">
          {list.map((a) => (
            <Link key={a.articleId} to={`/kb/${a.articleId}`} className="panel" style={{ textDecoration: 'none', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-body stack" style={{ gap: 10, flex: 1 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                    <Icon name={CAT_ICON[a.category] || 'book'} style={{ width: 18, height: 18 }} />
                  </span>
                  {!a.published ? <span className="badge b-warn">Draft</span> : <span className="small muted">{a.category}</span>}
                </div>
                <h3>{a.title}</h3>
                <p className="small muted" style={{ flex: 1 }}>{(a.body.split('\n').find((l) => l.trim() && !l.startsWith('#') && !/^(\d+\.|-) /.test(l)) || '').replace(/\*\*/g, '').slice(0, 120)}</p>
                <span className="small muted mono">{a.articleId} · updated {timeAgo(a.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="panel">
          <EmptyState icon="search" title="No articles match" action={<Link to="/" className="btn btn-primary">Ask IT instead</Link>}>
            Try fewer words, or submit a request and we'll help directly.
          </EmptyState>
        </section>
      )}
    </>
  );
}

export function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useSession();
  const { data: a, error, loading } = useLive(() => api.getKb(id), [id]);
  const [helpful, setHelpful] = useState(null);

  if (loading && !a) return <section className="panel"><LoadingRows n={8} /></section>;
  if (error && !a) return <section className="panel"><EmptyState icon="alert" title="Article not found" action={<Link to="/kb" className="btn btn-secondary">Back to knowledge base</Link>} /></section>;

  return (
    <>
      <Link to="/kb" className="row small" style={{ gap: 4, textDecoration: 'none', width: 'fit-content' }}><Icon name="back" style={{ width: 16, height: 16 }} />Knowledge base</Link>
      <div className="split">
        <article className="panel">
          <div className="panel-body" style={{ padding: '28px 32px' }}>
            <div className="row small muted" style={{ gap: 8 }}><span className="mono">{a.articleId}</span><span>{a.category}</span><span>Updated {timeAgo(a.updatedAt)}</span></div>
            <h1 style={{ marginTop: 10, marginBottom: 8 }}>{a.title}</h1>
            <Markdown source={a.body} />
          </div>
        </article>
        <aside className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <div className="panel-body stack" style={{ gap: 12 }}>
              <h3>Did this solve it?</h3>
              {helpful === null ? (
                <div className="row">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHelpful(true)}><Icon name="check" />Yes, fixed</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHelpful(false)}><Icon name="x" />No</button>
                </div>
              ) : helpful ? (
                <p className="small" style={{ color: 'var(--good)' }}>Great. Thanks for letting us know.</p>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  <p className="small">Submit a request and we'll take it from here. We'll include this article so you don't repeat yourself.</p>
                  <button type="button" className="btn btn-primary" onClick={() => navigate('/', { state: { prefill: `I followed “${a.title}” (${a.articleId}) but the problem is still there: ` } })}>
                    Submit a request
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-body stack" style={{ gap: 8 }}>
              <h3>Tags</h3>
              <div className="row" style={{ gap: 6 }}>{a.tags.map((t) => <span key={t} className="badge plain b-neutral">{t}</span>)}</div>
              {can('admin') ? <Link to={`/admin/kb/${a.articleId}`} className="btn btn-ghost btn-sm" style={{ width: 'fit-content', marginTop: 6 }}><Icon name="edit" />Edit article</Link> : null}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
