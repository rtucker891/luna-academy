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
  Luna Academy — Lesson 7 simulator: "Customer returns, credits, and refunds"

  Training only. This component never connects to production Luna.
  Labels, statuses, validation messages and confirmations are copied from
  the Luna_Accounting source (app/customer-returns.tsx, app/customer-return-review.tsx,
  app/customer-return-receiving.tsx, app/customer-return-restock.tsx,
  app/paid-customer-return-settlement.tsx, accounting/paid-return-settlement.ts,
  app/use-director-credit-approval.ts, database/customer-return-receiving.sql,
  database/customer-invoice-before-shipment.sql, database/gyd-customer-returns-draft.sql,
  database/luna-authorization-levels.sql, database/assistant-bookkeeper-access.sql,
  accounting/customer-return-workflow.ts, docs/customer-return-guide.md and
  docs/customer-return-*.md; guided flow as of Luna d4ed138; paid-sale refund credits as of Luna 21879b1,
  supabase/migrations/20261103042803_paid_customer_return_refunds.sql and docs/paid-customer-return-refunds.md). Records, bank accounts and references are fictional
  and live only in this browser tab.
*/

const LESSON_TITLE = "Customer returns, credits, and refunds";

/* ---------- Fictional data ---------- */

type Lot = { lot: string; supplier_lot: string; expiration: string; category: string };
type InvLine = { id: string; sku: string; name: string; unit: string; quantity: number; price_cents: number; shipped_lot: Lot; shipped_from_lot: number };
type ReturnInvoice = {
  id: string; number: number; so: number; customer: string; date: string;
  status: "recorded" | "partially_paid" | "paid"; total_cents: number; paid_cents: number; lines: InvLine[];
};
type Condition = "unknown" | "unopened" | "opened" | "damaged";
type Decision = "hold" | "ineligible" | "eligible_for_restock";
type ReturnRequest = {
  id: string; invoice_id: string; line_id: string; quantity: number; date: string;
  condition: Condition; reason: string; status: "draft" | "approved" | "cancelled"; approved_at?: string;
};
type Inspection = { date: string; condition: Condition; decision: Decision; identity: boolean; storage: boolean; notes: string };
type Receipt = {
  id: string; request_id: string; lot: string; date: string; quantity: number; notes: string;
  inspections: Inspection[]; restock?: { id: string; date: string; cost_cents: number; journal: string };
};
// luna_paid_return_credits / luna_paid_return_refunds (supabase/migrations/20261103042803_paid_customer_return_refunds.sql)
type Credit = { id: string; number: number; receipt_id: string; invoice_id: string; date: string; amount_cents: number; reason: string; status: "draft" | "recorded" | "cancelled" };
type Refund = { id: string; credit_id: string; receipt_id: string; invoice_id: string; date: string; amount_cents: number; bank: string; method: string; reference: string; reason: string };

const LOT_0238: Lot = { lot: "TR-LOT-0238", supplier_lot: "JRS-24417", expiration: "2028-06-30", category: "medical_supply" };
const LOT_0231: Lot = { lot: "TR-LOT-0231", supplier_lot: "ACS-55102", expiration: "2028-03-31", category: "medical_supply" };
const LOT_0252: Lot = { lot: "TR-LOT-0252", supplier_lot: "NSM-90311", expiration: "2028-09-30", category: "medical_supply" };

const GAUZE = { sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit: "Box", price_cents: 135000 };
const SYRINGE = { sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", price_cents: 365000 };
const GLOVE = { sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", unit: "Box", price_cents: 250000 };

// Recorded customer invoices that can be returned against. Luna ships only after full payment, so every one is paid in full.
const seedInvoices: ReturnInvoice[] = [
  {
    id: "i32", number: 32, so: 29, customer: "Harbour View Pharmacy", date: "2026-11-02", status: "paid",
    total_cents: 11350000, paid_cents: 11350000,
    lines: [
      { id: "l32a", ...GLOVE, quantity: 40, shipped_lot: LOT_0252, shipped_from_lot: 30 },
      { id: "l32b", ...GAUZE, quantity: 10, shipped_lot: LOT_0238, shipped_from_lot: 10 },
    ],
  },
  {
    id: "i31", number: 31, so: 27, customer: "St. Jude Community Hospital", date: "2026-10-20", status: "paid",
    total_cents: 2700000, paid_cents: 2700000,
    lines: [{ id: "l31a", ...GAUZE, quantity: 20, shipped_lot: LOT_0238, shipped_from_lot: 20 }],
  },
  {
    id: "i30", number: 30, so: 26, customer: "Riverside Family Clinic", date: "2026-10-15", status: "paid",
    total_cents: 6350000, paid_cents: 6350000,
    lines: [
      { id: "l30a", ...GAUZE, quantity: 20, shipped_lot: LOT_0238, shipped_from_lot: 20 },
      { id: "l30b", ...SYRINGE, quantity: 10, shipped_lot: LOT_0231, shipped_from_lot: 10 },
    ],
  },
];

const SJ_REQUEST = "5c2e81d4";
const SJ_RECEIPT = "rc-5c2e";
const RIVERSIDE_REQUEST = "8a41f0c7";
const RIVERSIDE_RECEIPT = "rc-8a41";

const seedRequests: ReturnRequest[] = [
  {
    id: SJ_REQUEST, invoice_id: "i31", line_id: "l31a", quantity: 6, date: "2026-10-29", condition: "unopened",
    reason: "Over-ordered. Six boxes returned unopened in their original cartons.", status: "approved", approved_at: "2026-10-29",
  },
];

const seedReceipts: Receipt[] = [
  {
    id: SJ_RECEIPT, request_id: SJ_REQUEST, lot: "TR-LOT-0238", date: "2026-10-30", quantity: 6,
    notes: "Six sealed boxes counted and placed on quarantine shelf Q2.",
    inspections: [{ date: "2026-10-30", condition: "unopened", decision: "eligible_for_restock", identity: true, storage: true, notes: "Seals intact, lot TR-LOT-0238 matches the shipment, stored at room temperature." }],
  },
];

// Inventory for the restock review (app/customer-return-restock.tsx shows lot cost in USD).
const GAUZE_ON_HAND = 54;
const GAUZE_COST_CENTS_USD = 425;

// Refund payments are made from a GYD payment account (get_luna_customer_gyd_bank_accounts).
const gydBanks = [
  { id: "g1", institution: "Republic Bank", account: "Operating Account (GYD)" },
  { id: "g2", institution: "Demerara Bank", account: "Payroll Account (GYD)" },
];

const customers = ["Bright Smile Dental Clinic", "Eastbank Pharmacy", "Harbour View Pharmacy", "Lakeside Care Home", "Riverside Family Clinic", "St. Jude Community Hospital"];

const soNumber = (n: number) => `SO-${String(n).padStart(5, "0")}`;
const invNumber = (n: number) => `INV-${String(n).padStart(5, "0")}`;

// accounting/paid-return-settlement.ts paidReturnMoney(): "GYD 10950.00" (no thousands separator)
function money(cents: number) {
  return `GYD ${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

// app/customer-return-restock.tsx money(): "USD 1,234.50"
function usd(cents: number) {
  return "USD " + String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + String(cents % 100).padStart(2, "0");
}

// accounting/paid-return-settlement.ts decimalGyd(): "10950.00"
function decimalGyd(cents: number) {
  return money(cents).slice(4);
}

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// accounting/paid-return-settlement.ts enteredGyd(). Academy also accepts grouped thousands such as 10,950.00.
function gydCents(value: string) {
  const normalized = value.trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(normalized)) throw new Error("Enter a GYD amount with up to two decimal places.");
  const [whole, fraction = ""] = normalized.replace(/,/g, "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0 || cents > Number.MAX_SAFE_INTEGER) throw new Error("The GYD amount could not be verified.");
  return cents;
}

function conditionText(c: Condition) {
  return c === "unknown" ? "unknown" : c;
}

// app/customer-return-receiving.tsx disposition()
function disposition(value: Decision) {
  return value === "eligible_for_restock" ? "Eligible for a separate restock review — still quarantined" : value === "ineligible" ? "Ineligible for restock — still quarantined" : "On hold — quarantined";
}

// accounting/customer-return-workflow.ts
type ReturnStep = "receive" | "resolve" | "print";
function returnNeedsInspection(rc: Receipt) {
  const latest = rc.inspections[rc.inspections.length - 1];
  return !rc.restock && (!latest || latest.decision === "hold" || latest.condition === "unknown");
}
function canReviewReturnSettlement(rc: Receipt) {
  const latest = rc.inspections[rc.inspections.length - 1];
  return Boolean(latest && latest.decision !== "hold" && latest.condition !== "unknown");
}

const isError = (text: string) => !/^(Return draft saved|Return authorized|Return draft cancelled|Physical receipt saved|Inspection saved|Refund credit saved|Refund credit approved|Draft cancelled|Returned goods released|Actual refund recorded|In real Luna)/.test(text);

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "order-select"; invoice: ReturnInvoice }
  | { type: "prepare"; invoice: ReturnInvoice; sku: string; quantity: number; condition: Condition }
  | { type: "approve"; request: ReturnRequest }
  | { type: "open-review"; request: ReturnRequest }
  | { type: "receive"; request: ReturnRequest; lot: string; quantity: number }
  | { type: "inspect"; receipt: Receipt; condition: Condition; decision: Decision; identity: boolean; storage: boolean }
  | { type: "credit-prepare"; receipt: Receipt; amount_cents: number }
  | { type: "credit-post"; credit: Credit }
  | { type: "restock"; receipt: Receipt }
  | { type: "refund-preview"; receipt: Receipt; amount_cents: number; bank: string; method: string; reference: string }
  | { type: "refund-record"; receipt: Receipt }
  | { type: "print"; receipt: Receipt };

type Mission =
  | { kind: "do"; prompt: string; details?: string[]; check: (e: Event) => string | null | undefined; learn: string[] }
  | { kind: "choice"; prompt: string; options: { text: string; correct: boolean; why: string }[]; learn: string[] };

const missions: Mission[] = [
  {
    kind: "do",
    prompt: "Riverside Family Clinic has called. 3 boxes of syringes from order SO-00026 arrived crushed. Open the section where customer returns are handled.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Customer Returns" ? null : `You opened ${e.section}. Goods coming back from a customer are handled in Customer Returns.`),
    learn: [
      "Customer Returns handles goods coming back from customers. Supplier Returns is the opposite direction: goods you send back to a vendor.",
      "Luna guides every return through 4 numbered steps: 1. Select item & authorize → 2. Receive & inspect → 3. Stock & customer balance → 4. Review & print. Luna moves you to the next step automatically after each save.",
    ],
  },
  {
    kind: "do",
    prompt: "At the top of Customer Returns, choose Riverside Family Clinic in “Customer”, then choose SO-00026 in “Customer order”.",
    check: (e) => {
      if (e.type !== "order-select") return undefined;
      if (e.invoice.id !== "i30") return `You opened ${soNumber(e.invoice.so)} for ${e.invoice.customer}. The crushed syringes came on SO-00026 for Riverside Family Clinic.`;
      return null;
    },
    learn: [
      "A return always starts from the original order. Luna only lists orders with a recorded invoice, because the return has to be matched to what was billed and shipped.",
      "Riverside's invoice INV-00030 totals GYD 63500.00 and is paid in full. Luna only lets goods ship once the invoice is fully paid, so every return you handle is on a sale the customer has already paid for.",
    ],
  },
  {
    kind: "do",
    prompt: "Under the order, in “1. Select the returned item”, enter the returned syringes and click “Save return & review”.",
    details: [
      "Product: ACS-SYR-5ML — Syringe 5 mL, luer lock",
      "Return quantity: 3",
      "Reported condition: Reported damaged",
      "Reason: at least 10 characters, for example “3 boxes arrived crushed in transit.”",
    ],
    check: (e) => {
      if (e.type !== "prepare") return undefined;
      if (e.invoice.id !== "i30") return "This return is for Riverside Family Clinic's SO-00026. Choose that order first.";
      if (e.sku !== "ACS-SYR-5ML") return `You chose ${e.sku}. The crushed boxes were the syringes, ACS-SYR-5ML.`;
      if (e.quantity !== 3) return `You entered ${e.quantity}. Riverside is returning 3 boxes.`;
      if (e.condition !== "damaged") return "The customer said the boxes arrived crushed. Choose “Reported damaged” in “Reported condition”.";
      return null;
    },
    learn: [
      "Luna confirmed: “Return draft saved. Review and authorize it below to continue.”",
      "Luna opened the saved return straight away under “1. Review & authorize return”. You don't have to look for it in a list.",
      "“Reported damaged” records what the customer told you. It isn't a finding yet. The inspection after the goods arrive decides what really happened.",
    ],
  },
  {
    kind: "choice",
    prompt: "The return is saved as a draft. What has that changed so far?",
    options: [
      { text: "EMS already owes Riverside the value of the 3 boxes", correct: false, why: "Not quite. Nothing is owed yet. EMS only owes the customer once a Director approves a refund credit in step 3." },
      { text: "Nothing in stock, accounts or what EMS owes the customer. It's only a saved request waiting for authorization", correct: true, why: "Correct. A draft only records the request. Authorization, receiving, inspection and the refund credit are all separate steps." },
      { text: "The 3 boxes have been added back to stock", correct: false, why: "Not quite. Nothing has even arrived yet. Returned goods never go straight back into stock in Luna; they're quarantined and inspected first." },
    ],
    learn: ["Each step in a Luna return does one thing only, so you can always see exactly where a return is."],
  },
  {
    kind: "do",
    prompt: "Under “1. Review & authorize return”, check the details, tick the box that starts “I reviewed this item and quantity…” and click “Authorize return & continue”.",
    check: (e) => {
      if (e.type !== "approve") return undefined;
      if (e.request.id !== RIVERSIDE_REQUEST) return `You authorized RET-${e.request.id}. Authorize the return you just saved for Riverside's syringes.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Return authorized. Continue with Receive & inspect below. Stock and the customer balance have not changed.”",
      "The heading changed to “Return progress”, and “2. Receive & inspect” is now highlighted. Authorization reserves the 3 boxes against this invoice line, so nobody can authorize returning the same boxes twice.",
    ],
  },
  {
    kind: "do",
    prompt: "The 3 crushed boxes have arrived at your warehouse. Below the step buttons, in “Receive into quarantine”, record the physical receipt and click “Save receipt & inspect”.",
    details: [
      "Original shipment lot: TR-LOT-0231 (Luna already picked it, because it's the only lot these syringes shipped from)",
      "Quantity physically received: 3",
      "Receiving notes: at least 10 characters, for example “3 crushed boxes counted, placed in quarantine.”",
      "Tick the box confirming you counted the goods",
    ],
    check: (e) => {
      if (e.type !== "receive") return undefined;
      if (e.request.id !== RIVERSIDE_REQUEST) return "Record the receipt on Riverside's syringe return.";
      if (e.lot !== "TR-LOT-0231") return `You chose ${e.lot}. The syringes were shipped from lot TR-LOT-0231.`;
      if (e.quantity !== 3) return `You entered ${e.quantity}. 3 boxes arrived.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Physical receipt saved in quarantine. Saleable stock, inventory value and the customer balance have not changed.”",
      "Luna opened the inspection form for these 3 boxes straight away. Quarantine means the boxes are in your building but not available to sell. Matching them to the original lot keeps tracing intact if there's ever a product recall.",
    ],
  },
  {
    kind: "do",
    prompt: "Luna opened “Inspect 3 unit(s) from TR-LOT-0231” just below the “Lot TR-LOT-0231” box. Record what you found and click “Save inspection & continue”.",
    details: [
      "Observed condition: Damaged",
      "Tick “Product, original lot and item identity verified”",
      "Inspection decision: Ineligible for restock",
      "Inspection findings: at least 10 characters, for example “Outer cartons crushed, packaging split.”",
      "Tick the confirmation box",
    ],
    check: (e) => {
      if (e.type !== "inspect") return undefined;
      if (e.receipt.id !== RIVERSIDE_RECEIPT) return "Inspect Riverside's syringe receipt (lot TR-LOT-0231).";
      if (e.condition !== "damaged") return `You recorded the condition as ${conditionText(e.condition)}. The cartons are crushed, so choose “Damaged”.`;
      if (e.decision === "hold") return "“Keep on hold” is for batches you can't decide on yet. It keeps the return in step 2 and blocks any refund credit. These boxes are clearly crushed, so choose “Ineligible for restock”.";
      return null;
    },
    learn: [
      "Luna confirmed: “Inspection saved. The goods remain quarantined, including items marked eligible for restock. No stock release, credit, refund or disposal was performed.”",
      "Because you made a decision, Luna moved you on to “3. Stock & customer balance”. Damaged goods can never be marked eligible: Luna only allows that for unopened goods with verified identity and storage history.",
    ],
  },
  {
    kind: "choice",
    prompt: "The “Lot TR-LOT-0231” box now reads “Not eligible for resale. Financial settlement can be reviewed separately.” What does that mean?",
    options: [
      { text: "Luna has recorded the boxes as thrown away", correct: false, why: "Not quite. Luna's inspection screen says “Ineligible” does not record disposal. Disposal is handled separately." },
      { text: "They stay quarantined and won't go back into stock, but Riverside can still get its money back", correct: true, why: "Correct. The decision only controls restocking. Any decision other than “Keep on hold” unlocks “Review refund credit” and “Record customer refund”." },
      { text: "Riverside can't get anything back because the goods can't be resold", correct: false, why: "Not quite. Whether you can resell the goods and whether the customer gets money back are separate questions. That's why the box still shows “Review refund credit”." },
    ],
    learn: ["“Ineligible for restock” is about the goods. Paying the customer back is decided separately, in step 3."],
  },
  {
    kind: "do",
    prompt: "You're on “3. Stock & customer balance”. In the box headed “Lot TR-LOT-0231”, click “Review refund credit”. The panel “Paid-sale return — refund to customer (GYD)” opens below the box. Under “1. Prepare refund credit”, save a refund credit for the full value of the 3 boxes.",
    details: [
      "Refund credit amount (GYD): Luna already filled in 10950.00, which is 3 boxes × GYD 3650.00 (10,950.00 also works)",
      "Reason for refund credit: at least 10 characters, for example “Refund for 3 boxes of syringes returned crushed.”",
      "Click “Save refund credit for Director”",
    ],
    check: (e) => {
      if (e.type !== "credit-prepare") return undefined;
      if (e.receipt.id !== RIVERSIDE_RECEIPT) return "Prepare the refund credit on Riverside's syringe receipt (lot TR-LOT-0231).";
      if (e.amount_cents !== 1095000) return `You entered ${money(e.amount_cents)}. Refund the full returned value: 3 boxes × GYD 3650.00 = GYD 10950.00.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Refund credit saved for Director approval. No payment or stock release has occurred.”",
      "The credit is numbered RCN-00001 and shows as “draft” in “Refund credit history”. Luna pre-filled the amount with the “Available return allowance”: the value of the returned boxes. You can't credit more than that.",
      "Both “Review refund credit” and “Record customer refund” open this same panel. A paid sale is always settled the same way: refund credit first, then the payment.",
    ],
  },
  {
    kind: "do",
    prompt: "Luna opened “2. Director approval” just below “Refund credit history”. Tick “I approve this return credit and the amount EMS owes the customer.” and click “Approve refund credit”.",
    check: (e) => {
      if (e.type !== "credit-post") return undefined;
      if (e.credit.receipt_id !== RIVERSIDE_RECEIPT) return "Approve the refund credit for Riverside's syringes (RCN-00001).";
      return null;
    },
    learn: [
      "Luna confirmed: “Refund credit approved. EMS now owes this amount to the customer. Record the refund only after payment.”",
      "RCN-00001 now reads “Director approved” and “Refund still payable: GYD 10950.00”. Only a Director can approve. A Bookkeeper can prepare the credit, and the Director reviews and approves it.",
    ],
  },
  {
    kind: "choice",
    prompt: "RCN-00001 is approved. What did the approval change?",
    options: [
      { text: "GYD 10950.00 was paid to Riverside from the bank", correct: false, why: "Not quite. Approval moves no money. Luna says to “Record the refund only after payment.”" },
      { text: "It reversed the sale (Dr 4100 Sales returns) and recorded that EMS owes Riverside GYD 10950.00 (Cr 2300 Customer refunds payable). No money moved, and INV-00030 is still fully paid", correct: true, why: "Correct. The approved credit creates a refund payable to the customer. The invoice and its paid balance don't change." },
      { text: "INV-00030 now shows GYD 10950.00 less to pay", correct: false, why: "Not quite. INV-00030 was already paid in full, so there's nothing left to reduce. The credit records what EMS now owes Riverside instead." },
    ],
    learn: ["Think of the refund credit as an IOU from EMS to the customer. It stays on the books, in Customer refunds payable (2300), until the money is actually paid."],
  },
  {
    kind: "do",
    prompt: "Your bank sent Riverside a GYD 10950.00 transfer this morning. In “Refund credit history”, under RCN-00001, click “Record payment for this credit”. Fill in “3. Record an actual refund payment” and click “Review approved refund payment”.",
    details: [
      "Amount actually refunded (GYD): Luna already filled in 10950.00",
      "GYD payment account: Republic Bank — Operating Account (GYD)",
      "Refund payment method: bank transfer",
      "Actual refund payment reference: RFC-RFD-0112",
      "Payment notes: at least 10 characters, for example “Bank transfer refund for 3 crushed boxes of syringes.”",
    ],
    check: (e) => {
      if (e.type !== "refund-preview") return undefined;
      if (e.receipt.id !== RIVERSIDE_RECEIPT) return "Record the payment on Riverside's refund credit RCN-00001.";
      if (e.amount_cents !== 1095000) return `You entered ${money(e.amount_cents)}. The bank sent the full GYD 10950.00.`;
      if (e.bank !== "g1") return "The transfer went out of Republic Bank — Operating Account (GYD). Choose that account.";
      if (e.method !== "bank_transfer") return "The refund was sent by bank transfer. Choose “bank transfer”.";
      if (e.reference !== "RFC-RFD-0112") return `You typed “${e.reference}”. Use the bank's reference for this transfer: RFC-RFD-0112.`;
      return null;
    },
    learn: [
      "Luna shows “Review actual refund payment” with the amount, bank account and reference. Nothing is recorded yet.",
      "Luna won't let the payment be more than “Refund still payable”. It records a refund that already happened, by any method. It never sends money.",
    ],
  },
  {
    kind: "do",
    prompt: "Check the review. Tick “I confirm this refund has actually been paid to the customer.” and click “Record approved refund payment”.",
    check: (e) => {
      if (e.type !== "refund-record") return undefined;
      if (e.receipt.id !== RIVERSIDE_RECEIPT) return "Record Riverside's refund payment.";
      return null;
    },
    learn: [
      "Luna confirmed: “Actual refund recorded against the approved credit. Sales were not reversed again.”",
      "The payment appears under “Refund payments” with a “Print refund receipt” button. RCN-00001 now shows “Refund still payable: GYD 0.00”. Like any payment, it can't be edited or deleted, which is why Luna shows a review first.",
    ],
  },
  {
    kind: "choice",
    prompt: "What did recording Riverside's refund payment do in the accounts?",
    options: [
      { text: "Dr 2300 Customer refunds payable, Cr the Republic Bank account. It cleared what EMS owed Riverside", correct: true, why: "Correct. The payable created by the approval is paid off, and the bank balance goes down by the actual transfer." },
      { text: "It reduced Sales a second time", correct: false, why: "Not quite. Sales were reversed once, when the credit was approved. Luna's message says: “Sales were not reversed again.”" },
      { text: "It lowered the paid amount on INV-00030 to GYD 52550.00", correct: false, why: "Not quite. The invoice and its payments don't change. The refund is tracked against the refund credit, not the invoice." },
    ],
    learn: ["Two entries, two moments: approval records what EMS owes (Dr 4100 / Cr 2300). Payment records the money going out (Dr 2300 / Cr bank). If only part is paid, the rest stays visible as “Refund still payable”."],
  },
  {
    kind: "do",
    prompt: "St. Jude Community Hospital returned 6 unopened boxes of gauze from SO-00027. The return is already received and inspected. Choose St. Jude Community Hospital in “Customer” and SO-00027 in “Customer order”. Then click “Find a saved return (1)” to open the list, then click “Open review” on RET-5c2e81d4.",
    check: (e) => {
      if (e.type !== "open-review") return undefined;
      if (e.request.id !== SJ_REQUEST) return `You opened RET-${e.request.id}. Choose SO-00027 for St. Jude Community Hospital and open RET-5c2e81d4.`;
      return null;
    },
    learn: [
      "Luna shows “Return progress”. The “Lot TR-LOT-0238” box reads “Eligible for a separate restock review — still quarantined”, and its button says “Continue to stock & settlement” because the inspection is already done.",
      "Saved returns sit inside “Find a saved return”, so the page stays focused on the return you're working on.",
    ],
  },
  {
    kind: "do",
    prompt: "In the box headed “Lot TR-LOT-0238”, click “Continue to stock & settlement”. Then click “Review stock release”, read the review, tick the approval box and click “Release stock and record adjustment”.",
    check: (e) => {
      if (e.type !== "restock") return undefined;
      if (e.receipt.id !== SJ_RECEIPT) return "Release St. Jude's unopened gauze (lot TR-LOT-0238).";
      return null;
    },
    learn: [
      "Luna confirmed: “Returned goods released to saleable stock. The inventory and accounting changes were saved together.”",
      "Saleable gauze went from 54 to 60 boxes. A receipt can only be released once. “Review stock release” only appears for goods inspected as eligible.",
    ],
  },
  {
    kind: "choice",
    prompt: "The release review showed “Exact cost restored: USD 25.50”. What did the release record?",
    options: [
      { text: "A debit to Inventory (1200) and a credit to Cost of Goods Sold (5000) at the original cost, with nothing owed or paid to St. Jude yet", correct: true, why: "Correct. The boxes go back at what they cost you, not the selling price. The customer's money is handled separately, with a refund credit." },
      { text: "A GYD 8100.00 refund to St. Jude, so the return is now finished", correct: false, why: "Not quite. Restocking only deals with stock and its cost. Luna never treats a restocked receipt as settled; the refund credit is a separate step." },
      { text: "A credit to Sales Revenue at the selling price", correct: false, why: "Not quite. Restocking uses the original cost, USD 4.25 a box. The selling price matters only for the refund credit." },
    ],
    learn: ["A restocked receipt still needs its refund credit. The review shows the cost in USD because that's the currency the lot was bought in (Lesson 5). Neither approving a refund credit nor paying it releases stock."],
  },
  {
    kind: "do",
    prompt: "St. Jude paid INV-00031 in full, so they're owed GYD 8100.00. In the same “Lot TR-LOT-0238” box, click “Review refund credit”. Under “1. Prepare refund credit”, save the refund credit, then approve it under “2. Director approval”.",
    details: [
      "Refund credit amount (GYD): Luna already filled in 8100.00, which is 6 boxes × GYD 1350.00",
      "Reason for refund credit: at least 10 characters, for example “Refund for 6 unopened boxes of gauze returned.”",
      "Click “Save refund credit for Director”",
      "Then tick “I approve this return credit and the amount EMS owes the customer.” and click “Approve refund credit”",
    ],
    check: (e) => {
      if (e.type === "credit-prepare") {
        if (e.receipt.id !== SJ_RECEIPT) return "Prepare the refund credit on St. Jude's gauze receipt (lot TR-LOT-0238).";
        if (e.amount_cents !== 810000) return `You entered ${money(e.amount_cents)}. Refund the full returned value: 6 boxes × GYD 1350.00 = GYD 8100.00.`;
        return undefined; // saved; the task finishes when the credit is approved
      }
      if (e.type !== "credit-post") return undefined;
      if (e.credit.receipt_id !== SJ_RECEIPT) return "Approve the refund credit for St. Jude's gauze (RCN-00002).";
      return null;
    },
    learn: [
      "Luna confirmed: “Refund credit approved. EMS now owes this amount to the customer. Record the refund only after payment.”",
      "RCN-00002 reads “Director approved” and “Refund still payable: GYD 8100.00”.",
    ],
  },
  {
    kind: "choice",
    prompt: "Accounts will send St. Jude's GYD 8100.00 transfer next week. A colleague wants to click “Record payment for this credit” now, so it isn't forgotten. What should you tell them?",
    options: [
      { text: "That's fine. Recording it now reminds us to pay", correct: false, why: "Not quite. Luna asks you to confirm the refund “has actually been paid to the customer”. Recording it early makes the bank account wrong." },
      { text: "Leave it. RCN-00002 already shows “Refund still payable: GYD 8100.00”. Record the payment only after the money has gone out, with the real transfer reference", correct: true, why: "Correct. The approved credit is the reminder: it stays visible as payable until the payment is recorded. Luna's panel says: “Record this only after the customer has been paid.”" },
      { text: "Cancel the refund credit and make a new one next week", correct: false, why: "Not quite. An approved refund credit can't be cancelled, and there's no need to. It correctly shows what EMS owes until it's paid." },
    ],
    learn: ["Luna records money that has actually moved. That applies to customer payments, vendor payments and customer refunds alike."],
  },
  {
    kind: "do",
    prompt: "St. Jude wants a copy of the return receipt. Click the step button “4. Review & print”, then click “Print return receipt” in the “Lot TR-LOT-0238” box.",
    check: (e) => {
      if (e.type !== "print") return undefined;
      if (e.receipt.id !== SJ_RECEIPT) return "Print St. Jude's gauze receipt (lot TR-LOT-0238).";
      return null;
    },
    learn: [
      "In real Luna this opens the Customer Return Receipt in a new window, ready to print.",
      "Step 4 says: “Printing does not confirm a stock release, credit or refund.” A return receipt proves the goods came back. The refund credit note and refund receipt are printed from the refund panel in step 3. Approved refund credits also appear under Invoices & Bills > Credit notes, with an “Open refund credit” button.",
    ],
  },
  {
    kind: "choice",
    prompt: "Who can do what with customer returns in Luna?",
    options: [
      { text: "Anyone who can see the invoice can authorize returns and approve refund credits", correct: false, why: "Not quite. Returns move stock, accounts and money, so Luna limits each step by role." },
      { text: "A Director authorizes, receives, inspects, releases stock and approves refund credits. A Bookkeeper can prepare a refund credit and record a refund payment that's already been made. A Salesman can't work on returns", correct: true, why: "Correct. Preparing a refund credit and recording the payment use “bookkeeping” permission. Only a Director can approve a refund credit: “Only a Director can approve and post refund credit notes.”" },
      { text: "A Bookkeeper can approve a refund credit as long as they also record the payment", correct: false, why: "Not quite. Approval always needs a Director. The person who prepares a refund credit isn't the one who approves it." },
    ],
    learn: ["This split means no single non-Director can both decide that EMS owes a customer money and record paying it."],
  },
  {
    kind: "choice",
    prompt: "Why does every return on a GYD sale now go through a refund credit, instead of just lowering what the customer owes?",
    options: [
      { text: "Luna only lets goods ship once the invoice is paid in full, so by the time goods come back there's no unpaid balance to lower", correct: true, why: "Correct. Partial payments and credits don't unlock shipping. Because the sale is already paid, the return becomes money EMS owes the customer." },
      { text: "Because refund credits are quicker than ordinary credits", correct: false, why: "Not quite. It isn't about speed. It's because every shipped sale has already been paid in full." },
      { text: "Because damaged goods can't be credited", correct: false, why: "Not quite. The goods' condition only decides restocking. Both of today's returns, damaged and unopened, used a refund credit." },
    ],
    learn: ["Full payment before shipping → every return is a refund: refund credit (Director) → actual payment (after the money moves)."],
  },
];

// Where each hands-on task is done. Opening a different section during the task gets a hint.
const missionArea: Record<number, string> = {
  1: "Customer Returns", 2: "Customer Returns", 4: "Customer Returns", 5: "Customer Returns", 6: "Customer Returns",
  8: "Customer Returns", 9: "Customer Returns", 11: "Customer Returns", 12: "Customer Returns",
  14: "Customer Returns", 15: "Customer Returns", 17: "Customer Returns", 19: "Customer Returns",
};

// Step-by-step help shown after the second unsuccessful try on a task (by task number).
const missionHelp: Record<number, string[]> = {
  0: ["Returns from customers are handled in Customer Returns.", "Click “Customer Returns” in the left sidebar."],
  1: [
    "At the top of Customer Returns, choose Riverside Family Clinic in “Customer”.",
    "In “Customer order”, choose “SO-00026 — Riverside Family Clinic — invoice date 2026-10-15”.",
    "You can also click “Open returns” on the SO-00026 row in “Find another customer order”.",
  ],
  2: [
    "In “1. Select the returned item”, choose “ACS-SYR-5ML — Syringe 5 mL, luer lock” and type 3 in “Return quantity”.",
    "In “Reported condition”, choose “Reported damaged”.",
    "Type a reason of at least 10 characters, then click “Save return & review”.",
  ],
  4: [
    "The saved return is open under “1. Review & authorize return”. If you closed it, click “Find a saved return”, then “Open review” on RET-8a41f0c7.",
    "Tick the box that starts “I reviewed this item and quantity…”, then click “Authorize return & continue”.",
  ],
  5: [
    "Make sure “2. Receive & inspect” is the highlighted step button. The form is headed “Receive into quarantine”.",
    "“TR-LOT-0231 — 3 still returnable” should already be chosen. Type 3 in “Quantity physically received”.",
    "Type receiving notes of at least 10 characters, tick the confirmation box, then click “Save receipt & inspect”.",
  ],
  6: [
    "The form is headed “Inspect 3 unit(s) from TR-LOT-0231”, just below the “Lot TR-LOT-0231” box. If it's closed, click “Inspect received goods” in that box.",
    "Choose “Damaged” for the condition and tick “Product, original lot and item identity verified”.",
    "Choose “Ineligible for restock”, type findings of at least 10 characters, tick the last box, then click “Save inspection & continue”.",
  ],
  8: [
    "Make sure “3. Stock & customer balance” is the highlighted step button.",
    "In the box headed “Lot TR-LOT-0231”, click “Review refund credit”. Scroll down to the panel “Paid-sale return — refund to customer (GYD)”.",
    "Under “1. Prepare refund credit”, leave 10950.00 in “Refund credit amount (GYD)”, type a reason of at least 10 characters, then click “Save refund credit for Director”.",
  ],
  9: [
    "“2. Director approval” sits below “Refund credit history”. If it's closed, click “Review refund credit” next to RCN-00001 in “Refund credit history”.",
    "Tick “I approve this return credit and the amount EMS owes the customer.”, then click “Approve refund credit”.",
  ],
  11: [
    "In the panel “Paid-sale return — refund to customer (GYD)”, find RCN-00001 under “Refund credit history” and click “Record payment for this credit”.",
    "Leave 10950.00, choose “Republic Bank — Operating Account (GYD)” and “bank transfer”, and type RFC-RFD-0112 as the reference.",
    "Type payment notes of at least 10 characters, then click “Review approved refund payment”.",
  ],
  12: [
    "Under “Review actual refund payment”, tick “I confirm this refund has actually been paid to the customer.”",
    "Click “Record approved refund payment”. To fix something first, click “Change payment details”.",
  ],
  14: [
    "At the top of Customer Returns, choose St. Jude Community Hospital in “Customer”, then “SO-00027 — St. Jude Community Hospital” in “Customer order”. Or click “Show all”, then “Open returns” on the SO-00027 row in “Find another customer order”.",
    "Click “Find a saved return (1)” to open the list, then click “Open review” on RET-5c2e81d4.",
  ],
  15: [
    "In the box headed “Lot TR-LOT-0238”, click “Continue to stock & settlement”. You can also click the step button “3. Stock & customer balance”.",
    "Click “Review stock release”, tick the box that starts “I reviewed the eligible inspection…”, then click “Release stock and record adjustment”.",
  ],
  17: [
    "Make sure “3. Stock & customer balance” is the highlighted step button. In the box headed “Lot TR-LOT-0238”, click “Review refund credit”, then scroll down to the refund panel.",
    "Under “1. Prepare refund credit”, leave 8100.00, type a reason of at least 10 characters and click “Save refund credit for Director”.",
    "Under “2. Director approval”, tick the approval box and click “Approve refund credit”.",
  ],
  19: [
    "The step buttons sit at the top of “Return progress”: “2. Receive & inspect”, “3. Stock & customer balance” and “4. Review & print”.",
    "Click “4. Review & print”, then click “Print return receipt” in the box headed “Lot TR-LOT-0238”.",
  ],
};

type Feedback = { tone: "good" | "bad"; lines: string[]; help?: string[] } | null;

const lesson7Styles = `
.lsim[aria-label$="Lesson 7"] .lsim-table th, .lsim[aria-label$="Lesson 7"] .lsim-table td { white-space:normal; padding-left:6px; padding-right:6px; }
.lsim[aria-label$="Lesson 7"] .lsim-table td button { white-space:nowrap; }
.lsim[aria-label$="Lesson 7"] .lsim-table select { min-width:0 !important; }
.lsim-form select, .lsim-form input, .lsim-form textarea { width:100%; min-width:0; max-width:100%; box-sizing:border-box; }
.lsim-form textarea { min-height:60px; font:inherit; padding:8px; border:1px solid #c9d8ea; border-radius:8px; }
.lsim-fields > * { min-width:0; }
.lsim-table select, .lsim-table input { width:100%; min-width:0; box-sizing:border-box; }
.lsim-check { display:flex !important; gap:10px; align-items:flex-start; font-size:13px; margin:8px 0; }
.lsim-check input { width:18px !important; height:18px; flex-shrink:0; margin-top:2px; }
.lsim-sub { border:1px solid #dceafa; border-radius:10px; padding:10px 12px; margin-top:10px; background:#fbfdff; }
.lsim-sub h3, .lsim-sub h4 { font-size:15px; margin:0 0 6px; }
.lsim-sub p { font-size:13px; margin:4px 0; }
.lsim-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.lsim-rowbtns { display:flex; gap:6px; flex-wrap:wrap; }
.lsim-history li { font-size:13px; margin:4px 0; }
.lsim-steps { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
.lsim-saved summary, .lsim-sub details summary { cursor:pointer; color:#0b3d78; font-weight:600; }
.lsim-receipt { border:2px solid #1f6fd1; border-radius:10px; padding:10px 12px; margin:8px 0; background:#f4f9ff; }
.lsim-receipt-head { font-weight:700; font-size:15px; color:#0b3d78; margin-bottom:4px; }
.lsim-receipt p { font-size:13px; margin:2px 0 6px; }
`;

export default function DirectorLesson7Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [invoices] = useState<ReturnInvoice[]>(seedInvoices);
  const [requests, setRequests] = useState<ReturnRequest[]>(seedRequests);
  const [receipts, setReceipts] = useState<Receipt[]>(seedReceipts);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [gauzeOnHand, setGauzeOnHand] = useState(GAUZE_ON_HAND);

  // New customer return (app/customer-returns.tsx)
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [searchError, setSearchError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Return review (app/customer-return-review.tsx)
  const [lineId, setLineId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reqDate, setReqDate] = useState(today());
  const [condition, setCondition] = useState<Condition>("unknown");
  const [reason, setReason] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [approveConfirmed, setApproveConfirmed] = useState(false);

  // Receiving and inspection (app/customer-return-receiving.tsx)
  const [sourceLot, setSourceLot] = useState("");
  const [recQty, setRecQty] = useState("1");
  const [recDate, setRecDate] = useState(today());
  const [recNotes, setRecNotes] = useState("");
  const [recConfirmed, setRecConfirmed] = useState(false);
  const [recNotice, setRecNotice] = useState("");
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspDate, setInspDate] = useState(today());
  const [inspCondition, setInspCondition] = useState<Condition>("unknown");
  const [identity, setIdentity] = useState(false);
  const [storage, setStorage] = useState(false);
  const [decision, setDecision] = useState<Decision>("hold");
  const [inspNotes, setInspNotes] = useState("");
  const [inspConfirmed, setInspConfirmed] = useState(false);
  const [panel, setPanel] = useState<{ kind: "settle" | "restock"; receiptId: string } | null>(null);
  const [flow, setFlow] = useState<ReturnStep>("receive");

  // Paid-sale return settlement (app/paid-customer-return-settlement.tsx)
  const [settleNotice, setSettleNotice] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [chosenCredit, setChosenCredit] = useState<string | null>(null);
  const [creditConfirmed, setCreditConfirmed] = useState(false);
  const [payCreditId, setPayCreditId] = useState("");
  const [refundValue, setRefundValue] = useState("");
  const [refundBank, setRefundBank] = useState("");
  const [refundMethod, setRefundMethod] = useState("bank_transfer");
  const [refundRef, setRefundRef] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPlan, setRefundPlan] = useState<Omit<Refund, "id" | "invoice_id"> | null>(null);
  const [refundConfirmed, setRefundConfirmed] = useState(false);

  // Restock (app/customer-return-restock.tsx)
  const [restockConfirmed, setRestockConfirmed] = useState(false);
  const [restockNotice, setRestockNotice] = useState("");

  const idSeq = useRef(0);
  const nextId = () => { idSeq.current += 1; return (0x2b6e1f40 + idSeq.current * 0x9e3779).toString(16).slice(-8); };
  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0 });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));
  const selected = invoices.find((i) => i.id === selectedId) ?? null;
  const opened = requests.find((r) => r.id === openedId) ?? null;

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
  function miss(feedbackLines: string[]) {
    if (!mission) return;
    const tries = misses + 1;
    setMisses(tries);
    const help = tries >= 2 ? (mission.kind === "choice" ? revealChoice(mission.options) : missionHelp[step]) : undefined;
    setFeedback({ tone: "bad", lines: feedbackLines, help });
  }

  function formMiss(message: string) {
    if (!mission || advanceReady || mission.kind !== "do") return;
    miss([`Luna didn't save it: “${message}”`]);
  }

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

  function resetReview() {
    setLineId(""); setQuantity("1"); setReqDate(today()); setCondition("unknown"); setReason(""); setReviewNotice("");
    setOpenedId(null); setApproveConfirmed(false);
    resetReceiving();
  }

  function resetReceiving() {
    setSourceLot(""); setRecQty("1"); setRecDate(today()); setRecNotes(""); setRecConfirmed(false); setRecNotice("");
    setInspectId(null); setPanel(null); setFlow("receive");
    resetCredit(); resetRefund(); setRestockConfirmed(false); setRestockNotice("");
  }

  function resetCredit() {
    setSettleNotice(""); setCreditValue(""); setCreditReason(""); setChosenCredit(null); setCreditConfirmed(false);
  }

  function resetRefund() {
    setPayCreditId(""); setRefundValue(""); setRefundBank(""); setRefundMethod("bank_transfer"); setRefundRef(""); setRefundReason("");
    setRefundPlan(null); setRefundConfirmed(false);
  }

  function restart() {
    setStep(0); setFeedback(null); setAdvanceReady(false); setMisses(0); setSaveStatus("idle");
    setActive("Home"); setRequests(seedRequests); setReceipts(seedReceipts); setCredits([]); setRefunds([]); setGauzeOnHand(GAUZE_ON_HAND);
    setCustomerId(""); setSearch(""); setFilter(""); setSearchError(""); setSelectedId(null);
    resetReview();
  }

  function navigate(section: string) {
    setActive(section);
    setSelectedId(null);
    resetReview();
    toTop();
    const area = missionArea[step];
    if (mission && mission.kind === "do" && !advanceReady && area && section !== area) {
      miss([`You opened ${section}. This task is done in ${area}.`, `Click “${area}” in the left sidebar to go back.`]);
      return;
    }
    if (area && section === area && !advanceReady) setFeedback(null);
    attempt({ type: "navigate", section }, () => {});
  }

  /* ----- derived values ----- */

  const lineOf = (r: ReturnRequest) => invoices.find((i) => i.id === r.invoice_id)!.lines.find((l) => l.id === r.line_id)!;
  const requestOf = (rc: Receipt) => requests.find((r) => r.id === rc.request_id)!;
  const invoiceOfReceipt = (rc: Receipt) => invoices.find((i) => i.id === requestOf(rc).invoice_id)!;

  function availableToReturn(line: InvLine) {
    const approved = requests.filter((r) => r.line_id === line.id && r.status === "approved").reduce((s, r) => s + r.quantity, 0);
    return Math.max(0, line.quantity - approved);
  }

  function lotStillReturnable(line: InvLine) {
    const received = receipts.filter((rc) => requestOf(rc).line_id === line.id).reduce((s, rc) => s + rc.quantity, 0);
    return Math.max(0, line.shipped_from_lot - received);
  }

  const refundedOn = (credit: Credit) => refunds.filter((r) => r.credit_id === credit.id).reduce((s, r) => s + r.amount_cents, 0);
  const stillPayable = (credit: Credit) => Math.max(0, credit.amount_cents - refundedOn(credit));

  // luna_private.paid_return_basis(): the returned value less refund credits already drafted or approved.
  function basis(rc: Receipt): { blocked: string } | { available: number } {
    const latest = rc.inspections[rc.inspections.length - 1];
    if (!latest || latest.decision === "hold") return { blocked: "Complete inspection and an eligibility decision before settlement." };
    const inv = invoiceOfReceipt(rc);
    if (inv.paid_cents < inv.total_cents) return { blocked: "Paid-return credits require the original invoice to have been fully paid in cash or recorded customer payments." };
    const line = lineOf(requestOf(rc));
    const used = credits.filter((c) => c.receipt_id === rc.id && c.status !== "cancelled").reduce((s, c) => s + c.amount_cents, 0);
    return { available: Math.max(0, Math.min(rc.quantity * line.price_cents, inv.paid_cents) - used) };
  }

  /* ----- New customer return (app/customer-returns.tsx) ----- */

  function selectInvoice(invoice: ReturnInvoice | null) {
    setSelectedId(invoice?.id ?? null);
    resetReview();
    if (invoice) attempt({ type: "order-select", invoice }, () => {});
  }

  function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (value && !/^(SO-)?\d{1,9}$/i.test(value)) {
      setSearchError("Enter an SO number such as SO-00001. Choose a customer using the separate dropdown.");
      return;
    }
    setSearchError("");
    setFilter(value);
    selectInvoice(null);
  }

  const rows = invoices.filter((i) => {
    if (customerId && i.customer !== customerId) return false;
    if (filter) {
      const n = Number(filter.replace(/^SO-/i, ""));
      if (i.so !== n) return false;
    }
    return true;
  });

  /* ----- Return review (app/customer-return-review.tsx) ----- */

  function prepareReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (notYet(2)) return;
    setReviewNotice("");
    const line = selected.lines.find((l) => l.id === lineId);
    const qty = Number(quantity);
    try {
      if (!line || !/^[1-9]\d*$/.test(quantity) || qty > availableToReturn(line)) throw new Error("Choose an item and a whole-number quantity within the available amount.");
      if (reason.trim().length < 10 || reason.trim().length > 500) throw new Error("Enter a reason of 10–500 characters.");
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "Unable to complete this return action.";
      setReviewNotice(message);
      formMiss(message);
      return;
    }
    const id = selected.id === "i30" && line.id === "l30b" && !requests.some((r) => r.id === RIVERSIDE_REQUEST)
      ? RIVERSIDE_REQUEST
      : nextId();
    const request: ReturnRequest = { id, invoice_id: selected.id, line_id: line.id, quantity: qty, date: reqDate, condition, reason: reason.trim(), status: "draft" };
    attempt({ type: "prepare", invoice: selected, sku: line.sku, quantity: qty, condition }, () => {
      setRequests((prev) => [request, ...prev]);
      setLineId(""); setQuantity("1"); setCondition("unknown"); setReason("");
      setOpenedId(id); setApproveConfirmed(false); resetReceiving();
      setReviewNotice("Return draft saved. Review and authorize it below to continue.");
    });
  }

  function openReview(request: ReturnRequest) {
    setOpenedId(request.id);
    setApproveConfirmed(false);
    resetReceiving();
    setReviewNotice("");
    setSourceLot(onlyLot(request));
    attempt({ type: "open-review", request }, () => {});
  }

  // onlyReturnSource(): a sole eligible shipment lot is selected automatically.
  function onlyLot(request: ReturnRequest, receivedNow = 0) {
    const line = lineOf(request);
    return lotStillReturnable(line) - receivedNow > 0 ? line.shipped_lot.lot : "";
  }

  function approveReturn() {
    if (!opened) return;
    if (notYet(4)) return;
    if (!approveConfirmed) { setReviewNotice("Confirm the saved request before approving it."); return; }
    const line = lineOf(opened);
    if (opened.quantity > availableToReturn(line)) {
      setReviewNotice("Choose an item and a whole-number quantity within the available amount.");
      formMiss("Choose an item and a whole-number quantity within the available amount.");
      return;
    }
    const request = opened;
    attempt({ type: "approve", request }, () => {
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "approved", approved_at: today() } : r)));
      setApproveConfirmed(false);
      resetReceiving();
      setSourceLot(onlyLot(request));
      setReviewNotice("Return authorized. Continue with Receive & inspect below. Stock and the customer balance have not changed.");
    });
  }

  function cancelReturn() {
    if (!opened) return;
    setRequests((prev) => prev.map((r) => (r.id === opened.id ? { ...r, status: "cancelled" } : r)));
    setOpenedId(null);
    setReviewNotice("Return draft cancelled.");
  }

  /* ----- Receiving and inspection (app/customer-return-receiving.tsx) ----- */

  function recordReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opened) return;
    if (notYet(5)) return;
    setRecNotice("");
    const line = lineOf(opened);
    const received = receipts.filter((rc) => rc.request_id === opened.id).reduce((s, rc) => s + rc.quantity, 0);
    const remaining = opened.quantity - received;
    const qty = Number(recQty);
    let message = "";
    if (!sourceLot || !/^[1-9]\d*$/.test(recQty) || recNotes.trim().length < 10 || !recConfirmed) message = "Confirm the original lot, physical quantity and receiving notes.";
    else if (sourceLot !== line.shipped_lot.lot) message = "Choose a lot from this invoice item’s original shipment.";
    else if (qty > remaining) message = "Quantity exceeds the authorization’s unreceived amount.";
    else if (qty > lotStillReturnable(line)) message = "Quantity exceeds the amount still returnable from this original shipment lot.";
    if (message) { setRecNotice(message); formMiss(message); return; }
    const request = opened;
    const id = request.id === RIVERSIDE_REQUEST && !receipts.some((rc) => rc.id === RIVERSIDE_RECEIPT) ? RIVERSIDE_RECEIPT : `rc-${nextId().slice(0, 4)}`;
    attempt({ type: "receive", request, lot: sourceLot, quantity: qty }, () => {
      setReceipts((prev) => [...prev, { id, request_id: request.id, lot: sourceLot, date: recDate, quantity: qty, notes: recNotes.trim(), inspections: [] }]);
      setSourceLot(onlyLot(request, qty)); setRecQty("1"); setRecNotes(""); setRecConfirmed(false);
      setRecNotice("Physical receipt saved in quarantine. Saleable stock, inventory value and the customer balance have not changed.");
      setPanel(null); setFlow("receive"); setInspectId(id);
      setInspDate(today()); setInspCondition("unknown"); setDecision("hold"); setIdentity(false); setStorage(false); setInspNotes(""); setInspConfirmed(false);
    });
  }

  function openInspection(rc: Receipt) {
    const latest = rc.inspections[rc.inspections.length - 1];
    setFlow("receive");
    setPanel(null);
    setInspectId(rc.id);
    setInspDate(today()); setInspCondition(latest?.condition ?? "unknown"); setDecision(latest?.decision ?? "hold"); setIdentity(false); setStorage(false); setInspNotes(""); setInspConfirmed(false);
  }

  function saveInspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rc = receipts.find((r) => r.id === inspectId);
    if (!rc) return;
    if (notYet(6)) return;
    setRecNotice("");
    let message = "";
    if (!inspConfirmed || inspNotes.trim().length < 10 || inspNotes.trim().length > 1000) message = "Confirm the inspection date, condition, disposition and notes of 10–1000 characters.";
    else if (decision === "eligible_for_restock" && (inspCondition !== "unopened" || !identity || !storage)) message = "Restock eligibility requires unopened goods, verified product/lot identity, and verified storage history.";
    if (message) { setRecNotice(message); formMiss(message); return; }
    const inspection: Inspection = { date: inspDate, condition: inspCondition, decision, identity, storage, notes: inspNotes.trim() };
    attempt({ type: "inspect", receipt: rc, condition: inspCondition, decision, identity, storage }, () => {
      setReceipts((prev) => prev.map((r) => (r.id === rc.id ? { ...r, inspections: [...r.inspections, inspection] } : r)));
      setInspectId(null);
      if (decision !== "hold" && inspCondition !== "unknown") setFlow("resolve");
      setRecNotice("Inspection saved. The goods remain quarantined, including items marked eligible for restock. No stock release, credit, refund or disposal was performed.");
    });
  }

  function goFlow(next: ReturnStep) {
    setFlow(next); setInspectId(null); setPanel(null);
    resetCredit(); resetRefund(); setRestockConfirmed(false); setRestockNotice("");
  }

  function printReceipt(rc: Receipt) {
    attempt({ type: "print", receipt: rc }, () => setRecNotice("In real Luna this opens the Customer Return Receipt in a new window, ready to print."));
  }

  function openPanel(kind: "settle" | "restock", rc: Receipt) {
    setInspectId(null);
    resetCredit(); resetRefund(); setRestockConfirmed(false); setRestockNotice("");
    setPanel({ kind, receiptId: rc.id });
    // The amount field starts with the available return allowance.
    if (kind === "settle") {
      const b = basis(rc);
      if (!("blocked" in b) && b.available > 0) setCreditValue(decimalGyd(b.available));
    }
  }

  // Task where each receipt's refund credit is prepared and approved.
  const creditTask = (rc: Receipt) => (rc.id === SJ_RECEIPT ? 17 : 8);

  /* ----- 1. Prepare refund credit (prepare_luna_paid_return_credit) ----- */

  function prepareCredit(event: FormEvent<HTMLFormElement>, rc: Receipt) {
    event.preventDefault();
    if (notYet(creditTask(rc))) return;
    setSettleNotice("");
    let amount = 0;
    try {
      const b = basis(rc);
      if ("blocked" in b) throw new Error(b.blocked);
      amount = gydCents(creditValue);
      if (amount > b.available || creditReason.trim().length < 10 || creditReason.trim().length > 500) throw new Error("Choose today, a refund credit within the returned-item allowance, and a reason of 10–500 characters.");
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "Unable to save this return action.";
      setSettleNotice(message);
      formMiss(message);
      return;
    }
    const id = nextId();
    const credit: Credit = { id, number: credits.length + 1, receipt_id: rc.id, invoice_id: invoiceOfReceipt(rc).id, date: today(), amount_cents: amount, reason: creditReason.trim(), status: "draft" };
    attempt({ type: "credit-prepare", receipt: rc, amount_cents: amount }, () => {
      setCredits((prev) => [credit, ...prev]);
      setChosenCredit(id); setCreditConfirmed(false); setCreditValue(""); setCreditReason("");
      setSettleNotice("Refund credit saved for Director approval. No payment or stock release has occurred.");
    });
  }

  /* ----- 2. Director approval (post_luna_paid_return_credit / cancel_luna_paid_return_credit) ----- */

  function creditAction(kind: "post" | "cancel", rc: Receipt) {
    const credit = credits.find((c) => c.id === chosenCredit);
    if (!credit) { setSettleNotice("Choose a saved credit draft."); return; }
    if (kind === "cancel") {
      setCredits((prev) => prev.map((c) => (c.id === credit.id ? { ...c, status: "cancelled" } : c)));
      setChosenCredit(null); setCreditConfirmed(false);
      setSettleNotice("Draft cancelled.");
      const b = basis(rc);
      if (!("blocked" in b)) setCreditValue(decimalGyd(b.available + credit.amount_cents));
      return;
    }
    if (notYet(creditTask(rc) + (rc.id === SJ_RECEIPT ? 0 : 1))) return;
    if (!creditConfirmed) { setSettleNotice("Director confirmation is required."); return; }
    attempt({ type: "credit-post", credit }, () => {
      setCredits((prev) => prev.map((c) => (c.id === credit.id ? { ...c, status: "recorded" } : c)));
      setChosenCredit(null); setCreditConfirmed(false);
      setSettleNotice("Refund credit approved. EMS now owes this amount to the customer. Record the refund only after payment.");
    });
  }

  /* ----- Restock (app/customer-return-restock.tsx) ----- */

  function restockPlan(rc: Receipt): { error: string } | { cost: number; before: number; after: number; lotBefore: number; lotAfter: number } {
    const latest = rc.inspections[rc.inspections.length - 1];
    if (!latest || latest.decision !== "eligible_for_restock" || latest.condition !== "unopened" || !latest.identity || !latest.storage) {
      return { error: "The latest inspection must verify unopened goods, product identity and storage history and mark this batch eligible for restock." };
    }
    const line = lineOf(requestOf(rc));
    if (line.sku !== GAUZE.sku) return { error: "The latest inspection must verify unopened goods, product identity and storage history and mark this batch eligible for restock." };
    return { cost: rc.quantity * GAUZE_COST_CENTS_USD, before: gauzeOnHand, after: gauzeOnHand + rc.quantity, lotBefore: gauzeOnHand, lotAfter: gauzeOnHand + rc.quantity };
  }

  function releaseStock(rc: Receipt) {
    if (notYet(15)) return;
    const plan = restockPlan(rc);
    if ("error" in plan) { setRestockNotice(plan.error); formMiss(plan.error); return; }
    if (!restockConfirmed) return;
    attempt({ type: "restock", receipt: rc }, () => {
      setReceipts((prev) => prev.map((r) => (r.id === rc.id ? { ...r, restock: { id: "rs-71c2a9e0", date: today(), cost_cents: plan.cost, journal: "je-4f81b2d6" } } : r)));
      setGauzeOnHand(plan.after);
      setRestockConfirmed(false);
      setRestockNotice("Returned goods released to saleable stock. The inventory and accounting changes were saved together.");
    });
  }

  /* ----- 3. Record an actual refund payment (preview/record_luna_approved_return_refund) ----- */

  function choosePayment(credit: Credit) {
    setPayCreditId(credit.id);
    setRefundValue(decimalGyd(stillPayable(credit)));
    setRefundPlan(null); setRefundConfirmed(false);
  }

  function previewRefund(event: FormEvent<HTMLFormElement>, rc: Receipt) {
    event.preventDefault();
    // St. Jude's transfer hasn't gone out yet in this lesson.
    if (rc.id === SJ_RECEIPT) {
      const lines = ["St. Jude hasn't been paid yet. Accounts will send the transfer next week.", "Leave RCN-00002 showing “Refund still payable”. Record a refund payment only after the money has actually gone out."];
      if (mission && !advanceReady) miss(lines); else setFeedback({ tone: "bad", lines });
      return;
    }
    if (notYet(11)) return;
    setSettleNotice("");
    const credit = credits.find((c) => c.id === payCreditId);
    let amount = 0;
    try {
      if (!credit || credit.status !== "recorded") throw new Error("A Director must approve and post the refund credit before payment is recorded.");
      amount = gydCents(refundValue);
      if (amount > stillPayable(credit)) throw new Error("Enter today and an actual refund within the approved outstanding amount.");
      const ref = refundRef.trim();
      if (ref.length < 3 || ref.length > 100 || refundReason.trim().length < 10 || refundReason.trim().length > 500) throw new Error("Enter the payment method, actual payment reference and reason.");
      if (!refundBank) throw new Error("Choose an active GYD bank account.");
      if (refunds.some((r) => r.bank === refundBank && r.reference.toLowerCase() === ref.toLowerCase())) throw new Error("This actual refund reference was already recorded for this account.");
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "Unable to save this return action.";
      setSettleNotice(message);
      formMiss(message);
      return;
    }
    const plan = { credit_id: credit!.id, receipt_id: rc.id, date: today(), amount_cents: amount, bank: refundBank, method: refundMethod, reference: refundRef.trim(), reason: refundReason.trim() };
    attempt({ type: "refund-preview", receipt: rc, amount_cents: amount, bank: refundBank, method: refundMethod, reference: plan.reference }, () => {
      setRefundPlan(plan);
      setRefundConfirmed(false);
    });
  }

  function recordRefund(rc: Receipt) {
    if (!refundPlan || !refundConfirmed) { setSettleNotice("Confirm that the refund was actually paid."); return; }
    if (notYet(12)) return;
    const plan = refundPlan;
    attempt({ type: "refund-record", receipt: rc }, () => {
      setRefunds((prev) => [{ id: "e17c4a90", invoice_id: invoiceOfReceipt(rc).id, ...plan }, ...prev]);
      resetRefund();
      setSettleNotice("Actual refund recorded against the approved credit. Sales were not reversed again.");
    });
  }

  /* ---------- Rendering ---------- */

  function renderCustomerReturns() {
    return (
      <>
        <section className="lsim-module">
          <h2>Customer returns</h2>
          <p>Choose the customer and original SO order. Start a return or continue a saved request below.</p>
          <form className="lsim-form" onSubmit={runSearch} noValidate>
            <div className="lsim-fields">
              <label>Customer
                <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); selectInvoice(null); }}>
                  <option value="">Choose a customer</option>
                  {customers.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Search SO number
                <input maxLength={30} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SO-00001 or 1" />
              </label>
            </div>
            <div className="lsim-actions">
              <button type="submit" className="lsim-pbtn">Search SO</button>
              <button type="button" className="lsim-sbtn" onClick={() => { setCustomerId(""); setSearch(""); setFilter(""); setSearchError(""); selectInvoice(null); }}>Show all</button>
            </div>
            {searchError && <p className="lsim-status error" role="alert">{searchError}</p>}
            <label style={{ display: "block", marginTop: 10 }}>Customer order
              <select aria-label="Customer order" value={selected?.id ?? ""} onChange={(e) => selectInvoice(invoices.find((i) => i.id === e.target.value) ?? null)}>
                <option value="">Choose the original SO order</option>
                {rows.map((i) => <option key={i.id} value={i.id}>{soNumber(i.so)} — {i.customer} — invoice date {i.date}</option>)}
              </select>
            </label>
          </form>
          {selected ? (
            <>
              <p style={{ fontSize: 14, marginTop: 10 }}><strong>{soNumber(selected.so)} — {selected.customer}</strong></p>
              {renderReview(selected)}
            </>
          ) : <p style={{ fontSize: 13 }}>Select an order above or use Open returns below to open its return-entry table.</p>}
        </section>

        <section className="lsim-module">
          <h2>Find another customer order</h2>
          <p>Orders with recorded billing documents eligible for return review. Separate billed deliveries on the same SO are listed individually.</p>
          <p style={{ fontSize: 13 }}>{rows.length === 0 ? "No matching orders with recorded billing documents." : `Showing 1–${rows.length} of ${rows.length} billed deliveries.`}</p>
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Invoice date</th><th>Billing status</th><th>Returns</th></tr></thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td>{soNumber(i.so)}</td><td>{i.customer}</td><td>{i.date}</td><td>{i.status.replaceAll("_", " ")}</td>
                    <td><button type="button" className="lsim-sbtn" onClick={() => { selectInvoice(i); toTop(); }}>Open returns</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function renderReview(invoice: ReturnInvoice) {
    const item = invoice.lines.find((l) => l.id === lineId);
    const history = requests.filter((r) => r.invoice_id === invoice.id);
    const openHere = opened && opened.invoice_id === invoice.id ? opened : null;
    return (
      <div className="lsim-sub">
        <p>Follow this return from the original sale through physical inspection and customer settlement. Each saved action keeps its own audit record.</p>
        <p><strong>1. Select item &amp; authorize</strong> → 2. Receive &amp; inspect → 3. Stock &amp; customer balance → 4. Review &amp; print</p>
        {reviewNotice && <p className={`lsim-status ${isError(reviewNotice) ? "error" : ""}`} role="status">{reviewNotice}</p>}
        {!openHere && (
          <form className="lsim-form" onSubmit={prepareReturn} noValidate style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 14, margin: "0 0 6px" }}>1. Select the returned item</h4>
            <div className="lsim-table-wrap">
              <table className="lsim-table">
                <thead><tr><th style={{ width: "40%" }}>Product</th><th>Unit</th><th>Invoiced</th><th>Available to return</th><th>Return quantity</th></tr></thead>
                <tbody><tr>
                  <td>
                    <select aria-label="Invoice item" value={lineId} onChange={(e) => setLineId(e.target.value)}>
                      <option value="">Choose an invoiced item</option>
                      {invoice.lines.map((l) => <option key={l.id} value={l.id} disabled={availableToReturn(l) === 0}>{l.sku} — {l.name}</option>)}
                    </select>
                  </td>
                  <td>{item?.unit ?? "—"}</td><td>{item?.quantity ?? "—"}</td><td>{item ? availableToReturn(item) : "—"}</td>
                  <td><input aria-label="Return quantity in invoice units" type="number" min="1" step="1" style={{ width: 80 }} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></td>
                </tr></tbody>
              </table>
            </div>
            <div className="lsim-fields" style={{ marginTop: 8 }}>
              <label>Request date<input type="date" min={invoice.date} max={today()} value={reqDate} onChange={(e) => setReqDate(e.target.value)} /></label>
              <label>Reported condition
                <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
                  <option value="unknown">Not inspected</option>
                  <option value="unopened">Reported unopened</option>
                  <option value="opened">Reported opened</option>
                  <option value="damaged">Reported damaged</option>
                </select>
              </label>
            </div>
            <label style={{ display: "block", marginTop: 8 }}>Reason<textarea maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <button className="lsim-pbtn" style={{ marginTop: 8 }}>Save return &amp; review</button>
          </form>
        )}

        <details className="lsim-saved" style={{ marginTop: 12 }}>
          <summary>Find a saved return ({history.length})</summary>
          <p style={{ fontSize: 13 }}>{history.length === 0 ? "No return requests for this invoice." : `Showing 1–${history.length} of ${history.length} requests.`}</p>
          {history.length > 0 && (
            <div className="lsim-table-wrap">
              <table className="lsim-table">
                <thead><tr><th>Reference</th><th>Item</th><th>Quantity</th><th>Request date</th><th>Status</th><th>Review</th></tr></thead>
                <tbody>{history.map((r) => {
                  const l = lineOf(r);
                  return (
                    <tr key={r.id}>
                      <td>RET-{r.id}</td><td>{l.sku} — {l.name}</td><td>{r.quantity} {l.unit}</td><td>{r.date}</td>
                      <td>{r.status === "approved" ? "Authorized — open receiving status" : r.status}</td>
                      <td><button type="button" className="lsim-sbtn" onClick={() => openReview(r)}>Open review</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </details>
        {openHere && renderOpened(openHere, invoice)}
      </div>
    );
  }

  function renderOpened(r: ReturnRequest, invoice: ReturnInvoice) {
    const l = lineOf(r);
    return (
      <div className="lsim-sub" aria-label={`Saved return review RET-${r.id}`}>
        <h4>{r.status === "draft" ? "1. Review & authorize return" : "Return progress"}</h4>
        <details><summary style={{ fontSize: 13 }}>Full return reference</summary><p>RET-{r.id}</p></details>
        <p>Order: {soNumber(invoice.so)}. Customer: {invoice.customer}.</p>
        <p>Item: {l.sku} — {l.name}.</p>
        <p>Quantity: {r.quantity} {l.unit}. Request date: {r.date}.</p>
        <p>Reported condition: {r.condition}. This is a customer report; inspection is still required.</p>
        <p style={{ whiteSpace: "pre-wrap" }}>Reason: {r.reason}</p>
        <p>Status: {r.status}{r.approved_at ? `; approved ${r.approved_at}` : ""}.</p>
        {r.status === "draft" && (
          <>
            <label className="lsim-check"><input type="checkbox" checked={approveConfirmed} onChange={(e) => setApproveConfirmed(e.target.checked)} /> I reviewed this item and quantity and authorize the customer return. This approval does not record receipt, restock inventory, issue a credit or send money.</label>
            <div className="lsim-actions">
              <button type="button" className="lsim-pbtn" disabled={!approveConfirmed} onClick={approveReturn}>Authorize return &amp; continue</button>
              <button type="button" className="lsim-sbtn" onClick={cancelReturn}>Cancel draft</button>
            </div>
          </>
        )}
        {r.status === "approved" && renderReceiving(r, l)}
        <div className="lsim-actions"><button type="button" className="lsim-sbtn" onClick={() => { setOpenedId(null); resetReceiving(); }}>Back to item selection / saved returns</button></div>
      </div>
    );
  }

  function renderReceiving(r: ReturnRequest, line: InvLine) {
    const list = receipts.filter((rc) => rc.request_id === r.id);
    const received = list.reduce((s, rc) => s + rc.quantity, 0);
    const remaining = r.quantity - received;
    const inspecting = flow === "receive" ? list.find((rc) => rc.id === inspectId) ?? null : null;
    const panelReceipt = panel ? list.find((rc) => rc.id === panel.receiptId) ?? null : null;
    const steps: [ReturnStep, string][] = [["receive", "2. Receive & inspect"], ["resolve", "3. Stock & customer balance"], ["print", "4. Review & print"]];
    return (
      <div className="lsim-sub">
        <nav aria-label="Return workflow steps" className="lsim-steps">
          {steps.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={flow === value} className={flow === value ? "lsim-pbtn" : "lsim-sbtn"} onClick={() => goFlow(value)}>{label}</button>
          ))}
        </nav>
        <h4>{flow === "receive" ? "Receive & inspect returned goods" : flow === "resolve" ? "Resolve stock and customer balance" : "Review & print return receipts"}</h4>
        <p>{flow === "receive" ? "Record custody, then inspect the received goods. They remain in quarantine until an approved stock release." : flow === "resolve" ? "Stock release and customer settlement are separate decisions. Posting a credit does not restock goods; recording a refund does not send money." : "Print the physical return receipt. Printing does not confirm a stock release, credit or refund."}</p>
        {recNotice && <p className={`lsim-status ${isError(recNotice) ? "error" : ""}`} role="status">{recNotice}</p>}
        <p>Authorized: {r.quantity}. Physically received: {received}. Still expected: {remaining}. Quantities use the original invoice units.</p>
        {flow === "receive" && remaining > 0 && (
          <form className="lsim-form" onSubmit={recordReceipt} noValidate>
            <h4 style={{ fontSize: 14, margin: "6px 0" }}>Receive into quarantine</h4>
            <div className="lsim-fields">
              <label>Original shipment lot
                <select value={sourceLot} onChange={(e) => setSourceLot(e.target.value)}>
                  <option value="">Choose a verified lot</option>
                  <option value={line.shipped_lot.lot} disabled={!lotStillReturnable(line)}>{line.shipped_lot.lot} — {lotStillReturnable(line)} still returnable</option>
                </select>
              </label>
              <label>Quantity physically received<input type="number" min="1" step="1" value={recQty} onChange={(e) => setRecQty(e.target.value)} /></label>
              <label>Receipt date<input type="date" min={r.date} max={today()} value={recDate} onChange={(e) => setRecDate(e.target.value)} /></label>
            </div>
            {sourceLot && <p>Supplier lot: {line.shipped_lot.supplier_lot}. Expiration: {line.shipped_lot.expiration}. Product category: {line.shipped_lot.category}.</p>}
            <label style={{ display: "block", marginTop: 8 }}>Receiving notes<textarea maxLength={1000} value={recNotes} onChange={(e) => setRecNotes(e.target.value)} /></label>
            <label className="lsim-check"><input type="checkbox" checked={recConfirmed} onChange={(e) => setRecConfirmed(e.target.checked)} /> I counted these goods, verified the original shipment lot, and placed them in quarantine.</label>
            <button className="lsim-pbtn" disabled={!recConfirmed}>Save receipt &amp; inspect</button>
          </form>
        )}

        <h4 style={{ fontSize: 14, margin: "12px 0 4px" }}>Received items — choose the next action</h4>
        <div>
          {list.map((rc) => {
            const latest = rc.inspections[rc.inspections.length - 1];
            return (
              <div key={rc.id} className="lsim-receipt" role="group" aria-label={"Lot " + rc.lot}>
                <div className="lsim-receipt-head">Lot {rc.lot}</div>
                <p>Receipt date: {rc.date} · Quantity: {rc.quantity}</p>
                <p>Stock status: {rc.restock ? "Restocked on " + rc.restock.date : latest ? disposition(latest.decision) : "Awaiting inspection — quarantined"}</p>
                <div className="lsim-rowbtns">
                  {flow === "receive" && (
                    returnNeedsInspection(rc)
                      ? <button type="button" className="lsim-pbtn" onClick={() => openInspection(rc)}>Inspect received goods</button>
                      : <button type="button" className="lsim-pbtn" onClick={() => goFlow("resolve")}>Continue to stock &amp; settlement</button>
                  )}
                  {flow === "print" && <button type="button" className="lsim-pbtn" onClick={() => printReceipt(rc)}>Print return receipt</button>}
                  {flow === "resolve" && (
                    <>
                      {!canReviewReturnSettlement(rc)
                        ? <button type="button" className="lsim-pbtn" disabled={Boolean(rc.restock)} onClick={() => openInspection(rc)}>Complete inspection first</button>
                        : <>
                          <button type="button" className="lsim-pbtn" onClick={() => openPanel("settle", rc)}>Review refund credit</button>
                          <button type="button" className="lsim-sbtn" onClick={() => openPanel("settle", rc)}>Record customer refund</button>
                        </>}
                      {(rc.restock || latest?.decision === "eligible_for_restock") && <button type="button" className="lsim-sbtn" onClick={() => openPanel("restock", rc)}>{rc.restock ? "View saved stock release" : "Review stock release"}</button>}
                    </>
                  )}
                </div>
                {flow === "resolve" && !rc.restock && latest?.decision === "ineligible" && <p style={{ marginTop: 6 }}>Not eligible for resale. Financial settlement can be reviewed separately.</p>}
                {flow === "resolve" && (
                  <details style={{ marginTop: 6 }}><summary style={{ fontSize: 13 }}>More actions</summary>
                    <div className="lsim-rowbtns" style={{ marginTop: 6 }}>
                      <button type="button" className="lsim-sbtn" disabled={Boolean(rc.restock)} onClick={() => openInspection(rc)}>Review / repeat inspection</button>
                      <button type="button" className="lsim-sbtn" onClick={() => goFlow("print")}>Review &amp; print</button>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p style={{ fontSize: 13 }}>No goods have been received for this return. Record physical receipt in step 2 before inspection or settlement.</p>}
        </div>
        {flow === "print" && <p style={{ fontSize: 13 }}>For credit-note and refund documents, open the corresponding history in step 3. A physical receipt alone does not mean this return is financially settled.</p>}
        <p style={{ fontSize: 13 }}>{list.length} receipt(s). Showing up to 25 per page.</p>

        {inspecting && renderInspection(inspecting)}
        {flow === "resolve" && panel && panelReceipt && panel.kind === "settle" && renderSettlement(panelReceipt)}
        {flow === "resolve" && panel && panelReceipt && panel.kind === "restock" && renderRestock(panelReceipt)}
      </div>
    );
  }

  function renderInspection(rc: Receipt) {
    const latest = rc.inspections[rc.inspections.length - 1];
    return (
      <form className="lsim-form lsim-sub" onSubmit={saveInspection} noValidate>
        <h4>Inspect {rc.quantity} unit(s) from {rc.lot}</h4>
        <p>Receipt notes: {rc.notes}</p>
        {latest && <p>Latest inspection: {latest.date}; {disposition(latest.decision)}. Notes: {latest.notes}. Saving another inspection adds an audit record; it does not erase the earlier inspection. {rc.inspections.length} inspection(s) retained.</p>}
        <p>Inspect the entire received batch. If its condition is mixed, keep it on hold for separate handling. “Ineligible” does not record disposal.</p>
        <div className="lsim-fields">
          <label>Inspection date<input type="date" min={latest?.date ?? rc.date} max={today()} value={inspDate} onChange={(e) => setInspDate(e.target.value)} /></label>
          <label>Observed condition
            <select value={inspCondition} onChange={(e) => setInspCondition(e.target.value as Condition)}>
              <option value="unknown">Not established</option>
              <option value="unopened">Unopened</option>
              <option value="opened">Opened</option>
              <option value="damaged">Damaged</option>
            </select>
          </label>
        </div>
        <label className="lsim-check"><input type="checkbox" checked={identity} onChange={(e) => setIdentity(e.target.checked)} /> Product, original lot and item identity verified</label>
        <label className="lsim-check"><input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} /> Storage history and handling verified</label>
        <label style={{ display: "block" }}>Inspection decision
          <select value={decision} onChange={(e) => setDecision(e.target.value as Decision)}>
            <option value="hold">Keep on hold</option>
            <option value="ineligible">Ineligible for restock</option>
            <option value="eligible_for_restock">Eligible for a separate restock review</option>
          </select>
        </label>
        <p>Eligibility requires unopened goods, verified identity and storage history, and an unexpired lot when an expiration is recorded. Pharmaceutical returns remain on hold for separate release controls. Eligibility does not release stock.</p>
        <label style={{ display: "block" }}>Inspection findings<textarea maxLength={1000} value={inspNotes} onChange={(e) => setInspNotes(e.target.value)} /></label>
        <label className="lsim-check"><input type="checkbox" checked={inspConfirmed} onChange={(e) => setInspConfirmed(e.target.checked)} /> I inspected this batch and confirm the findings and decision. The goods remain quarantined.</label>
        <div className="lsim-actions">
          <button className="lsim-pbtn" disabled={!inspConfirmed}>Save inspection &amp; continue</button>
          <button type="button" className="lsim-sbtn" onClick={() => setInspectId(null)}>Close inspection</button>
        </div>
      </form>
    );
  }

  // app/paid-customer-return-settlement.tsx
  function renderSettlement(rc: Receipt) {
    const b = basis(rc);
    const notes = credits.filter((c) => c.receipt_id === rc.id).sort((x, y) => y.number - x.number);
    const chosen = credits.find((c) => c.id === chosenCredit && c.status === "draft") ?? null;
    const paying = credits.find((c) => c.id === payCreditId) ?? null;
    const payments = refunds.filter((r) => r.receipt_id === rc.id);
    const rcn = (c: Credit) => `RCN-${String(c.number).padStart(5, "0")}`;
    const bankName = (id: string) => gydBanks.find((x) => x.id === id)?.account ?? "";
    return (
      <section className="lsim-sub" aria-label="Paid-sale return — refund to customer (GYD)">
        <h3>Paid-sale return — refund to customer (GYD)</h3>
        <p>The original sale was paid before delivery. A Director-approved credit creates a refund payable to the customer. Recording the later payment clears that payable; it does not reduce the invoice balance or reverse sales again.</p>
        <p role="status">Only Directors can approve and post credit notes.</p>
        <button type="button" className="lsim-sbtn" onClick={() => setSettleNotice("")}>Refresh refund credits</button>
        {settleNotice && <p className={`lsim-status ${isError(settleNotice) ? "error" : ""}`} role="status">{settleNotice}</p>}
        {"blocked" in b && <p role="status">{b.blocked}</p>}

        {!("blocked" in b) && b.available > 0 && !chosen && (
          <form className="lsim-form" onSubmit={(e) => prepareCredit(e, rc)} noValidate>
            <h4 style={{ marginTop: 10 }}>1. Prepare refund credit</h4>
            <p>Available return allowance: {money(b.available)}. Credit date: {today()}.</p>
            <label style={{ display: "block" }}>Refund credit amount (GYD)<input inputMode="decimal" value={creditValue} onChange={(e) => setCreditValue(e.target.value)} /></label>
            <label style={{ display: "block", marginTop: 8 }}>Reason for refund credit<textarea maxLength={500} value={creditReason} onChange={(e) => setCreditReason(e.target.value)} /></label>
            <button className="lsim-pbtn" style={{ marginTop: 8 }}>Save refund credit for Director</button>
          </form>
        )}

        <h4 style={{ marginTop: 10 }}>Refund credit history</h4>
        {notes.length ? notes.map((n) => (
          <div key={n.id} className="lsim-sub" aria-label={rcn(n)}>
            <p><strong>{rcn(n)}</strong> · {money(n.amount_cents)} · {n.status === "recorded" ? "Director approved" : n.status}<br />{n.reason}</p>
            {n.status === "draft" && <button type="button" className="lsim-sbtn" onClick={() => { setChosenCredit(n.id); setCreditConfirmed(false); }}>Review refund credit</button>}
            {n.status === "recorded" && (
              <>
                <p>Refund still payable: {money(stillPayable(n))}</p>
                <div className="lsim-actions">
                  {stillPayable(n) > 0 && <button type="button" className="lsim-pbtn" onClick={() => choosePayment(n)}>Record payment for this credit</button>}
                  <button type="button" className="lsim-sbtn" onClick={() => setSettleNotice("In real Luna this opens the refund credit note in a new window, ready to print.")}>Print refund credit note</button>
                </div>
              </>
            )}
          </div>
        )) : <p>No refund credit has been prepared for this receipt.</p>}

        {chosen && (
          <section className="lsim-sub" aria-label="2. Director approval">
            <h4>2. Director approval</h4>
            <p>{money(chosen.amount_cents)} — {chosen.reason}</p>
            <label className="lsim-check"><input type="checkbox" checked={creditConfirmed} onChange={(e) => setCreditConfirmed(e.target.checked)} /> I approve this return credit and the amount EMS owes the customer.</label>
            <div className="lsim-actions">
              <button type="button" className="lsim-pbtn" disabled={!creditConfirmed} onClick={() => creditAction("post", rc)}>Approve refund credit</button>
              <button type="button" className="lsim-sbtn" onClick={() => creditAction("cancel", rc)}>Cancel credit draft</button>
            </div>
          </section>
        )}

        {paying && !refundPlan && (
          <form className="lsim-form lsim-sub" onSubmit={(e) => previewRefund(e, rc)} noValidate aria-label="3. Record an actual refund payment">
            <h4>3. Record an actual refund payment</h4>
            <p>Record this only after the customer has been paid. Date: {today()}.</p>
            <div className="lsim-fields">
              <label>Amount actually refunded (GYD)<input inputMode="decimal" value={refundValue} onChange={(e) => setRefundValue(e.target.value)} /></label>
              <label>GYD payment account
                <select value={refundBank} onChange={(e) => setRefundBank(e.target.value)}>
                  <option value="">Choose a GYD account</option>
                  {gydBanks.map((x) => <option key={x.id} value={x.id}>{x.institution} — {x.account}</option>)}
                </select>
              </label>
              <label>Refund payment method
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                  {["bank_transfer", "cash", "check", "credit_card", "other"].map((v) => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label>Actual refund payment reference<input maxLength={100} value={refundRef} onChange={(e) => setRefundRef(e.target.value)} /></label>
            </div>
            <label style={{ display: "block", marginTop: 8 }}>Payment notes<textarea maxLength={500} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></label>
            <button className="lsim-sbtn" style={{ marginTop: 8 }}>Review approved refund payment</button>
          </form>
        )}

        {refundPlan && (
          <section className="lsim-sub" aria-label="Review actual refund payment">
            <h4>Review actual refund payment</h4>
            <p>{money(refundPlan.amount_cents)} · {bankName(refundPlan.bank)}<br />{refundPlan.reference}</p>
            <label className="lsim-check"><input type="checkbox" checked={refundConfirmed} onChange={(e) => setRefundConfirmed(e.target.checked)} /> I confirm this refund has actually been paid to the customer.</label>
            <div className="lsim-actions">
              <button type="button" className="lsim-pbtn" disabled={!refundConfirmed} onClick={() => recordRefund(rc)}>Record approved refund payment</button>
              <button type="button" className="lsim-sbtn" onClick={() => { setRefundPlan(null); setRefundConfirmed(false); }}>Change payment details</button>
            </div>
          </section>
        )}

        <h4 style={{ marginTop: 10 }}>Refund payments</h4>
        {payments.length ? payments.map((f) => (
          <p key={f.id}>{f.date} · {money(f.amount_cents)} · {f.reference}{" "}
            <button type="button" className="lsim-sbtn" onClick={() => setSettleNotice("In real Luna this opens the refund receipt in a new window, ready to print. It names the approved return credit it pays.")}>Print refund receipt</button>
          </p>
        )) : <p>No payment has been recorded for these refund credits.</p>}
      </section>
    );
  }

  function renderRestock(rc: Receipt) {
    const inv = invoiceOfReceipt(rc);
    const line = lineOf(requestOf(rc));
    const plan = rc.restock ? null : restockPlan(rc);
    return (
      <section className="lsim-sub" aria-label="Returned stock release review">
        <h4>Returned stock release review</h4>
        <button type="button" className="lsim-sbtn" onClick={() => setRestockNotice("")}>Refresh release review</button>
        {plan && "error" in plan && <p className="lsim-status error" role="alert">{plan.error}</p>}
        {restockNotice && <p className={`lsim-status ${isError(restockNotice) ? "error" : ""}`} role="status">{restockNotice}</p>}
        {plan && !("error" in plan) && (
          <>
            <p>{invNumber(inv.number)} — {inv.customer}. {line.sku} — {line.name}.</p>
            <p>Original lot: {line.shipped_lot.lot}. Expiration: {line.shipped_lot.expiration}.</p>
            <p><strong>Release the entire inspected batch: {rc.quantity} {line.unit}.</strong> Posting date: {today()}, today in the company time zone.</p>
            <p>Saleable product quantity: {plan.before} → {plan.after}. Original lot quantity: {plan.lotBefore} → {plan.lotAfter}.</p>
            <p>Original lot value: {usd(plan.lotBefore * GAUZE_COST_CENTS_USD)} → {usd(plan.lotAfter * GAUZE_COST_CENTS_USD)}. Exact cost restored: <strong>{usd(plan.cost)}</strong>.</p>
            <p>The same approval records a debit to Inventory (1200) and a credit to Cost of Goods Sold (5000), each {usd(plan.cost)}.</p>
            <p>Cost uses the original shipment’s remaining unreturned value, including applied acquisition costs. Whole-cent rounding reconciles across successive returns. Customer invoice prices, amounts owed and payments are handled separately.</p>
            <label className="lsim-check"><input type="checkbox" checked={restockConfirmed} onChange={(e) => setRestockConfirmed(e.target.checked)} /> I reviewed the eligible inspection, original lot, quantity and USD cost. I approve releasing this batch from quarantine and recording the displayed accounting adjustment.</label>
            <div className="lsim-actions"><button type="button" className="lsim-pbtn" disabled={!restockConfirmed} onClick={() => releaseStock(rc)}>Release stock and record adjustment</button></div>
          </>
        )}
        {rc.restock && (
          <>
            <p><strong>This receipt was restocked on {rc.restock.date}.</strong> Quantity: {rc.quantity}. Cost restored: {usd(rc.restock.cost_cents)}.</p>
            <p>Saved release reference: {rc.restock.id}. Journal entry reference: {rc.restock.journal}</p>
            <p>Open General Ledger for the recorded adjustment. This receipt cannot be released a second time.</p>
          </>
        )}
        <p>Customer and product margin reports group by original invoice dates and use current net shipment costs after restocks. General Ledger records the adjustment on the release date. Credits and refunds are separate actions.</p>
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
    if (active === "Customer Returns") return renderCustomerReturns();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">This lesson works in Customer Returns. {active} is covered in {active === "Customer Returns" ? "this lesson" : coveredIn[active] ?? "a later lesson"}.</p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 7">
      <style>{simulatorStyles + formStyles + lesson7Styles}</style>
      <div className="lsim-top">TRAINING SIMULATOR · Fictional returns, credits and refunds · Not connected to production Luna</div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>Lesson 7 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}</h4>
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
            <p><strong>Lesson 7 complete.</strong></p>
            <p>You can now follow Luna&apos;s 4 guided return steps: take a customer return from request to authorization, receive it into quarantine against the original lot, and inspect it. Because every sale is paid in full before it ships, you settle each return with a refund credit that a Director approves, then record the actual payment once the money has gone out. You can also release eligible goods back to stock at their original cost.</p>
            <p>Next: Lesson 8 covers supplier returns and settlement.</p>
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

        <p className="lsim-footnote">Labels, statuses, validation messages and confirmations match the current Luna code. Records, bank accounts and references are fictional and reset when you restart, and nothing here changes production Luna.</p>
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
