// Mock AI triage. Stands in for Microsoft Foundry until Phase 5.
// Returns the exact JSON shape defined in the spec's "Classification output".

const RULES = [
  {
    match: /(phish|suspicious (email|link)|clicked a link|malware|virus|ransom|hacked)/i,
    out: { category: 'Security', subcategory: 'Phishing', priority: 'P1', scenario: null, confidence: 0.94,
      reason: 'Possible security incident; Security must review before anything else happens.' },
  },
  {
    match: /(locked out|account (is )?locked|lockout|too many (sign-in|login) attempts)/i,
    out: { category: 'Identity', subcategory: 'Account Lockout', priority: 'P2', scenario: 'account-lockout', confidence: 0.93,
      reason: 'User describes an account lockout, which matches the lockout automation.' },
  },
  {
    match: /(forgot|reset|expired|change).{0,20}password|password.{0,20}(forgot|reset|expired)/i,
    out: { category: 'Identity', subcategory: 'Password', priority: 'P3', scenario: 'password-sspr', confidence: 0.91,
      reason: 'Password reset request; Microsoft Entra SSPR can handle it securely.' },
  },
  {
    match: /(not compliant|non-?compliant|compliance)/i,
    out: { category: 'Endpoint', subcategory: 'Compliance', priority: 'P2', scenario: 'device-compliance', confidence: 0.88,
      reason: 'Device reports a compliance failure in Intune.' },
  },
  {
    match: /(policies|policy|check(ing)? in|not syncing|company portal|intune)/i,
    out: { category: 'Endpoint', subcategory: 'Sync/Check-in', priority: 'P3', scenario: 'device-checkin', confidence: 0.84,
      reason: 'Device may not be checking in with Intune; a sync usually fixes it.' },
  },
  {
    match: /(disk|storage|space|slow|sluggish|freez)/i,
    out: { category: 'Endpoint', subcategory: 'Performance', priority: 'P2', scenario: 'low-disk', confidence: 0.86,
      reason: 'Slowness is often caused by low disk space; the device will be checked first.' },
  },
  {
    match: /(install|need|request).{0,30}(7-?zip|chrome|vlc|adobe|reader|acrobat|visio|power ?bi)|\b(7-?zip|vlc|visio)\b/i,
    out: { category: 'Software', subcategory: 'Install Request', priority: 'P4', scenario: 'software-install', confidence: 0.9,
      reason: 'Request for an app from the approved software catalog.' },
  },
  {
    match: /teams/i,
    out: { category: 'Microsoft 365', subcategory: 'Teams', priority: 'P3', scenario: 'teams-basic', confidence: 0.82,
      reason: 'Teams issue that the approved cache reset usually fixes.' },
  },
  {
    match: /outlook|email (won.t|not) (open|load)|mailbox/i,
    out: { category: 'Microsoft 365', subcategory: 'Outlook', priority: 'P3', scenario: 'outlook-basic', confidence: 0.83,
      reason: 'Outlook issue that the approved cache reset usually fixes.' },
  },
  {
    match: /(wi-?fi|wireless|internet|network|no connection)/i,
    out: { category: 'Network', subcategory: 'Wi-Fi', priority: 'P2', scenario: null, confidence: 0.89,
      reason: 'Network issue; no approved automation, so Network Support will take it.' },
  },
  {
    match: /vpn/i,
    out: { category: 'Network', subcategory: 'VPN', priority: 'P2', scenario: null, confidence: 0.87,
      reason: 'VPN issue; routed to Network Support.' },
  },
  {
    match: /print/i,
    out: { category: 'Hardware', subcategory: 'Printer', priority: 'P3', scenario: null, confidence: 0.9,
      reason: 'Printer problem; needs a technician.' },
  },
  {
    match: /(monitor|screen|display|keyboard|mouse|dock|headset|cracked|broken)/i,
    out: { category: 'Hardware', subcategory: 'Peripherals', priority: 'P3', scenario: null, confidence: 0.85,
      reason: 'Hardware fault; needs a technician.' },
  },
  {
    match: /(mfa|authenticator|2fa|two.factor)/i,
    out: { category: 'Identity', subcategory: 'MFA', priority: 'P2', scenario: null, confidence: 0.86,
      reason: 'MFA problem; Help Desk will verify identity before changing methods.' },
  },
  {
    match: /(access to|permission|shared drive|sharepoint|onedrive)/i,
    out: { category: 'Microsoft 365', subcategory: 'OneDrive/SharePoint', priority: 'P3', scenario: null, confidence: 0.78,
      reason: 'Access or file-sharing request; a technician will check permissions.' },
  },
];

const FALLBACK = {
  category: 'Other', subcategory: 'General Question', priority: 'P4', scenario: null, confidence: 0.55,
  reason: 'Not enough detail to classify confidently; Help Desk will triage.',
};

const TEAM_FOR = {
  Identity: 'Help Desk', Endpoint: 'Endpoint', Software: 'Endpoint', 'Microsoft 365': 'M365',
  Network: 'Network', Hardware: 'Help Desk', Security: 'Security', Onboarding: 'IT Operations',
  Offboarding: 'IT Operations', Other: 'Help Desk',
};

const BUMP = { P4: 'P3', P3: 'P2', P2: 'P2', P1: 'P1' };

export function classify(text = '', urgency = 'Medium') {
  const rule = RULES.find((r) => r.match.test(text));
  const base = rule ? rule.out : FALLBACK;
  const priority = urgency === 'High' ? BUMP[base.priority] : base.priority;
  return {
    category: base.category,
    subcategory: base.subcategory,
    priority,
    assignedTeam: TEAM_FOR[base.category],
    automationCandidate: Boolean(base.scenario),
    automationScenario: base.scenario,
    confidence: base.confidence,
    reason: base.reason,
  };
}

// Technician assistant: recommendation grounded in KB article ids.
export function recommend(ticket) {
  const map = {
    'Disk Space': ['KB0003', 'Check free space in Intune, run the cleanup remediation, then confirm free space is above 10%.'],
    Performance: ['KB0003', 'Check free disk space and recent restarts first. If disk is fine, review startup apps and pending updates.'],
    'Account Lockout': ['KB0002', 'Confirm the lockout in Entra sign-in logs (error 50053), then guide the user through SSPR.'],
    Password: ['KB0001', 'Confirm SSPR registration, then send the reset guidance. Never reset passwords over chat.'],
    'Sync/Check-in': ['KB0008', 'Check last check-in in Intune. Trigger a sync and wait 30 minutes before rechecking.'],
    Compliance: ['KB0007', 'Open the device compliance report, find the failing setting, apply the approved fix.'],
    Teams: ['KB0005', 'Check Microsoft 365 service health, then clear the Teams cache and have the user sign in again.'],
    Outlook: ['KB0004', 'Check Exchange service health, start Outlook in safe mode, then reset the local cache.'],
    'Wi-Fi': ['KB0010', 'Ask whether other devices connect. Forget and rejoin the corporate SSID, then check the certificate.'],
    VPN: ['KB0011', 'Confirm internet works without VPN, check the client version, then review the sign-in log for conditional access blocks.'],
    Printer: ['KB0012', 'Check the queue on the print server, clear stuck jobs, then reinstall the printer from the Company Portal.'],
    Peripherals: ['KB0013', 'Confirm the fault with a second cable or port, then log a hardware swap if it persists.'],
    Phishing: ['KB0014', 'Do not delete the email. Isolate the device, reset the password, revoke sessions and report to Security.'],
    MFA: ['KB0001', 'Verify identity by callback to the number on file before changing any authentication method.'],
    'Install Request': ['KB0009', 'Check the catalog entry, approval requirement and assign the Intune app to the device group.'],
  };
  const [kb, text] = map[ticket.subcategory] || ['KB0015', 'Gather details, reproduce the issue, and check the knowledge base for a match.'];
  return { text, kbIds: [kb] };
}
