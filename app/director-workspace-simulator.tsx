"use client";

import { useState } from "react";
import { useAcademyAuth } from "./academy-auth";

/*
  Luna Academy — Lesson 1 simulator: "Getting started with Luna"

  Training only. This component never connects to production Luna.
  Screen labels, section names, section descriptions, sign-in messages,
  and role visibility rules are copied from the Luna_Accounting source
  (app/auth-gate.tsx, app/workspace.tsx, accounting/luna-access.ts).
  Everything here runs in the browser with fictional accounts.
*/

export type Role = "director" | "bookkeeper" | "assistant_bookkeeper" | "salesman";

export const roleLabels: Record<Role, string> = {
  director: "Director",
  bookkeeper: "Bookkeeper",
  assistant_bookkeeper: "Assistant Bookkeeper",
  salesman: "Salesman",
};

// Same order as Luna's main navigation.
export const sections = [
  "Home",
  "Luna AI Assistant",
  "Chat History",
  "Luna Task History",
  "Customer Orders",
  "Customer Returns",
  "Purchase Orders",
  "Director Approval",
  "Vendor Receiving",
  "Supplier Returns",
  "Banking",
  "Invoices & Bills",
  "Vendors",
  "Customers",
  "General Ledger",
  "Financial Reports",
  "Month-end Review",
  "Scheduled Reports",
  "Email & Reminders",
  "Document Center",
  "Budget Planning",
  "Products & Inventory",
  "Approvals & Audit",
  "Settings",
  "User Access",
  "PharmaBridge",
];

// Descriptions exactly as written in Luna's workspace.
export const descriptions: Record<string, string> = {
  "Director Approval": "Review purchase orders and authorize supplier returns.",
  "Vendor Receiving": "Record goods received against approved purchase orders.",
  "Supplier Returns": "Prepare, dispatch and settle receipt-linked supplier returns.",
  "Customer Returns":
    "Manage customer return authorizations, receiving, inspection, restocking, credits and refunds.",
  Customers: "Customer profiles, contacts, billing addresses, and payment terms.",
  "Customer Orders": "Enter customer orders with multiple products and track fulfillment.",
  Vendors: "Supplier profiles, contacts, purchasing terms, and authorization records.",
  "Purchase Orders": "Create numbered purchase orders with multiple items and track receiving.",
  "Products & Inventory":
    "Manage medical supplies, nonmedical supplies, pharmaceuticals, lots, and stock.",
  "Invoices & Bills": "Manage customer invoices and vendor bills.",
  Banking: "Import transactions, match payments, and reconcile bank accounts.",
  "General Ledger": "Manage accounts, balanced journal entries, and accounting periods.",
  "Financial Reports": "Access financial statements and the required management reports.",
  "Month-end Review": "Review unfinished accounting work before preparing final monthly reports.",
  "Budget Planning":
    "Set monthly income and expense plans and compare them with recorded entries.",
  "Scheduled Reports": "Configure reporting schedules and owner email notifications.",
  "Document Center": "Upload and organize invoices, receipts, and business records.",
  "Luna Task History": "See saved document accounting tasks, outcomes and pending reviews.",
  "Email & Reminders": "Manage business notifications and delivery history.",
  "Approvals & Audit": "Review pending actions and inspect recorded activity.",
  Settings: "Configure Elevate Medical Solutions and Luna's operating policies.",
};


export type IconName =
  | "home" | "assistant" | "orders" | "bank" | "invoice" | "vendors" | "customers"
  | "ledger" | "reports" | "calendar" | "mail" | "documents" | "budget" | "products"
  | "settings" | "help" | "bell";

// Icons copied from Luna's workspace so the simulator looks like the real app.
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "home":
      return <svg {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></svg>;
    case "assistant":
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
    case "orders":
      return <svg {...common}><path d="M7 3h10l4 4v14H3V3z" /><path d="M7 3v5h10V3M7 13h10M7 17h7" /></svg>;
    case "bank":
      return <svg {...common}><path d="m3 9 9-6 9 6M4 10h16M5 20h14M7 10v8m5-8v8m5-8v8M3 21h18" /></svg>;
    case "invoice":
    case "documents":
      return <svg {...common}><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6M9 13h8M9 17h8" /></svg>;
    case "vendors":
    case "customers":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1z" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20h-3" /></svg>;
    case "ledger":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 6h16M8 8v9M11 9h6M11 13h6M11 17h4" /></svg>;
    case "reports":
      return <svg {...common}><path d="M4 20V11h4v9M10 20V5h4v15M16 20V8h4v12" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "budget":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M16 8.5c-.8-1-2-1.5-3.7-1.5-1.8 0-3 .8-3 2s1 1.8 3 2.2 3 .9 3 2.3-1.3 2.5-3.4 2.5c-1.7 0-3-.6-3.9-1.7M12 5v14" /></svg>;
    case "products":
      return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5zM3 8v9l9 5 9-5V8M12 13v9" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3z" /></svg>;
    case "help":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17h.01" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
  }
}

export const navigationIcons: Record<string, IconName> = {
  Home: "home",
  "Luna AI Assistant": "assistant",
  "Chat History": "documents",
  "Luna Task History": "documents",
  "Customer Orders": "orders",
  "Customer Returns": "orders",
  "Purchase Orders": "orders",
  "Director Approval": "documents",
  "Vendor Receiving": "orders",
  "Supplier Returns": "orders",
  Banking: "bank",
  "Invoices & Bills": "invoice",
  Vendors: "vendors",
  Customers: "customers",
  "General Ledger": "ledger",
  "Financial Reports": "reports",
  "Month-end Review": "reports",
  "Scheduled Reports": "calendar",
  "Email & Reminders": "mail",
  "Document Center": "documents",
  "Budget Planning": "budget",
  "Products & Inventory": "products",
  "Approvals & Audit": "documents",
  Settings: "settings",
  "User Access": "settings",
  PharmaBridge: "products",
};

// The "Accounting Workspace" cards on Luna's Home screen.
export const homeCards: { title: string; description: string; icon: IconName }[] = [
  { title: "Customer Orders", description: "Enter orders and track fulfillment", icon: "orders" },
  { title: "Purchase Orders", description: "Create purchase orders and track deliveries", icon: "orders" },
  { title: "Banking", description: "Connect and manage bank accounts", icon: "bank" },
  { title: "Invoices & Bills", description: "Create invoices and manage bills", icon: "invoice" },
  { title: "Vendors", description: "Manage vendor information", icon: "vendors" },
  { title: "Customers", description: "Manage customer information", icon: "customers" },
  { title: "General Ledger", description: "Journal entries and accounting records", icon: "ledger" },
  { title: "Financial Reports", description: "Generate and view financial reports", icon: "reports" },
  { title: "Scheduled Reports", description: "Set weekly, monthly, quarterly, or yearly reports", icon: "calendar" },
  { title: "Email & Reminders", description: "Manage business emails and reminders", icon: "mail" },
  { title: "Document Center", description: "Upload, organize, and find business documents", icon: "documents" },
  { title: "Budget Planning", description: "Plan income and expenses by month", icon: "budget" },
  { title: "Products & Inventory", description: "Manage products, lots, and stock", icon: "products" },
];

// Which Director lesson teaches each section's workflow in depth.
export const coveredIn: Record<string, string> = {
  "Luna AI Assistant": "Lesson 11",
  "Chat History": "Lesson 11",
  "Luna Task History": "Lesson 11",
  "Customer Orders": "Lesson 6",
  "Customer Returns": "Lesson 7",
  "Purchase Orders": "Lesson 3",
  "Director Approval": "Lesson 3",
  "Vendor Receiving": "Lesson 4",
  "Supplier Returns": "Lesson 8",
  Banking: "Lesson 9",
  "Invoices & Bills": "Lessons 4 and 6",
  Vendors: "Lesson 2",
  Customers: "Lesson 2",
  "General Ledger": "Lesson 9",
  "Financial Reports": "Lesson 10",
  "Month-end Review": "Lesson 10",
  "Scheduled Reports": "Lesson 11",
  "Email & Reminders": "Lesson 11",
  "Document Center": "Lesson 11",
  "Budget Planning": "Lesson 10",
  "Products & Inventory": "Lessons 2 and 5",
  "Approvals & Audit": "Lesson 11",
  Settings: "Lesson 1 (overview only)",
  "User Access": "Lesson 1 (overview only)",
  PharmaBridge: "Lesson 12",
};

// Luna's rule (accounting/luna-access.ts) for the accounting workspace.
const accountingSections = new Set([
  "Home",
  "Purchase Orders",
  "Luna AI Assistant",
  "Chat History",
  "Luna Task History",
  "Banking",
  "Invoices & Bills",
  "Vendors",
  "Customers",
  "General Ledger",
  "Financial Reports",
  "Month-end Review",
  "Document Center",
]);

export function canOpenSection(role: Role, section: string) {
  if (role === "director") return true;
  if (role === "salesman") return false; // Salesman uses a separate sales workspace.
  if (!accountingSections.has(section)) return false;
  if (
    role === "assistant_bookkeeper" &&
    ["Purchase Orders", "Banking", "Financial Reports", "Month-end Review"].includes(section)
  ) {
    return false;
  }
  return true;
}

type Mission =
  | { kind: "signin"; prompt: string; learn: string[] }
  | { kind: "navigate"; target: string; prompt: string; learn: string[] }
  | { kind: "back"; prompt: string; learn: string[] }
  | { kind: "signout"; prompt: string; learn: string[] }
  | {
      kind: "choice";
      prompt: string;
      options: { text: string; correct: boolean; why: string }[];
      showRolePreview?: boolean;
      learn: string[];
    };

const missions: Mission[] = [
  {
    kind: "signin",
    prompt: "Click “Sign in as Training Director” to open the practice workspace.",
    learn: [
      "You are in the workspace. In the real Luna you type your email and password, then Luna checks two things: that the password is correct, and that your account has an approved Luna role.",
      "If the email or password is wrong, Luna says: “Sign-in failed. Check your email and Luna password.” If the password is right but there is no approved role, Luna says: “This account does not have approved access to Luna.” The first means retype; the second means contact the administrator.",
      "Above the workspace, the account bar shows who is signed in and their role, with a Sign out button. Home greets you by name and offers the Ask Luna box plus quick links.",
    ],
  },
  {
    kind: "choice",
    prompt: "Look at the account bar above the workspace. Which role is this session using?",
    options: [
      {
        text: "Director",
        correct: true,
        why: "Correct. The account bar reads “Signed in as Training Director · Director.” Always confirm the role before acting, because the role decides which sections and actions you have.",
      },
      {
        text: "Bookkeeper",
        correct: false,
        why: "Not this time. Read the text after the dot in the account bar — that is the role.",
      },
      {
        text: "Salesman",
        correct: false,
        why: "No. A Salesman would not see this sidebar at all — Luna gives that role a separate sales workspace.",
      },
    ],
    learn: [
      "The Director role can open every section of the accounting workspace, including approvals, settings, user access and PharmaBridge.",
    ],
  },
  {
    kind: "navigate",
    target: "Customers",
    prompt:
      "A customer phones to say their billing address on your records is wrong. Open the section where customer profiles and billing addresses are kept.",
    learn: [
      "Customers holds each customer's profile, contacts, billing addresses and payment terms.",
      "This is a master record: orders and invoices draw on it. Fixing it at the source prevents the wrong address being copied onto future documents.",
    ],
  },
  {
    kind: "navigate",
    target: "Director Approval",
    prompt:
      "The Bookkeeper has submitted a purchase order for your approval. Open the section where you review it.",
    learn: [
      "Director Approval is where you review purchase orders and authorize supplier returns.",
      "Purchase Orders is where orders are prepared and tracked; Director Approval is where you decide on them. Keeping preparation and approval separate is a deliberate control.",
    ],
  },
  {
    kind: "navigate",
    target: "Vendor Receiving",
    prompt:
      "The supplier says the goods have arrived. Open the section where receipt of goods against approved purchase orders is recorded.",
    learn: [
      "Vendor Receiving records what physically arrived against an approved purchase order.",
      "An approved order is a promise to buy, not proof of delivery. Receiving is its own record, and it can show a short delivery.",
    ],
  },
  {
    kind: "navigate",
    target: "Invoices & Bills",
    prompt: "Next, find where the supplier's bill for that delivery would be managed.",
    learn: [
      "Invoices & Bills manages customer invoices and vendor bills.",
      "Order, receipt, bill and payment are four different events in four places. Before paying, a Director compares them rather than trusting any single one.",
    ],
  },
  {
    kind: "navigate",
    target: "Month-end Review",
    prompt:
      "It's the end of the month. Before final reports are prepared, open the section that lists unfinished accounting work.",
    learn: [
      "Month-end Review shows unfinished accounting work before final monthly reports are prepared.",
      "Financial Reports produces the statements; Month-end Review tells you whether the records behind them are finished.",
    ],
  },
  {
    kind: "navigate",
    target: "Luna Task History",
    prompt:
      "Luna's assistant said it finished processing a supplier document. Open the section that lists saved document accounting tasks, their outcomes and pending reviews.",
    learn: [
      "Luna Task History lists saved document accounting tasks, outcomes and pending reviews.",
      "A chat reply is not evidence that a record changed. Check the task's outcome here, then check the business record itself.",
    ],
  },
  {
    kind: "navigate",
    target: "PharmaBridge",
    prompt: "Open PharmaBridge, the pharmaceutical operations area.",
    learn: [
      "PharmaBridge replaces the accounting sidebar with its own workspace. Notice the sidebar has disappeared and a “← Back to Luna” button appears at the top.",
      "Its overview tracks drug profiles, registrations, permits and shipments. Luna states that registration status is entered by staff and does not independently confirm an authority decision.",
    ],
  },
  {
    kind: "back",
    prompt: "Return to the accounting workspace.",
    learn: [
      "“← Back to Luna” returns you to Home in the accounting workspace, and the sidebar comes back.",
    ],
  },
  {
    kind: "choice",
    showRolePreview: true,
    prompt:
      "Use the role preview below to compare sidebars. An Assistant Bookkeeper tells you they can't see Banking. What is the correct explanation?",
    options: [
      {
        text: "Their role does not include Banking, so Luna hides it from their sidebar.",
        correct: true,
        why: "Correct. Luna only lists sections a role can open. The Assistant Bookkeeper role excludes Purchase Orders, Banking, Financial Reports and Month-end Review.",
      },
      {
        text: "Luna has a fault. Lend them the Director login to finish the task.",
        correct: false,
        why: "No. The section is hidden on purpose, and sharing a login defeats Luna's access controls and its record of who did what.",
      },
      {
        text: "Banking is only visible inside PharmaBridge.",
        correct: false,
        why: "No. Banking is an accounting section. Check the preview: it's missing for the Assistant Bookkeeper because of their role.",
      },
    ],
    learn: [
      "Settings configures Elevate Medical Solutions and Luna's operating policies. User Access is where approved users and roles are managed. Changes there are deliberate administrative decisions — never a quick workaround.",
    ],
  },
  {
    kind: "signout",
    prompt: "You've finished the tour. Sign out of Luna.",
    learn: [
      "Sign out ends the session in this browser. Always sign out on shared computers.",
    ],
  },
];

export const simulatorStyles = `
.lsim { border:1px solid #cbd5e1; border-radius:16px; overflow:hidden; background:#f8fafc; color:#0f172a; margin:16px 0; font-size:15px; font-family:Arial,Helvetica,sans-serif; }
.lsim-top { background:#0f172a; color:#fff; padding:10px 16px; font-size:13px; letter-spacing:.04em; }
.lsim-coach { padding:14px 16px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; border-bottom:1px solid #e2e8f0; align-items:start; }
@media (max-width:760px){ .lsim-coach{ grid-template-columns:1fr; } }
.lsim-coach-head { grid-column:1 / -1; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
.lsim-coach-head h4 { margin:0; font-size:1rem; }
.lsim-coach-actions { display:flex; gap:8px; }
.lsim-prompt { background:#ecfeff; border:1px solid #a5f3fc; border-radius:10px; padding:12px; }
.lsim-feedback { border-radius:10px; padding:12px; }
.lsim-feedback.good { background:#f0fdf4; border:1px solid #86efac; }
.lsim-feedback.bad { background:#fff7ed; border:1px solid #fdba74; }
.lsim-feedback p { margin:0 0 8px; } .lsim-feedback p:last-child { margin:0; }
.lsim-btn { border:1px solid #0f766e; background:#0f766e; color:#fff; border-radius:8px; padding:9px 14px; cursor:pointer; font:inherit; }
.lsim-btn.secondary { background:#fff; color:#0f172a; border-color:#cbd5e1; }
.lsim-btn:disabled { opacity:.5; cursor:not-allowed; }
.lsim-choice { display:block; width:100%; text-align:left; margin:6px 0; }
.lsim-progress { height:8px; background:#e2e8f0; border-radius:99px; overflow:hidden; grid-column:1 / -1; }
.lsim-progress span { display:block; height:100%; background:#0f766e; }
.lsim-roles { display:flex; flex-wrap:wrap; gap:6px; }
.lsim-roles button { font-size:12px; padding:5px 9px; }
.lsim-rolelist { font-size:12px; columns:2; margin:8px 0 0; padding-left:18px; }
.lsim-footnote { grid-column:1 / -1; font-size:12px; color:#64748b; margin:0; }

/* ----- Simulated Luna (styles follow Luna's workspace) ----- */
.lsim-stage { height:620px; display:flex; flex-direction:column; background:#f7fbff; color:#0a2d66; }
.lsim-login { flex:1; display:flex; align-items:center; justify-content:center; padding:32px; background:#eef4fb; }
.lsim-card { background:#fff; border:1px solid #d6e2ef; border-radius:14px; padding:28px; width:100%; max-width:380px; text-align:center; }
.lsim-mark { display:inline-flex; width:44px; height:44px; border-radius:12px; background:#12345a; color:#fff; align-items:center; justify-content:center; font-weight:700; }
.lsim-bar { display:flex; justify-content:space-between; align-items:center; padding:10px 18px; background:#eaf4ff; border-bottom:1px solid #dceafa; font-size:14px; color:#173b70; flex:0 0 auto; }
.lsim-bar button { border:1px solid #d5e5f5; background:#fff; color:#173b70; border-radius:10px; padding:7px 14px; font:inherit; cursor:pointer; }
.lsim-shell { flex:1; display:flex; min-height:0; }
.lsim-side { width:200px; flex-shrink:0; background:#f4f9ff; border-right:1px solid #e2edf8; display:flex; flex-direction:column; min-height:0; padding:0 8px 8px; }
.lsim-brand { height:64px; flex-shrink:0; display:flex; align-items:center; gap:10px; padding:0 8px; border-bottom:1px solid #e3edf8; margin-bottom:8px; }
.lsim-logo { font-size:32px; line-height:1; color:#2588df; transform:rotate(-25deg); }
.lsim-brand strong { display:block; font-size:19px; line-height:1.05; color:#164986; }
.lsim-brand small { display:block; font-size:12px; color:#2779c2; margin-top:2px; }
.lsim-nav { flex:1; overflow-y:auto; display:grid; gap:2px; align-content:start; scrollbar-width:thin; }
.lsim-nav button { display:flex; align-items:center; gap:9px; width:100%; text-align:left; background:transparent; border:0; color:#153969; padding:8px; min-height:36px; border-radius:8px; cursor:pointer; font:inherit; font-size:13px; white-space:nowrap; }
.lsim-nav button:hover { background:#e8f3ff; }
.lsim-nav button.active { background:#dceeff; color:#086ac4; font-weight:700; }
.lsim-nav button.pharma { color:#05663c; background:#dff4e7; font-weight:700; }
.lsim-nav-icon { width:20px; flex-shrink:0; display:flex; justify-content:center; color:#12437e; }
.lsim-nav button.pharma .lsim-nav-icon { color:#067343; }
.lsim-side-foot { padding:10px 8px 2px; color:#647b96; font-size:11px; }
.lsim-side-foot span { display:inline-block; width:7px; height:7px; background:#28a875; border-radius:50%; margin-right:6px; }
.lsim-main { flex:1; display:flex; flex-direction:column; min-width:0; min-height:0; }
.lsim-topbar { height:64px; flex:0 0 64px; display:flex; justify-content:space-between; align-items:center; padding:0 18px; background:#f1f8ff; border-bottom:1px solid #e3edf8; }
.lsim-company { font-size:17px; font-weight:700; color:#173d72; }
.lsim-top-actions { display:flex; align-items:center; gap:16px; color:#163c70; font-size:13px; }
.lsim-top-actions > span { display:inline-flex; align-items:center; gap:6px; }
.lsim-top-logo { height:44px; width:auto; border-left:1px solid #dce8f5; padding-left:14px; }
.lsim-back { background:#e5f5e9; color:#075d38; border:1px solid #c9dfd0; border-radius:8px; padding:7px 11px; margin-right:12px; cursor:pointer; font:inherit; font-size:13px; }
.lsim-content { flex:1; padding:18px; overflow:auto; min-height:0; }
.lsim-heading { margin:0 0 12px; color:#123d68; font-size:1.5rem; }
.lsim-hero { border-radius:18px; background:linear-gradient(115deg,#e7f4ff 0%,#deefff 100%); display:grid; grid-template-columns:150px minmax(0,1fr); align-items:center; gap:22px; padding:18px 22px; margin-bottom:18px; }
.lsim-portrait { width:140px; height:140px; object-fit:cover; border-radius:50%; border:4px solid rgba(255,255,255,.85); box-shadow:0 5px 20px rgba(32,91,147,.12); }
.lsim-greeting { font-size:16px; margin:0 0 4px; color:#193b70; }
.lsim-hero h2 { font-size:22px; line-height:1.2; margin:0; color:#103975; }
.lsim-question { font-size:15px; margin:5px 0 10px; color:#193b70; }
.lsim-ask { display:flex; align-items:center; background:#fff; border:1px solid #d4e6f7; border-radius:12px; padding:5px; gap:6px; }
.lsim-ask input { flex:1; min-width:0; border:0; outline:0; padding:8px; font:inherit; font-size:14px; background:transparent; }
.lsim-send { width:36px; height:36px; border:0; border-radius:9px; background:#1877d4; color:#fff; opacity:.6; }
.lsim-quick { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }
.lsim-quick button { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1px solid #e1edf8; border-radius:10px; color:#17437c; padding:7px 10px; font:inherit; font-size:12px; cursor:pointer; }
.lsim-quick button:hover { background:#f5faff; border-color:#b7d7f5; }
.lsim-section-title { font-size:19px; color:#10386f; margin:0 0 10px; }
.lsim-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.lsim-cards button { display:grid; grid-template-columns:46px minmax(0,1fr); align-items:center; gap:12px; border:1px solid #e1ebf5; border-radius:12px; background:#fff; padding:10px 12px; text-align:left; color:#153969; cursor:pointer; font:inherit; }
.lsim-cards button:hover { border-color:#a9cfee; }
.lsim-card-icon { width:44px; height:44px; border-radius:11px; display:grid; place-items:center; background:#e8f4ff; color:#1677d0; }
.lsim-cards strong { display:block; font-size:14px; color:#12396f; }
.lsim-cards span span { display:block; font-size:12px; color:#536984; line-height:1.35; }
.lsim-note { font-size:13px; color:#475569; background:#fff; border:1px dashed #cbd5e1; border-radius:8px; padding:10px; margin-top:12px; }
.lsim-module { background:#fff; border:1px solid #dceafa; border-radius:14px; padding:18px; }
.lsim-stage.pharma .lsim-topbar { background:#f5faf6; border-color:#dcece2; }
.lsim-stage.pharma .lsim-company { color:#164c36; }
.lsim-stage.pharma .lsim-main { background:#f7fcf8; }
.lsim-stage.pharma .lsim-bar { background:#eef8f1; border-color:#dcece2; color:#164c36; }
.lsim-pharma h2 { color:#075d38; margin:0 0 6px; }
.lsim-pharma-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin:10px 0; }
.lsim-pharma-cards div { border:1px solid #dcece2; border-radius:10px; padding:12px; background:#f7fcf8; font-size:13px; color:#4e685b; }
.lsim-pharma-cards strong { display:block; font-size:1.5rem; color:#08673c; margin-top:4px; }
@media (max-width:760px){
  .lsim-stage { height:auto; min-height:560px; }
  .lsim-shell { flex-direction:column; }
  .lsim-side { width:auto; }
  .lsim-nav { max-height:170px; }
  .lsim-hero { grid-template-columns:1fr; text-align:center; }
  .lsim-portrait { width:100px; height:100px; margin:0 auto; }
  .lsim-cards { grid-template-columns:1fr; }
  .lsim-company, .lsim-top-actions > span { display:none; }
}
`;

type Feedback = { tone: "good" | "bad"; lines: string[] } | null;

export default function DirectorWorkspaceSimulator() {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);

  const [screen, setScreen] = useState<"signin" | "workspace">("signin");
  const [user, setUser] = useState<{ name: string; role: Role } | null>(null);
  const [active, setActive] = useState("Home");
  const [previewRole, setPreviewRole] = useState<Role>("assistant_bookkeeper");
  const auth = useAcademyAuth();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];

  function succeed(extra?: string) {
    if (!mission) return;
    setFeedback({ tone: "good", lines: [...(extra ? [extra] : []), ...mission.learn] });
    setAdvanceReady(true);
  }

  function miss(lines: string[]) {
    setFeedback({ tone: "bad", lines });
  }

  async function saveCompletion() {
    if (!auth) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    const problem = await auth.recordCompletion("director", "Getting started with Luna");
    setSaveStatus(problem ? "error" : "saved");
  }

  function nextMission() {
    if (step === missions.length - 1) void saveCompletion();
    setStep((s) => s + 1);
    setFeedback(null);
    setAdvanceReady(false);
  }

  function restart() {
    setStep(0);
    setFeedback(null);
    setAdvanceReady(false);
    setScreen("signin");
    setUser(null);
    setActive("Home");
  }

  function signIn() {
    setUser({ name: "Training Director", role: "director" });
    setScreen("workspace");
    setActive("Home");
    if (mission?.kind === "signin" && !advanceReady) succeed();
  }

  function signOut() {
    setUser(null);
    setScreen("signin");
    setActive("Home");
    if (mission?.kind === "signout") succeed();
  }

  function navigate(section: string) {
    setActive(section);
    if (!mission || advanceReady) return;
    if (mission.kind === "navigate") {
      if (section === mission.target) {
        succeed();
      } else {
        const desc = descriptions[section];
        miss([
          `Not quite. You opened ${section}${desc ? ` — ${desc}` : "."}`,
          "Re-read the task and try another section.",
        ]);
      }
    }
  }

  function backToLuna() {
    setActive("Home");
    if (mission?.kind === "back" && !advanceReady) succeed();
  }

  function choose(option: { correct: boolean; why: string }) {
    if (advanceReady) return;
    if (option.correct) succeed(option.why);
    else miss([option.why]);
  }

  const visibleSections = user ? sections.filter((s) => canOpenSection(user.role, s)) : [];
  const inPharma = active === "PharmaBridge";
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);

  return (
    <div className="lsim" aria-label="Luna training simulator">
      <style>{simulatorStyles}</style>
      <div className="lsim-top">
        TRAINING SIMULATOR · Fictional accounts and records · Not connected to production Luna
      </div>

      {/* ---------- Coach panel ---------- */}
      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>
            Lesson 1 · Getting started with Luna · Task {Math.min(step + 1, missions.length)} of {missions.length}
          </h4>
          <div className="lsim-coach-actions">
            {advanceReady && !finished && (
              <button type="button" className="lsim-btn" onClick={nextMission}>
                {step === missions.length - 1 ? "Finish lesson" : "Next task →"}
              </button>
            )}
            <button type="button" className="lsim-btn secondary" onClick={restart}>
              Restart lesson
            </button>
          </div>
        </div>
        <div className="lsim-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        {finished ? (
          <div className="lsim-feedback good" style={{ gridColumn: "1 / -1" }}>
            <p><strong>Lesson 1 complete.</strong></p>
            <p>You can now sign in, read your role, find each part of Luna, move in and out of PharmaBridge, explain why sections are hidden, and sign out.</p>
            <p>Next: Lesson 2 uses this same workspace to work with fictional customer, vendor and product records.</p>
            <p role="status">
              {saveStatus === "saving" && "Saving your completion…"}
              {saveStatus === "saved" && "Your completion has been recorded in your Academy training record."}
              {saveStatus === "error" && (
                <>
                  Your completion could not be saved.{" "}
                  <button type="button" className="lsim-btn secondary" onClick={() => void saveCompletion()}>
                    Try again
                  </button>
                </>
              )}
            </p>
          </div>
        ) : (
          mission && (
            <div className="lsim-prompt">
              <strong>Your task</strong>
              <p style={{ margin: "6px 0 0" }}>{mission.prompt}</p>

              {mission.kind === "choice" && (
                <div style={{ marginTop: 8 }}>
                  {mission.showRolePreview && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="lsim-roles">
                        {(Object.keys(roleLabels) as Role[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={`lsim-btn ${previewRole === r ? "" : "secondary"}`}
                            onClick={() => setPreviewRole(r)}
                          >
                            {roleLabels[r]}
                          </button>
                        ))}
                      </div>
                      {previewRole === "salesman" ? (
                        <p style={{ fontSize: 12, margin: "8px 0 0" }}>
                          A Salesman doesn’t get this sidebar. Luna opens a separate sales workspace,
                          covered in the Salesman track.
                        </p>
                      ) : (
                        <ul className="lsim-rolelist">
                          {sections
                            .filter((sec) => canOpenSection(previewRole, sec))
                            .map((sec) => (
                              <li key={sec}>{sec}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {mission.options.map((o) => (
                    <button
                      key={o.text}
                      type="button"
                      className="lsim-btn secondary lsim-choice"
                      disabled={advanceReady}
                      onClick={() => choose(o)}
                    >
                      {o.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {!finished && (
          feedback ? (
            <div className={`lsim-feedback ${feedback.tone}`} role="status">
              {feedback.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="lsim-note" style={{ marginTop: 0 }}>
              Do the task in the practice workspace below. Feedback will appear here.
            </div>
          )
        )}

        <p className="lsim-footnote">
          Screen labels, messages and role rules match the current Luna code. Records and accounts are
          fictional, and nothing here changes production Luna.
        </p>
      </div>

      {/* ---------- Simulated Luna ---------- */}
      <div className={`lsim-stage ${inPharma ? "pharma" : ""}`}>
        {screen === "signin" ? (
          <div className="lsim-login">
            <div className="lsim-card">
              <span className="lsim-mark" aria-hidden="true">L</span>
              <p style={{ fontSize: 12, letterSpacing: ".08em", margin: "10px 0 0" }}>
                ELEVATE MEDICAL SOLUTIONS
              </p>
              <h3 style={{ margin: "4px 0" }}>Luna Academy · Practice sign-in</h3>
              <p style={{ margin: "0 0 16px", color: "#475569" }}>
                No password needed. This is practice only.
              </p>
              <button type="button" className="lsim-btn" style={{ width: "100%" }} onClick={signIn}>
                Sign in as Training Director
              </button>
              <p style={{ fontSize: 13, color: "#64748b" }}>
                Never enter your real Luna password in Luna Academy.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="lsim-bar">
              <span>
                Signed in as <strong>{user?.name}</strong> · {user ? roleLabels[user.role] : ""}
              </span>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>

            <div className="lsim-shell">
              {!inPharma && (
                <aside className="lsim-side">
                  <div className="lsim-brand">
                    <span className="lsim-logo" aria-hidden="true">☾</span>
                    <div>
                      <strong>Luna</strong>
                      <small>Accounting</small>
                    </div>
                  </div>
                  <nav className="lsim-nav" aria-label="Simulated main navigation">
                    {visibleSections.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`${active === sec ? "active" : ""} ${sec === "PharmaBridge" ? "pharma" : ""}`}
                        aria-current={active === sec ? "page" : undefined}
                        onClick={() => navigate(sec)}
                      >
                        <span className="lsim-nav-icon">
                          <Icon name={navigationIcons[sec]} size={18} />
                        </span>
                        {sec}
                      </button>
                    ))}
                  </nav>
                  <div className="lsim-side-foot">
                    <span />
                    Elevate Medical Solutions
                  </div>
                </aside>
              )}

              <div className="lsim-main">
                <div className="lsim-topbar">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {inPharma && (
                      <button type="button" className="lsim-back" onClick={backToLuna}>
                        ← Back to Luna
                      </button>
                    )}
                    <span className="lsim-company">Elevate Medical Solutions</span>
                  </span>
                  <span className="lsim-top-actions">
                    <span><Icon name="bell" size={17} />Notifications</span>
                    <span><Icon name="help" size={17} />Help</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="lsim-top-logo" src="/ems-logo.png" alt="EMS — Elevate Medical Solutions" />
                  </span>
                </div>

                <div className="lsim-content">
                  {active === "Home" ? (
                    <>
                      <section className="lsim-hero">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="lsim-portrait" src="/luna-avatar.jpg" alt="Luna, your accounting assistant" />
                        <div>
                          <p className="lsim-greeting">Good day, {user?.name}</p>
                          <h2>I’m Luna, your AI Accounting Assistant</h2>
                          <p className="lsim-question">How can I help you today?</p>
                          <div className="lsim-ask">
                            <input
                              aria-label="Ask Luna"
                              disabled
                              placeholder="Ask Luna a question or give me an instruction…"
                            />
                            <button className="lsim-send" disabled aria-label="Send to Luna">➤</button>
                          </div>
                          <div className="lsim-quick" aria-label="Quick links">
                            {([
                              ["Reconcile bank account", "Banking", "bank"],
                              ["Create an invoice", "Invoices & Bills", "invoice"],
                              ["Generate a monthly report", "Financial Reports", "reports"],
                              ["Find a document", "Document Center", "documents"],
                              ["Set a reminder", "Email & Reminders", "calendar"],
                            ] as [string, string, IconName][]).map(([label, target, icon]) => (
                              <button key={label} type="button" onClick={() => navigate(target)}>
                                <Icon name={icon} size={15} />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>
                      <h3 className="lsim-section-title">Accounting Workspace</h3>
                      <div className="lsim-cards">
                        {homeCards.map((card) => (
                          <button key={card.title} type="button" onClick={() => navigate(card.title)}>
                            <span className="lsim-card-icon"><Icon name={card.icon} size={22} /></span>
                            <span>
                              <strong>{card.title}</strong>
                              <span>{card.description}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="lsim-note">
                        The quick links and cards are shortcuts into sections. “Set a reminder” appears only
                        for the Director. Luna AI replies are not simulated in this lesson; you’ll practise
                        them in Lesson 11.
                      </p>
                    </>
                  ) : inPharma ? (
                    <section className="lsim-module lsim-pharma">
                      <h2>Regulatory Overview</h2>
                      <p style={{ margin: 0 }}>Track the records entered in PharmaBridge.</p>
                      <div className="lsim-pharma-cards">
                        {([
                          ["Drug profiles", 6],
                          ["Registration records", 4],
                          ["Permit tracking records", 3],
                          ["Shipments in transit", 1],
                        ] as [string, number][]).map(([label, n]) => (
                          <div key={label}>
                            {label}
                            <strong>{n}</strong>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 13 }}>
                        Registration status is entered by staff and does not independently confirm an
                        authority decision.
                      </p>
                      <p className="lsim-note">
                        Fictional numbers. PharmaBridge workflows are practised in Lesson 12.
                      </p>
                    </section>
                  ) : (
                    <>
                      <h1 className="lsim-heading">{active}</h1>
                      <div className="lsim-module">
                        <p style={{ marginTop: 0 }}>
                          {descriptions[active] ?? "Luna does not show a description for this section."}
                        </p>
                        <p className="lsim-note">
                          Training preview. This lesson teaches where things are. You’ll use this section’s
                          workflow with fictional records in {coveredIn[active] ?? "a later lesson"}.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
