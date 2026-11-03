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
  Luna Academy — Lesson 6 simulator: "Customer orders, invoices, payments, and shipments"

  Training only. This component never connects to production Luna.
  Labels, statuses, validation messages and confirmations are copied from
  the Luna_Accounting source (app/customer-orders.tsx, app/invoices-bills.tsx,
  accounting/order-shipment.ts, database/customer-invoice-before-shipment.sql,
  database/gyd-customer-payment-draft.sql, database/luna-authorization-levels.sql,
  docs/customer-invoice-before-shipment.md, docs/native-gyd-customer-sales.md;
  full payment before shipment as of Luna 21879b1,
  supabase/migrations/20261103042803_paid_customer_return_refunds.sql).
  Records, bank accounts and references are fictional and live only in this
  browser tab.
*/

const LESSON_TITLE = "Customer orders, invoices, payments, and shipments";

/* ---------- Fictional records ---------- */

type Product = { id: string; sku: string; name: string; unit: string; price_cents: number; on_hand: number; lot: string; category: "medical_supply" | "pharmaceutical" };
type OrderLine = { sku: string; name: string; unit: string; quantity: number; shipped: number; price_cents: number };
type Order = { id: string; number: number; customer: string; lines: OrderLine[]; status: "draft" | "partially_shipped" | "shipped" };
type Payment = { date: string; amount_cents: number; bank: string; method: string; reference: string };
type Invoice = {
  id: string; number: number; order_id: string; customer: string; date: string; due: string;
  lines: OrderLine[]; total_cents: number; status: "draft" | "recorded" | "partially_paid" | "paid"; payments: Payment[];
};
type Shipment = { order_id: string; date: string; lines: { sku: string; name: string; quantity: number; lot: string }[] };
type InputLine = { productId: string; quantity: string };

// Selling prices are GYD (docs/native-gyd-customer-sales.md). Pharmaceuticals never appear in the order form.
const seedProducts: Product[] = [
  { id: "p4", sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", unit: "Box", price_cents: 250000, on_hand: 30, lot: "TR-LOT-0252", category: "medical_supply" },
  { id: "p3", sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit: "Box", price_cents: 135000, on_hand: 64, lot: "TR-LOT-0238", category: "medical_supply" },
  { id: "p2", sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", price_cents: 365000, on_hand: 72, lot: "TR-LOT-0231", category: "medical_supply" },
  { id: "p1", sku: "LG-AMOX-500", name: "Amoxicillin 500 mg capsules", unit: "Case", price_cents: 2650000, on_hand: 4, lot: "TR-LOT-0219", category: "pharmaceutical" },
];

const customers = ["Bright Smile Dental Clinic", "Eastbank Pharmacy", "Harbour View Pharmacy", "Lakeside Care Home", "Riverside Family Clinic", "St. Jude Community Hospital"];
const termsDays: Record<string, number> = { "Harbour View Pharmacy": 15, "Bright Smile Dental Clinic": 30, "St. Jude Community Hospital": 45 };

const seedOrders: Order[] = [
  { id: "s28", number: 28, customer: "Bright Smile Dental Clinic", status: "draft", lines: [{ sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", quantity: 4, shipped: 0, price_cents: 365000 }] },
  { id: "s27", number: 27, customer: "St. Jude Community Hospital", status: "shipped", lines: [{ sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit: "Box", quantity: 20, shipped: 20, price_cents: 135000 }] },
];

const seedInvoices: Invoice[] = [
  {
    id: "i31", number: 31, order_id: "s27", customer: "St. Jude Community Hospital", date: "2026-10-20", due: "2026-12-04",
    lines: seedOrders[1].lines, total_cents: 2700000, status: "paid",
    payments: [{ date: "2026-10-21", amount_cents: 2700000, bank: "g1", method: "bank_transfer", reference: "SJ-4410" }],
  },
];

// GYD customer receipts go to a GYD bank account (database/gyd-customer-payment-draft.sql).
const gydBanks = [
  { id: "g1", label: "Republic Bank — Operating Account (GYD)" },
  { id: "g2", label: "Demerara Bank — Payroll Account (GYD)" },
];

const soNumber = (n: number) => `SO-${String(n).padStart(5, "0")}`;
const invNumber = (n: number) => `INV-${String(n).padStart(5, "0")}`;
const lineTotal = (l: { quantity: number; price_cents: number }) => l.quantity * l.price_cents;
const orderTotal = (o: { lines: OrderLine[] }) => o.lines.reduce((s, l) => s + lineTotal(l), 0);
const paidOf = (i: Invoice) => i.payments.reduce((s, p) => s + p.amount_cents, 0);

// app/customer-orders.tsx money(): "GYD 100000.00" (no thousands separator)
function money(cents: number) {
  return `GYD ${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// app/invoices-bills.tsx amountToCents. Academy also accepts grouped thousands such as 50,000.00.
function amountToCents(value: string) {
  const normalized = value.trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(normalized)) throw new Error("Enter a payment amount with no more than two decimal places.");
  const [whole, fraction = ""] = normalized.replace(/,/g, "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) throw new Error("Payment amount must be greater than zero.");
  return cents;
}

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

function orderStatusText(status: Order["status"]) {
  if (status === "shipped") return "Shipped";
  if (status === "partially_shipped") return "Partially shipped";
  return "Draft";
}

function invoiceStatusText(status: Invoice["status"]) {
  if (status === "partially_paid") return "Partially paid";
  if (status === "paid") return "Paid";
  if (status === "recorded") return "Recorded";
  return "Draft";
}

const isError = (text: string) => !/saved and confirmed|recorded in the accounting|Draft order invoice saved|In real Luna/.test(text);

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "tab"; tab: string }
  | { type: "orders-tab"; tab: string }
  | { type: "order-save"; customer: string; lines: { sku: string; quantity: number }[] }
  | { type: "order-view"; order: Order }
  | { type: "invoice-create"; order: Order }
  | { type: "invoice-record"; invoice: Invoice }
  | { type: "payment"; invoice: Invoice; amount_cents: number; bank: string; method: string; reference: string }
  | { type: "shipment"; order: Order; quantities: Record<string, number> };

type Mission =
  | { kind: "do"; prompt: string; details?: string[]; check: (e: Event) => string | null | undefined; learn: string[] }
  | { kind: "choice"; prompt: string; options: { text: string; correct: boolean; why: string }[]; learn: string[] };

const missions: Mission[] = [
  {
    kind: "do",
    prompt: "K. Williams at Harbour View Pharmacy has emailed an order. Open the section where customer orders are entered.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Customer Orders" ? null : `You opened ${e.section}. Orders that customers place with you are entered in Customer Orders.`),
    learn: [
      "Customer Orders is where you record what a customer wants to buy. Purchase Orders, from Lessons 3–5, are the opposite direction: what you buy from vendors.",
      "Luna's order of work for a sale is: order, invoice, record the invoice, full payment, then shipment.",
    ],
  },
  {
    kind: "do",
    prompt: "Enter Harbour View's order in “New customer order”, then click “Save Draft”.",
    details: [
      "Customer: Harbour View Pharmacy",
      "Item 1: NSM-GLOVE-M — Nitrile exam gloves, medium / Box, quantity 40",
      "Click “Add Item” for a second line",
      "Item 2: JRS-GAUZE-4X4 — Sterile gauze pads 4x4 / Box, quantity 10",
    ],
    check: (e) => {
      if (e.type !== "order-save") return undefined;
      if (e.customer !== "Harbour View Pharmacy") return `The order was for ${e.customer}. Choose Harbour View Pharmacy as the customer.`;
      const glove = e.lines.find((l) => l.sku === "NSM-GLOVE-M");
      const gauze = e.lines.find((l) => l.sku === "JRS-GAUZE-4X4");
      if (!glove || !gauze || e.lines.length !== 2) return "The order needs exactly two lines: NSM-GLOVE-M and JRS-GAUZE-4X4. Use “Add Item” for the second line and “Remove” for any extra line.";
      if (glove.quantity !== 40) return `Harbour View ordered 40 boxes of gloves. You entered ${glove.quantity}.`;
      if (gauze.quantity !== 10) return `Harbour View ordered 10 boxes of gauze. You entered ${gauze.quantity}.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Draft order saved and confirmed: SO-00029”. Luna assigns the order number when the order is saved.",
      "Prices are in GYD and come from the product catalog: GYD 2500.00 per box of gloves and GYD 1350.00 per box of gauze. The order total is GYD 113500.00. You can't type a different price on the order.",
    ],
  },
  {
    kind: "choice",
    prompt: "Harbour View also asked for 2 cases of Amoxicillin 500 mg capsules (LG-AMOX-500). It's in the catalog with 4 cases in stock, but it isn't in the order's product list. Why?",
    options: [
      { text: "It's out of stock", correct: false, why: "Not quite. The catalog shows 4 cases on hand. Stock doesn't control which products appear on the order form." },
      { text: "Pharmaceutical products can't be put on a customer order yet. They need their own authorization and tracing controls", correct: true, why: "Correct. The order form leaves out pharmaceutical products, and its footnote says: “Pharmaceutical ordering will follow its authorization and tracing controls.”" },
      { text: "It has no selling price", correct: false, why: "Not quite. Its selling price is GYD 26500.00 per case. The product is left out because it's a pharmaceutical." },
    ],
    learn: ["Tell the customer the medicine needs a separate, controlled process. Don't substitute it or add it under a different product."],
  },
  {
    kind: "choice",
    prompt: "SO-00029 now shows “Draft”. What has saving the draft done?",
    options: [
      { text: "It reserved 40 boxes of gloves and 10 boxes of gauze for Harbour View", correct: false, why: "Not quite. Luna's footnote says “Draft orders do not reserve stock.” Other orders can still use that stock until it ships." },
      { text: "It saved the products, quantities and GYD prices. No stock is reserved, nothing is invoiced and no account balance changes", correct: true, why: "Correct. A draft order is a record of what the customer asked for. The invoice, payment and shipment are separate records that come next." },
      { text: "It created the customer's invoice", correct: false, why: "Not quite. An order and an invoice are separate records. The invoice is created from the order in Invoices & Bills." },
    ],
    learn: ["Keep the four records apart: the order says what was asked for, the invoice says what's owed, the payment says what was received, and the shipment says what actually left."],
  },
  {
    kind: "do",
    prompt: "In “Recent customer orders”, click “View order” for SO-00029 and read the message under “Record items shipped”.",
    check: (e) => (e.type !== "order-view" ? undefined : e.order.number === 29 ? null : `${soNumber(e.order.number)} is ${e.order.customer}'s order. Harbour View's order is SO-00029.`),
    learn: [
      "Luna says: “Create and record the customer invoice, then record full payment before shipping.” The shipment boxes stay greyed out.",
      "The database enforces this too, so no screen can skip it. A draft invoice, another order's invoice, a partial payment or a credit doesn't unlock shipping.",
    ],
  },
  {
    kind: "do",
    prompt: "Open the section where customer invoices are created.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Invoices & Bills" ? null : `You opened ${e.section}. Customer invoices are made in Invoices & Bills.`),
    learn: ["You used Invoices & Bills for supplier bills in Lesson 4. Customer invoices are in the first two tabs."],
  },
  {
    kind: "do",
    prompt: "Open “Create Customer Invoice” and click “Create draft invoice” for SO-00029. Leave the invoice date as today.",
    check: (e) => (e.type !== "invoice-create" ? undefined : e.order.number === 29 ? null : `${soNumber(e.order.number)} belongs to ${e.order.customer}. Create the invoice for Harbour View's SO-00029.`),
    learn: [
      "Luna confirmed: “Draft order invoice saved. Review it, click Record invoice in accounts, then record full customer payment before shipping.”",
      "INV-00032 copies SO-00029's GYD prices with no exchange rate. The due date is 15 days after the invoice date, from Harbour View's payment terms.",
    ],
  },
  {
    kind: "do",
    prompt: "Review INV-00032, then click “Record invoice in accounts”.",
    check: (e) => (e.type !== "invoice-record" ? undefined : e.invoice.number === 32 ? null : "Record Harbour View's INV-00032."),
    learn: [
      "Luna confirmed: “INV-00032 recorded in the accounting records.” The status is now “Recorded” and the payment form appears.",
      "A draft invoice changes nothing in the accounts. Recording it creates the amount Harbour View owes.",
    ],
  },
  {
    kind: "choice",
    prompt: "INV-00032 is recorded but nothing has shipped. Where is the GYD 113500.00 in the accounts right now?",
    options: [
      { text: "In Sales Revenue, because the customer has been invoiced", correct: false, why: "Not quite. Sales are recognised as goods ship, not when the invoice is recorded." },
      { text: "In Accounts Receivable, balanced by 2200 Customer Orders Awaiting Delivery until the goods ship", correct: true, why: "Correct. The invoice page says “The undelivered value is held in Customer Orders Awaiting Delivery; sales and stock cost are recorded as goods ship.”" },
      { text: "Nowhere until the customer pays", correct: false, why: "Not quite. Recording the invoice creates the receivable straight away. The payment reduces it later." },
    ],
    learn: ["Each shipment moves its share of the value from 2200 to Sales Revenue and records the stock cost from the lots that left."],
  },
  {
    kind: "do",
    prompt: "Harbour View has sent a deposit. Record it on INV-00032 and click “Save payment”.",
    details: [
      "Payment date: today (already filled in)",
      "Amount received (GYD): 50000.00 (or 50,000.00)",
      "Deposit account: Republic Bank — Operating Account (GYD)",
      "Payment method: Bank transfer",
      "Reference: HVP-TRF-0193",
      "Check the amount, account, method and reference before you click “Save payment”. A saved payment can't be edited or deleted.",
    ],
    check: (e) => {
      if (e.type !== "payment") return undefined;
      if (e.amount_cents !== 5000000) return `The deposit was GYD 50000.00. You entered ${money(e.amount_cents)}.`;
      if (e.bank !== "g1") return "The deposit went into Republic Bank — Operating Account (GYD). Choose that account.";
      if (e.method !== "bank_transfer") return "Harbour View paid by bank transfer. Choose “Bank transfer” as the payment method.";
      if (e.reference.trim().toUpperCase() !== "HVP-TRF-0193") return "Type the bank reference exactly: HVP-TRF-0193. It lets the bank statement be matched later.";
      return null;
    },
    learn: [
      "Luna confirmed: “GYD payment saved and confirmed. Remaining balance: GYD 63500.00.” The status is now “Partially paid”.",
      "Customer receipts in GYD can only go into a GYD bank account. Record only money that has actually arrived.",
    ],
  },
  {
    kind: "choice",
    prompt: "Harbour View has paid GYD 50000.00 of INV-00032's GYD 113500.00. Can SO-00029 ship now?",
    options: [
      { text: "Yes. Any payment recorded against the order's invoice unlocks shipping", correct: false, why: "Not quite. Luna now requires full payment. Customer Orders would say: “Shipment blocked: record full customer payment. Partial payments and credit notes do not qualify.”" },
      { text: "No. The invoice must be paid in full first. Partial payments and credit notes don't qualify", correct: true, why: "Correct. Luna enables shipping only when the recorded customer payments equal the invoice total. Until then, Customer Orders shows “Shipment blocked: record full customer payment. Partial payments and credit notes do not qualify.”" },
      { text: "Yes, if a Director marks the invoice as paid", correct: false, why: "Not quite. Changing a status by hand doesn't count. Only recorded customer payments that add up to the full invoice total unlock shipping." },
    ],
    learn: ["Because goods only leave once the sale is fully paid, a later return is always settled as a refund to the customer (Lesson 7)."],
  },
  {
    kind: "do",
    prompt: "Harbour View has now sent the balance. Record it on INV-00032 and click “Save payment”.",
    details: [
      "Payment date: today (already filled in)",
      "Amount received (GYD): 63500.00 (or 63,500.00), the “Remaining balance” Luna showed after the deposit",
      "Deposit account: Republic Bank — Operating Account (GYD)",
      "Payment method: Bank transfer",
      "Reference: HVP-TRF-0207",
    ],
    check: (e) => {
      if (e.type !== "payment") return undefined;
      if (e.amount_cents !== 6350000) return `The balance is GYD 63500.00. You entered ${money(e.amount_cents)}. Anything less leaves the invoice partly paid, and shipping stays blocked.`;
      if (e.bank !== "g1") return "The money went into Republic Bank — Operating Account (GYD). Choose that account.";
      if (e.method !== "bank_transfer") return "Harbour View paid by bank transfer. Choose “Bank transfer” as the payment method.";
      if (e.reference.trim().toUpperCase() !== "HVP-TRF-0207") return "Type the bank reference exactly: HVP-TRF-0207. It lets the bank statement be matched later.";
      return null;
    },
    learn: [
      "Luna confirmed: “GYD payment saved and confirmed. Remaining balance: GYD 0.00.” The status is now “Paid”.",
      "The two payments together equal the invoice total, so shipping is now allowed.",
    ],
  },
  {
    kind: "do",
    prompt: "Go back to the section where shipments are recorded.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Customer Orders" ? null : `You opened ${e.section}. Shipments are recorded on the order in Customer Orders.`),
    learn: ["Shipments are recorded on the customer order, not on the invoice. One order invoice can cover several partial deliveries."],
  },
  {
    kind: "do",
    prompt: "Click “View order” for SO-00029 and read the message under “Record items shipped” again.",
    check: (e) => (e.type !== "order-view" ? undefined : e.order.number === 29 ? null : `${soNumber(e.order.number)} is ${e.order.customer}'s order. Open SO-00029.`),
    learn: [
      "Luna now says: “Invoice recorded and fully paid. Shipping is enabled.” The shipment boxes are unlocked.",
      "If the order was already open, “Refresh invoice and payment status” fetches the same check.",
    ],
  },
  {
    kind: "do",
    prompt: "Record what is actually leaving today, then click “Save shipment”.",
    details: [
      "Shipment date: today (already filled in)",
      "NSM-GLOVE-M: ship 30. Only 30 boxes are in stock; the other 10 stay owed.",
      "JRS-GAUZE-4X4: ship 10",
    ],
    check: (e) => {
      if (e.type !== "shipment") return undefined;
      const g = e.quantities["NSM-GLOVE-M"] ?? 0, z = e.quantities["JRS-GAUZE-4X4"] ?? 0;
      if (g !== 30) return `Ship all 30 boxes of gloves that are in stock. You entered ${g}.`;
      if (z !== 10) return `Ship all 10 boxes of gauze. You entered ${z}.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Shipment saved and confirmed for SO-00029.” The order is now “Partially shipped”, with 10 boxes of gloves still owed.",
      "Stock went down by exactly what shipped, taken from the oldest stock lots first. Luna moved the shipped value from 2200 into Sales Revenue and recorded the cost of those lots.",
      "“Print Delivery Note” makes the paper that travels with the goods and is signed on delivery.",
    ],
  },
  {
    kind: "do",
    prompt: "Open the “Shipped Items” tab at the top of Customer Orders to see what has shipped and what is still owed.",
    check: (e) => (e.type !== "orders-tab" ? undefined : e.tab === "shipped" ? null : "That's the order list. Click “Shipped Items”."),
    learn: ["Shipped Items lists every product that has shipped, with a “Still owed” column. SO-00029 shows 30 gloves shipped and 10 still owed, and 10 gauze shipped and 0 owed."],
  },
  {
    kind: "choice",
    prompt: "K. Williams emails: “When will the other 10 boxes of gloves arrive?” No new glove stock has been received and no delivery date is confirmed. Which reply should you send?",
    options: [
      { text: "“The remaining 10 boxes will be delivered this Friday.”", correct: false, why: "Not quite. No stock has arrived and no date is confirmed, so this promises something Luna can't back up." },
      { text: "“Today we shipped 30 boxes of gloves and 10 boxes of gauze (delivery note attached). 10 boxes of gloves are still owed. We'll confirm a delivery date once new stock has been received.”", correct: true, why: "Correct. It states what actually shipped, what's still owed, and makes no promise about an unconfirmed delivery." },
      { text: "“Your order has been fully shipped.”", correct: false, why: "Not quite. SO-00029 is “Partially shipped”. Shipped Items shows 10 boxes of gloves still owed." },
    ],
    learn: ["Base customer updates on what Luna shows: the shipment history, the delivery note and the “Still owed” column."],
  },
  {
    kind: "choice",
    prompt: "A Salesman created a customer order and asks you to let them record its shipment too. What does Luna allow?",
    options: [
      { text: "Salesmen can record shipments for their own orders", correct: false, why: "Not quite. In Luna's authorization levels, recording a shipment needs Director permission." },
      { text: "Director, Bookkeeper and Salesman can create customer orders, but only the Director can record shipments", correct: true, why: "Correct. database/luna-authorization-levels.sql gives order drafts “sales” permission and ship_sales_order “director” permission." },
      { text: "Anyone who can see the order can record its shipment", correct: false, why: "Not quite. Shipping reduces stock and posts accounting entries, so Luna limits it to the Director." },
    ],
    learn: ["Salesmen see approved selling prices, customer contacts and their own orders. They never see supplier costs."],
  },
];

// Where each hands-on task is done. Opening a different section during the task gets a hint.
const missionArea: Record<number, string> = {
  1: "Customer Orders", 4: "Customer Orders",
  6: "Invoices & Bills", 7: "Invoices & Bills", 9: "Invoices & Bills", 11: "Invoices & Bills",
  13: "Customer Orders", 14: "Customer Orders", 15: "Customer Orders",
};

// Step-by-step help shown after the second unsuccessful try on a task (by task number).
const missionHelp: Record<number, string[]> = {
  0: ["Customer orders are entered in Customer Orders.", "Click “Customer Orders” in the left sidebar."],
  1: [
    "In “Customer”, choose Harbour View Pharmacy.",
    "On Item 1, choose “NSM-GLOVE-M — Nitrile exam gloves, medium / Box” and type 40 in Quantity.",
    "Click “Add Item”. On Item 2, choose “JRS-GAUZE-4X4 — Sterile gauze pads 4x4 / Box” and type 10.",
    "Click “Save Draft”. If a message appears under the form, it names what Luna rejected.",
  ],
  4: ["Scroll to “Recent customer orders”.", "Click “View order” on the SO-00029 row (Harbour View Pharmacy, GYD 113500.00)."],
  5: ["Customer invoices are made in Invoices & Bills.", "Click “Invoices & Bills” in the left sidebar."],
  6: [
    "Click “Create Customer Invoice”, the first tab.",
    "Under “Customer orders ready to invoice”, find the SO-00029 row (Harbour View Pharmacy).",
    "Click “Create draft invoice” on that row.",
  ],
  7: [
    "Open the “Customer Invoices & Payments” tab and click “View invoice” on INV-00032 if it isn't open.",
    "At the bottom of the invoice, click “Record invoice in accounts”.",
  ],
  9: [
    "The payment form is under “Record a customer payment” on INV-00032. Open the invoice with “View invoice” if it's closed.",
    "Type 50000.00 as the amount and choose “Republic Bank — Operating Account (GYD)”.",
    "Choose “Bank transfer”, type HVP-TRF-0193 as the reference, then click “Save payment”.",
  ],
  11: [
    "The payment form is under “Record a customer payment” on INV-00032. Open the invoice with “View invoice” if it's closed.",
    "Type 63500.00 as the amount and choose “Republic Bank — Operating Account (GYD)”.",
    "Choose “Bank transfer”, type HVP-TRF-0207 as the reference, then click “Save payment”.",
  ],
  12: ["Shipments are recorded in Customer Orders.", "Click “Customer Orders” in the left sidebar."],
  13: ["If the Shipped Items tab is open, click the “Customer Orders” tab first.", "Click “View order” on the SO-00029 row."],
  14: [
    "Open SO-00029 with “View order” if it's closed.",
    "Under “Record items shipped”, type 30 in “Ship now” for NSM-GLOVE-M and 10 for JRS-GAUZE-4X4.",
    "Luna won't accept more than is in stock or still owed. Click “Save shipment”.",
  ],
  15: ["The two tabs are at the top of Customer Orders.", "Click “Shipped Items”."],
};

type Feedback = { tone: "good" | "bad"; lines: string[]; help?: string[] } | null;

const lesson6Styles = `
.lsim-form select, .lsim-form input { width:100%; min-width:0; max-width:100%; box-sizing:border-box; }
.lsim-fields > * { min-width:0; }
.lsim-table select, .lsim-table input { width:100%; min-width:0; box-sizing:border-box; }
.lsim-qty { width:80px !important; }
.lsim-subtabs { margin-bottom:12px; }
.lsim-billhead { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; }
.lsim-billmark { color:#b45309; letter-spacing:.15em; font-size:1rem; }
.lsim-billmark.done { color:#15803d; }
.lsim-totals p { margin:2px 0; font-size:13px; }
.lsim-gate { background:#f7fbff; border:1px solid #dceafa; border-radius:10px; padding:10px 12px; font-size:13px; margin:8px 0; }
.lsim-gate.open { background:#f0fdf4; border-color:#bbf7d0; }
.lsim-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
`;

export default function DirectorLesson6Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notice, setNotice] = useState("");

  // Customer Orders
  const [ordersTab, setOrdersTab] = useState<"orders" | "shipped">("orders");
  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState<InputLine[]>([{ productId: "", quantity: "1" }]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shipDate, setShipDate] = useState(today());
  const [shipQty, setShipQty] = useState<Record<string, string>>({});
  const [shipNotice, setShipNotice] = useState("");

  // Invoices & Bills
  const [tab, setTab] = useState("create-customer");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(today());
  const [payAmount, setPayAmount] = useState("");
  const [payBank, setPayBank] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0 });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));
  const orderable = products.filter((p) => p.category !== "pharmaceutical").sort((a, b) => a.name.localeCompare(b.name));
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) ?? null;
  const invoicedOrders = new Set(invoices.map((i) => i.order_id));
  const readyToInvoice = orders.filter((o) => o.status !== "shipped" && !invoicedOrders.has(o.id));

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

  function resetPayment() {
    setPayDate(today()); setPayAmount(""); setPayBank(""); setPayMethod("cash"); setPayRef("");
  }

  function restart() {
    setStep(0); setFeedback(null); setAdvanceReady(false); setMisses(0); setSaveStatus("idle");
    setActive("Home"); setProducts(seedProducts); setOrders(seedOrders); setInvoices(seedInvoices); setShipments([]); setNotice("");
    setOrdersTab("orders"); setCustomer(""); setLines([{ productId: "", quantity: "1" }]); setSelectedOrderId(null);
    setShipDate(today()); setShipQty({}); setShipNotice("");
    setTab("create-customer"); setInvoiceDate(today()); setSelectedInvoiceId(null); resetPayment();
  }

  function navigate(section: string) {
    setActive(section);
    setNotice("");
    setShipNotice("");
    setSelectedOrderId(null);
    setSelectedInvoiceId(null);
    toTop();
    const area = missionArea[step];
    if (mission && mission.kind === "do" && !advanceReady && area && section !== area) {
      miss([`You opened ${section}. This task is done in ${area}.`, `Click “${area}” in the left sidebar to go back.`]);
      return;
    }
    if (area && section === area && !advanceReady) setFeedback(null);
    attempt({ type: "navigate", section }, () => {});
  }

  function openOrdersTab(value: "orders" | "shipped") {
    setOrdersTab(value);
    setSelectedOrderId(null);
    setNotice("");
    attempt({ type: "orders-tab", tab: value }, () => {});
  }

  function openTab(value: string) {
    setTab(value);
    setNotice("");
    if (value !== "customers") setSelectedInvoiceId(null);
    attempt({ type: "tab", tab: value }, () => {});
  }

  /* ----- Customer Orders (app/customer-orders.tsx) ----- */

  function updateLine(index: number, field: keyof InputLine, value: string) {
    setNotice("");
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function estimate(line: InputLine) {
    const product = products.find((p) => p.id === line.productId);
    if (!product || !/^[1-9]\d{0,6}$/.test(line.quantity) || Number(line.quantity) > 1000000) return null;
    return product.price_cents * Number(line.quantity);
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notYet(1)) return;
    setNotice("");
    try {
      if (!customer) throw new Error("Choose a customer.");
      const request = lines.map((line) => {
        if (!line.productId || !/^[1-9]\d{0,6}$/.test(line.quantity) || Number(line.quantity) > 1000000) {
          throw new Error("Choose a product and a whole quantity from 1 to 1000000 on each line.");
        }
        return { productId: line.productId, quantity: Number(line.quantity) };
      });
      if (new Set(request.map((l) => l.productId)).size !== request.length) throw new Error("Combine repeated products into one line.");
      const saved = request.map((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        return { sku: p.sku, name: p.name, unit: p.unit, quantity: l.quantity, shipped: 0, price_cents: p.price_cents };
      });
      attempt({ type: "order-save", customer, lines: saved.map((l) => ({ sku: l.sku, quantity: l.quantity })) }, () => {
        const number = Math.max(...orders.map((o) => o.number)) + 1;
        setOrders((prev) => [{ id: `s${number}`, number, customer, lines: saved, status: "draft" }, ...prev]);
        setCustomer("");
        setLines([{ productId: "", quantity: "1" }]);
        setNotice(`Draft order saved and confirmed: ${soNumber(number)}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the order.";
      setNotice(message);
      formMiss(message);
    }
  }

  function viewOrder(order: Order) {
    attempt({ type: "order-view", order }, () => {
      setOrdersTab("orders");
      setSelectedOrderId(order.id);
      setShipDate(today());
      setShipQty({});
      setShipNotice("");
      setNotice("");
    });
  }

  // luna_private.paid_order_state() via get_luna_order_shipping_gate
  // (supabase/migrations/20261103042803_paid_customer_return_refunds.sql): full payment is required.
  function shippingGate(order: Order): { can_ship: boolean; message: string; earliest?: string } {
    const invoice = invoices.find((i) => i.order_id === order.id);
    if (!invoice || invoice.status === "draft") return { can_ship: false, message: "Create and record the customer invoice, then record full payment before shipping." };
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount_cents, 0);
    if (paid !== invoice.total_cents) return { can_ship: false, message: "Shipment blocked: record full customer payment. Partial payments and credit notes do not qualify." };
    const lastPayment = invoice.payments.map((p) => p.date).sort().slice(-1)[0];
    return { can_ship: true, message: "Invoice recorded and fully paid. Shipping is enabled.", earliest: lastPayment > invoice.date ? lastPayment : invoice.date };
  }

  function recordShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) return;
    if (notYet(14)) return;
    setShipNotice("");
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(shipDate)) throw new Error("Enter the shipment date as YYYY-MM-DD.");
      if (!isValidDate(shipDate)) throw new Error("Shipment date is invalid.");
      const gate = shippingGate(selectedOrder);
      if (!gate.can_ship) throw new Error(gate.message);
      if (gate.earliest && shipDate < gate.earliest) throw new Error("The shipment date cannot be before the invoice date or the first qualifying payment.");
      // accounting/order-shipment.ts buildShipmentLines
      const quantities: Record<string, number> = {};
      for (const line of selectedOrder.lines) {
        const raw = (shipQty[line.sku] ?? "").trim();
        if (raw === "" || raw === "0") continue;
        if (!/^[1-9]\d{0,6}$/.test(raw) || Number(raw) > 1000000) throw new Error(`Enter a whole shipment quantity from 0 to 1000000 for ${line.sku}.`);
        const quantity = Number(raw);
        const remaining = line.quantity - line.shipped;
        const available = products.find((p) => p.sku === line.sku)?.on_hand ?? 0;
        if (quantity > remaining) throw new Error(`${line.sku}: ${remaining} still owed. Enter no more than ${remaining}.`);
        if (quantity > available) throw new Error(`${line.sku}: only ${available} in stock. Enter no more than ${available}.`);
        quantities[line.sku] = quantity;
      }
      if (!Object.keys(quantities).length) throw new Error("Enter at least one quantity actually shipped.");
      attempt({ type: "shipment", order: selectedOrder, quantities }, () => {
        const newLines = selectedOrder.lines.map((l) => ({ ...l, shipped: l.shipped + (quantities[l.sku] ?? 0) }));
        const status: Order["status"] = newLines.every((l) => l.shipped >= l.quantity) ? "shipped" : "partially_shipped";
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, lines: newLines, status } : o)));
        setProducts((prev) => prev.map((p) => (quantities[p.sku] ? { ...p, on_hand: p.on_hand - quantities[p.sku] } : p)));
        setShipments((prev) => [{
          order_id: selectedOrder.id, date: shipDate,
          lines: selectedOrder.lines.filter((l) => quantities[l.sku]).map((l) => ({ sku: l.sku, name: l.name, quantity: quantities[l.sku], lot: products.find((p) => p.sku === l.sku)?.lot ?? "lot unavailable" })),
        }, ...prev]);
        setShipQty({});
        setShipNotice(`Shipment saved and confirmed for ${soNumber(selectedOrder.number)}.`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the shipment.";
      setShipNotice(message);
      formMiss(message);
    }
  }

  /* ----- Customer invoices (app/invoices-bills.tsx) ----- */

  function createInvoice(order: Order) {
    if (notYet(6)) return;
    setNotice("");
    try {
      if (!isValidDate(invoiceDate) || invoiceDate > today()) throw new Error("Choose an invoice date no later than the company date.");
      attempt({ type: "invoice-create", order }, () => {
        const number = Math.max(...invoices.map((i) => i.number)) + 1;
        const remainingLines = order.lines.filter((l) => l.quantity > l.shipped).map((l) => ({ ...l, quantity: l.quantity - l.shipped, shipped: 0 }));
        const invoice: Invoice = {
          id: `i${number}`, number, order_id: order.id, customer: order.customer, date: invoiceDate,
          due: addDays(invoiceDate, termsDays[order.customer] ?? 30), lines: remainingLines,
          total_cents: orderTotal({ lines: remainingLines }), status: "draft", payments: [],
        };
        setInvoices((prev) => [invoice, ...prev]);
        setTab("customers");
        setSelectedInvoiceId(invoice.id);
        resetPayment();
        setNotice("Draft order invoice saved. Review it, click Record invoice in accounts, then record full customer payment before shipping.");
        toTop();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the invoice.";
      setNotice(message);
      formMiss(message);
    }
  }

  function viewInvoice(invoice: Invoice) {
    setSelectedInvoiceId(invoice.id);
    setNotice("");
    resetPayment();
  }

  function recordInvoice(invoice: Invoice) {
    if (notYet(7)) return;
    attempt({ type: "invoice-record", invoice }, () => {
      setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: "recorded" } : i)));
      setNotice(`${invNumber(invoice.number)} recorded in the accounting records.`);
    });
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInvoice) return;
    if (notYet(9)) return;
    if (step === 10 && notYet(11)) return;
    if ((step !== 9 && step !== 11) || advanceReady) {
      const lines = [
        "This lesson's payments are already recorded, so this one wasn't saved.",
        "Luna doesn't let you edit or delete a saved customer payment. A payment saved by mistake needs a Director's reviewed correction, so check every field before you click “Save payment”.",
      ];
      setNotice("Payment not saved. This lesson's payments are already recorded.");
      setFeedback({ tone: "bad", lines: [...lines, ...(mission && !advanceReady ? [`Current task: ${mission.prompt}`] : [])] });
      return;
    }
    setNotice("");
    try {
      if (!payBank) throw new Error("Choose an active GYD bank account.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payDate)) throw new Error("Enter the payment date as YYYY-MM-DD.");
      if (!isValidDate(payDate)) throw new Error("Payment date is invalid.");
      const amount = amountToCents(payAmount);
      const balance = selectedInvoice.total_cents - paidOf(selectedInvoice);
      if (amount > balance) throw new Error("Payment exceeds the GYD balance due.");
      attempt({ type: "payment", invoice: selectedInvoice, amount_cents: amount, bank: payBank, method: payMethod, reference: payRef }, () => {
        const remaining = balance - amount;
        setInvoices((prev) => prev.map((i) => (i.id === selectedInvoice.id
          ? { ...i, status: remaining === 0 ? "paid" : "partially_paid", payments: [...i.payments, { date: payDate, amount_cents: amount, bank: payBank, method: payMethod, reference: payRef.trim() }] }
          : i)));
        resetPayment();
        setNotice(`GYD payment saved and confirmed. Remaining balance: ${money(remaining)}.`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record the payment.";
      setNotice(message);
      formMiss(message);
    }
  }

  /* ----- rendering ----- */

  function renderCustomerOrders() {
    const estimates = lines.map(estimate);
    const estimatedTotal = estimates.every((x) => x !== null) ? estimates.reduce<number>((s, x) => s + (x ?? 0), 0) : null;
    return (
      <>
        <section className="lsim-module lsim-subtabs">
          <div className="lsim-tabs" aria-label="Customer Orders sections">
            <button type="button" className="lsim-sbtn" aria-pressed={ordersTab === "orders"} onClick={() => openOrdersTab("orders")}>Customer Orders</button>
            <button type="button" className="lsim-sbtn" aria-pressed={ordersTab === "shipped"} onClick={() => openOrdersTab("shipped")}>Shipped Items</button>
          </div>
        </section>

        {ordersTab === "orders" && (
          <>
            <section className="lsim-module">
              <h2>New customer order</h2>
              <p>The order number is assigned when saved.</p>
              <form className="lsim-form" onSubmit={saveOrder} noValidate>
                <div className="lsim-fields">
                  <label>Customer
                    <select value={customer} onChange={(e) => { setNotice(""); setCustomer(e.target.value); }}>
                      <option value="">Choose a customer</option>
                      {customers.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
                <div className="lsim-table-wrap">
                  <table className="lsim-table">
                    <caption style={{ textAlign: "left", fontSize: 12, padding: "4px 0" }}>Customer order items</caption>
                    <thead><tr><th>Item</th><th style={{ width: "32%" }}>Product</th><th>SKU / Code</th><th>Unit</th><th>Quantity</th><th>Unit price (GYD)</th><th>Estimated amount (GYD)</th><th>Action</th></tr></thead>
                    <tbody>
                      {lines.map((line, index) => {
                        const product = products.find((p) => p.id === line.productId);
                        return (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>
                              <select style={{ minWidth: 260 }} aria-label={`Product for item ${index + 1}`} value={line.productId} onChange={(e) => updateLine(index, "productId", e.target.value)}>
                                <option value="">Choose a product</option>
                                {orderable.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} / {p.unit}</option>)}
                              </select>
                            </td>
                            <td>{product?.sku || "—"}</td>
                            <td>{product?.unit || "—"}</td>
                            <td><input className="lsim-qty" type="number" min={1} max={1000000} step={1} aria-label={`Quantity in the selected unit for item ${index + 1}`} value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} /></td>
                            <td>{product ? money(product.price_cents) : "—"}</td>
                            <td>{estimates[index] === null ? "Choose product and quantity" : money(estimates[index]!)}</td>
                            <td><button type="button" className="lsim-sbtn" disabled={lines.length === 1} aria-label={`Remove item ${index + 1}`} onClick={() => { setNotice(""); setLines((prev) => prev.filter((_, i) => i !== index)); }}>Remove</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="lsim-actions">
                  <button type="button" className="lsim-sbtn" disabled={lines.length >= 100} onClick={() => { setNotice(""); setLines((prev) => [...prev, { productId: "", quantity: "1" }]); }}>Add Item</button>
                  <button className="lsim-pbtn">Save Draft</button>
                </div>
              </form>
              <p style={{ fontSize: 13 }}><strong>Estimated total:</strong> {estimatedTotal === null ? "Complete all items" : money(estimatedTotal)}</p>
              {notice && !selectedOrder && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
              <p className="lsim-foot">Final prices are checked against saved product records when you save. Taxes and discounts are not included yet. Draft orders do not reserve stock. Create and record the invoice and full customer payment before shipment. Shipping reduces stock and records the related delivery accounting. Pharmaceutical ordering will follow its authorization and tracing controls.</p>
            </section>

            <section className="lsim-module">
              <h2>Recent customer orders</h2>
              <p>The 50 most recently created orders.</p>
              <div className="lsim-table-wrap">
                <table className="lsim-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{soNumber(o.number)}</td><td>{o.customer}</td><td>{money(orderTotal(o))}</td><td>{orderStatusText(o.status)}</td>
                        <td><button type="button" className="lsim-sbtn" onClick={() => viewOrder(o)}>View order</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {ordersTab === "shipped" && renderShippedItems()}
        {selectedOrder && renderOrder(selectedOrder)}
      </>
    );
  }

  function renderShippedItems() {
    const rows = orders.filter((o) => o.status !== "draft").flatMap((o) => o.lines.filter((l) => l.shipped > 0).map((l) => ({ o, l })));
    return (
      <section className="lsim-module">
        <div className="lsim-panelhead">
          <h2>Shipped Items</h2>
          <button type="button" className="lsim-sbtn">Refresh</button>
        </div>
        <p>Shipped product quantities for the 50 most recently created orders with shipments, including partially shipped orders. View an order for shipment dates and lot details.</p>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>Order</th><th>Customer</th><th>SKU / Code</th><th>Product</th><th>Unit</th><th>Shipped</th><th>Still owed</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map(({ o, l }) => (
                <tr key={o.id + l.sku}>
                  <td>{soNumber(o.number)}</td><td>{o.customer}</td><td>{l.sku}</td><td>{l.name}</td><td>{l.unit}</td><td>{l.shipped}</td><td>{l.quantity - l.shipped}</td>
                  <td><button type="button" className="lsim-sbtn" onClick={() => viewOrder(o)}>View order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p style={{ fontSize: 13 }}>No shipped items found.</p>}
        </div>
      </section>
    );
  }

  function renderOrder(order: Order) {
    const gate = shippingGate(order);
    const history = shipments.filter((s) => s.order_id === order.id);
    const seededHistory = order.id === "s27" ? [{ order_id: "s27", date: "2026-10-22", lines: [{ sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", quantity: 20, lot: "TR-LOT-0238" }] }] : [];
    const allHistory = [...history, ...seededHistory];
    return (
      <section className="lsim-module" aria-label={`${soNumber(order.number)} details`}>
        <h2>{soNumber(order.number)} — {orderStatusText(order.status)}</h2>
        <p>{order.customer}</p>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>Product</th><th>Unit</th><th>Ordered</th><th>Shipped</th><th>Still owed</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>{order.lines.map((l) => (
              <tr key={l.sku}><td>{l.sku} — {l.name}</td><td>{l.unit}</td><td>{l.quantity}</td><td>{l.shipped}</td><td>{l.quantity - l.shipped}</td><td>{money(l.price_cents)}</td><td>{money(lineTotal(l))}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {allHistory.length > 0 && (
          <button type="button" className="lsim-pbtn" style={{ marginTop: 8 }} onClick={() => setShipNotice("In real Luna this opens the delivery note for the latest shipment in a new window, ready to print and sign.")}>Print Delivery Note — latest shipment</button>
        )}
        <h3 style={{ fontSize: 15, margin: "12px 0 4px" }}>Shipment history</h3>
        {allHistory.length === 0 ? <p style={{ fontSize: 13 }}>No shipments recorded yet.</p> : (
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Date</th><th>Items and stock lots</th><th>Delivery note</th></tr></thead>
              <tbody>{allHistory.map((s, i) => (
                <tr key={i}>
                  <td>{s.date}</td>
                  <td>{s.lines.map((l) => `${l.sku} — ${l.name} × ${l.quantity}; lots: ${l.lot} × ${l.quantity}`).join(", ")}</td>
                  <td><button type="button" className="lsim-sbtn" onClick={() => setShipNotice("In real Luna this opens the delivery note in a new window, ready to print and sign.")}>Print Delivery Note</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {order.status !== "shipped" && (
          <form className="lsim-form" onSubmit={recordShipment} noValidate style={{ marginTop: 10 }}>
            <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>Record items shipped</h3>
            <p role="status" className={`lsim-gate ${gate.can_ship ? "open" : ""}`}>{gate.message}</p>
            {!gate.can_ship && <p style={{ fontSize: 13, margin: "4px 0" }}><button type="button" className="lsim-sbtn" onClick={() => navigate("Invoices & Bills")}>Open Invoices &amp; Bills to create the invoice or record payment</button></p>}
            <button type="button" className="lsim-sbtn" onClick={() => viewOrder(order)}>Refresh invoice and payment status</button>
            <fieldset disabled={!gate.can_ship} style={{ border: 0, padding: 0, margin: "8px 0 0", minWidth: 0 }}>
              <p style={{ fontSize: 13, margin: "0 0 6px" }}>Only enter quantities that have actually left your business. Available stock is checked before saving.</p>
              <label style={{ maxWidth: 260, display: "block" }}>Shipment date<input type="date" min={gate.earliest} value={shipDate} onChange={(e) => setShipDate(e.target.value)} /></label>
              <p style={{ fontSize: 13, margin: "6px 0" }}>Only products saved on {soNumber(order.number)} appear below. Quantities are allocated from available stock lots in receipt order.</p>
              <div className="lsim-table-wrap">
                <table className="lsim-table">
                  <thead><tr><th>Ordered product</th><th>Unit</th><th>Still owed</th><th>Ship now</th></tr></thead>
                  <tbody>{order.lines.filter((l) => l.quantity > l.shipped).map((l) => {
                    const remaining = l.quantity - l.shipped;
                    const available = products.find((p) => p.sku === l.sku)?.on_hand ?? 0;
                    const entered = shipQty[l.sku] ?? "";
                    const limit = Math.min(remaining, available);
                    return (
                      <tr key={l.sku}>
                        <th scope="row">{l.sku} — {l.name}</th><td>{l.unit}</td><td>{remaining}</td>
                        <td>
                          <input className="lsim-qty" type="number" min={0} max={limit} step={1} disabled={available === 0} aria-label={`Quantity to ship for ${l.sku} — ${l.name}`} value={entered}
                            onChange={(e) => { setShipNotice(""); setShipQty((prev) => ({ ...prev, [l.sku]: e.target.value })); }} />
                          <small style={{ display: "block" }}>Available: {available} {l.unit}</small>
                          {entered !== "" && Number(entered) > limit && <span role="alert" style={{ color: "#b42318", fontSize: 12 }}>Enter no more than {limit}.</span>}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              <button className="lsim-pbtn" style={{ marginTop: 8 }}>Save shipment</button>
            </fieldset>
          </form>
        )}
        {shipNotice && <p className={`lsim-status ${isError(shipNotice) ? "error" : ""}`} role="status">{shipNotice}</p>}
        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
        <p style={{ fontSize: 13 }}><strong>Saved total: {money(orderTotal(order))}</strong></p>
        <button type="button" className="lsim-sbtn" onClick={() => { setSelectedOrderId(null); setShipNotice(""); }}>Close details</button>
      </section>
    );
  }

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
        {tab === "create-customer" && renderCreateInvoice()}
        {tab === "customers" && renderInvoices()}
        {!["create-customer", "customers"].includes(tab) && (
          <section className="lsim-module">
            <p className="lsim-note" style={{ margin: 0 }}>Vendor bills were covered in Lesson 4. Credit notes and items awaiting accounting are covered in later lessons. This lesson uses “Create Customer Invoice” and “Customer Invoices &amp; Payments”.</p>
          </section>
        )}
      </>
    );
  }

  function renderCreateInvoice() {
    return (
      <section className="lsim-module">
        <h2>Create a draft customer invoice</h2>
        <p>Create the invoice from a saved customer order before shipment. Record it in accounts, then record full customer payment to unlock shipping. Partial payments do not qualify. Saving a draft does not change stock or account balances.</p>
        <div className="lsim-form"><label style={{ maxWidth: 260, display: "block" }}>Invoice date<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label></div>
        <p style={{ fontSize: 13 }}>New customer orders are priced in GYD. Their saved prices carry directly to the invoice without currency conversion.</p>
        <h3 style={{ fontSize: 15, margin: "10px 0 4px" }}>Customer orders ready to invoice</h3>
        {readyToInvoice.length ? (
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Still awaiting shipment</th><th>Action</th></tr></thead>
              <tbody>{readyToInvoice.map((o) => (
                <tr key={o.id}>
                  <td>{soNumber(o.number)}</td><td>{o.customer}</td>
                  <td>{o.lines.filter((l) => l.quantity > l.shipped).map((l) => `${l.quantity - l.shipped} × ${l.name}`).join(", ")}</td>
                  <td><button type="button" className="lsim-pbtn" onClick={() => createInvoice(o)}>Create draft invoice</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p style={{ fontSize: 13 }}>No saved orders are waiting for an order invoice.</p>}
        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
        <p className="lsim-foot">Each order has one invoice for its remaining undelivered items. Existing shipped deliveries can still be billed separately. Taxes are not included yet. Pharmaceutical items need their tracking controls before they can be invoiced.</p>
      </section>
    );
  }

  function renderInvoices() {
    return (
      <>
        <section className="lsim-module">
          <h2>Customer invoices &amp; payments</h2>
          <p>Open an invoice to review or record it, record customer payments, and print the customer document.</p>
          <button type="button" className="lsim-pbtn" onClick={() => openTab("create-customer")}>Create customer invoice</button>
          {notice && !selectedInvoice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
          <div className="lsim-table-wrap" style={{ marginTop: 10 }}>
            <table className="lsim-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Order</th><th>Date</th><th>Due</th><th>Total</th><th>Balance due</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>{invoices.map((i) => {
                const order = orders.find((o) => o.id === i.order_id);
                return (
                  <tr key={i.id}>
                    <td>{invNumber(i.number)}</td><td>{i.customer}</td><td>{order ? soNumber(order.number) : "—"}</td><td>{i.date}</td><td>{i.due}</td>
                    <td>{money(i.total_cents)}</td><td>{money(i.total_cents - paidOf(i))}</td><td>{invoiceStatusText(i.status)}</td>
                    <td><button type="button" className="lsim-sbtn" onClick={() => viewInvoice(i)}>View invoice</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </section>
        {selectedInvoice && renderInvoice(selectedInvoice)}
      </>
    );
  }

  function renderInvoice(invoice: Invoice) {
    const order = orders.find((o) => o.id === invoice.order_id);
    const paid = paidOf(invoice);
    const balance = invoice.total_cents - paid;
    return (
      <section className="lsim-module" aria-label={`${invNumber(invoice.number)} details`}>
        <div className="lsim-billhead">
          <div><p style={{ margin: 0 }}><strong>Elevate Medical Solutions</strong></p><h2>{invNumber(invoice.number)}</h2></div>
          <strong className={`lsim-billmark ${invoice.status === "draft" ? "" : "done"}`}>{invoice.status === "draft" ? "DRAFT" : "INVOICE"}</strong>
        </div>
        <div className="lsim-dl">
          <p><strong>Customer order:</strong> {order ? soNumber(order.number) : "—"}</p>
          <p><strong>Bill to:</strong> {invoice.customer}</p>
          <p>Invoice date: {invoice.date} · Due date: {invoice.due}</p>
        </div>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>Product</th><th>Unit</th><th>Quantity invoiced</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>{invoice.lines.map((l) => (
              <tr key={l.sku}><td>{l.sku} — {l.name}</td><td>{l.unit}</td><td>{l.quantity}</td><td>{money(l.price_cents)}</td><td>{money(lineTotal(l))}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="lsim-totals" style={{ marginTop: 8 }}>
          <p>Subtotal: {money(invoice.total_cents)}</p>
          <p>Tax: GYD 0.00</p>
          <p><strong>Total: {money(invoice.total_cents)}</strong></p>
          <p>Payments received: {money(paid)}</p>
          <p>Posted credit notes: GYD 0.00</p>
          <p><strong>Balance due: {money(balance)}</strong></p>
        </div>
        <p style={{ fontSize: 13 }}>{invoice.status === "draft"
          ? "The invoice is still a draft and has not changed account balances. Missing acquisition costs do not prevent recording."
          : "Invoice recorded. Record full customer payment before shipment. The undelivered value is held in Customer Orders Awaiting Delivery; sales and stock cost are recorded as goods ship."}</p>
        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}

        <h3 style={{ fontSize: 15, margin: "12px 0 4px" }}>Payment history</h3>
        {invoice.payments.length ? (
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Received into</th><th>Method</th><th>Reference</th></tr></thead>
              <tbody>{invoice.payments.map((p, i) => (
                <tr key={i}><td>{p.date}</td><td>{money(p.amount_cents)}</td><td>{gydBanks.find((b) => b.id === p.bank)?.label ?? p.bank}</td><td>{p.method.replaceAll("_", " ")}</td><td>{p.reference || "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p style={{ fontSize: 13 }}>No payments recorded yet.</p>}

        {invoice.status !== "draft" && balance > 0 && (
          <form className="lsim-form" onSubmit={savePayment} noValidate style={{ marginTop: 10 }}>
            <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>Record a customer payment</h3>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>Balance due: {money(balance)}</p>
            <div className="lsim-fields">
              <label>Payment date<input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></label>
              <label>Amount received (GYD)<input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></label>
              <label>Deposit account
                <select value={payBank} onChange={(e) => setPayBank(e.target.value)}>
                  <option value="">Choose a GYD bank account</option>
                  {gydBanks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
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
            </div>
            <button className="lsim-pbtn" style={{ marginTop: 8 }}>Save payment</button>
          </form>
        )}

        <div className="lsim-actions">
          {invoice.status === "draft" && <button type="button" className="lsim-pbtn" onClick={() => recordInvoice(invoice)}>Record invoice in accounts</button>}
          <button type="button" className="lsim-sbtn">Print Invoice</button>
          <button type="button" className="lsim-sbtn">Save as PDF</button>
          <button type="button" className="lsim-sbtn" onClick={() => { setSelectedInvoiceId(null); setNotice(""); }}>Close details</button>
        </div>
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
    if (active === "Customer Orders") return renderCustomerOrders();
    if (active === "Invoices & Bills") return renderInvoicesBills();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">This lesson works in Customer Orders and Invoices &amp; Bills. {active} is covered in {coveredIn[active] ?? "a later lesson"}.</p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 6">
      <style>{simulatorStyles + formStyles + lesson6Styles}</style>
      <div className="lsim-top">TRAINING SIMULATOR · Fictional orders, invoices and payments · Not connected to production Luna</div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>Lesson 6 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}</h4>
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
            <p><strong>Lesson 6 complete.</strong></p>
            <p>You can now enter a customer order in GYD, create and record its invoice, record payments into a GYD bank account until the invoice is paid in full, and only then ship what is in stock. You can also explain why an order, an invoice, a payment and a shipment are separate records, and write a customer update that doesn&apos;t promise an unconfirmed delivery.</p>
            <p>Next: Lesson 7 covers customer returns, credits and refunds.</p>
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
