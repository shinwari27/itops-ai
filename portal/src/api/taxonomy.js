// Fixed value lists from the Phase 0 Specification (Taxonomies section).
// The AI may only return these values; the UI only displays these values.

export const STATUSES = [
  'New',
  'AI Analysis',
  'Triaged',
  'Pending Approval',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
];

export const AUTOMATION_STATUSES = [
  'Not Applicable',
  'Queued',
  'Running',
  'Verifying',
  'Succeeded',
  'Failed',
];

export const REQUEST_TYPES = ['Incident', 'Service Request', 'Onboarding', 'Offboarding'];

export const URGENCY = ['Low', 'Medium', 'High'];

export const CATEGORIES = {
  Identity: { subcategories: ['Account Lockout', 'Password', 'MFA', 'Access Request'], team: 'Help Desk' },
  Endpoint: { subcategories: ['Performance', 'Disk Space', 'Sync/Check-in', 'Compliance'], team: 'Endpoint' },
  Software: { subcategories: ['Install Request', 'Application Error'], team: 'Endpoint' },
  'Microsoft 365': { subcategories: ['Teams', 'Outlook', 'OneDrive/SharePoint', 'Licensing'], team: 'M365' },
  Network: { subcategories: ['Wi-Fi', 'VPN', 'Connectivity'], team: 'Network' },
  Hardware: { subcategories: ['Laptop', 'Monitor', 'Peripherals', 'Printer'], team: 'Help Desk' },
  Security: { subcategories: ['Phishing', 'Malware', 'Suspicious Sign-in'], team: 'Security' },
  Onboarding: { subcategories: ['New Hire'], team: 'IT Operations' },
  Offboarding: { subcategories: ['Leaver'], team: 'IT Operations' },
  Other: { subcategories: ['General Question'], team: 'Help Desk' },
};

export const TEAMS = {
  'Help Desk': 'IT-Helpdesk-L1',
  Endpoint: 'IT-Endpoint-Support',
  M365: 'IT-M365-Support',
  Network: 'IT-Network-Support',
  Security: 'IT-Security',
  'IT Operations': 'IT-Management',
};

// Proposed SLA targets, in minutes.
export const PRIORITIES = {
  P1: { label: 'Critical', definition: 'Security incident, or many users unable to work', response: 15, resolve: 4 * 60 },
  P2: { label: 'High', definition: 'One user unable to work, no workaround', response: 60, resolve: 8 * 60 },
  P3: { label: 'Medium', definition: 'Degraded, a workaround exists', response: 4 * 60, resolve: 3 * 24 * 60 },
  P4: { label: 'Low', definition: 'Request or how-to question', response: 24 * 60, resolve: 5 * 24 * 60 },
};

export const RESOLUTION_CODES = [
  'Auto-Resolved',
  'Fixed by Technician',
  'Request Fulfilled',
  'Self-Service (KB)',
  'Duplicate',
  'No Fault Found',
  'Cancelled by User',
];

// The 10 V1 automations. Steps follow Detect → Validate → Automate → Verify → Resolve.
export const SCENARIOS = {
  'account-lockout': {
    name: 'Account lockout',
    team: 'Help Desk',
    steps: ['Detect lockout in Entra sign-in logs', 'Validate user and lockout state', 'Guide secure reset via SSPR', 'Verify next sign-in succeeds', 'Resolve ticket'],
  },
  'password-sspr': {
    name: 'Password / SSPR assistance',
    team: 'Help Desk',
    steps: ['Detect password issue', 'Validate SSPR registration', 'Send guided SSPR reset', 'Verify password last-changed updates', 'Resolve ticket'],
  },
  'low-disk': {
    name: 'Low disk space',
    team: 'Endpoint',
    steps: ['Detect device in Intune', 'Validate free space under 10%', 'Run approved cleanup script', 'Verify free space above 10%', 'Resolve ticket'],
  },
  'device-checkin': {
    name: 'Device not checking in',
    team: 'Endpoint',
    steps: ['Detect last Intune check-in', 'Validate check-in older than 24 h', 'Trigger Intune device sync', 'Verify check-in time updates', 'Resolve ticket'],
  },
  'device-compliance': {
    name: 'Device compliance',
    team: 'Endpoint',
    steps: ['Detect non-compliant setting', 'Validate setting is on approved-fix list', 'Apply approved fix and sync', 'Verify compliance state', 'Resolve ticket'],
  },
  'software-install': {
    name: 'Approved software install',
    team: 'Endpoint',
    steps: ['Detect software request', 'Validate app is in the catalog', 'Assign Intune app to device', 'Verify install state', 'Resolve ticket'],
  },
  'teams-basic': {
    name: 'Teams basic support',
    team: 'M365',
    steps: ['Detect Teams issue', 'Validate service health is clear', 'Clear Teams cache on device', 'Verify script and user confirmation', 'Resolve ticket'],
  },
  'outlook-basic': {
    name: 'Outlook basic troubleshooting',
    team: 'M365',
    steps: ['Detect Outlook issue', 'Validate Exchange health is clear', 'Run approved Outlook cache reset', 'Verify script and user confirmation', 'Resolve ticket'],
  },
  onboarding: {
    name: 'Employee onboarding',
    team: 'IT Operations',
    steps: ['Detect onboarding request', 'Validate manager approval', 'Create account, groups and licenses', 'Verify account and access', 'Complete and notify in Teams'],
  },
  offboarding: {
    name: 'Employee offboarding',
    team: 'IT Operations',
    steps: ['Detect offboarding request', 'Validate approval and technician confirmation', 'Disable account, revoke sessions, remove access', 'Verify account disabled', 'Complete with device recovery checklist'],
  },
};

export const AI_CONFIDENCE_THRESHOLD = 0.7;
export const REOPEN_WINDOW_DAYS = 3;
