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

type Role = "director" | "bookkeeper" | "assistant_bookkeeper" | "salesman";

const roleLabels: Record<Role, string> = {
  director: "Director",
  bookkeeper: "Bookkeeper",
  assistant_bookkeeper: "Assistant Bookkeeper",
  salesman: "Salesman",
};

// Same order as Luna's main navigation.
const sections = [
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
const descriptions: Record<string, string> = {
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

// Which Director lesson teaches each section's workflow in depth.
const coveredIn: Record<string, string> = {
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

function canOpenSection(role: Role, section: string) {
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

const styles = `
.lsim { border:1px solid #cbd5e1; border-radius:16px; overflow:hidden; background:#f8fafc; color:#0f172a; margin:16px 0; font-size:15px; }
.lsim-top { background:#0f172a; color:#fff; padding:10px 16px; font-size:13px; letter-spacing:.04em; }
.lsim-grid { display:grid; grid-template-columns:minmax(0,1fr) 340px; }
@media (max-width:980px){ .lsim-grid{ grid-template-columns:1fr; } }
.lsim-stage { min-height:560px; background:#fff; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; }
.lsim-coach { padding:18px; display:flex; flex-direction:column; gap:12px; }
.lsim-coach h4 { margin:0; font-size:1rem; }
.lsim-prompt { background:#ecfeff; border:1px solid #a5f3fc; border-radius:10px; padding:12px; }
.lsim-feedback { border-radius:10px; padding:12px; }
.lsim-feedback.good { background:#f0fdf4; border:1px solid #86efac; }
.lsim-feedback.bad { background:#fff7ed; border:1px solid #fdba74; }
.lsim-feedback p { margin:0 0 8px; } .lsim-feedback p:last-child { margin:0; }
.lsim-btn { border:1px solid #0f766e; background:#0f766e; color:#fff; border-radius:8px; padding:9px 14px; cursor:pointer; font:inherit; }
.lsim-btn.secondary { background:#fff; color:#0f172a; border-color:#cbd5e1; }
.lsim-btn:disabled { opacity:.5; cursor:not-allowed; }
.lsim-choice { display:block; width:100%; text-align:left; margin:6px 0; }
.lsim-progress { height:8px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
.lsim-progress span { display:block; height:100%; background:#0f766e; }
.lsim-login { flex:1; display:flex; align-items:center; justify-content:center; padding:32px; background:#eef4fb; }
.lsim-card { background:#fff; border:1px solid #d6e2ef; border-radius:14px; padding:28px; width:100%; max-width:380px; text-align:center; }
.lsim-mark { display:inline-flex; width:44px; height:44px; border-radius:12px; background:#12345a; color:#fff; align-items:center; justify-content:center; font-weight:700; }
.lsim-card form { display:flex; flex-direction:column; gap:6px; text-align:left; margin-top:12px; }
.lsim-card input { padding:9px; border:1px solid #cbd5e1; border-radius:8px; font:inherit; }
.lsim-alert { color:#9a3412; background:#fff7ed; border:1px solid #fdba74; padding:8px; border-radius:8px; margin:4px 0; }
.lsim-accounts { font-size:13px; text-align:left; background:#f1f5f9; border-radius:8px; padding:10px; margin-top:14px; }
.lsim-accounts button { margin-top:4px; font-size:12px; padding:4px 8px; }
.lsim-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; background:#f1f5f9; border-bottom:1px solid #e2e8f0; font-size:14px; }
.lsim-shell { flex:1; display:flex; min-height:0; }
.lsim-side { width:210px; flex-shrink:0; background:#12345a; color:#fff; display:flex; flex-direction:column; }
.lsim-brand { padding:12px 14px; font-weight:700; border-bottom:1px solid #ffffff22; }
.lsim-brand small { display:block; font-weight:400; opacity:.75; }
.lsim-nav { overflow-y:auto; max-height:470px; padding:6px; }
.lsim-nav button { display:block; width:100%; text-align:left; background:transparent; border:0; color:#e2e8f0; padding:6px 10px; border-radius:6px; cursor:pointer; font:inherit; font-size:13px; }
.lsim-nav button:hover { background:#ffffff1a; }
.lsim-nav button.active { background:#ffffff; color:#12345a; font-weight:600; }
.lsim-nav button.pharma { color:#86efac; }
.lsim-main { flex:1; display:flex; flex-direction:column; min-width:0; }
.lsim-topbar { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:14px; }
.lsim-content { padding:18px; overflow:auto; }
.lsim-content h2 { margin:0 0 8px; font-size:1.3rem; }
.lsim-quick { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.lsim-quick button { font-size:13px; padding:6px 10px; }
.lsim-ask { display:flex; gap:6px; margin-top:8px; }
.lsim-ask input { flex:1; padding:9px; border:1px solid #cbd5e1; border-radius:8px; font:inherit; }
.lsim-note { font-size:13px; color:#475569; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:10px; margin-top:12px; }
.lsim-pharma { background:#f7fcf8; }
.lsim-pharma-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin:10px 0; }
.lsim-pharma-cards div { border:1px solid #dcece2; border-radius:10px; padding:10px; background:#fff; font-size:13px; }
.lsim-pharma-cards strong { display:block; font-size:1.3rem; color:#08673c; }
.lsim-roles { display:flex; flex-wrap:wrap; gap:6px; }
.lsim-roles button { font-size:12px; padding:5px 9px; }
.lsim-rolelist { font-size:12px; columns:2; margin:8px 0 0; padding-left:18px; }
@media (max-width:640px){ .lsim-shell{ flex-direction:column; } .lsim-side{ width:auto; } .lsim-nav{ max-height:180px; } .lsim-stage{ min-height:0; } }
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
      <style>{styles}</style>
      <div className="lsim-top">
        TRAINING SIMULATOR · Fictional accounts and records · Not connected to production Luna
      </div>

      <div className="lsim-grid">
        {/* ---------- Simulated Luna ---------- */}
        <div className="lsim-stage">
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
                <button type="button" className="lsim-btn secondary" onClick={signOut}>
                  Sign out
                </button>
              </div>

              <div className="lsim-shell">
                {!inPharma && (
                  <aside className="lsim-side">
                    <div className="lsim-brand">
                      ☾ Luna<small>Accounting</small>
                    </div>
                    <nav className="lsim-nav" aria-label="Simulated main navigation">
                      {visibleSections.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`${active === s ? "active" : ""} ${s === "PharmaBridge" ? "pharma" : ""}`}
                          aria-current={active === s ? "page" : undefined}
                          onClick={() => navigate(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </nav>
                  </aside>
                )}

                <div className={`lsim-main ${inPharma ? "lsim-pharma" : ""}`}>
                  <div className="lsim-topbar">
                    <span>
                      {inPharma && (
                        <button
                          type="button"
                          className="lsim-btn secondary"
                          style={{ marginRight: 10 }}
                          onClick={backToLuna}
                        >
                          ← Back to Luna
                        </button>
                      )}
                      Elevate Medical Solutions
                    </span>
                    <span style={{ color: "#64748b" }}>Help</span>
                  </div>

                  <div className="lsim-content">
                    {active === "Home" ? (
                      <>
                        <p style={{ margin: 0, color: "#475569" }}>Good day, {user?.name}</p>
                        <h2>I’m Luna, your AI Accounting Assistant</h2>
                        <p style={{ margin: 0 }}>How can I help you today?</p>
                        <div className="lsim-ask">
                          <input
                            aria-label="Ask Luna"
                            disabled
                            placeholder="Ask Luna a question or give me an instruction…"
                          />
                          <button className="lsim-btn" disabled aria-label="Send to Luna">➤</button>
                        </div>
                        <div className="lsim-quick" aria-label="Quick links">
                          {[
                            ["Reconcile bank account", "Banking"],
                            ["Create an invoice", "Invoices & Bills"],
                            ["Generate a monthly report", "Financial Reports"],
                            ["Find a document", "Document Center"],
                            ["Set a reminder", "Email & Reminders"],
                          ].map(([label, target]) => (
                            <button
                              key={label}
                              type="button"
                              className="lsim-btn secondary"
                              onClick={() => navigate(target)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="lsim-note">
                          The quick links are shortcuts into sections. “Set a reminder” appears only for
                          the Director. Luna AI replies are not simulated in this lesson; you’ll practise
                          them in Lesson 11.
                        </p>
                      </>
                    ) : inPharma ? (
                      <>
                        <h2>Regulatory Overview</h2>
                        <p style={{ margin: 0 }}>Track the records entered in PharmaBridge.</p>
                        <div className="lsim-pharma-cards">
                          {[
                            ["Drug profiles", 6],
                            ["Registration records", 4],
                            ["Permit tracking records", 3],
                            ["Shipments in transit", 1],
                          ].map(([label, n]) => (
                            <div key={label as string}>
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
                      </>
                    ) : (
                      <>
                        <h2>{active}</h2>
                        <p>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
                        <p className="lsim-note">
                          Training preview. This lesson teaches where things are. You’ll use this section’s
                          workflow with fictional records in {coveredIn[active] ?? "a later lesson"}.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---------- Coach panel ---------- */}
        <div className="lsim-coach">
          <div>
            <h4>Lesson 1 · Getting started with Luna</h4>
            <p style={{ margin: "4px 0 8px", fontSize: 13, color: "#475569" }}>
              Task {Math.min(step + 1, missions.length)} of {missions.length}
            </p>
            <div className="lsim-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {finished ? (
            <div className="lsim-feedback good">
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
                              .filter((s) => canOpenSection(previewRole, s))
                              .map((s) => (
                                <li key={s}>{s}</li>
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

          {feedback && (
            <div className={`lsim-feedback ${feedback.tone}`} role="status">
              {feedback.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {advanceReady && !finished && (
              <button type="button" className="lsim-btn" onClick={nextMission}>
                {step === missions.length - 1 ? "Finish lesson" : "Next task →"}
              </button>
            )}
            <button type="button" className="lsim-btn secondary" onClick={restart}>
              Restart lesson
            </button>
          </div>

          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Screen labels, messages and role rules match the current Luna code. Records and
            accounts are fictional, and nothing here changes production Luna.
          </p>
        </div>
      </div>
    </div>
  );
}
