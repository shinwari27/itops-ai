import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Switch, LoadingRows, Markdown, EmptyState } from '../components/ui.jsx';
import { api } from '../api/client.js';
import { CATEGORIES, SCENARIOS, AI_CONFIDENCE_THRESHOLD, REOPEN_WINDOW_DAYS, TEAMS } from '../api/taxonomy.js';
import { useLive, useToast } from '../lib/session.jsx';
import { timeAgo } from '../lib/format.js';

export function KbAdmin() {
  const navigate = useNavigate();
  const { data, loading } = useLive(() => api.searchKb(''), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Knowledge editor</h1>
          <p className="lede">The approved articles employees read and the AI cites. Drafts stay hidden from employees and from the AI until published.</p>
        </div>
        <Link to="/admin/kb/new" className="btn btn-primary"><Icon name="plus" />New article</Link>
      </div>
      <section className="panel">
        {loading && !data ? <LoadingRows /> : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>State</th><th>Updated</th></tr></thead>
              <tbody>
                {(data || []).map((a) => (
                  <tr key={a.articleId} onClick={() => navigate(`/admin/kb/${a.articleId}`)}>
                    <td className="mono muted">{a.articleId}</td>
                    <td className="title-cell"><Link to={`/admin/kb/${a.articleId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{a.title}</Link></td>
                    <td className="small">{a.category}</td>
                    <td>{a.published ? <span className="badge b-good">Published</span> : <span className="badge b-warn">Draft</span>}</td>
                    <td className="muted small">{timeAgo(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

const BLANK = { title: '', category: 'Other', tags: [], body: '## Steps\n1. \n', published: false };

export function KbEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = id === 'new';
  const [a, setA] = useState(isNew ? BLANK : null);
  const [tags, setTags] = useState('');
  const [err, setErr] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (isNew) { setA(BLANK); setTags(''); return; }
    api.getKb(id).then((x) => { setA(x); setTags(x.tags.join(', ')); }).catch(() => setMissing(true));
  }, [id, isNew]);

  if (missing) return <section className="panel"><EmptyState icon="alert" title="Article not found" action={<Link to="/admin/kb" className="btn btn-secondary">Back to editor</Link>} /></section>;
  if (!a) return <section className="panel"><LoadingRows n={8} /></section>;

  async function save(publish) {
    setErr('');
    try {
      const saved = await api.saveKb({ ...a, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), published: publish ?? a.published });
      toast(publish ? 'Article published' : 'Article saved');
      navigate(`/admin/kb/${saved.articleId}`, { replace: true });
      setA(saved);
    } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <Link to="/admin/kb" className="row small" style={{ gap: 4, textDecoration: 'none', width: 'fit-content' }}><Icon name="back" style={{ width: 16, height: 16 }} />Knowledge editor</Link>
      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 10 }}>{a.articleId ? <span className="mono muted">{a.articleId}</span> : null}{a.published ? <span className="badge b-good">Published</span> : <span className="badge b-warn">Draft</span>}</div>
          <h1 style={{ marginTop: 6 }}>{isNew ? 'New article' : 'Edit article'}</h1>
        </div>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={() => save()}>Save</button>
          {a.published
            ? <button type="button" className="btn btn-secondary" onClick={() => save(false)}>Unpublish</button>
            : <button type="button" className="btn btn-primary" onClick={() => save(true)}><Icon name="check" />Publish</button>}
        </div>
      </div>
      {err ? <p role="alert" style={{ color: 'var(--crit)' }}>{err}</p> : null}
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="panel">
          <div className="panel-body stack" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="kb-title">Title</label><input id="kb-title" className="input" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="Write it as the problem people search for" /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="kb-cat">Category</label>
                <select id="kb-cat" className="select" value={a.category} onChange={(e) => setA({ ...a, category: e.target.value })}>{Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div className="field"><label htmlFor="kb-tags">Search tags</label><input id="kb-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="password, reset, sspr" /></div>
            </div>
            <div className="field">
              <label htmlFor="kb-body">Article</label>
              <textarea id="kb-body" className="textarea mono" rows={18} value={a.body} onChange={(e) => setA({ ...a, body: e.target.value })} style={{ fontSize: '0.86rem' }} />
              <span className="hint">Use ## for headings, 1. for steps, - for bullets and **bold** for buttons people click.</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Preview</h2><span className="small muted">What employees see</span></div>
          <div className="panel-body"><h1 style={{ fontSize: '1.5rem', marginBottom: 6 }}>{a.title || 'Untitled article'}</h1><Markdown source={a.body} /></div>
        </section>
      </div>
    </>
  );
}

export function Settings() {
  const toast = useToast();
  const { data: s } = useLive(() => api.getSettings(), []);
  const { data: catalog } = useLive(() => api.listCatalog(), []);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!s) return <section className="panel"><LoadingRows n={8} /></section>;
  const enabled = Object.values(s.scenarios).filter(Boolean).length;

  async function toggle(k, v) {
    await api.updateSettings({ scenarios: { [k]: v } });
    toast(`${SCENARIOS[k].name} automation ${v ? 'switched on' : 'switched off'}`);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Automation settings</h1>
          <p className="lede">{enabled} of 10 approved automations are on. Switching one off sends its tickets straight to the escalation team.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Approved automations</h2><span className="small muted">Detect → Validate → Automate → Verify → Resolve</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>#</th><th>Scenario</th><th>Automated action</th><th>Escalates to</th><th>On</th></tr></thead>
            <tbody>
              {Object.entries(SCENARIOS).map(([k, sc], i) => (
                <tr key={k} style={{ cursor: 'default' }}>
                  <td className="mono muted">{i + 1}</td>
                  <td className="title-cell">{sc.name}<div className="sub mono">{k}</div></td>
                  <td className="small" style={{ maxWidth: 320 }}>{sc.steps[2]}</td>
                  <td className="small">{sc.team}<div className="muted mono">{TEAMS[sc.team]}</div></td>
                  <td><Switch id={`sc-${k}`} checked={s.scenarios[k]} onChange={(v) => toggle(k, v)} label={`${sc.name} automation`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="panel">
          <div className="panel-head"><h2>Software catalog</h2></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>App</th><th>Intune app ID</th><th>Needs approval</th></tr></thead>
              <tbody>
                {(catalog || []).map((c) => (
                  <tr key={c.itemId} style={{ cursor: 'default' }}>
                    <td className="title-cell">{c.name}<div className="sub">{c.publisher}</div></td>
                    <td className="mono small muted">{c.intuneAppId}</td>
                    <td><Switch id={`cat-${c.itemId}`} checked={c.requiresApproval} label={`${c.name} needs approval`}
                      onChange={async (v) => { await api.updateCatalogItem(c.itemId, { requiresApproval: v }); toast(`${c.name} ${v ? 'now needs approval' : 'installs without approval'}`); }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <div className="panel-head"><h2>AI guardrails</h2></div>
            <div className="panel-body">
              <dl className="kv" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <dt>Minimum AI confidence to automate</dt><dd className="mono">{AI_CONFIDENCE_THRESHOLD.toFixed(2)}</dd>
                <dt>Reopen window</dt><dd>{REOPEN_WINDOW_DAYS} days</dd>
                <dt>AI may only return</dt><dd>Fixed taxonomy values</dd>
                <dt>Destructive actions</dt><dd>Human approval + confirmation</dd>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Role mappings</h2><span className="small muted">Entra ID groups</span></div>
            <div className="panel-body">
              <dl className="kv" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                {[['Employee', 'All staff'], ['L1 Technician', 'IT-Helpdesk-L1'], ['L2 Technician', 'IT-Endpoint / M365 / Network / Security'],
                  ['IT Manager', 'IT-Management'], ['HR Requester', 'HR-Requesters'], ['Administrator', 'IT-Admins']].map(([r, g]) => (
                  <Fragment key={r}><dt>{r}</dt><dd className="mono small">{g}</dd></Fragment>
                ))}
              </dl>
            </div>
          </section>

          <section className="panel" style={{ borderColor: 'color-mix(in srgb, var(--ai) 35%, var(--line))' }}>
            <div className="panel-head"><h2>Demo controls</h2><span className="badge b-ai">Mock API only</span></div>
            <div className="panel-body stack" style={{ gap: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <label htmlFor="sim-fail" style={{ cursor: 'pointer' }}><b>Make the next verifications fail</b><span className="small muted" style={{ display: 'block' }}>Shows the escalation path: AI summary, team assignment, retry.</span></label>
                <Switch id="sim-fail" checked={s.simulateFailure} label="Simulate verification failure"
                  onChange={async (v) => { await api.updateSettings({ simulateFailure: v }); toast(v ? 'Verifications will fail' : 'Verifications will pass'); }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span><b>Automation speed</b><span className="small muted" style={{ display: 'block' }}>For live demos.</span></span>
                <div className="seg" role="group" aria-label="Automation speed">
                  {[1, 2, 4].map((n) => <button key={n} type="button" aria-pressed={s.speed === n} onClick={() => api.updateSettings({ speed: n })}>{n}×</button>)}
                </div>
              </div>
              <hr className="divider" />
              {confirmReset ? (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">Reset all demo tickets, articles and settings?</span>
                  <div className="row">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Keep data</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={async () => { await api.resetDemo(); setConfirmReset(false); toast('Demo data reset'); }}>Reset demo data</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => setConfirmReset(true)}><Icon name="refresh" />Reset demo data</button>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
