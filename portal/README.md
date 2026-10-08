# ITOps AI — IT Support Portal (Phase 0.5)

The web front door for **ITOps AI — Intelligent IT Service Desk & Endpoint Automation Platform**.
Every screen works today against an in-browser mock API that returns the exact data shapes from the
Phase 0 Specification. Later phases replace the mock with Azure Functions without changing the UI.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/ (for Azure Static Web Apps)
npm run build:single # one self-contained HTML file in dist-single/ (for sharing a demo)
```

Use the profile menu (top right) to switch between the six demo roles.

## Screens by role

| Role | Screens |
| --- | --- |
| Employee | Home with live AI triage preview, submission tracker, My tickets, Ticket detail, Knowledge base, Software catalog |
| L1 / L2 Technician | Ticket queue, Ticket workspace (AI analysis, automation trace, internal notes, resolve), Operations dashboard |
| IT Manager | Operations dashboard, Approvals, queue |
| HR Requester | Onboard a new hire, Offboard a leaver, My requests |
| Administrator | Everything above, plus Knowledge editor and Automation settings |

## Project layout

```
src/
  api/
    client.js      ← the single swap point: mock today, real API when VITE_API_BASE is set
    mockApi.js     ← in-browser backend: tickets, AI triage, automation engine simulation
    httpApi.js     ← real backend client (same functions, spec's REST paths)
    classifier.js  ← mock AI classification + technician recommendations
    taxonomy.js    ← categories, priorities, teams, statuses, the 10 scenarios
    seed.js        ← demo users, tickets, devices, catalog, KB articles
  components/      ← Shell (nav + role switcher), AutomationTrace, Timeline, charts, UI kit
  lib/             ← session/roles, toasts, live data hook, formatting
  pages/           ← one file per screen group
```

## Connecting the real backend (Phase 8+)

1. Deploy the Azure Functions API with the routes in `src/api/httpApi.js`.
2. Set `VITE_API_BASE=/api` (Static Web Apps links the Function App under `/api`).
3. Replace the demo role switcher with Entra ID sign-in (`/.auth/login/aad`) and map roles from Entra groups.

## Demo tips

- Employee → type "My laptop is very slow" → Submit. Watch AI triage and the low-disk automation run live.
- Administrator → Automation settings → turn on "Make the next verifications fail" to demo escalation.
- IT Manager → Approvals → approve the onboarding request and watch the automation run.
- Offboarding needs manager approval **and** a technician's confirmation in the workspace.
