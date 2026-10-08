// Demo data for the mock API. Shapes follow the spec's Data model section exactly.
// Everything here is example data, clearly fictional.

import { SCENARIOS } from './taxonomy.js';

const now = Date.now();
const ago = (min) => new Date(now - min * 60000).toISOString();

export const USERS = {
  emp: { userId: 'u-emp', displayName: 'Priya Nair', email: 'priya.nair@contoso-demo.com', role: 'Employee', department: 'Finance', title: 'Financial Analyst' },
  l1: { userId: 'u-l1', displayName: 'Marcus Chen', email: 'marcus.chen@contoso-demo.com', role: 'L1 Technician', team: 'Help Desk', title: 'Service Desk Analyst' },
  l2: { userId: 'u-l2', displayName: 'Aisha Rahman', email: 'aisha.rahman@contoso-demo.com', role: 'L2 Technician', team: 'Endpoint', title: 'Endpoint Engineer' },
  mgr: { userId: 'u-mgr', displayName: 'Daniel Okafor', email: 'daniel.okafor@contoso-demo.com', role: 'IT Manager', team: 'IT Operations', title: 'IT Operations Manager' },
  hr: { userId: 'u-hr', displayName: 'Sofia Martins', email: 'sofia.martins@contoso-demo.com', role: 'HR Requester', department: 'People & Culture', title: 'HR Business Partner' },
  admin: { userId: 'u-admin', displayName: 'Hikmat Shinwari', email: 'hikmat.shinwari@contoso-demo.com', role: 'Administrator', team: 'IT Operations', title: 'Platform Administrator' },
};

export const TECHNICIANS = [
  { userId: 'u-l1', displayName: 'Marcus Chen', team: 'Help Desk' },
  { userId: 'u-l1b', displayName: 'Jenna Walsh', team: 'Help Desk' },
  { userId: 'u-l2', displayName: 'Aisha Rahman', team: 'Endpoint' },
  { userId: 'u-l2b', displayName: 'Tomás Ruiz', team: 'M365' },
  { userId: 'u-l2c', displayName: 'Kenji Watanabe', team: 'Network' },
  { userId: 'u-l2d', displayName: 'Leah Goldberg', team: 'Security' },
];

export const DEVICES = [
  { deviceName: 'WIN11-042', primaryUser: 'u-emp', model: 'Lenovo ThinkPad T14 Gen 4', os: 'Windows 11 Enterprise 23H2', complianceState: 'Compliant', lastCheckIn: ago(38), freeDiskGB: 19, totalDiskGB: 256 },
  { deviceName: 'WIN11-117', primaryUser: 'u-emp', model: 'Microsoft Surface Pro 9', os: 'Windows 11 Enterprise 23H2', complianceState: 'Non-compliant', lastCheckIn: ago(60 * 31), freeDiskGB: 14, totalDiskGB: 128 },
];

export const CATALOG = [
  { itemId: 'app-7zip', name: '7-Zip', publisher: 'Igor Pavlov', version: '24.08', requiresApproval: false, intuneAppId: 'a1f0-7zip', summary: 'Open and create .zip, .7z and .rar archives.' },
  { itemId: 'app-chrome', name: 'Google Chrome', publisher: 'Google', version: '129', requiresApproval: false, intuneAppId: 'a1f0-chrome', summary: 'Web browser for sites that need Chrome.' },
  { itemId: 'app-vlc', name: 'VLC media player', publisher: 'VideoLAN', version: '3.0.21', requiresApproval: false, intuneAppId: 'a1f0-vlc', summary: 'Plays most audio and video formats.' },
  { itemId: 'app-reader', name: 'Adobe Acrobat Reader', publisher: 'Adobe', version: '24.003', requiresApproval: false, intuneAppId: 'a1f0-reader', summary: 'View, sign and comment on PDFs.' },
  { itemId: 'app-teams', name: 'Microsoft Teams', publisher: 'Microsoft', version: '24.2', requiresApproval: false, intuneAppId: 'a1f0-teams', summary: 'Chat, meetings and calls.' },
  { itemId: 'app-visio', name: 'Microsoft Visio', publisher: 'Microsoft', version: '2024', requiresApproval: true, intuneAppId: 'a1f0-visio', summary: 'Diagrams and flowcharts. Needs a paid license, so a manager approves.' },
  { itemId: 'app-powerbi', name: 'Power BI Desktop', publisher: 'Microsoft', version: '2.134', requiresApproval: true, intuneAppId: 'a1f0-pbi', summary: 'Build reports from company data. Manager approval required.' },
];

export const KB = [
  { articleId: 'KB0001', title: 'Reset your password with self-service', category: 'Identity', tags: ['password', 'sspr', 'reset', 'forgot'], published: true, updatedAt: ago(60 * 24 * 12),
    body: `You can reset your Microsoft 365 password yourself, any time, without calling IT.\n\n## Before you start\n- You need the phone number or authenticator app you registered.\n- If you never registered, contact the Help Desk.\n\n## Steps\n1. Go to **aka.ms/sspr** from any browser.\n2. Enter your work email and the characters shown.\n3. Verify with your phone or authenticator app.\n4. Choose a new password at least 14 characters long.\n5. Sign in again on your laptop and phone.\n\n## If it doesn't work\nSubmit a ticket and choose *Password* as the topic. Never share your password with anyone, including IT.` },
  { articleId: 'KB0002', title: 'My account is locked', category: 'Identity', tags: ['locked', 'lockout', 'sign in'], published: true, updatedAt: ago(60 * 24 * 20),
    body: `Your account locks after several wrong passwords in a row. This protects you from someone guessing your password.\n\n## What to do\n1. Wait 15 minutes. The lock clears on its own.\n2. If you don't remember your password, reset it with **aka.ms/sspr**.\n3. Sign in again.\n\n## Still locked?\nSubmit a ticket. Our automation checks the lockout and guides you through a secure reset.` },
  { articleId: 'KB0003', title: 'Laptop is slow or running out of space', category: 'Endpoint', tags: ['slow', 'disk', 'space', 'performance'], published: true, updatedAt: ago(60 * 24 * 5),
    body: `Low disk space is the most common cause of a slow laptop.\n\n## Check your free space\n1. Open **File Explorer** and select **This PC**.\n2. Look at the bar under **Windows (C:)**. Red means less than 10% free.\n\n## Free up space\n- Empty the Recycle Bin.\n- Move large files to OneDrive and set them to *online-only*.\n- Restart your laptop at least once a week.\n\nIf the bar stays red, submit a ticket. Our cleanup automation clears safe temporary files and confirms the result.` },
  { articleId: 'KB0004', title: "Outlook won't open", category: 'Microsoft 365', tags: ['outlook', 'email', 'mail'], published: true, updatedAt: ago(60 * 24 * 9),
    body: `## Quick checks\n1. Close Outlook completely, including from the system tray.\n2. Open Outlook web at **outlook.office.com**. If mail works there, the problem is on your laptop.\n3. Restart your laptop.\n\n## Still not opening?\nSubmit a ticket. The approved fix resets Outlook's local cache; your mail stays safe on the server.` },
  { articleId: 'KB0005', title: 'Teams is slow, blank or not loading', category: 'Microsoft 365', tags: ['teams', 'meeting', 'chat'], published: true, updatedAt: ago(60 * 24 * 7),
    body: `## Try these first\n1. Quit Teams from the system tray and reopen it.\n2. Check **Settings → About** for updates.\n3. Try Teams on the web at **teams.microsoft.com**.\n\n## Clearing the cache\nA corrupted cache is the usual cause. Submit a ticket and the automation clears it for you, then asks you to confirm Teams works.` },
  { articleId: 'KB0006', title: 'Connect to company Wi-Fi', category: 'Network', tags: ['wifi', 'wi-fi', 'wireless', 'network'], published: true, updatedAt: ago(60 * 24 * 30),
    body: `## Join the network\n1. Select the Wi-Fi icon in the taskbar.\n2. Choose **Contoso-Corp**. Your laptop signs in automatically with its certificate.\n3. Guests use **Contoso-Guest** with the daily code from reception.\n\n## Can't connect?\n- Forget the network and join again.\n- Make sure your laptop was restarted in the last week.\n- If other people nearby also can't connect, report it as an outage.` },
  { articleId: 'KB0007', title: 'Device says it is not compliant', category: 'Endpoint', tags: ['compliance', 'intune', 'company portal'], published: true, updatedAt: ago(60 * 24 * 3),
    body: `A non-compliant device can lose access to email and Teams until it is fixed.\n\n## Common causes\n- Windows updates are overdue.\n- BitLocker encryption is off.\n- The device hasn't checked in for days.\n\n## Fix it\n1. Open **Company Portal** and select your device.\n2. Select **Check status** and follow the steps shown.\n3. If it still shows non-compliant, submit a ticket. The automation applies the approved fix and re-checks.` },
  { articleId: 'KB0008', title: "Laptop isn't getting company policies", category: 'Endpoint', tags: ['policies', 'sync', 'intune', 'check in'], published: true, updatedAt: ago(60 * 24 * 14),
    body: `Your laptop checks in with Intune a few times a day to receive settings and apps.\n\n## Sync manually\n1. Open **Settings → Accounts → Access work or school**.\n2. Select your work account, then **Info**.\n3. Select **Sync**.\n\nIf it still hasn't synced after 30 minutes, submit a ticket.` },
  { articleId: 'KB0009', title: 'Request approved software', category: 'Software', tags: ['install', 'software', 'app', 'catalog'], published: true, updatedAt: ago(60 * 24 * 6),
    body: `Approved apps install automatically after you request them.\n\n## How it works\n1. Open **Software** in this portal.\n2. Select **Request** on the app you need.\n3. Free apps install within about 15 minutes. Licensed apps need your manager's approval first.\n\nNeed an app that isn't listed? Submit a ticket and describe what you need it for.` },
  { articleId: 'KB0010', title: 'Wi-Fi drops during calls', category: 'Network', tags: ['wifi', 'calls', 'drops'], published: true, updatedAt: ago(60 * 24 * 40),
    body: `## Things that help\n- Sit closer to an access point or use the docking station's cable.\n- Turn off Bluetooth devices you aren't using.\n- Restart your laptop.\n\nIf calls keep dropping in one area of the office, tell us which room so Network Support can check coverage.` },
  { articleId: 'KB0011', title: 'VPN will not connect', category: 'Network', tags: ['vpn', 'remote'], published: true, updatedAt: ago(60 * 24 * 22),
    body: `## Check\n1. Make sure your internet works without the VPN.\n2. Update the VPN client from Company Portal.\n3. Restart and try again.\n\nIf it still fails, submit a ticket with the error message shown.` },
  { articleId: 'KB0012', title: 'Printer not working', category: 'Hardware', tags: ['printer', 'print'], published: true, updatedAt: ago(60 * 24 * 18),
    body: `## Try first\n1. Check the printer screen for paper jams or low toner.\n2. Remove and re-add the printer from **Company Portal**.\n3. Print a test page.\n\nStill stuck? Submit a ticket with the printer name on its label.` },
  { articleId: 'KB0013', title: 'Monitor, dock or keyboard not working', category: 'Hardware', tags: ['monitor', 'dock', 'keyboard', 'mouse'], published: true, updatedAt: ago(60 * 24 * 25),
    body: `## Quick checks\n- Try a different cable or port.\n- Unplug the dock for 30 seconds, then reconnect.\n- Restart the laptop with the dock connected.\n\nIf a device is physically damaged, submit a ticket and we'll arrange a swap.` },
  { articleId: 'KB0014', title: 'I clicked a suspicious link', category: 'Security', tags: ['phishing', 'security', 'suspicious'], published: true, updatedAt: ago(60 * 24 * 2),
    body: `Act quickly. Reporting early protects you and everyone else.\n\n## Do this now\n1. Disconnect from Wi-Fi.\n2. Don't delete the email.\n3. Submit a ticket and choose *High* urgency. Security responds within 15 minutes.\n\nYou won't get in trouble for reporting. Waiting is what makes incidents worse.` },
  { articleId: 'KB0015', title: 'Getting help from IT', category: 'Other', tags: ['help', 'ticket', 'support'], published: true, updatedAt: ago(60 * 24 * 60),
    body: `## Fastest way to get help\n1. Search this knowledge base first.\n2. Submit a ticket describing what happened, when, and any error message.\n3. Add a screenshot if you can.\n\n## Response targets\n- **P1 Critical:** 15 minutes\n- **P2 High:** 1 hour\n- **P3 Medium:** 4 hours\n- **P4 Low:** 1 business day` },
  { articleId: 'KB0016', title: 'New starter IT checklist', category: 'Onboarding', tags: ['onboarding', 'new hire', 'first day'], published: false, updatedAt: ago(60 * 3),
    body: `Draft for HR and managers.\n\n## Before day one\n- HR submits the onboarding form at least 5 business days ahead.\n- Manager approves access.\n\n## Day one\n- Laptop handed over by IT.\n- First sign-in and MFA setup with a technician.` },
];

const runSteps = (scenario, doneCount, failAt = -1, startMin = 30) => {
  const steps = SCENARIOS[scenario].steps;
  return steps.map((name, i) => {
    let status = 'Pending';
    if (i < doneCount) status = 'Succeeded';
    if (i === failAt) status = 'Failed';
    if (i === doneCount && failAt < 0 && doneCount < steps.length) status = 'Running';
    return { name, status, detail: '', at: status === 'Pending' ? null : ago(startMin - i * 0.6) };
  });
};

const T = (o) => ({
  requestType: 'Incident',
  urgency: 'Medium',
  assignedTechnician: null,
  deviceName: null,
  automationCandidate: false,
  automationScenario: null,
  automationStatus: 'Not Applicable',
  aiConfidence: 0.85,
  aiSummary: '',
  aiRecommendation: '',
  requestDetails: null,
  attachments: [],
  resolution: '',
  resolutionCode: null,
  resolvedAt: null,
  closedAt: null,
  ...o,
});

const priya = { userId: 'u-emp', displayName: 'Priya Nair', email: USERS.emp.email };
const sofia = { userId: 'u-hr', displayName: 'Sofia Martins', email: USERS.hr.email };
const req = (name) => ({ userId: `u-${name.toLowerCase().split(' ')[0]}`, displayName: name, email: `${name.toLowerCase().replace(' ', '.')}@contoso-demo.com` });

export function buildSeed() {
  const tickets = [
    T({ ticketId: 'INC00127', title: 'Laptop very slow', description: 'My laptop takes minutes to open apps and Excel freezes.', requester: priya, urgency: 'Medium',
      category: 'Endpoint', subcategory: 'Disk Space', priority: 'P2', status: 'Resolved', assignedTeam: 'Endpoint', deviceName: 'WIN11-042',
      automationCandidate: true, automationScenario: 'low-disk', automationStatus: 'Succeeded', aiConfidence: 0.91,
      aiSummary: 'Low disk space likely. Device WIN11-042 had 6% free.', aiRecommendation: 'Run the approved cleanup remediation, then confirm free space is above 10%.',
      resolution: 'Automation cleared 38 GB of temporary files. Free space now 24%.', resolutionCode: 'Auto-Resolved',
      createdAt: ago(95), updatedAt: ago(88), resolvedAt: ago(88), slaDueAt: ago(95 - 480) }),
    T({ ticketId: 'INC00126', title: 'Need 7-Zip installed', description: 'I need 7-Zip to open archive files from a supplier.', requester: priya, requestType: 'Service Request', urgency: 'Low',
      category: 'Software', subcategory: 'Install Request', priority: 'P4', status: 'In Progress', assignedTeam: 'Endpoint', deviceName: 'WIN11-042',
      automationCandidate: true, automationScenario: 'software-install', automationStatus: 'Running', aiConfidence: 0.95,
      aiSummary: '7-Zip is in the approved catalog and needs no approval.', aiRecommendation: 'Assign 7-Zip to the device and confirm install state.',
      requestDetails: { itemId: 'app-7zip', appName: '7-Zip' }, createdAt: ago(6), updatedAt: ago(2), slaDueAt: ago(6 - 7200) }),
    T({ ticketId: 'INC00125', title: 'Outlook keeps freezing', description: 'Outlook freezes every time I open the calendar.', requester: priya,
      category: 'Microsoft 365', subcategory: 'Outlook', priority: 'P3', status: 'Assigned', assignedTeam: 'M365',
      assignedTechnician: { userId: 'u-l2b', displayName: 'Tomás Ruiz' }, deviceName: 'WIN11-042',
      automationCandidate: true, automationScenario: 'outlook-basic', automationStatus: 'Failed', aiConfidence: 0.83,
      aiSummary: 'Cache reset ran, but the user reports Outlook still freezes on the calendar. Possibly a corrupt shared calendar or add-in.',
      aiRecommendation: 'Start Outlook in safe mode to rule out add-ins, then remove and re-add shared calendars.',
      createdAt: ago(60 * 26), updatedAt: ago(60 * 20), slaDueAt: ago(60 * 26 - 4320) }),
    T({ ticketId: 'INC00124', title: 'Wi-Fi drops in meeting room 4B', description: 'Wi-Fi disconnects every few minutes in room 4B. Others have the same problem.', requester: req('Owen Pike'), urgency: 'High',
      category: 'Network', subcategory: 'Wi-Fi', priority: 'P2', status: 'In Progress', assignedTeam: 'Network',
      assignedTechnician: { userId: 'u-l2c', displayName: 'Kenji Watanabe' }, aiConfidence: 0.89,
      aiSummary: 'Several users in room 4B lose Wi-Fi. Likely an access point fault, not a single device.',
      aiRecommendation: 'Check the access point serving 4B for reboots or channel interference.',
      createdAt: ago(140), updatedAt: ago(40), slaDueAt: ago(140 - 480) }),
    T({ ticketId: 'INC00123', title: 'Clicked a link in a fake invoice email', description: 'I opened an invoice email and clicked the link before noticing the sender looked wrong.', requester: req('Grace Liu'), urgency: 'High',
      category: 'Security', subcategory: 'Phishing', priority: 'P1', status: 'In Progress', assignedTeam: 'Security',
      assignedTechnician: { userId: 'u-l2d', displayName: 'Leah Goldberg' }, aiConfidence: 0.96,
      aiSummary: 'User clicked a link in a suspected phishing email. Credentials may be exposed.',
      aiRecommendation: 'Isolate the device, reset password, revoke sessions, and check sign-in logs for unusual locations.',
      createdAt: ago(22), updatedAt: ago(9), slaDueAt: ago(22 - 240) }),
    T({ ticketId: 'INC00122', title: 'Account locked after holiday', description: 'Back from vacation and my account says it is locked.', requester: req('Ravi Patel'),
      category: 'Identity', subcategory: 'Account Lockout', priority: 'P2', status: 'Resolved', assignedTeam: 'Help Desk',
      automationCandidate: true, automationScenario: 'account-lockout', automationStatus: 'Succeeded', aiConfidence: 0.93,
      aiSummary: 'Lockout confirmed (sign-in error 50053). User completed SSPR.', resolution: 'User reset password through SSPR and signed in successfully.', resolutionCode: 'Auto-Resolved',
      createdAt: ago(60 * 5), updatedAt: ago(60 * 5 - 9), resolvedAt: ago(60 * 5 - 9), slaDueAt: ago(60 * 5 - 480) }),
    T({ ticketId: 'INC00121', title: 'Printer on floor 3 jams', description: 'The printer near the kitchen on floor 3 jams on every job.', requester: req('Hannah Brooks'), urgency: 'Low',
      category: 'Hardware', subcategory: 'Printer', priority: 'P3', status: 'Assigned', assignedTeam: 'Help Desk', aiConfidence: 0.9,
      aiSummary: 'Printer PRN-F3-01 jams on every job. Needs a physical check.', aiRecommendation: 'Inspect the paper path and fuser; clear the queue on the print server.',
      createdAt: ago(60 * 3), updatedAt: ago(60 * 3), slaDueAt: ago(60 * 3 - 4320) }),
    T({ ticketId: 'INC00120', title: 'Device not compliant', description: 'Company Portal says my Surface is not compliant and email stopped syncing.', requester: priya, urgency: 'High',
      category: 'Endpoint', subcategory: 'Compliance', priority: 'P2', status: 'Triaged', assignedTeam: 'Endpoint', deviceName: 'WIN11-117',
      automationCandidate: true, automationScenario: 'device-compliance', automationStatus: 'Queued', aiConfidence: 0.88,
      aiSummary: 'WIN11-117 is non-compliant: BitLocker is off and it last checked in 31 hours ago.',
      aiRecommendation: 'Apply the approved BitLocker enablement fix, sync, and re-evaluate compliance.',
      createdAt: ago(12), updatedAt: ago(11), slaDueAt: ago(12 - 480) }),
    T({ ticketId: 'INC00119', title: 'Teams shows a blank screen', description: 'Teams opens but the window is completely white.', requester: req('Lucas Meyer'),
      category: 'Microsoft 365', subcategory: 'Teams', priority: 'P3', status: 'Resolved', assignedTeam: 'M365',
      automationCandidate: true, automationScenario: 'teams-basic', automationStatus: 'Succeeded', aiConfidence: 0.86,
      resolution: 'Teams cache cleared; user confirmed Teams loads normally.', resolutionCode: 'Auto-Resolved',
      createdAt: ago(60 * 7), updatedAt: ago(60 * 7 - 6), resolvedAt: ago(60 * 7 - 6), slaDueAt: ago(60 * 7 - 4320) }),
    T({ ticketId: 'INC00118', title: 'Need Visio for process maps', description: 'Requesting Visio to document the month-end close process.', requester: priya, requestType: 'Service Request', urgency: 'Low',
      category: 'Software', subcategory: 'Install Request', priority: 'P4', status: 'Pending Approval', assignedTeam: 'Endpoint', deviceName: 'WIN11-042',
      automationCandidate: true, automationScenario: 'software-install', automationStatus: 'Queued', aiConfidence: 0.92,
      aiSummary: 'Visio is in the catalog but needs a paid license, so manager approval is required.',
      requestDetails: { itemId: 'app-visio', appName: 'Microsoft Visio' }, createdAt: ago(60 * 4), updatedAt: ago(60 * 4), slaDueAt: ago(60 * 4 - 7200) }),
    T({ ticketId: 'INC00117', title: 'New hire: Mateo Silva, Finance', description: 'Onboarding request for Mateo Silva starting in Finance.', requester: sofia, requestType: 'Onboarding', urgency: 'Medium',
      category: 'Onboarding', subcategory: 'New Hire', priority: 'P3', status: 'Pending Approval', assignedTeam: 'IT Operations',
      automationCandidate: true, automationScenario: 'onboarding', automationStatus: 'Queued', aiConfidence: 0.99,
      aiSummary: 'Standard Finance new-hire bundle: M365 E3, Finance-Shared, Power BI Viewer.',
      requestDetails: { employeeName: 'Mateo Silva', department: 'Finance', manager: 'Daniel Okafor', jobTitle: 'Accounts Payable Specialist', startDate: new Date(now + 86400000 * 12).toISOString().slice(0, 10), location: 'Mississauga office', requiredAccess: ['Microsoft 365 E3', 'Finance-Shared', 'Power BI Viewer'] },
      createdAt: ago(60 * 9), updatedAt: ago(60 * 9), slaDueAt: ago(60 * 9 - 4320) }),
    T({ ticketId: 'INC00116', title: 'Leaver: Brian Holt, Sales', description: 'Offboarding request for Brian Holt in Sales.', requester: sofia, requestType: 'Offboarding', urgency: 'Medium',
      category: 'Offboarding', subcategory: 'Leaver', priority: 'P3', status: 'Pending Approval', assignedTeam: 'IT Operations',
      automationCandidate: true, automationScenario: 'offboarding', automationStatus: 'Queued', aiConfidence: 0.99,
      aiSummary: 'Leaver with a laptop (WIN11-088) and a phone to recover. Shared mailbox access to remove.',
      requestDetails: { employee: 'Brian Holt', lastWorkingDay: new Date(now + 86400000 * 3).toISOString().slice(0, 10), manager: 'Carla Nunes', department: 'Sales', reason: 'Resignation' },
      createdAt: ago(60 * 20), updatedAt: ago(60 * 20), slaDueAt: ago(60 * 20 - 4320) }),
    T({ ticketId: 'INC00115', title: 'New hire: Amara Osei, Engineering', description: 'Onboarding request for Amara Osei.', requester: sofia, requestType: 'Onboarding',
      category: 'Onboarding', subcategory: 'New Hire', priority: 'P3', status: 'Resolved', assignedTeam: 'IT Operations',
      automationCandidate: true, automationScenario: 'onboarding', automationStatus: 'Succeeded', aiConfidence: 0.99,
      requestDetails: { employeeName: 'Amara Osei', department: 'Engineering', manager: 'Daniel Okafor', jobTitle: 'Software Developer', startDate: new Date(now + 86400000 * 5).toISOString().slice(0, 10), location: 'Remote', requiredAccess: ['Microsoft 365 E3', 'GitHub Enterprise', 'Engineering-All'] },
      resolution: 'Account created, 3 groups and E3 license assigned, onboarding checklist posted to Teams.', resolutionCode: 'Request Fulfilled',
      createdAt: ago(60 * 48), updatedAt: ago(60 * 30), resolvedAt: ago(60 * 30), slaDueAt: ago(60 * 48 - 4320) }),
    T({ ticketId: 'INC00114', title: 'Monitor flickers', description: 'Second monitor flickers and goes black every few minutes.', requester: req('Owen Pike'), urgency: 'Low',
      category: 'Hardware', subcategory: 'Monitor', priority: 'P3', status: 'Resolved', assignedTeam: 'Help Desk',
      assignedTechnician: { userId: 'u-l1', displayName: 'Marcus Chen' }, aiConfidence: 0.85,
      resolution: 'Replaced the DisplayPort cable; flicker stopped.', resolutionCode: 'Fixed by Technician',
      createdAt: ago(60 * 52), updatedAt: ago(60 * 47), resolvedAt: ago(60 * 47), slaDueAt: ago(60 * 52 - 4320) }),
    T({ ticketId: 'INC00113', title: 'Forgot my password', description: 'I forgot my password after changing it on Friday.', requester: req('Hannah Brooks'),
      category: 'Identity', subcategory: 'Password', priority: 'P3', status: 'Closed', assignedTeam: 'Help Desk',
      automationCandidate: true, automationScenario: 'password-sspr', automationStatus: 'Succeeded', aiConfidence: 0.91,
      resolution: 'SSPR guidance sent; password last-changed date updated.', resolutionCode: 'Auto-Resolved',
      createdAt: ago(60 * 24 * 4), updatedAt: ago(60 * 24), resolvedAt: ago(60 * 24 * 4 - 7), closedAt: ago(60 * 24), slaDueAt: ago(60 * 24 * 4 - 4320) }),
    T({ ticketId: 'INC00112', title: 'Laptop not receiving policies', description: 'IT said a new policy was pushed but my laptop still has old settings.', requester: req('Lucas Meyer'),
      category: 'Endpoint', subcategory: 'Sync/Check-in', priority: 'P3', status: 'Assigned', assignedTeam: 'Endpoint',
      assignedTechnician: { userId: 'u-l2', displayName: 'Aisha Rahman' }, deviceName: 'WIN11-063',
      automationCandidate: true, automationScenario: 'device-checkin', automationStatus: 'Failed', aiConfidence: 0.84,
      aiSummary: 'Sync was triggered but WIN11-063 did not check in within 30 minutes. The Intune management certificate may have expired.',
      aiRecommendation: 'Check the MDM certificate on the device; re-enroll through Company Portal if expired.',
      createdAt: ago(60 * 6), updatedAt: ago(60 * 5), slaDueAt: ago(60 * 6 - 4320) }),
    T({ ticketId: 'INC00111', title: 'VPN fails from home', description: 'VPN says authentication failed since this morning.', requester: req('Ravi Patel'), urgency: 'High',
      category: 'Network', subcategory: 'VPN', priority: 'P2', status: 'Triaged', assignedTeam: 'Network', aiConfidence: 0.87,
      aiSummary: 'VPN authentication failing since today. Could be a conditional access change or an expired client.',
      aiRecommendation: 'Check sign-in logs for conditional access blocks, then the client version.',
      createdAt: ago(35), updatedAt: ago(34), slaDueAt: ago(35 - 480) }),
    T({ ticketId: 'INC00110', title: 'Question about OneDrive sharing', description: 'How do I share a folder with an external auditor?', requester: req('Grace Liu'), urgency: 'Low',
      category: 'Microsoft 365', subcategory: 'OneDrive/SharePoint', priority: 'P4', status: 'Closed', assignedTeam: 'Help Desk',
      assignedTechnician: { userId: 'u-l1b', displayName: 'Jenna Walsh' }, aiConfidence: 0.78,
      resolution: 'Shared KB article and enabled external sharing on the Audit site after manager approval.', resolutionCode: 'Self-Service (KB)',
      createdAt: ago(60 * 24 * 6), updatedAt: ago(60 * 24 * 2), resolvedAt: ago(60 * 24 * 5), closedAt: ago(60 * 24 * 2), slaDueAt: ago(60 * 24 * 6 - 7200) }),
  ];

  const updates = [];
  let n = 1;
  const U = (ticketId, minAgo, actorType, actorName, updateType, message, visibility = 'Public') =>
    updates.push({ updateId: `UPD${String(n++).padStart(5, '0')}`, ticketId, timestamp: ago(minAgo), actorType, actorName, updateType, visibility, message });

  for (const t of tickets) {
    const c = (Date.now() - new Date(t.createdAt).getTime()) / 60000;
    U(t.ticketId, c, 'User', t.requester.displayName, 'StatusChange', 'Ticket submitted.');
    U(t.ticketId, c - 0.2, 'AI', 'ITOps AI', 'AIAnalysis', `Classified as ${t.category} / ${t.subcategory}, ${t.priority}, routed to ${t.assignedTeam}.`, 'Internal');
  }
  U('INC00127', 92, 'Automation', 'Automation engine', 'AutomationStep', 'Low disk space automation started on WIN11-042.');
  U('INC00127', 88, 'Automation', 'Automation engine', 'StatusChange', 'Free space verified at 24%. Ticket resolved automatically.');
  U('INC00125', 60 * 22, 'Automation', 'Automation engine', 'AutomationStep', 'Outlook cache reset completed.');
  U('INC00125', 60 * 20.5, 'User', 'Priya Nair', 'Comment', 'Still freezing when I open the shared Finance calendar.');
  U('INC00125', 60 * 20, 'System', 'ITOps AI', 'Assignment', 'Verification failed. Escalated to M365 with an AI summary.');
  U('INC00125', 60 * 19, 'Technician', 'Tomás Ruiz', 'Comment', "Hi Priya, I'll call you at 2 pm to check the shared calendar together.");
  U('INC00124', 90, 'Technician', 'Kenji Watanabe', 'Comment', 'Access point AP-4B rebooted 14 times today. Replacement ordered.', 'Internal');
  U('INC00124', 40, 'Technician', 'Kenji Watanabe', 'Comment', "We found a faulty access point near 4B and are replacing it this afternoon.");
  U('INC00123', 15, 'Technician', 'Leah Goldberg', 'Comment', 'Password reset and sessions revoked. Reviewing sign-in logs now.', 'Internal');
  U('INC00114', 60 * 47, 'Technician', 'Marcus Chen', 'StatusChange', 'Replaced cable. Resolved.');
  U('INC00112', 60 * 5, 'System', 'ITOps AI', 'Assignment', 'Device did not check in after sync. Escalated to Endpoint.');

  const runs = [
    { runId: 'RUN0127', ticketId: 'INC00127', scenario: 'low-disk', startedAt: ago(92), endedAt: ago(88), steps: runSteps('low-disk', 5, -1, 92), result: 'Succeeded' },
    { runId: 'RUN0126', ticketId: 'INC00126', scenario: 'software-install', startedAt: ago(4), endedAt: null, steps: runSteps('software-install', 2, -1, 4), result: null },
    { runId: 'RUN0125', ticketId: 'INC00125', scenario: 'outlook-basic', startedAt: ago(60 * 22), endedAt: ago(60 * 20), steps: runSteps('outlook-basic', 3, 3, 60 * 22), result: 'Failed' },
    { runId: 'RUN0122', ticketId: 'INC00122', scenario: 'account-lockout', startedAt: ago(60 * 5 - 1), endedAt: ago(60 * 5 - 9), steps: runSteps('account-lockout', 5, -1, 60 * 5), result: 'Succeeded' },
    { runId: 'RUN0119', ticketId: 'INC00119', scenario: 'teams-basic', startedAt: ago(60 * 7 - 1), endedAt: ago(60 * 7 - 6), steps: runSteps('teams-basic', 5, -1, 60 * 7), result: 'Succeeded' },
    { runId: 'RUN0115', ticketId: 'INC00115', scenario: 'onboarding', startedAt: ago(60 * 31), endedAt: ago(60 * 30), steps: runSteps('onboarding', 5, -1, 60 * 31), result: 'Succeeded' },
    { runId: 'RUN0113', ticketId: 'INC00113', scenario: 'password-sspr', startedAt: ago(60 * 24 * 4 - 1), endedAt: ago(60 * 24 * 4 - 7), steps: runSteps('password-sspr', 5, -1, 60 * 24 * 4), result: 'Succeeded' },
    { runId: 'RUN0112', ticketId: 'INC00112', scenario: 'device-checkin', startedAt: ago(60 * 5.6), endedAt: ago(60 * 5), steps: runSteps('device-checkin', 3, 3, 60 * 5.6), result: 'Failed' },
  ];
  runs.find((r) => r.runId === 'RUN0125').steps[3].detail = 'User reported Outlook still freezes.';
  runs.find((r) => r.runId === 'RUN0112').steps[3].detail = 'No check-in within 30 minutes.';
  runs.find((r) => r.runId === 'RUN0127').steps[2].detail = 'Removed 38 GB from temp, Windows Update cache and browser caches.';

  // 14 days of history for dashboard trends.
  const history = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    const created = [21, 18, 24, 19, 9, 6, 22, 26, 23, 20, 25, 8, 7, 18][i];
    const auto = [8, 7, 10, 8, 4, 2, 9, 12, 11, 9, 12, 3, 3, 8][i];
    return { date: d.toISOString().slice(0, 10), created, autoResolved: auto };
  });

  return {
    tickets,
    updates,
    runs,
    kb: KB.map((a) => ({ ...a })),
    catalog: CATALOG.map((c) => ({ ...c })),
    devices: DEVICES.map((d) => ({ ...d })),
    history,
    nextTicket: 128,
    settings: {
      scenarios: Object.fromEntries(Object.keys(SCENARIOS).map((k) => [k, true])),
      simulateFailure: false,
      speed: 1,
    },
  };
}
