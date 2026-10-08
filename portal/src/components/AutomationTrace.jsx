import Icon from './Icon.jsx';
import { SCENARIOS } from '../api/taxonomy.js';

const PHASES = [
  { label: 'Detect', icon: 'scan' },
  { label: 'Validate', icon: 'shield' },
  { label: 'Automate', icon: 'wrench' },
  { label: 'Verify', icon: 'verify' },
  { label: 'Resolve', icon: 'flag' },
];

// The five-stage trace every automation follows. Drawn from an AutomationRun's steps.
export default function AutomationTrace({ run, scenario, compact = false }) {
  const steps = run?.steps || SCENARIOS[scenario]?.steps.map((name) => ({ name, status: 'Pending' })) || [];
  const doneCount = steps.filter((s) => s.status === 'Succeeded').length;
  const failed = steps.some((s) => s.status === 'Failed');
  const runningIdx = steps.findIndex((s) => s.status === 'Running');
  const reach = failed ? steps.findIndex((s) => s.status === 'Failed') : runningIdx >= 0 ? runningIdx : doneCount - 1;
  const pct = steps.length ? Math.max(0, Math.min(100, (reach / (steps.length - 1)) * 100)) : 0;
  const live = runningIdx >= 0;

  return (
    <div className="trace" role="list" aria-label="Automation progress">
      <div className="trace-rail" aria-hidden="true">
        <div className={`trace-fill ${failed ? 'failed' : ''} ${live ? 'live' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      {PHASES.map((ph, i) => {
        const st = steps[i]?.status || 'Pending';
        const cls = { Succeeded: 'done', Running: 'running', Failed: 'failed', Pending: 'pending' }[st];
        const icon = st === 'Succeeded' ? 'check' : st === 'Failed' ? 'x' : st === 'Running' ? 'loader' : ph.icon;
        return (
          <div key={ph.label} className={`trace-step ${cls}`} role="listitem" aria-label={`${ph.label}: ${st}`}>
            <div className="trace-node"><Icon name={icon} className={st === 'Running' ? 'spin' : ''} /></div>
            <div>
              <div className="trace-label">{ph.label}</div>
              {!compact && steps[i] ? <div className="trace-sub">{steps[i].detail || steps[i].name}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
