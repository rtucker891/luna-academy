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
  Luna Academy — Lesson 4 simulator: "Vendor receiving and supplier bills"

  Training only. This component never connects to production Luna.
  Labels, statuses, validation messages and confirmations are copied from
  the Luna_Accounting source (app/invoices-bills.tsx, app/purchase-orders.tsx,
  accounting/po-workflow.ts, accounting/invoice-exchange-rate.ts,
  docs/vendor-bill-before-receiving.md). Records, exchange rates and
  account names are fictional and live only in this browser tab.
*/

const LESSON_TITLE = "Vendor receiving and supplier bills";

/* ---------- Fictional records ---------- */

type Line = { sku: string; name: string; unit: "Box"; contents: number; quantity: number; received: number; price_cents: number };
type Order = {
  id: string;
  po_number: number;
  vendor: string;
  customer: string;
  created: string;
  lines: Line[];
  status: "approved" | "partially_received" | "received";
};
type Payment = { date: string; amount_cents: number; account: string; method: string; reference: string; rate: string };
type Bill = {
  id: string;
  bill_number: number;
  vendor: string;
  order_id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  total_cents: number;
  rate: string;
  status: "draft" | "recorded" | "paid";
  payments: Payment[];
};
type Receipt = { order_id: string; date: string; quantity: number };

const seedOrders: Order[] = [
  {
    id: "o42", po_number: 42, vendor: "Northstar Medical Supply", customer: "Harbour View Pharmacy", created: "11/1/2026",
    lines: [{ sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", unit: "Box", contents: 100, quantity: 30, received: 0, price_cents: 850 }],
    status: "approved",
  },
  {
    id: "o40", po_number: 40, vendor: "Atlantic Clinical Supply", customer: "Bright Smile Dental Clinic", created: "10/22/2026",
    lines: [{ sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", contents: 100, quantity: 12, received: 0, price_cents: 1150 }],
    status: "approved",
  },
];

const seedBills: Bill[] = [
  {
    id: "b17", bill_number: 17, vendor: "Jade River Surgical Co.", order_id: "PO-00038", vendor_invoice_number: "JR-2026-0412",
    invoice_date: "2026-10-12", total_cents: 63750, rate: "209.00", status: "paid",
    payments: [{ date: "2026-10-20", amount_cents: 63750, account: "1010", method: "bank_transfer", reference: "TRF-5490", rate: "209.00" }],
  },
];

// Fictional cash and bank accounts for the practice company.
const paymentAccounts = [
  { code: "1000", name: "Cash" },
  { code: "1010", name: "USD Bank Account" },
];

const PRACTICE_RATE = "209.00"; // fictional Bank of Guyana USD selling rate

/* ---------- Rules copied from Luna ---------- */

const poNumber = (n: number) => `PO-${String(n).padStart(5, "0")}`;
const billNumber = (n: number) => `BILL-${String(n).padStart(5, "0")}`;
const orderTotal = (o: Order) => o.lines.reduce((s, l) => s + l.price_cents * l.quantity, 0);

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

function gyd(cents: number, rate: string) {
  const value = Math.round(cents * Number(rate)) / 100;
  return `GYD ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// app/invoices-bills.tsx amountToCents (used for the invoice total and payments)
function amountToCents(value: string) {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Enter a payment amount with no more than two decimal places.");
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) throw new Error("Payment amount must be greater than zero.");
  return cents;
}

// accounting/invoice-exchange-rate.ts parseInvoiceRate
function parseInvoiceRate(value: string) {
  const match = value.trim().match(/^(\d{1,6})(?:\.(\d{1,6}))?$/);
  if (!match) throw new Error("Enter a positive GYD-per-USD rate with up to 6 decimal places.");
  if (Number(value) <= 0) throw new Error("The exchange rate must be greater than zero.");
}

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function orderStatusText(order: Order) {
  if (order.status === "approved") return "Active";
  if (order.status === "partially_received") return "Active · Partially received";
  return "Active · Received";
}

function billStatusText(bill: Bill) {
  return bill.status === "paid" ? "Paid" : bill.status === "recorded" ? "Recorded" : "Draft";
}

const canReceive = (o: Order) => o.status === "approved" || o.status === "partially_received";
const isError = (text: string) => !/saved and confirmed|filled in|recorded in the accounting|Delivery recorded/.test(text);
const normalizeInvoice = (v: string) => v.trim().toUpperCase().replace(/\s+/g, "");

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "tab"; tab: string }
  | { type: "bill-save"; order: Order; invoice: string; date: string }
  | { type: "bill-record"; bill: Bill }
  | { type: "payment"; bill: Bill; amount_cents: number; account: string; method: string }
  | { type: "receiving-view"; order: Order }
  | { type: "receive"; order: Order; quantity: number };

type Mission =
  | { kind: "do"; prompt: string; details?: string[]; check: (e: Event) => string | null | undefined; learn: string[] }
  | { kind: "choice"; prompt: string; options: { text: string; correct: boolean; why: string }[]; learn: string[] };

const missions: Mission[] = [
  {
    kind: "do",
    prompt: "PO-00042 for Harbour View's gloves is Active. Northstar Medical Supply has emailed its invoice for the order. Open the section where supplier bills are entered.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Invoices & Bills" ? null : `You opened ${e.section}. Supplier bills are kept with invoices.`),
    learn: [
      "Invoices & Bills holds both sides: invoices you send customers and bills your vendors send you.",
      "Luna's normal order for a purchase is: bill, payment, receiving, then Cost Analysis. Receiving never has to wait for the bill or the payment.",
    ],
  },
  {
    kind: "do",
    prompt: "Open the tab used to enter a new supplier bill.",
    check: (e) => (e.type !== "tab" ? undefined : e.tab === "create-vendor" ? null : "That tab doesn't create a supplier bill. Look for the vendor bill tab that starts with “Create”."),
    learn: ["The vendor bill form starts from an approved purchase order, so the vendor and the order total come from what the Director signed."],
  },
  {
    kind: "do",
    prompt: "Create the bill from Northstar's invoice, then click “Save vendor bill for review”.",
    details: [
      "Approved purchase order: PO-00042 — Northstar Medical Supply — $255.00",
      "Vendor invoice number: NSM-INV-7731",
      "Vendor invoice date: today (already filled in)",
      "Vendor invoice total ($): 255.00 (Luna fills this in from the order)",
      "Exchange rate and source: Luna fills these in from the Bank of Guyana publication. Leave them as they are.",
    ],
    check: (e) => {
      if (e.type !== "bill-save") return undefined;
      if (e.order.id !== "o42") return `${poNumber(e.order.po_number)} is ${e.order.vendor}'s order. Northstar's invoice belongs to PO-00042.`;
      if (normalizeInvoice(e.invoice) !== "NSM-INV-7731") return `The invoice number must be copied exactly from Northstar's invoice: NSM-INV-7731. You entered “${e.invoice.trim()}”.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Vendor bill saved and confirmed. Record the bill in accounts, then record the vendor payment. Receiving remains available before payment.”",
      "Luna saved the invoice-date exchange rate with the bill. Rates published later never change it.",
    ],
  },
  {
    kind: "choice",
    prompt: "BILL-00018 now shows the status “Draft” and the match “Matches”. What has Luna done so far?",
    options: [
      { text: "It has paid Northstar $255.00", correct: false, why: "Not quite. Luna never sends money. You record payments that you've actually made, and none has been made yet." },
      { text: "It saved the bill and checked it against PO-00042. It isn't in the accounts yet", correct: true, why: "Correct. The bill page says “This bill is checked and ready to be recorded in the accounts.”" },
      { text: "It added 30 boxes to stock", correct: false, why: "Not quite. Bills never change stock. Stock changes only when you record a delivery in Vendor Receiving." },
    ],
    learn: ["A draft bill is saved and checked, but it hasn't touched the accounts yet. Recording it is a separate, deliberate step."],
  },
  {
    kind: "do",
    prompt: "Open BILL-00018 with “View bill” and click “Record bill in accounts”.",
    check: (e) => (e.type !== "bill-record" ? undefined : e.bill.bill_number === 18 ? null : "That's a different bill. Record BILL-00018, Northstar's bill."),
    learn: [
      "Luna confirmed: “BILL-00018 recorded in the accounting records.”",
      "Behind the scenes Luna posted: debit 1250 Goods Awaiting Supplier Delivery, credit 2000 Accounts Payable. You now owe Northstar $255.00 for goods that haven't arrived yet.",
    ],
  },
  {
    kind: "do",
    prompt: "Your office paid Northstar by bank transfer today. Record that payment on BILL-00018, then click “Save payment”.",
    details: [
      "Payment date: today",
      "Amount paid ($): 255.00",
      "Payment account: 1010 — USD Bank Account",
      "Payment method: Bank transfer",
      "Reference: TRF-5521",
      "Payment-date exchange rate: 209.00",
      "Payment-date rate source: bank rate for payment date",
    ],
    check: (e) => {
      if (e.type !== "payment") return undefined;
      if (e.amount_cents !== 25500) return `The transfer was for $255.00. You entered ${money(e.amount_cents)}.`;
      if (e.account !== "1010") return "The money left the bank, so choose 1010 — USD Bank Account as the payment account.";
      if (e.method !== "bank_transfer") return "The payment was made by bank transfer. Choose “Bank transfer” as the payment method.";
      return null;
    },
    learn: [
      "Luna confirmed: “Payment saved and confirmed. BILL-00018 is settled in full.”",
      "Luna posted: debit 2000 Accounts Payable, credit 1010 USD Bank Account. Record real payments only. Luna doesn't send money.",
    ],
  },
  {
    kind: "do",
    prompt: "Northstar's truck has arrived at the warehouse. Open the section where deliveries from suppliers are recorded.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Vendor Receiving" ? null : `You opened ${e.section}. Deliveries from suppliers are recorded in their own section.`),
    learn: ["Vendor Receiving lists approved USD orders that still have goods expected. Only the Director can record a delivery here."],
  },
  {
    kind: "do",
    prompt: "Open PO-00042 with “View order”.",
    check: (e) => (e.type !== "receiving-view" ? undefined : e.order.id === "o42" ? null : `${poNumber(e.order.po_number)} is ${e.order.vendor}'s order. This delivery is from Northstar.`),
    learn: ["The order view shows each product's ordering unit, how many were ordered, how many came before, and how many are still expected."],
  },
  {
    kind: "do",
    prompt: "Count the boxes. Only 20 boxes arrived; Northstar says the other 10 are on back-order. Record what arrived, then click “Record items received”.",
    details: ["Arrival date: today (already filled in)", "Received now for NSM-GLOVE-M: 20 (in boxes, the ordering unit)"],
    check: (e) => {
      if (e.type !== "receive") return undefined;
      if (e.order.id !== "o42") return "Record the delivery on PO-00042, Northstar's order.";
      if (e.quantity !== 20) return `Only 20 boxes physically arrived. You entered ${e.quantity}. Record only what you counted.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Delivery recorded. Product stock has been updated.” NSM-GLOVE-M stock went from 0 to 20 boxes.",
      "Because the bill is already recorded, Luna moved the value of those 20 boxes from 1250 Goods Awaiting Supplier Delivery into 1200 Inventory.",
    ],
  },
  {
    kind: "choice",
    prompt: "PO-00042 now shows “Active · Partially received” and is still in the Vendor Receiving list. Why?",
    options: [
      { text: "The bill hasn't been paid", correct: false, why: "Not quite. The bill is already paid in full, and receiving never depends on payment." },
      { text: "10 boxes are still expected, so the order stays open for receiving", correct: true, why: "Correct. The order shows Previously received 20 and Still expected 10. It stays in Vendor Receiving until every box is in." },
      { text: "The Director has to approve it again", correct: false, why: "Not quite. The order is already signed and active. A partial delivery doesn't need a new approval." },
    ],
    learn: ["Each delivery is saved as its own receipt. Partial deliveries are normal. Record each one on the day it arrives."],
  },
  {
    kind: "do",
    prompt: "A week later, the 10 back-ordered boxes arrive. Record them on PO-00042 in Vendor Receiving.",
    details: ["Arrival date: today (already filled in)", "Received now for NSM-GLOVE-M: 10"],
    check: (e) => {
      if (e.type !== "receive") return undefined;
      if (e.order.id !== "o42") return "Record the delivery on PO-00042, Northstar's order.";
      if (e.quantity !== 10) return `The back-order was 10 boxes. You entered ${e.quantity}.`;
      return null;
    },
    learn: [
      "PO-00042 is now “Active · Received” and has left the Vendor Receiving list. NSM-GLOVE-M stock is 30 boxes.",
      "With the whole order received, 1250 Goods Awaiting Supplier Delivery is cleared for this order. Cost Analysis, covered in Lesson 5, comes next.",
    ],
  },
  {
    kind: "choice",
    prompt: "Suppose Northstar's invoice had said $265.00: $255.00 for the gloves plus $10.00 shipping. What would Luna do?",
    options: [
      { text: "Save the bill for $265.00 and add the shipping to the order", correct: false, why: "Not quite. Luna won't save a vendor bill whose total differs from the signed order." },
      { text: "Refuse to save it. The total must match the PO, and shipping is entered separately in GYD in Cost Analysis", correct: true, why: "Correct. Luna says “The vendor invoice total must match the saved PO amount of $255.00. Resolve any difference before saving.” Shipping and freight are entered in GYD in Cost Analysis after receiving." },
      { text: "Save it and pay the extra $10.00 automatically", correct: false, why: "Not quite. Luna never pays anything automatically, and it won't accept a total that differs from the order." },
    ],
    learn: ["The vendor bill form notes that taxes, shipping charges and pharmaceutical bills need additional controls before they can be entered."],
  },
  {
    kind: "choice",
    prompt: "Another order was for 20 boxes. Only 18 arrive, but the supplier's bill lists 20. What do you record in Vendor Receiving?",
    options: [
      { text: "20, so receiving matches the bill", correct: false, why: "Not quite. That would add 2 boxes to stock that aren't on the shelf. Receiving must match what physically arrived." },
      { text: "18, the boxes that actually arrived. Then follow up with the supplier about the 2 missing boxes", correct: true, why: "Correct. Record 18. Luna keeps the other 2 as still expected, so the order stays open while you sort out the difference with the supplier." },
      { text: "Nothing until the supplier sends a corrected bill", correct: false, why: "Not quite. Record deliveries on the day they arrive. Receiving never waits for the bill." },
    ],
    learn: ["Receiving records what is on the shelf. The bill records what the supplier charged. When they disagree, don't change one to match the other. Raise it with the supplier and the Director."],
  },
  {
    kind: "choice",
    prompt: "Who can do which part of this work in Luna?",
    options: [
      { text: "Anyone with a Luna account can do all of it", correct: false, why: "Not quite. Each part is limited to certain roles, and Salesmen don't use the accounting workspace at all." },
      { text: "Bookkeepers can create, record and pay vendor bills. Only the Director records deliveries in Vendor Receiving", correct: true, why: "Correct. Invoices & Bills is open to the Director, Bookkeeper and Assistant Bookkeeper. Vendor Receiving is Director-only." },
      { text: "Only the Director can enter vendor bills", correct: false, why: "Not quite. Bookkeepers and Assistant Bookkeepers can enter, record and pay vendor bills too." },
    ],
    learn: ["Splitting the work this way means the person who records stock arriving isn't the only person handling the supplier's bill."],
  },
];

// Step-by-step help shown after the second unsuccessful try on a task (by task number).
const missionHelp: Record<number, string[]> = {
  0: ["Supplier bills are entered in Invoices & Bills.", "Click “Invoices & Bills” in the left sidebar."],
  1: [
    "The tabs are across the top of Invoices & Bills.",
    "Click “Create Vendor Bill”, the third tab. “Vendor Bills & Payments” is the list of saved bills.",
  ],
  2: [
    "In “Approved purchase order”, choose “PO-00042 — Northstar Medical Supply — $255.00”. Luna fills in the vendor, the total and the exchange rate.",
    "Type NSM-INV-7731 in “Vendor invoice number”, exactly as written on the invoice.",
    "Leave the date, the total of 255.00 and the rate fields as Luna filled them, then click “Save vendor bill for review”.",
    "If a message appears under the button, it names what Luna rejected.",
  ],
  4: [
    "Click the “Vendor Bills & Payments” tab if you're not on it.",
    "Click “View bill” on the BILL-00018 row (Northstar, NSM-INV-7731).",
    "At the bottom of the bill, click “Record bill in accounts”.",
  ],
  5: [
    "The payment form appears on BILL-00018 after the bill is recorded. Open it with “View bill” if it's closed.",
    "Enter 255.00 as the amount, choose “1010 — USD Bank Account” and “Bank transfer”, and type TRF-5521 as the reference.",
    "Type 209.00 as the payment-date rate and “bank rate for payment date” as its source, then click “Save payment”.",
  ],
  6: ["Supplier deliveries are recorded in Vendor Receiving.", "Click “Vendor Receiving” in the left sidebar."],
  7: [
    "If you're inside an order, click “Back to Vendor Receiving” first.",
    "Click “View order” on the PO-00042 row (Northstar Medical Supply → Harbour View Pharmacy).",
  ],
  8: [
    "In “Record Received Products”, leave the arrival date as today.",
    "Type 20 in the “Received now” box for NSM-GLOVE-M. Quantities are in boxes, the ordering unit.",
    "Click “Record items received”.",
  ],
  10: [
    "Open Vendor Receiving and click “View order” on PO-00042.",
    "“Still expected” shows 10. Type 10 in “Received now”. Luna won't accept more than is still expected.",
    "Click “Record items received”.",
  ],
};

type Feedback = { tone: "good" | "bad"; lines: string[]; help?: string[] } | null;

const lesson4Styles = `
.lsim-form select, .lsim-form input { width:100%; min-width:0; max-width:100%; box-sizing:border-box; }
.lsim-fields > * { min-width:0; }
.lsim-po-status { display:inline-block; font-size:12px; font-weight:600; background:#eef6ff; border:1px solid #cfe3f7; color:#174a7c; border-radius:999px; padding:3px 10px; }
.lsim-po-info { background:#f7fbff; border:1px solid #dceafa; border-radius:10px; padding:10px 12px; font-size:13px; line-height:1.5; margin:8px 0; }
.lsim-billhead { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; }
.lsim-billmark { color:#b45309; letter-spacing:.15em; font-size:1rem; }
.lsim-billmark.done { color:#15803d; }
.lsim-totals p { margin:2px 0; font-size:13px; }
.lsim-qty { width:80px !important; }
.lsim-subtabs { margin-bottom:12px; }
`;

export default function DirectorLesson4Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [bills, setBills] = useState<Bill[]>(seedBills);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [notice, setNotice] = useState("");

  // Invoices & Bills
  const [tab, setTab] = useState("create-customer");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [invoiceTotal, setInvoiceTotal] = useState("");
  const [invoiceRate, setInvoiceRate] = useState("");
  const [rateSource, setRateSource] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payAmount, setPayAmount] = useState("");
  const [payAccount, setPayAccount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payRate, setPayRate] = useState("");
  const [payRateSource, setPayRateSource] = useState("");

  // Vendor Receiving
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [arrivalDate, setArrivalDate] = useState(today());
  const [receivedNow, setReceivedNow] = useState("");
  const [search, setSearch] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0 });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));
  const selectedBill = bills.find((b) => b.id === selectedBillId) ?? null;
  const receivingOrder = orders.find((o) => o.id === receivingId) ?? null;
  const billedOrders = new Set(bills.map((b) => b.order_id));
  const availableBillOrders = orders.filter((o) => !billedOrders.has(o.id));
  const sourceOrder = orders.find((o) => o.id === sourceId) ?? null;

  /* ----- coaching ----- */

  // Checks the action against the current task. Returns false if it should not go ahead.
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
    setActive("Home"); setOrders(seedOrders); setBills(seedBills); setReceipts([]); setNotice("");
    setTab("create-customer"); setSelectedBillId(null); setSourceId(""); setInvoiceNo(""); setInvoiceDate(today());
    setInvoiceTotal(""); setInvoiceRate(""); setRateSource(""); resetPayment();
    setReceivingId(null); setArrivalDate(today()); setReceivedNow(""); setSearch("");
  }

  function resetPayment() {
    setPayDate(today()); setPayAmount(""); setPayAccount(""); setPayMethod("cash"); setPayRef(""); setPayRate(""); setPayRateSource("");
  }

  function navigate(section: string) {
    setActive(section);
    setNotice("");
    setSelectedBillId(null);
    setReceivingId(null);
    toTop();
    attempt({ type: "navigate", section }, () => {});
  }

  function openTab(value: string) {
    setTab(value);
    setNotice("");
    if (value !== "vendors") setSelectedBillId(null);
    attempt({ type: "tab", tab: value }, () => {});
  }

  /* ----- vendor bill (app/invoices-bills.tsx) ----- */

  function selectOrder(id: string) {
    setSourceId(id);
    const order = orders.find((o) => o.id === id);
    if (!order) { setInvoiceTotal(""); setInvoiceRate(""); setRateSource(""); setNotice(""); return; }
    setInvoiceDate(today());
    setInvoiceTotal((orderTotal(order) / 100).toFixed(2));
    setInvoiceRate(PRACTICE_RATE);
    setRateSource(`Bank of Guyana USD selling rate, published ${today()}`);
    setNotice("Vendor and PO total filled in. Enter the vendor invoice number and verify the invoice date and total.");
  }

  function saveBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notYet(2)) return;
    setNotice("");
    try {
      const order = orders.find((o) => o.id === sourceId);
      if (!order) throw new Error("Choose an approved purchase order first.");
      if (!invoiceNo.trim()) throw new Error("Enter the vendor invoice number shown on the vendor's invoice.");
      const totalCents = amountToCents(invoiceTotal);
      parseInvoiceRate(invoiceRate);
      if (rateSource.trim().length < 3) throw new Error("Enter the source of the invoice-date exchange rate.");
      if (!isValidDate(invoiceDate)) throw new Error("Enter a valid vendor invoice date.");
      if (totalCents !== orderTotal(order)) {
        throw new Error(`The vendor invoice total must match the saved PO amount of ${money(orderTotal(order))}. Resolve any difference before saving.`);
      }
      attempt({ type: "bill-save", order, invoice: invoiceNo, date: invoiceDate }, () => {
        const number = Math.max(...bills.map((b) => b.bill_number)) + 1;
        const bill: Bill = {
          id: `b${number}`, bill_number: number, vendor: order.vendor, order_id: order.id,
          vendor_invoice_number: invoiceNo.trim(), invoice_date: invoiceDate, total_cents: totalCents,
          rate: invoiceRate.trim(), status: "draft", payments: [],
        };
        setBills((prev) => [bill, ...prev]);
        setSourceId(""); setInvoiceNo(""); setInvoiceTotal(""); setInvoiceRate(""); setRateSource("");
        setTab("vendors");
        setNotice("Vendor bill saved and confirmed. Record the bill in accounts, then record the vendor payment. Receiving remains available before payment.");
        toTop();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the vendor bill.";
      setNotice(message);
      formMiss(message);
    }
  }

  function viewBill(bill: Bill) {
    setSelectedBillId(bill.id);
    setNotice("");
    resetPayment();
  }

  function recordBill(bill: Bill) {
    if (notYet(4)) return;
    attempt({ type: "bill-record", bill }, () => {
      setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, status: "recorded" } : b)));
      setNotice(`${billNumber(bill.bill_number)} recorded in the accounting records.`);
    });
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBill) return;
    if (notYet(5)) return;
    setNotice("");
    try {
      const amount = amountToCents(payAmount);
      parseInvoiceRate(payRate);
      if (payRateSource.trim().length < 3) throw new Error("Enter the source of the payment-date exchange rate.");
      if (!payAccount) throw new Error("Choose the cash or bank account used for the payment.");
      if (!isValidDate(payDate)) throw new Error("Enter a valid payment date.");
      if (payDate > today()) throw new Error("Payment date cannot be in the future.");
      if (payDate < selectedBill.invoice_date) throw new Error("Payment date cannot be before the vendor invoice date.");
      const paid = selectedBill.payments.reduce((s, p) => s + p.amount_cents, 0);
      const balance = selectedBill.total_cents - paid;
      if (amount > balance) throw new Error("The amount exceeds the unpaid vendor bill balance.");
      attempt({ type: "payment", bill: selectedBill, amount_cents: amount, account: payAccount, method: payMethod }, () => {
        const payment: Payment = { date: payDate, amount_cents: amount, account: payAccount, method: payMethod, reference: payRef.trim(), rate: payRate.trim() };
        const remaining = balance - amount;
        setBills((prev) => prev.map((b) => (b.id === selectedBill.id ? { ...b, payments: [...b.payments, payment], status: remaining === 0 ? "paid" : "recorded" } : b)));
        resetPayment();
        setNotice(remaining === 0
          ? `Payment saved and confirmed. ${billNumber(selectedBill.bill_number)} is settled in full.`
          : `Payment saved and confirmed. Remaining balance: ${money(remaining)}.`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the payment.";
      setNotice(message);
      formMiss(message);
    }
  }

  /* ----- Vendor Receiving (app/purchase-orders.tsx, page "receiving") ----- */

  function viewReceivingOrder(order: Order) {
    attempt({ type: "receiving-view", order }, () => {
      setReceivingId(order.id);
      setArrivalDate(today());
      setReceivedNow("");
      setNotice("");
      toTop();
    });
  }

  function recordReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receivingOrder || !canReceive(receivingOrder)) return;
    const alreadyReceived = receivingOrder.lines[0].received;
    if (notYet(alreadyReceived > 0 ? 10 : 8)) return;
    setNotice("");
    try {
      if (!arrivalDate) throw new Error("Choose the arrival date.");
      const line = receivingOrder.lines[0];
      const quantity = Number(receivedNow || 0);
      const remaining = line.quantity - line.received;
      if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > remaining) {
        throw new Error("A received quantity cannot exceed the amount still expected.");
      }
      if (quantity === 0) throw new Error("Enter the quantity received for at least one item.");
      attempt({ type: "receive", order: receivingOrder, quantity }, () => {
        const received = line.received + quantity;
        const status: Order["status"] = received >= line.quantity ? "received" : "partially_received";
        setOrders((prev) => prev.map((o) => (o.id === receivingOrder.id ? { ...o, status, lines: [{ ...line, received }] } : o)));
        setReceipts((prev) => [...prev, { order_id: receivingOrder.id, date: arrivalDate, quantity }]);
        setReceivedNow("");
        setNotice("Delivery recorded. Product stock has been updated.");
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record the delivery.";
      setNotice(message);
      formMiss(message);
    }
  }

  /* ----- rendering ----- */

  function renderInvoicesBills() {
    const tabs = [
      ["create-customer", "Create Customer Invoice"],
      ["customers", "Customer Invoices & Payments"],
      ["create-vendor", "Create Vendor Bill"],
      ["vendors", "Vendor Bills & Payments"],
      ["credits", "Credit Notes"],
      ["pending", "Awaiting Accounting"],
    ];
    return (
      <>
        <section className="lsim-module lsim-subtabs">
          <div className="lsim-tabs" aria-label="Invoice and bill sections">
            {tabs.map(([value, label]) => (
              <button key={value} type="button" className="lsim-sbtn" aria-pressed={tab === value} onClick={() => openTab(value)}>{label}</button>
            ))}
          </div>
        </section>
        {tab === "create-vendor" && renderCreateBill()}
        {tab === "vendors" && renderBills()}
        {!["create-vendor", "vendors"].includes(tab) && (
          <section className="lsim-module">
            <p className="lsim-note" style={{ margin: 0 }}>Customer invoices, credit notes and items awaiting accounting are covered in later lessons. This lesson uses “Create Vendor Bill” and “Vendor Bills & Payments”.</p>
          </section>
        )}
      </>
    );
  }

  function renderCreateBill() {
    return (
      <section className="lsim-module">
        <h2>Create vendor bill from PO</h2>
        <p>Choose an approved PO to fill its vendor and total before receiving items. Enter the vendor&apos;s invoice number and check its date and total. Record the bill in accounts, then record payment. You may receive items before payment when needed.</p>
        {availableBillOrders.length ? (
          <form className="lsim-form" onSubmit={saveBill} noValidate>
            <div className="lsim-fields">
              <label>Approved purchase order
                <select value={sourceId} onChange={(e) => selectOrder(e.target.value)}>
                  <option value="">Choose an approved PO</option>
                  {availableBillOrders.map((o) => <option key={o.id} value={o.id}>{poNumber(o.po_number)} — {o.vendor} — {money(orderTotal(o))}</option>)}
                </select>
              </label>
              <label>Vendor<input readOnly value={sourceOrder ? sourceOrder.vendor : ""} /></label>
              <label>Purchase order<input readOnly value={sourceOrder ? poNumber(sourceOrder.po_number) : ""} /></label>
              <label>Vendor invoice number<input maxLength={100} value={invoiceNo} placeholder="Number shown on the vendor's invoice" onChange={(e) => setInvoiceNo(e.target.value)} /></label>
              <label>Vendor invoice date<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label>
              <label>Vendor invoice total ($)<input inputMode="decimal" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} /></label>
              <label>Invoice-date exchange rate (GYD per USD 1)<input inputMode="decimal" value={invoiceRate} placeholder="Bank of Guyana selling rate" onChange={(e) => setInvoiceRate(e.target.value)} /></label>
              <label>Exchange-rate source<input value={rateSource} placeholder="Filled with the published rate" onChange={(e) => setRateSource(e.target.value)} /></label>
            </div>
            {sourceOrder && <p style={{ fontSize: 13, margin: "4px 0" }}>Published {today()}. (Practice rate. Real Luna links to the Bank of Guyana source.)</p>}
            <p style={{ fontSize: 13, margin: "4px 0 10px" }}>The latest available publication on or before the invoice date is used (up to seven days earlier). The rate is saved with the vendor bill; later published rates do not change it.</p>
            <button type="button" className="lsim-sbtn" disabled={!sourceId} onClick={() => sourceId && selectOrder(sourceId)}>Refresh invoice-date rate</button>{" "}
            <button className="lsim-pbtn" disabled={!invoiceRate || rateSource.trim().length < 3}>Save vendor bill for review</button>
          </form>
        ) : (
          <p>No approved, unbilled POs are available. Create and approve a PO first.</p>
        )}
        {notice && tab === "create-vendor" && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
        <p className="lsim-foot">Taxes, shipping charges, and pharmaceutical bills need additional controls before they can be entered.</p>
      </section>
    );
  }

  function renderBills() {
    return (
      <>
        <section className="lsim-module">
          <h2>Vendor bills &amp; payments</h2>
          <p>Create the bill from an approved PO, record it in accounts, then record payment. Receiving remains available before payment. Existing delivery bills remain available.</p>
          <button type="button" className="lsim-pbtn" onClick={() => openTab("create-vendor")}>Create vendor bill</button>
          {notice && !selectedBill && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
          <div className="lsim-table-wrap" style={{ marginTop: 10 }}>
            <table className="lsim-table">
              <thead><tr><th>Bill</th><th>Vendor</th><th>Purchase order</th><th>Vendor invoice</th><th>Date</th><th>Total</th><th>Balance due</th><th>Match</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>
                {bills.map((b) => {
                  const order = orders.find((o) => o.id === b.order_id);
                  const balance = b.total_cents - b.payments.reduce((s, p) => s + p.amount_cents, 0);
                  return (
                    <tr key={b.id}>
                      <td>{billNumber(b.bill_number)}</td><td>{b.vendor}</td><td>{order ? poNumber(order.po_number) : b.order_id}</td>
                      <td>{b.vendor_invoice_number}</td><td>{b.invoice_date}</td><td>{money(b.total_cents)}</td><td>{money(balance)}</td>
                      <td>Matches</td><td>{billStatusText(b)}</td>
                      <td><button type="button" className="lsim-sbtn" onClick={() => viewBill(b)}>View bill</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        {selectedBill && renderBill(selectedBill)}
      </>
    );
  }

  function renderBill(bill: Bill) {
    const order = orders.find((o) => o.id === bill.order_id);
    const paid = bill.payments.reduce((s, p) => s + p.amount_cents, 0);
    const balance = bill.total_cents - paid;
    return (
      <section className="lsim-module" aria-label={`${billNumber(bill.bill_number)} details`}>
        {order && <p className="lsim-po-info">This bill covers the whole PO. Recording it uses Goods Awaiting Supplier Delivery. Open Vendor Receiving to record each actual delivery, even before payment. Recorded bill and delivery values move into Inventory once both are recorded.</p>}
        <div className="lsim-billhead">
          <div><p style={{ margin: 0 }}><strong>Elevate Medical Solutions</strong></p><h2>{billNumber(bill.bill_number)}</h2></div>
          <strong className={`lsim-billmark ${bill.status === "paid" ? "done" : ""}`}>{bill.status.toUpperCase()}</strong>
        </div>
        <div className="lsim-dl">
          <p><strong>Vendor:</strong> {bill.vendor}</p>
          <p><strong>Vendor invoice:</strong> {bill.vendor_invoice_number}</p>
          <p>Purchase order: {order ? poNumber(order.po_number) : bill.order_id} · Invoice date: {bill.invoice_date} · Due date: {bill.invoice_date}</p>
          <p>Invoice-date exchange rate: {bill.rate} GYD per USD 1 · {gyd(bill.total_cents, bill.rate)}</p>
        </div>
        {order && (
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Item</th><th>Unit</th><th>Quantity</th><th>Unit cost</th><th>Amount</th></tr></thead>
              <tbody>{order.lines.map((l) => <tr key={l.sku}><td>{l.sku} — {l.name}</td><td>{l.unit}</td><td>{l.quantity}</td><td>{money(l.price_cents)}</td><td>{money(l.price_cents * l.quantity)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="lsim-totals" style={{ marginTop: 8 }}>
          <p>Purchase order items: {money(bill.total_cents)}</p>
          <p>Vendor invoice total: {money(bill.total_cents)}</p>
          <p>Posted supplier credits: {money(0)}</p>
          <p><strong>Difference: {money(0)}</strong></p>
          <p>Payments made: {money(paid)}</p>
          <p><strong>Balance due: {money(balance)}</strong></p>
        </div>
        <p style={{ fontSize: 13 }}>{bill.status === "draft" ? "This bill is checked and ready to be recorded in the accounts." : "This bill is recorded in the accounting records."}</p>
        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}

        <h3 style={{ fontSize: 15, margin: "12px 0 4px" }}>Payment history</h3>
        {bill.payments.length ? (
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Paid from</th><th>Method</th><th>Reference</th></tr></thead>
              <tbody>{bill.payments.map((p, i) => (
                <tr key={i}><td>{p.date}</td><td>{money(p.amount_cents)}</td><td>{paymentAccounts.find((a) => a.code === p.account)?.name ?? p.account}</td><td>{p.method.replaceAll("_", " ")}</td><td>{p.reference || "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p style={{ fontSize: 13 }}>No payments recorded yet.</p>}

        {bill.status === "recorded" && (
          <form className="lsim-form" onSubmit={savePayment} noValidate style={{ marginTop: 10 }}>
            <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>Record a vendor payment</h3>
            <div className="lsim-fields">
              <label>Payment date<input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></label>
              <label>Amount paid ($)<input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></label>
              <label>Payment account
                <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)}>
                  <option value="">Choose an account</option>
                  {paymentAccounts.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
              </label>
              <label>Payment method
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="credit_card">Credit card</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>Reference (optional)<input maxLength={100} value={payRef} onChange={(e) => setPayRef(e.target.value)} /></label>
              <label>Payment-date exchange rate (GYD per USD 1)<input inputMode="decimal" value={payRate} placeholder="Example: 209.00" onChange={(e) => setPayRate(e.target.value)} /></label>
              <label>Payment-date rate source<input value={payRateSource} placeholder="Example: bank rate for payment date" onChange={(e) => setPayRateSource(e.target.value)} /></label>
            </div>
            <button className="lsim-pbtn">Save payment</button>
          </form>
        )}

        <div style={{ marginTop: 10 }}>
          {bill.status === "draft" && <button type="button" className="lsim-pbtn" onClick={() => recordBill(bill)}>Record bill in accounts</button>}
          <button type="button" className="lsim-sbtn">Print or save as PDF</button>
          <button type="button" className="lsim-sbtn" onClick={() => { setSelectedBillId(null); setNotice(""); }}>Close bill details</button>
        </div>
      </section>
    );
  }

  function renderReceiving() {
    if (receivingOrder) return renderReceivingOrder(receivingOrder);
    const q = search.trim().toLowerCase();
    const list = orders.filter(canReceive).filter((o) => [poNumber(o.po_number), o.vendor, o.customer, orderStatusText(o)].some((x) => x.toLowerCase().includes(q)));
    return (
      <section className="lsim-module">
        <div className="lsim-panelhead">
          <h2>Vendor Receiving</h2>
          <button type="button" className="lsim-sbtn">Refresh queue</button>
        </div>
        <p>Approved USD orders with goods still expected. Open the order and record the quantities physically received.</p>
        <label className="lsim-search">Search orders
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PO number, vendor, customer, or status" />
        </label>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>PO number</th><th>Vendor</th><th>Customer</th><th>Date</th><th>Currency</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{poNumber(o.po_number)}</td><td>{o.vendor}</td><td>{o.customer}</td><td>{o.created}</td><td>USD</td><td>{money(orderTotal(o))}</td><td>{orderStatusText(o)}</td>
                  <td><button type="button" className="lsim-sbtn" onClick={() => viewReceivingOrder(o)}>View order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p style={{ fontSize: 13 }}>No approved purchase orders await receiving on this page.</p>}
        </div>
      </section>
    );
  }

  function renderReceivingOrder(order: Order) {
    const history = receipts.filter((r) => r.order_id === order.id);
    return (
      <section className="lsim-module">
        <button type="button" className="lsim-sbtn" onClick={() => { setReceivingId(null); setNotice(""); }}>Back to Vendor Receiving</button>
        <div className="lsim-billhead" style={{ marginTop: 8 }}>
          <div><h2>{poNumber(order.po_number)}</h2><p style={{ margin: 0, fontSize: 13 }}>{order.vendor} → {order.customer}</p></div>
          <span className="lsim-po-status">{orderStatusText(order)}</span>
        </div>
        <div className="lsim-table-wrap" style={{ marginTop: 8 }}>
          <table className="lsim-table">
            <thead><tr><th>SKU / Code</th><th>Product description</th><th>Ordering unit</th><th>Items per unit</th><th>Quantity</th><th>Received / Remaining</th><th>Unit price</th><th>Line total</th></tr></thead>
            <tbody>{order.lines.map((l) => (
              <tr key={l.sku}><td>{l.sku}</td><td>{l.name}</td><td>{l.unit}</td><td>{l.contents}</td><td>{l.quantity}</td><td>{l.received} / {l.quantity - l.received} {l.unit}</td><td>{money(l.price_cents)}</td><td>{money(l.price_cents * l.quantity)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {!canReceive(order) && <p role="status" style={{ fontSize: 13 }}>This order is not currently open for receiving. Its recorded details remain available below.</p>}
        {canReceive(order) && (
          <form className="lsim-form lsim-po-info" onSubmit={recordReceipt} noValidate>
            <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>Record Received Products</h3>
            <p style={{ margin: "0 0 6px" }}>Enter only quantities that have arrived, in the ordering unit shown (Pack, Box or Each). You can receive items before paying the vendor. If the PO bill is already recorded, Luna also moves the received merchandise value into Inventory.</p>
            <label>Arrival date (Eastern Time)<input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} /></label>
            <div className="lsim-table-wrap">
              <table className="lsim-table">
                <caption style={{ textAlign: "left", fontSize: 12, padding: "4px 0" }}>Products on this purchase order</caption>
                <thead><tr><th>SKU / Code</th><th>Product description</th><th>Ordering unit</th><th>Items per unit</th><th>Ordered</th><th>Previously received</th><th>Still expected</th><th>Received now</th></tr></thead>
                <tbody>{order.lines.map((l) => (
                  <tr key={l.sku}>
                    <td>{l.sku}</td><td>{l.name}</td><td>{l.unit}</td><td>{l.contents}</td><td>{l.quantity}</td><td>{l.received}</td><td>{l.quantity - l.received}</td>
                    <td><input className="lsim-qty" type="number" min={0} max={l.quantity - l.received} aria-label={`Received now for ${l.sku} — ${l.name}, in ${l.unit}`} value={receivedNow} onChange={(e) => setReceivedNow(e.target.value)} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <button className="lsim-pbtn" style={{ marginTop: 8 }}>Record items received</button>
          </form>
        )}
        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
        <h3 style={{ fontSize: 15, margin: "12px 0 4px" }}>Deliveries recorded in this practice</h3>
        {history.length ? (
          <ul style={{ fontSize: 13, margin: 0 }}>{history.map((r, i) => <li key={i}>{r.date} · {r.quantity} {order.lines[0].unit}</li>)}</ul>
        ) : <p style={{ fontSize: 13, margin: 0 }}>No deliveries recorded yet.</p>}
      </section>
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
    if (active === "Invoices & Bills") return renderInvoicesBills();
    if (active === "Vendor Receiving") return renderReceiving();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">This lesson works in Invoices &amp; Bills and Vendor Receiving. {active} is covered in {coveredIn[active] ?? "a later lesson"}.</p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 4">
      <style>{simulatorStyles + formStyles + lesson4Styles}</style>
      <div className="lsim-top">TRAINING SIMULATOR · Fictional bills and deliveries · Not connected to production Luna</div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>Lesson 4 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}</h4>
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
            <p><strong>Lesson 4 complete.</strong></p>
            <p>You can now create a vendor bill from an approved order, record it in the accounts, record the payment, and receive a delivery in parts. You can also explain why receiving records only what arrived and why the bill total must match the order.</p>
            <p>Next: Lesson 5 covers exchange rates and inventory costing, including Cost Analysis.</p>
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

        <p className="lsim-footnote">Labels, statuses, validation messages and confirmations match the current Luna code. Records, exchange rates and account names are fictional and reset when you restart, and nothing here changes production Luna.</p>
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
