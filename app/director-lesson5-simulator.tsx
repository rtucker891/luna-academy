"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAcademyAuth } from "./academy-auth";
import {
  WhyNotWorking,
  revealChoice,
  Icon,
  canOpenSection,
  coveredIn,
  descriptions,
  homeCards,
  navigationIcons,
  sections,
  simulatorStyles,
} from "./director-workspace-simulator";
import { formStyles } from "./director-lesson2-simulator";

/*
  Luna Academy — Lesson 5 simulator: "Exchange rates and inventory costing"

  Training only. This component never connects to production Luna.
  Labels, statuses, validation messages and confirmations are copied from
  the Luna_Accounting source (app/purchase-orders.tsx Cost Analysis,
  app/po-exchange-rate.tsx, app/complete-costing.tsx,
  app/inventory-reports.tsx, accounting/po-acquisition.ts,
  docs/currency-policy.md, docs/complete-costing.md). Records, exchange rates
  and account names are fictional and live only in this browser tab.
*/

const LESSON_TITLE = "Exchange rates and inventory costing";

/* ---------- Fictional records ---------- */

type Order = {
  id: string;
  po_number: number;
  vendor: string;
  customer: string;
  created: string;
  sku: string;
  name: string;
  quantity: number;
  contents: number;
  price_cents: number;
  status: "draft" | "approved" | "received";
};
type Cost = { id: number; type: string; description: string; stage: "actual" | "estimated"; amount_cents: number; date: string };

const orders: Order[] = [
  { id: "o42", po_number: 42, vendor: "Northstar Medical Supply", customer: "Harbour View Pharmacy", created: "11/1/2026", sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", quantity: 30, contents: 100, price_cents: 850, status: "received" },
  { id: "o41", po_number: 41, vendor: "Jade River Surgical Co.", customer: "St. Jude Community Hospital", created: "10/30/2026", sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", quantity: 50, contents: 100, price_cents: 425, status: "draft" },
  { id: "o40", po_number: 40, vendor: "Atlantic Clinical Supply", customer: "Bright Smile Dental Clinic", created: "10/22/2026", sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", quantity: 12, contents: 100, price_cents: 1150, status: "approved" },
];

const PRACTICE_RATE = "209.00"; // fictional Bank of Guyana USD selling rate
const RATE_HUNDREDTHS = 20900; // 209.00

const costTypes: [string, string][] = [
  ["shipping", "Additional shipping / freight"],
  ["transportation", "Transportation"],
  ["delivery", "Delivery"],
  ["customs_duty", "Customs / import duty"],
  ["insurance", "Cargo insurance"],
  ["handling", "Handling"],
  ["brokerage", "Brokerage"],
  ["nonrecoverable_tax", "Nonrecoverable tax"],
  ["sea_freight", "Sea freight"],
  ["air_freight", "Air freight"],
];

// Fictional cash and bank accounts for the practice company.
const cashAccounts = [
  { code: "1000", name: "Cash" },
  { code: "1010", name: "USD Bank Account" },
];

/* ---------- Rules copied from Luna ---------- */

const poNumber = (n: number) => `PO-${String(n).padStart(5, "0")}`;
const orderTotal = (o: Order) => o.price_cents * o.quantity;
const statusText = (o: Order) => (o.status === "received" ? "Active · Received" : o.status === "approved" ? "Active" : "Draft");

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// accounting/po-acquisition.ts acquisitionMoney: "GYD 61655.00"
const acquisitionMoney = (cents: number, currency: string) => `${currency} ${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

// accounting/po-acquisition.ts acquisitionPerItem: rounded to four decimal places
function acquisitionPerItem(cents: number, units: number) {
  const scaled = Math.floor((cents * 100 + Math.floor(units / 2)) / units);
  return `GYD ${Math.trunc(scaled / 10000)}.${String(scaled % 10000).padStart(4, "0")}`;
}

const gydGrouped = (cents: number) => `GYD ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// accounting/journal.ts moneyToCents
function moneyToCents(value: string) {
  const normalized = value.trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(normalized)) throw new Error("Enter a nonnegative amount with at most two decimal places.");
  const [whole, fraction = ""] = normalized.replace(/,/g, "").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isError = (text: string) => !/saved\.|Costing completed|Cost saved/.test(text);

/* ---------- Inventory valuation (Products & Inventory → Inventory Cost (GYD)) ---------- */

type ValuationRow = { sku: string; name: string; unit: string; quantity: number; reorder: number; value_cents: number | null; reason: string };

function valuationRows(gloveValueCents: number): ValuationRow[] {
  return [
    { sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", quantity: 72, reorder: 20, value_cents: null, reason: "Lot TR-LOT-0245 has no verified GYD cost" },
    { sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit: "Box", quantity: 64, reorder: 25, value_cents: 5888000, reason: "" },
    { sku: "LG-AMOX-500", name: "Amoxicillin 500 mg capsules", unit: "Case", quantity: 4, reorder: 5, value_cents: 7640000, reason: "" },
    { sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", unit: "Box", quantity: 30, reorder: 20, value_cents: gloveValueCents, reason: "" },
  ];
}

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "view-order"; order: Order }
  | { type: "open-cost-analysis"; order: Order }
  | { type: "rate-saved" }
  | { type: "cost-saved"; cost: Cost }
  | { type: "costing-complete"; mode: string; account: string }
  | { type: "tab"; tab: string }
  | { type: "report" };

type Mission =
  | { kind: "do"; prompt: string; details?: string[]; check: (e: Event) => string | null | undefined; learn: string[] }
  | { kind: "choice"; prompt: string; options: { text: string; correct: boolean; why: string }[]; learn: string[] };

const missions: Mission[] = [
  {
    kind: "choice",
    prompt: "Northstar's invoice and your payment to Northstar were both in US dollars. In which currency does Luna keep the General Ledger, inventory values and acquisition costs?",
    options: [
      { text: "US dollars (USD), the same as the supplier's invoice", correct: false, why: "Not quite. USD is used only on the supplier side: vendor prices, purchase orders, vendor invoices and supplier payments." },
      { text: "Guyana dollars (GYD)", correct: true, why: "Correct. Luna's currency policy: the accounting ledger, inventory costs, acquisition costs, financial statements and reports are in GYD." },
      { text: "Whatever currency the person entering it prefers", correct: false, why: "Not quite. The currency is fixed by Luna's policy, not chosen per entry." },
    ],
    learn: [
      "Luna keeps the original USD supplier records for traceability, and converts them to GYD using verified exchange-rate evidence.",
      "Missing GYD costs are never counted as zero. They stay unknown and are shown for review.",
    ],
  },
  {
    kind: "do",
    prompt: "PO-00042 is fully received, billed and paid. A freight forwarder has also charged you for flying the gloves in. Open the section where you'll find the order's Cost Analysis.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Purchase Orders" ? null : `You opened ${e.section}. Cost Analysis is part of each purchase order.`),
    learn: ["Cost Analysis is opened from a purchase order in Purchase Orders. It shows what the stock actually cost you in GYD, including freight and other related charges."],
  },
  {
    kind: "do",
    prompt: "Open PO-00042 with “View order”.",
    check: (e) => {
      if (e.type !== "view-order") return undefined;
      if (e.order.id === "o42") return null;
      return e.order.status === "received"
        ? "Open PO-00042, Northstar's gloves order."
        : `${poNumber(e.order.po_number)} shows “${statusText(e.order)}”. It isn't fully received, so it can't be costed yet. Open PO-00042.`;
    },
    learn: ["PO-00042 shows “Active · Received”. Every box has arrived, which is what unlocks Cost Analysis."],
  },
  {
    kind: "do",
    prompt: "Open the order's Cost Analysis.",
    check: (e) => (e.type !== "open-cost-analysis" ? undefined : null),
    learn: [
      "Luna's normal workflow: approved PO → vendor bill → payment → receiving → Cost Analysis.",
      "The Cost Analysis button stays unavailable until all PO items are received. Its tooltip reads “Receive all PO items before Cost Analysis”.",
    ],
  },
  {
    kind: "do",
    prompt: "Save the acquisition exchange rate. Luna has already filled in the Bank of Guyana USD selling rate for today.",
    details: ["GYD per USD 1: 209.00 (filled in automatically)", "Rate date: today", "Click “Save acquisition rate”."],
    check: (e) => (e.type !== "rate-saved" ? undefined : null),
    learn: [
      "Luna confirmed: “Acquisition exchange rate saved.”",
      "The rate comes from the Bank of Guyana USD selling rate. Luna records the rate, its publication, the date and who saved it. Saving it doesn't post an expense or change inventory.",
    ],
  },
  {
    kind: "do",
    prompt: "The freight forwarder billed GYD 8,360.00 for air freight, and you've received their invoice. Add it as a procurement cost, then click “Save cost”.",
    details: [
      "Cost type: Air freight",
      "Description: Air freight Miami to Georgetown",
      "Amount: 8360.00",
      "Cost date: today",
      "Cost status: Actual cost",
    ],
    check: (e) => {
      if (e.type !== "cost-saved") return undefined;
      const c = e.cost;
      if (c.type !== "air_freight") return `Choose “Air freight” as the cost type. You chose “${costTypes.find(([v]) => v === c.type)?.[1]}”.`;
      if (c.amount_cents !== 836000) return `The freight bill was GYD 8,360.00. You entered ${gydGrouped(c.amount_cents)}.`;
      if (c.stage !== "actual") return "This charge has been billed, so it's an Actual cost, not an estimate.";
      return null;
    },
    learn: [
      "Related costs are always entered in GYD. Luna won't let you add one until the acquisition rate is saved.",
      "The cost now appears under “Recorded procurement costs” and is spread across the order's items.",
    ],
  },
  {
    kind: "do",
    prompt: "A customs broker has quoted GYD 3,000.00 for brokerage but hasn't sent a bill. Add it as an estimated cost.",
    details: ["Cost type: Brokerage", "Description: Customs brokerage quote", "Amount: 3000.00", "Cost status: Estimated cost"],
    check: (e) => {
      if (e.type !== "cost-saved") return undefined;
      const c = e.cost;
      if (c.type !== "brokerage") return "Choose “Brokerage” as the cost type.";
      if (c.amount_cents !== 300000) return `The quote was GYD 3,000.00. You entered ${gydGrouped(c.amount_cents)}.`;
      if (c.stage !== "estimated") return "The broker hasn't billed you yet, so choose “Estimated cost” as the cost status.";
      return null;
    },
    learn: ["Estimated costs are listed separately and are not included in actual acquisition costs."],
  },
  {
    kind: "choice",
    prompt: "Look at the totals under “Recorded procurement costs”. What is PO-00042's total acquisition cost?",
    options: [
      { text: "GYD 64655.00", correct: false, why: "Not quite. That includes the GYD 3,000.00 brokerage estimate. Estimated costs are excluded." },
      { text: "GYD 61655.00", correct: true, why: "Correct. GYD 53,295.00 for the gloves ($255.00 × 209.00) plus GYD 8,360.00 actual air freight. The estimate is left out." },
      { text: "GYD 53295.00", correct: false, why: "Not quite. That's only the gloves converted to GYD. The actual air freight is part of what the stock cost." },
    ],
    learn: ["Total acquisition cost = merchandise converted to GYD at the saved rate + actual related costs in GYD."],
  },
  {
    kind: "choice",
    prompt: "In “Acquisition cost by item”, what does one individual glove cost you?",
    options: [
      { text: "GYD 2055.1667", correct: false, why: "Not quite. That's roughly the cost of one box. Luna divides boxes and packs into individual items: 30 boxes × 100 = 3,000 gloves." },
      { text: "GYD 17.7650", correct: false, why: "Not quite. That leaves out the air freight. The freight is part of what each glove cost." },
      { text: "GYD 20.5517", correct: true, why: "Correct. GYD 61,655.00 ÷ 3,000 individual gloves = GYD 20.5517, rounded to four decimal places." },
    ],
    learn: ["This per-item cost is what Luna uses for stock valuation and, when gloves are sold, for Cost of Goods Sold."],
  },
  {
    kind: "do",
    prompt: "You paid the freight forwarder in cash. Complete the costing so Luna records the expense and applies it to inventory.",
    details: [
      "Click “Complete Costing”",
      "Have these acquisition charges been paid?: Yes — paid from cash or bank",
      "Account used to pay: 1000 — Cash",
      "Expense date: today",
      "Tick the review confirmation, then click “Confirm & Record Costs”",
    ],
    check: (e) => {
      if (e.type !== "costing-complete") return undefined;
      if (e.mode !== "paid") return "The freight was already paid in cash, so choose “Yes — paid from cash or bank”.";
      if (e.account !== "1000") return "The freight was paid in cash, so choose “1000 — Cash” as the account used to pay.";
      return null;
    },
    learn: [
      "Luna confirmed: “Costing completed: the expense is recorded and acquisition costs are applied to accounting.”",
      "One confirmation recorded the expense and applied it to Inventory and Cost of Goods Sold together. No gloves have been sold yet, so all of it went to Inventory.",
    ],
  },
  {
    kind: "choice",
    prompt: "Why didn't Luna include the GYD 3,000.00 brokerage estimate when you completed the costing?",
    options: [
      { text: "Estimated charges are excluded. Only actual charges are recorded and applied", correct: true, why: "Correct. Luna says: “Estimated charges are excluded.” When the broker sends a real bill, enter it as an Actual cost." },
      { text: "Brokerage can never be an acquisition cost", correct: false, why: "Not quite. Brokerage is one of Luna's cost types. It was left out because it was only an estimate." },
      { text: "It was too small to matter", correct: false, why: "Not quite. Amount has nothing to do with it. Luna leaves out every estimate, however large." },
    ],
    learn: ["Applied charges and their exchange rate are protected from editing. A correction needs a separate reviewed reversal."],
  },
  {
    kind: "do",
    prompt: "Now check how your stock is valued. Open the section where products and stock values are kept.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Products & Inventory" ? null : `You opened ${e.section}. Stock values are kept with products.`),
    learn: ["Products & Inventory has three tabs: Product Catalog, Inventory Cost (GYD) and Expiry Alerts."],
  },
  {
    kind: "do",
    prompt: "Open the “Inventory Cost (GYD)” tab and click “Prepare inventory reports”.",
    check: (e) => (e.type === "report" ? null : e.type === "tab" && e.tab !== "cost" ? "That tab doesn't show stock values. Open “Inventory Cost (GYD)”." : undefined),
    learn: [
      "NSM-GLOVE-M is valued at GYD 61,655.00, including the air freight you applied.",
      "Preparing the report is a snapshot. It doesn't change stock or post entries to the General Ledger.",
    ],
  },
  {
    kind: "choice",
    prompt: "ACS-SYR-5ML shows “Needs review” because lot TR-LOT-0245 has no verified GYD cost. What should you do?",
    options: [
      { text: "Treat its value as zero so the report balances", correct: false, why: "Not quite. Luna never counts a missing cost as zero. That would understate your stock." },
      { text: "Enter a recent exchange rate so Luna can calculate a value", correct: false, why: "Not quite. Don't invent or guess a rate. The rate must come from evidence for the original purchase." },
      { text: "Treat the valuation as incomplete, and check the lot's receipt, its vendor bill and the rate evidence", correct: true, why: "Correct. Luna says: “Valuation is incomplete. Products needing review are excluded from the subtotal. Check their stock counts, receipt currencies, saved costs, and ordering units.”" },
    ],
    learn: ["While anything needs review, Luna labels the total “Verified inventory subtotal (GYD)” instead of “Inventory lot value (GYD)”, so nobody mistakes it for the full value."],
  },
  {
    kind: "choice",
    prompt: "In Director Approval → Exchange rates, a Bank of Guyana rate that Luna read with AI is waiting for you. What do you do before approving it?",
    options: [
      { text: "Approve it straight away. Luna already checked it", correct: false, why: "Not quite. AI extraction is labelled for review. It isn't independent verification by the Bank." },
      { text: "Check the dated USD buying and selling rates against the official Bank of Guyana source yourself, then record your reference and approve or reject", correct: true, why: "Correct. Luna asks for an independent source reference and the confirmation “I independently checked the publication date and USD columns against supporting evidence.”" },
      { text: "Change the rate to the one your bank gave you", correct: false, why: "Not quite. A correction is archived as a replacement that needs its own approval. Existing bills and costing are never changed." },
    ],
    learn: ["Only Directors approve AI-extracted or corrected rate publications. Directors and Bookkeepers can save a published rate on a purchase order."],
  },
];

// Where each hands-on task is done. Opening a different section during the task gets a hint.
const missionArea: Record<number, string> = { 2: "Purchase Orders", 3: "Purchase Orders", 4: "Purchase Orders", 5: "Purchase Orders", 6: "Purchase Orders", 9: "Purchase Orders", 12: "Products & Inventory" };

// Step-by-step help shown after the second unsuccessful try on a task (by task number).
const missionHelp: Record<number, string[]> = {
  1: ["Cost Analysis belongs to each purchase order.", "Click “Purchase Orders” in the left sidebar."],
  2: [
    "Scroll to “Recent Purchase Orders”.",
    "Click “View order” on the PO-00042 row (Northstar Medical Supply, Active · Received). PO-00040 is still waiting for its delivery.",
  ],
  3: ["At the top of PO-00042, click the “Cost Analysis” button next to “Print / Save as PDF”.", "If you opened another order, click “Back to Purchase Orders” and open PO-00042."],
  4: [
    "In “Acquisition exchange rate”, the GYD per USD 1 box already shows 209.00 and the Rate date is today.",
    "Click “Save acquisition rate”. If the box is empty, click “Refresh exchange rate” first.",
  ],
  5: [
    "In “Add a procurement cost”, choose Cost type “Air freight”.",
    "Type a description, for example “Air freight Miami to Georgetown”, and 8360.00 as the amount, with no commas or “GYD”.",
    "Leave the cost date as today and Cost status as “Actual cost”, then click “Save cost”.",
    "If you haven't saved the acquisition rate yet, do that first.",
  ],
  6: [
    "In “Add a procurement cost”, choose Cost type “Brokerage”.",
    "Type “Customs brokerage quote” as the description and 3000.00 as the amount.",
    "Change Cost status to “Estimated cost”, then click “Save cost”.",
  ],
  9: [
    "Scroll to “Complete Costing” and click the “Complete Costing” button.",
    "Choose “Yes — paid from cash or bank”, then “1000 — Cash” as the account used to pay.",
    "Leave the expense date as today, tick the box beginning “I reviewed the saved costs”, then click “Confirm & Record Costs”.",
  ],
  11: ["Stock values are in Products & Inventory.", "Click “Products & Inventory” in the left sidebar, near the bottom."],
  12: ["Click the middle tab, “Inventory Cost (GYD)”.", "Then click the blue “Prepare inventory reports” button."],
};

type Feedback = { tone: "good" | "bad"; lines: string[]; help?: string[] } | null;

const lesson5Styles = `
.lsim-form select, .lsim-form input { width:100%; min-width:0; max-width:100%; box-sizing:border-box; }
.lsim-fields > * { min-width:0; }
.lsim-po-status { display:inline-block; font-size:12px; font-weight:600; background:#eef6ff; border:1px solid #cfe3f7; color:#174a7c; border-radius:999px; padding:3px 10px; }
.lsim-po-info { background:#f7fbff; border:1px solid #dceafa; border-radius:10px; padding:10px 12px; font-size:13px; line-height:1.5; margin:8px 0; }
.lsim-card { border:1px solid #dbe5f0; border-radius:10px; padding:12px; margin:10px 0; background:#fff; }
.lsim-card h3 { font-size:15px; margin:0 0 6px; }
.lsim-card p { font-size:13px; margin:4px 0; }
.lsim-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.lsim-check { display:flex !important; gap:10px; align-items:flex-start; font-size:13px; }
.lsim-check input { width:18px !important; height:18px; flex-shrink:0; margin-top:2px; }
.lsim-alert { background:#fff7ed; border:1px solid #fdba74; border-radius:8px; padding:8px 10px; font-size:13px; }
.lsim-total { font-weight:700; font-size:14px; }
`;

export default function DirectorLesson5Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // Purchase Orders
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [costOpen, setCostOpen] = useState(false);
  const [rateLoaded, setRateLoaded] = useState(true);
  const [rateDate, setRateDate] = useState(today());
  const [savedRate, setSavedRate] = useState<string | null>(null);
  const [rateNotice, setRateNotice] = useState("");
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costType, setCostType] = useState("shipping");
  const [costDescription, setCostDescription] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costDate, setCostDate] = useState(today());
  const [costStage, setCostStage] = useState<"actual" | "estimated">("actual");
  const [costNotice, setCostNotice] = useState("");

  // Complete Costing
  const [reviewOpen, setReviewOpen] = useState(false);
  const [mode, setMode] = useState("");
  const [account, setAccount] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [confirmed, setConfirmed] = useState(false);
  const [costed, setCosted] = useState(false);

  // Products & Inventory
  const [tab, setTab] = useState("catalog");
  const [reportReady, setReportReady] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0 });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const o42 = orders[0];
  const purchaseGyd = Math.round((orderTotal(o42) * RATE_HUNDREDTHS) / 100); // 5,329,500 cents
  const actualCosts = costs.filter((c) => c.stage === "actual").reduce((s, c) => s + c.amount_cents, 0);
  const estimatedCosts = costs.filter((c) => c.stage === "estimated").reduce((s, c) => s + c.amount_cents, 0);
  const totalGyd = purchaseGyd + actualCosts;
  const units = o42.quantity * o42.contents;
  const appliedCosts = costed ? actualCosts : 0;

  /* ----- coaching ----- */

  function attempt(event: Event, commit: () => void) {
    if (mission && !advanceReady && mission.kind === "do") {
      const result = mission.check(event);
      if (typeof result === "string") {
        miss([result, "Re-read the task and try again."]);
        return false;
      }
      commit();
      if (result === null) {
        setFeedback({ tone: "good", lines: mission.learn });
        setAdvanceReady(true);
      }
      return true;
    }
    commit();
    return true;
  }

  // Count unsuccessful tries. From the second one on, explain why it isn't working.
  function miss(lines: string[]) {
    if (!mission) return;
    const tries = misses + 1;
    setMisses(tries);
    const help = tries >= 2 ? (mission.kind === "choice" ? revealChoice(mission.options) : missionHelp[step]) : undefined;
    setFeedback({ tone: "bad", lines, help });
  }

  // A form that Luna refused to save also counts as an unsuccessful try.
  function formMiss(message: string) {
    if (!mission || advanceReady || mission.kind !== "do") return;
    miss([`Luna didn't save it: “${message}”`]);
  }

  // Keeps the story in order: actions that belong to a later task wait.
  function notYet(taskIndex: number) {
    if (step >= taskIndex) return false;
    setFeedback({ tone: "bad", lines: ["Not yet. Finish the current task first, then you'll get to this step.", mission ? `Current task: ${mission.prompt}` : ""] });
    return true;
  }

  function choose(option: { correct: boolean; why: string }) {
    if (!mission || advanceReady) return;
    if (option.correct) {
      setFeedback({ tone: "good", lines: [option.why, ...mission.learn] });
      setAdvanceReady(true);
    } else {
      miss([option.why]);
    }
  }

  async function saveCompletion() {
    if (!auth) { setSaveStatus("error"); return; }
    setSaveStatus("saving");
    const problem = await auth.recordCompletion("director", LESSON_TITLE);
    setSaveStatus(problem ? "error" : "saved");
  }

  function nextMission() {
    if (step === missions.length - 1) void saveCompletion();
    setStep((s) => s + 1);
    setFeedback(null);
    setAdvanceReady(false);
    setMisses(0);
  }

  function restart() {
    setStep(0); setFeedback(null); setAdvanceReady(false); setMisses(0); setSaveStatus("idle");
    setActive("Home"); setNotice(""); setSearch(""); setSelectedId(null); setCostOpen(false);
    setRateLoaded(true); setRateDate(today()); setSavedRate(null); setRateNotice("");
    setCosts([]); setCostType("shipping"); setCostDescription(""); setCostAmount(""); setCostDate(today()); setCostStage("actual"); setCostNotice("");
    setReviewOpen(false); setMode(""); setAccount(""); setExpenseDate(today()); setConfirmed(false); setCosted(false);
    setTab("catalog"); setReportReady(false);
  }

  function navigate(section: string) {
    setActive(section);
    setNotice("");
    setSelectedId(null);
    setCostOpen(false);
    toTop();
    const area = missionArea[step];
    if (mission && mission.kind === "do" && !advanceReady && area && section !== area) {
      miss([`You opened ${section}. This task is done in ${area}.`, `Click “${area}” in the left sidebar to go back.`]);
      return;
    }
    if (area && section === area && !advanceReady) setFeedback(null);
    attempt({ type: "navigate", section }, () => {});
  }

  /* ----- Purchase Orders and Cost Analysis ----- */

  function viewOrder(order: Order) {
    attempt({ type: "view-order", order }, () => { setSelectedId(order.id); setNotice(""); toTop(); });
  }

  function openCostAnalysis(order: Order) {
    if (order.status !== "received") return;
    attempt({ type: "open-cost-analysis", order }, () => { setCostOpen(true); setCostNotice(""); toTop(); });
  }

  function saveRate() {
    if (notYet(4)) return;
    if (!rateLoaded) return;
    attempt({ type: "rate-saved" }, () => { setSavedRate(PRACTICE_RATE); setRateNotice("Acquisition exchange rate saved."); });
  }

  function addProcurementCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notYet(5)) return;
    setCostNotice("");
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(costDate) || costDate > today()) throw new Error("Choose a cost date no later than today in Eastern Time.");
      const amountCents = moneyToCents(costAmount);
      if (amountCents < 1) throw new Error("Enter a cost greater than zero.");
      if (!costDescription.trim()) throw new Error("Describe this procurement cost.");
      if (!savedRate) throw new Error("Save the acquisition exchange rate and date first.");
      if (costed && costStage === "actual") throw new Error("Costing is complete for this practice order. Applied charges are protected from editing.");
      const cost: Cost = { id: costs.reduce((m, c) => Math.max(m, c.id), 0) + 1, type: costType, description: costDescription.trim(), stage: costStage, amount_cents: amountCents, date: costDate };
      attempt({ type: "cost-saved", cost }, () => {
        setCosts((prev) => [...prev, cost]);
        setCostDescription(""); setCostAmount(""); setCostStage("actual"); setCostType("shipping");
        setCostNotice("Cost saved.");
        setReviewOpen(false); setConfirmed(false);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the cost.";
      setCostNotice(message);
      formMiss(message);
    }
  }

  function removeCost(cost: Cost) {
    if (costed && cost.stage === "actual") return;
    setCosts((prev) => prev.filter((c) => c.id !== cost.id));
    setReviewOpen(false); setConfirmed(false);
  }

  function openReview() {
    if (notYet(9)) return;
    setReviewOpen(true); setMode(""); setAccount(""); setExpenseDate(today()); setConfirmed(false);
  }

  function completeCosting() {
    if (!confirmed || !mode || !account || !expenseDate) return;
    attempt({ type: "costing-complete", mode, account }, () => {
      setCosted(true); setReviewOpen(false); setConfirmed(false);
      setCostNotice("Costing completed: the expense is recorded and acquisition costs are applied to accounting.");
    });
  }

  /* ----- Products & Inventory ----- */

  function openTab(value: string) {
    setTab(value);
    attempt({ type: "tab", tab: value }, () => {});
  }

  function prepareReport() {
    if (notYet(12)) return;
    attempt({ type: "report" }, () => setReportReady(true));
  }

  /* ----- rendering ----- */

  function renderOrders() {
    if (selected && costOpen) return renderCostAnalysis(selected);
    if (selected) return renderOrder(selected);
    const q = search.trim().toLowerCase();
    const list = orders.filter((o) => [poNumber(o.po_number), o.vendor, o.customer, statusText(o)].some((x) => x.toLowerCase().includes(q)));
    return (
      <section className="lsim-module">
        <div className="lsim-panelhead">
          <h2>Recent Purchase Orders</h2>
          <button type="button" className="lsim-sbtn">Show archived orders</button>
        </div>
        <p>Choose View order to open the complete purchase order by itself.</p>
        <label className="lsim-search">Search orders
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PO number, vendor, customer, or status" />
        </label>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>PO number</th><th>Vendor</th><th>Customer</th><th>Date</th><th>Currency</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{poNumber(o.po_number)}</td><td>{o.vendor}</td><td>{o.customer}</td><td>{o.created}</td><td>USD</td><td>{usd(orderTotal(o))}</td><td>{statusText(o)}</td>
                  <td><button type="button" className="lsim-sbtn" onClick={() => viewOrder(o)}>View order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p>No purchase orders found.</p>}
        </div>
      </section>
    );
  }

  function renderOrder(order: Order) {
    const received = order.status === "received";
    return (
      <section className="lsim-module">
        <div className="lsim-row">
          <button type="button" className="lsim-sbtn" onClick={() => { setSelectedId(null); setNotice(""); }}>Back to Purchase Orders</button>
          <button type="button" className="lsim-pbtn">Print / Save as PDF</button>
          <button type="button" className="lsim-sbtn" disabled={!received} title={!received ? "Receive all PO items before Cost Analysis" : undefined} onClick={() => openCostAnalysis(order)}>Cost Analysis</button>
        </div>
        {order.status !== "draft" && (
          <div className="lsim-row" style={{ marginTop: 8 }}>
            <button type="button" className="lsim-sbtn">Create / Review Vendor Bill</button>
            {!received && <p style={{ fontSize: 13, margin: 0 }}>Normal workflow: approved PO → vendor bill → payment → receiving → Cost Analysis. Receiving is allowed before payment. Cost Analysis becomes available after all PO items are received.</p>}
          </div>
        )}
        {order.status === "draft" && <h2 style={{ color: "#b45309" }}>DRAFT</h2>}
        <p style={{ margin: "10px 0 0" }}><strong>Elevate Medical Solutions</strong></p>
        <div className="lsim-row" style={{ justifyContent: "space-between" }}>
          <div><h2 style={{ margin: "4px 0" }}>{poNumber(order.po_number)}</h2><p style={{ margin: 0, fontSize: 13 }}>{order.vendor} → {order.customer}</p></div>
          <span className="lsim-po-status">{statusText(order)}</span>
        </div>
        <div className="lsim-table-wrap" style={{ marginTop: 8 }}>
          <table className="lsim-table">
            <thead><tr><th>SKU / Code</th><th>Product description</th><th>Ordering unit</th><th>Items per unit</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr></thead>
            <tbody><tr><td>{order.sku}</td><td>{order.name}</td><td>Box</td><td>{order.contents}</td><td>{order.quantity}</td><td>{usd(order.price_cents)}</td><td>{usd(orderTotal(order))}</td></tr></tbody>
          </table>
        </div>
        <p className="lsim-total" style={{ marginTop: 8 }}>Purchase order total: {usd(orderTotal(order))}</p>
      </section>
    );
  }

  function renderCostAnalysis(order: Order) {
    const relatedGyd = actualCosts;
    return (
      <section className="lsim-module">
        <div className="lsim-row">
          <button type="button" className="lsim-sbtn" onClick={() => { setCostOpen(false); setCostNotice(""); }}>Back to Purchase Order</button>
          <button type="button" className="lsim-pbtn">Print / Save Cost Analysis as PDF</button>
          <button type="button" className="lsim-sbtn">Refresh cost analysis</button>
        </div>
        <p style={{ margin: "10px 0 0" }}><strong>Elevate Medical Solutions</strong></p>
        <h2 style={{ margin: "4px 0" }}>{poNumber(order.po_number)} — Cost Analysis</h2>
        <p style={{ fontSize: 13, margin: "2px 0" }}>Vendor: {order.vendor} · PO currency: USD</p>
        <p style={{ fontSize: 13, margin: "2px 0" }}>Customer: {order.customer}</p>
        <p style={{ fontSize: 13, margin: "2px 0" }}>PO created: {order.created}</p>

        <div className="lsim-card">
          <h3>Acquisition exchange rate</h3>
          <div className="lsim-form">
            <div className="lsim-fields">
              <label>GYD per USD 1<input inputMode="decimal" readOnly value={rateLoaded ? PRACTICE_RATE : ""} placeholder="Published selling rate" /></label>
              <label>Rate date<input type="date" value={rateDate} max={today()} onChange={(e) => { setRateDate(e.target.value); setRateLoaded(!!e.target.value && e.target.value <= today()); setRateNotice(""); }} /></label>
            </div>
          </div>
          {rateLoaded && <p>Bank of Guyana · USD selling rate · Published {rateDate}. (Practice rate. Real Luna links to the official source.)</p>}
          {savedRate && <p>Saved rate date: {rateDate}. Bank of Guyana — USD selling rate.</p>}
          <div className="lsim-row" style={{ marginTop: 6 }}>
            <button type="button" className="lsim-sbtn" onClick={() => { setRateLoaded(!!rateDate && rateDate <= today()); setRateNotice(""); }}>Refresh exchange rate</button>
            <button type="button" className="lsim-pbtn" disabled={!rateLoaded} onClick={saveRate}>Save acquisition rate</button>
          </div>
          {rateNotice && <p role="status" className="lsim-status">{rateNotice}</p>}
          <p>The published selling rate fills this field automatically. Existing saved rates stay unchanged until you refresh and save. Rates used in completed costing remain protected.</p>
        </div>

        <div className="lsim-card">
          <h3>Add a procurement cost</h3>
          <form className="lsim-form" onSubmit={addProcurementCost} noValidate>
            <div className="lsim-fields">
              <label>Cost type
                <select value={costType} onChange={(e) => setCostType(e.target.value)}>
                  {costTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Description<input maxLength={500} value={costDescription} placeholder="For example, overseas freight" onChange={(e) => setCostDescription(e.target.value)} /></label>
              <label>Amount<input inputMode="decimal" value={costAmount} placeholder="0.00" onChange={(e) => setCostAmount(e.target.value)} /></label>
              <label>Cost date (Eastern Time)<input type="date" value={costDate} max={today()} onChange={(e) => setCostDate(e.target.value)} /></label>
              <label>Cost currency<input readOnly value="GYD" /></label>
              <label>Cost status
                <select value={costStage} onChange={(e) => setCostStage(e.target.value as "actual" | "estimated")}>
                  <option value="actual">Actual cost</option>
                  <option value="estimated">Estimated cost</option>
                </select>
              </label>
            </div>
            <p className="lsim-foot">Related costs are recorded in GYD. The saved acquisition rate is used for the compatibility USD equivalent; acquisition calculations use the original GYD amount. PO tax is not included automatically; enter it as a nonrecoverable tax only when it cannot be claimed back.</p>
            <button className="lsim-pbtn">Save cost</button>
          </form>
          {costNotice && <p role="status" className={`lsim-status ${isError(costNotice) ? "error" : ""}`}>{costNotice}</p>}
        </div>

        {renderCompleteCosting()}

        <div className="lsim-po-info">
          <strong>Acquisition cost per individual item in GYD</strong><br />
          USD purchases after discounts and posted supplier credits are converted using the saved GYD-per-USD rate. Boxes and packs are divided into individual items. Estimated costs are excluded.
        </div>

        <div className="lsim-card">
          <h3>Recorded procurement costs (USD)</h3>
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Type</th><th>Description</th><th>Status</th><th>Entered amount</th><th>Cost date</th><th>Action</th></tr></thead>
              <tbody>
                {costs.map((c) => (
                  <tr key={c.id}>
                    <td>{costTypes.find(([v]) => v === c.type)?.[1]}</td><td>{c.description}</td><td>{c.stage === "actual" ? "Actual" : "Estimated"}</td>
                    <td>{acquisitionMoney(c.amount_cents, "GYD")}</td><td>{c.date}</td>
                    <td><button type="button" className="lsim-sbtn" disabled={costed && c.stage === "actual"} onClick={() => removeCost(c)}>Remove</button></td>
                  </tr>
                ))}
                {!costs.length && <tr><td colSpan={6}>No additional procurement costs recorded.</td></tr>}
              </tbody>
            </table>
          </div>
          <p>Additional actual costs: <strong>{acquisitionMoney(actualCosts, "GYD")}</strong></p>
          <p>Estimated costs (not included in actual acquisition costs): <strong>{acquisitionMoney(estimatedCosts, "GYD")}</strong></p>
          <p>Merchandise after discounts and supplier credits, converted to GYD: <strong>{savedRate ? acquisitionMoney(purchaseGyd, "GYD") : "Save the acquisition rate"}</strong></p>
          <p className="lsim-total">Total acquisition cost: {savedRate ? acquisitionMoney(totalGyd, "GYD") : "Save the acquisition rate"}</p>
        </div>

        <div className="lsim-card">
          <h3>Acquisition cost by item</h3>
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Item</th><th>Ordered</th><th>Individual items</th><th>Purchase after discount (USD)</th><th>Converted purchase (GYD)</th><th>Allocated related costs (GYD)</th><th>Total acquisition cost (GYD)</th><th>Acquisition cost per individual item (GYD)</th></tr></thead>
              <tbody>
                <tr>
                  <td>{order.sku} — {order.name}</td><td>{order.quantity} Box ({order.contents} items per unit)</td><td>{units}</td>
                  <td>{acquisitionMoney(orderTotal(order), "USD")}</td>
                  <td>{savedRate ? acquisitionMoney(purchaseGyd, "GYD") : "—"}</td>
                  <td>{acquisitionMoney(relatedGyd, "GYD")}</td>
                  <td>{savedRate ? acquisitionMoney(totalGyd, "GYD") : "—"}</td>
                  <td>{savedRate ? acquisitionPerItem(totalGyd, units) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="lsim-foot">Per-item averages are rounded to four decimal places. Calculating or printing this analysis does not post accounting entries. Use Complete Costing to record and apply the actual acquisition costs.</p>
        </div>
      </section>
    );
  }

  function renderCompleteCosting() {
    const actual = costs.filter((c) => c.stage === "actual");
    const ready = !!mode && !!account && !!expenseDate;
    return (
      <div className="lsim-card">
        <h3>Complete Costing</h3>
        <p>Save the actual charges and exchange rate above. Review once, then let Luna record the expense and apply it to Inventory and Cost of Goods Sold together.</p>
        {costed ? (
          <div role="status">
            <p><strong>Costing completed</strong></p>
            <p>The expense is recorded and the costs have been applied to Inventory and Cost of Goods Sold. The PO item status will show Costed for these applied charges.</p>
            <p>Expense reference: TR-EXP-0042 · Costing reference: TR-COST-0042 (practice references)</p>
          </div>
        ) : !reviewOpen ? (
          <button type="button" className="lsim-pbtn" onClick={openReview}>Complete Costing</button>
        ) : (
          <>
            <button type="button" className="lsim-sbtn" onClick={openReview}>Refresh Costing Review</button>
            <p style={{ fontWeight: 600, marginTop: 8 }}>{poNumber(o42.po_number)} — {o42.vendor}</p>
            {!savedRate || !actual.length ? (
              <p className="lsim-alert" role="alert">{!savedRate ? "Save the acquisition exchange rate and date first." : "No unapplied actual acquisition costs remain. Add the actual charges first."}</p>
            ) : (
              <>
                <div className="lsim-table-wrap">
                  <table className="lsim-table">
                    <thead><tr><th>Cost</th><th>Description</th><th>Date</th><th>Amount (GYD)</th></tr></thead>
                    <tbody>{actual.map((c) => <tr key={c.id}><td>{c.type.replaceAll("_", " ")}</td><td>{c.description}</td><td>{c.date}</td><td>{acquisitionMoney(c.amount_cents, "GYD")}</td></tr>)}</tbody>
                  </table>
                </div>
                <p><strong>Actual acquisition costs: {acquisitionMoney(actualCosts, "GYD")}</strong>. Exchange rate: GYD {PRACTICE_RATE} per USD 1.</p>
                <p>Inventory: <strong>{gydGrouped(actualCosts)}</strong> · Cost of Goods Sold: <strong>{gydGrouped(0)}</strong>. Allocation date: {today()}.</p>
                <div className="lsim-form" style={{ display: "grid", gap: 10 }}>
                  <label>Have these acquisition charges been paid?
                    <select value={mode} onChange={(e) => { setMode(e.target.value); setAccount(e.target.value === "unpaid" ? "2000" : ""); setConfirmed(false); }}>
                      <option value="">Choose how to record these charges</option>
                      <option value="paid">Yes — paid from cash or bank</option>
                      <option value="unpaid">No — record the amount payable</option>
                      <option value="existing">Already recorded in General Ledger</option>
                    </select>
                  </label>
                  {mode === "paid" && (
                    <label>Account used to pay
                      <select value={account} onChange={(e) => { setAccount(e.target.value); setConfirmed(false); }}>
                        <option value="">Choose the cash or bank account</option>
                        {cashAccounts.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                      </select>
                    </label>
                  )}
                  {mode === "existing" && (
                    <label>Existing entry for these exact charges
                      <select value={account} onChange={(e) => { setAccount(e.target.value); setConfirmed(false); }}>
                        <option value="">Choose the previously recorded expense</option>
                      </select>
                    </label>
                  )}
                  <label>Expense date<input type="date" value={expenseDate} max={today()} onChange={(e) => { setExpenseDate(e.target.value); setConfirmed(false); }} /></label>
                  {mode === "unpaid" && <p>Luna will record an Accounts Payable balance for these charges. This does not create a separate vendor bill or transfer money.</p>}
                  <label className="lsim-check"><input type="checkbox" checked={confirmed} disabled={!ready} onChange={(e) => setConfirmed(e.target.checked)} /> I reviewed the saved costs, payment details and allocation, and confirm these costs have not already been applied elsewhere.</label>
                </div>
                <button type="button" className="lsim-pbtn" style={{ marginTop: 10 }} disabled={!ready || !confirmed} onClick={completeCosting}>Confirm &amp; Record Costs</button>
                <p>One confirmation records or reuses the expense, applies its allocation, and updates the PO costing status. If either step fails, neither step is saved. Estimated charges are excluded.</p>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  function renderProducts() {
    const tabs: [string, string][] = [["catalog", "Product Catalog"], ["cost", "Inventory Cost (GYD)"], ["expiry", "Expiry Alerts"]];
    const rows = valuationRows(purchaseGyd + appliedCosts);
    const verified = rows.filter((r) => r.value_cents !== null);
    const subtotal = verified.reduce((s, r) => s + (r.value_cents ?? 0), 0);
    const review = rows.length - verified.length;
    return (
      <>
        <section className="lsim-module">
          <div className="lsim-row">
            {tabs.map(([value, label]) => <button key={value} type="button" className={tab === value ? "lsim-pbtn" : "lsim-sbtn"} aria-pressed={tab === value} onClick={() => openTab(value)}>{label}</button>)}
          </div>
        </section>
        {tab !== "cost" ? (
          <section className="lsim-module"><p className="lsim-note" style={{ margin: 0 }}>{tab === "catalog" ? "You practised the Product Catalog in Lesson 2." : "Expiry alerts are covered in a later lesson."} This task uses “Inventory Cost (GYD)”.</p></section>
        ) : (
          <section className="lsim-module">
            <h2>Inventory Valuation &amp; Low Stock</h2>
            <p>Current stock valued using saved receipt lot costs. Low stock includes active products at or below their reorder level.</p>
            <p className="lsim-foot">This is a current snapshot. Preparing it does not change stock or post entries to the General Ledger.</p>
            <div className="lsim-row">
              <button type="button" className="lsim-pbtn" onClick={prepareReport}>Prepare inventory reports</button>
              <button type="button" className="lsim-sbtn">Verify GYD stock and costing</button>
            </div>
            {reportReady && (
              <>
                <p><strong>Prepared:</strong> {new Date().toLocaleString()}</p>
                <p><strong>{review ? "Verified inventory subtotal (GYD): " : "Inventory lot value (GYD): "}</strong>{gydGrouped(subtotal)}</p>
                <p>Products: {rows.length} · Low stock: {rows.filter((r) => r.quantity <= r.reorder).length} · Needs review: {review}</p>
                {review > 0 && <p className="lsim-alert" role="alert">Valuation is incomplete. Products needing review are excluded from the subtotal. Check their stock counts, receipt currencies, saved costs, and ordering units.</p>}
                <p className="lsim-foot">Lot value includes acquisition costs that have been applied to stock. Unapplied charges remain outside inventory. Reconcile the valuation with the General Ledger inventory balance.</p>
                <h3 style={{ fontSize: 15 }}>Inventory valuation</h3>
                <div className="lsim-table-wrap">
                  <table className="lsim-table">
                    <thead><tr><th>SKU</th><th>Product</th><th>Unit</th><th>On hand</th><th>In lots</th><th>Reorder level</th><th>Lot value · GYD</th><th>Review</th></tr></thead>
                    <tbody>{rows.map((r) => (
                      <tr key={r.sku}><td>{r.sku}</td><td>{r.name}</td><td>{r.unit}</td><td>{r.quantity}</td><td>{r.quantity}</td><td>{r.reorder}</td><td>{r.value_cents !== null ? gydGrouped(r.value_cents) : "Needs review"}</td><td>{r.reason || "Checked"}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                {!costed && <p className="lsim-foot">NSM-GLOVE-M doesn&apos;t include the air freight yet. Charges count toward stock value only after Complete Costing applies them.</p>}
              </>
            )}
          </section>
        )}
      </>
    );
  }

  function renderContent() {
    if (active === "Home") {
      return (
        <>
          <h3 className="lsim-section-title">Accounting Workspace</h3>
          <div className="lsim-cards">
            {homeCards.map((card) => (
              <button key={card.title} type="button" onClick={() => navigate(card.title)}>
                <span className="lsim-card-icon"><Icon name={card.icon} size={22} /></span>
                <span><strong>{card.title}</strong><span>{card.description}</span></span>
              </button>
            ))}
          </div>
        </>
      );
    }
    if (active === "Purchase Orders") return renderOrders();
    if (active === "Products & Inventory") return renderProducts();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">This lesson works in Purchase Orders and Products &amp; Inventory. {active} is covered in {coveredIn[active] ?? "a later lesson"}.</p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 5">
      <style>{simulatorStyles + formStyles + lesson5Styles}</style>
      <div className="lsim-top">TRAINING SIMULATOR · Fictional costs and exchange rates · Not connected to production Luna</div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>Lesson 5 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}</h4>
          <div className="lsim-coach-actions">
            {advanceReady && !finished && (
              <button type="button" className="lsim-btn" onClick={nextMission}>
                {step === missions.length - 1 ? "Finish lesson" : "Next task →"}
              </button>
            )}
            <button type="button" className="lsim-btn secondary" onClick={restart}>Restart lesson</button>
          </div>
        </div>
        <div className="lsim-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

        {finished ? (
          <div className="lsim-feedback good" style={{ gridColumn: "1 / -1" }}>
            <p><strong>Lesson 5 complete.</strong></p>
            <p>You can now save the Bank of Guyana acquisition rate, add actual and estimated costs in GYD, read the cost per individual item, complete costing, and read an inventory valuation that needs review.</p>
            <p>Next: Lesson 6 covers customer orders, invoices, payments and shipments.</p>
            <p role="status">
              {saveStatus === "saving" && "Saving your completion…"}
              {saveStatus === "saved" && "Your completion has been recorded in your Academy training record."}
              {saveStatus === "error" && (<>Your completion could not be saved.{" "}<button type="button" className="lsim-btn secondary" onClick={() => void saveCompletion()}>Try again</button></>)}
            </p>
          </div>
        ) : mission && (
          <div className="lsim-prompt">
            <strong>Your task</strong>
            <p style={{ margin: "6px 0 0" }}>{mission.prompt}</p>
            {mission.kind === "do" && mission.details && (
              <ul className="lsim-details-list">{mission.details.map((d) => <li key={d}>{d}</li>)}</ul>
            )}
            {mission.kind === "choice" && (
              <div style={{ marginTop: 8 }}>
                {mission.options.map((o) => (
                  <button key={o.text} type="button" className="lsim-btn secondary lsim-choice" disabled={advanceReady} onClick={() => choose(o)}>{o.text}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {!finished && (feedback ? (
          <div className={`lsim-feedback ${feedback.tone}`} role="status">
            {feedback.lines.filter(Boolean).map((line) => <p key={line}>{line}</p>)}
            <WhyNotWorking help={feedback.help} />
          </div>
        ) : (
          <div className="lsim-note" style={{ marginTop: 0 }}>Do the task in the practice workspace below. Feedback will appear here.</div>
        ))}

        <p className="lsim-footnote">Labels, statuses, validation messages and confirmations match the current Luna code. Records, exchange rates, references and account names are fictional and reset when you restart, and nothing here changes production Luna.</p>
      </div>

      <div className="lsim-stage">
        <div className="lsim-bar"><span>Signed in as <strong>Training Director</strong> · Director</span></div>
        <div className="lsim-shell">
          <aside className="lsim-side">
            <div className="lsim-brand">
              <span className="lsim-logo" aria-hidden="true">☾</span>
              <div><strong>Luna</strong><small>Accounting</small></div>
            </div>
            <nav className="lsim-nav" aria-label="Simulated main navigation">
              {visibleSections.map((sec) => (
                <button key={sec} type="button" className={`${active === sec ? "active" : ""} ${sec === "PharmaBridge" ? "pharma" : ""}`}
                  aria-current={active === sec ? "page" : undefined} onClick={() => navigate(sec)}>
                  <span className="lsim-nav-icon"><Icon name={navigationIcons[sec]} size={18} /></span>
                  {sec}
                </button>
              ))}
            </nav>
            <div className="lsim-side-foot"><span />Elevate Medical Solutions</div>
          </aside>
          <div className="lsim-main">
            <div className="lsim-topbar">
              <span className="lsim-company">Elevate Medical Solutions</span>
              <span className="lsim-top-actions">
                <span><Icon name="bell" size={17} />Notifications</span>
                <span><Icon name="help" size={17} />Help</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="lsim-top-logo" src="/ems-logo.png" alt="EMS — Elevate Medical Solutions" />
              </span>
            </div>
            <div className="lsim-content" ref={contentRef}>
              {active !== "Home" && <h1 className="lsim-heading">{active}</h1>}
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
