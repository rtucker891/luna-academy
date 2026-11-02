"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAcademyAuth } from "./academy-auth";
import {
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
  Luna Academy — Lesson 3 simulator: "Purchase orders and Director approval"

  Training only. This component never connects to production Luna.
  Labels, statuses, validation messages and confirmations are copied from
  the Luna_Accounting source (app/purchase-orders.tsx,
  app/director-approval.tsx, accounting/journal.ts moneyToCents).
  Records are fictional and live only in this browser tab.
*/

const LESSON_TITLE = "Purchase orders and Director approval";

/* ---------- Fictional records ---------- */

type Vendor = { id: string; company_name: string; country: string; currency: string; address: string; contact_name: string; phone: string; email: string };
type Customer = { id: string; company_name: string; billing_address: string; shipping_address: string; contact_name: string; phone: string; email: string };
type Product = { id: string; vendor_id: string; sku: string; name: string; unit_of_measure: "Box" | "Each" | "Case"; box_contents: number | null; pack_contents: number | null; purchase_cost_cents: number };
type Line = { product_id: string; sku: string; name: string; unit: "Pack" | "Box" | "Each"; contents: number; quantity: number; price_cents: number };
type Order = {
  id: string;
  po_number: number;
  vendor_id: string;
  customer_id: string;
  prepared_by: string;
  created: string;
  expected: string;
  delivery_address: string;
  lines: Line[];
  discount_cents: number;
  status: "draft" | "approved";
  submitted: boolean;
  version: number;
  approved_by?: string;
  approved_at?: string;
  approved_version?: number;
  returned_reason?: string;
};

const vendors: Vendor[] = [
  { id: "v9", company_name: "Northstar Medical Supply", country: "United States", currency: "USD", address: "410 Commerce Way, Atlanta, GA", contact_name: "D. Price", phone: "1-404-555-0109", email: "orders@northstar.example" },
  { id: "v8", company_name: "Atlantic Clinical Supply", country: "United States", currency: "USD", address: "100 Harbor Blvd, Miami, FL", contact_name: "J. Moore", phone: "1-305-555-0108", email: "sales@atlanticclinical.example" },
  { id: "v6", company_name: "Jade River Surgical Co.", country: "China", currency: "USD", address: "88 Export Road, Shanghai", contact_name: "L. Chen", phone: "86-21-555-0106", email: "trade@jaderiver.example" },
];

const customers: Customer[] = [
  { id: "c16", company_name: "Harbour View Pharmacy", billing_address: "3 Harbour Road, Georgetown", shipping_address: "3 Harbour Road\nGeorgetown", contact_name: "K. Williams", phone: "592-555-0116", email: "orders@harbourview.example" },
  { id: "c13", company_name: "St. Jude Community Hospital", billing_address: "40 Hospital Avenue, New Amsterdam", shipping_address: "Receiving dock, 40 Hospital Avenue\nNew Amsterdam", contact_name: "Dr. A. Khan", phone: "592-555-0113", email: "purchasing@stjude.example" },
  { id: "c12", company_name: "Bright Smile Dental Clinic", billing_address: "27 Camp Street, Georgetown", shipping_address: "14 Main Street\nGeorgetown", contact_name: "Dr. L. Thomas", phone: "592-555-0112", email: "office@brightsmile.example" },
];

const products: Product[] = [
  { id: "p4", vendor_id: "v9", sku: "NSM-GLOVE-M", name: "Nitrile exam gloves, medium", unit_of_measure: "Box", box_contents: 100, pack_contents: null, purchase_cost_cents: 850 },
  { id: "p5", vendor_id: "v9", sku: "NSM-MASK-L3", name: "Surgical masks, level 3", unit_of_measure: "Box", box_contents: 50, pack_contents: null, purchase_cost_cents: 1200 },
  { id: "p3", vendor_id: "v6", sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit_of_measure: "Box", box_contents: 100, pack_contents: null, purchase_cost_cents: 425 },
  { id: "p2", vendor_id: "v8", sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit_of_measure: "Box", box_contents: 100, pack_contents: null, purchase_cost_cents: 1150 },
];

const seedOrders: Order[] = [
  {
    id: "o41", po_number: 41, vendor_id: "v6", customer_id: "c13", prepared_by: "Training Bookkeeper",
    created: "10/29/2026", expected: "2026-12-04", delivery_address: "Receiving dock, 40 Hospital Avenue\nNew Amsterdam",
    lines: [{ product_id: "p3", sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", unit: "Box", contents: 100, quantity: 500, price_cents: 425 }],
    discount_cents: 0, status: "draft", submitted: true, version: 1,
  },
  {
    id: "o40", po_number: 40, vendor_id: "v8", customer_id: "c12", prepared_by: "Training Bookkeeper",
    created: "10/22/2026", expected: "2026-11-20", delivery_address: "14 Main Street\nGeorgetown",
    lines: [{ product_id: "p2", sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", unit: "Box", contents: 100, quantity: 12, price_cents: 1150 }],
    discount_cents: 0, status: "approved", submitted: true, version: 1,
    approved_by: "Training Director", approved_at: "10/23/2026, 9:14:00 AM", approved_version: 1,
  },
];

/* ---------- Rules copied from Luna ---------- */

const poNumber = (n: number) => `PO-${String(n).padStart(5, "0")}`;

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

function centsText(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function moneyToCents(value: string): number {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Enter a nonnegative amount with at most two decimal places.");
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function statusText(order: Order) {
  if (order.status === "approved") return "Active";
  if (order.submitted) return "Draft · Awaiting Director Approval";
  return "Draft";
}

function dateText(value: string) {
  if (!value) return "Not entered";
  const [y, m, d] = value.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

const total = (o: Order) => o.lines.reduce((s, l) => s + l.price_cents * l.quantity, 0) - o.discount_cents;

// Purchase cost is stored for one unit_of_measure. A Box price is only known for Box lines.
function priceFor(product: Product, unit: Line["unit"]) {
  const base = product.unit_of_measure.toLowerCase();
  const contents = unit === "Each" ? 1 : unit === "Pack" ? product.pack_contents : product.box_contents;
  const multiplier = base === unit.toLowerCase() ? 1 : base === "each" ? contents : null;
  return multiplier ? product.purchase_cost_cents * multiplier : undefined;
}

function unitContents(product: Product, unit: Line["unit"]) {
  if (unit === "Each") return 1;
  return unit === "Pack" ? product.pack_contents : product.box_contents;
}

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "draft-saved"; order: Order }
  | { type: "submitted"; order: Order }
  | { type: "view-approval"; order: Order }
  | { type: "returned"; order: Order }
  | { type: "signed"; order: Order };

type Mission =
  | { kind: "do"; prompt: string; details?: string[]; check: (e: Event) => string | null | undefined; learn: string[] }
  | { kind: "choice"; prompt: string; options: { text: string; correct: boolean; why: string }[]; learn: string[] };

const missions: Mission[] = [
  {
    kind: "do",
    prompt: "Harbour View Pharmacy wants 30 boxes of medium nitrile gloves from Northstar. Open the section where supplier orders are prepared.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Purchase Orders" ? null : `You opened ${e.section}. Supplier orders are prepared in their own section.`),
    learn: [
      "Luna's note at the top of Purchase Orders reads: “Saving or activating an order does not receive inventory, create a vendor bill, or post an accounting entry.”",
      "Every new purchase order begins as a Draft. You fill in the form, then save it.",
    ],
  },
  {
    kind: "do",
    prompt: "Prepare the purchase order with these details, then click “Save Draft”.",
    details: [
      "Expected delivery date: any date in the next month",
      "Vendor: Northstar Medical Supply",
      "Customer: Harbour View Pharmacy",
      "Product line: NSM-GLOVE-M (Nitrile exam gloves, medium)",
      "Order unit: Box · Items per box: 100 · Quantity: 30",
      "Unit price (USD): $8.50 per box. Luna fills this in when you choose the product.",
      "Line total: $255.00",
      "Use the one product line already on the form. You don't need “Add product line” for a single item.",
    ],
    check: (e) => {
      if (e.type !== "draft-saved") return undefined;
      const o = e.order;
      if (o.vendor_id !== "v9") return "A draft was saved, but the vendor isn't Northstar Medical Supply. Open it, choose Edit Draft and fix it.";
      if (o.customer_id !== "c16") return "A draft was saved, but the customer isn't Harbour View Pharmacy. Choose Edit Draft and fix it.";
      const line = o.lines.find((l) => l.sku === "NSM-GLOVE-M");
      if (!line || o.lines.length !== 1) return "The draft should have one line: NSM-GLOVE-M. Choose Edit Draft and fix the products.";
      if (line.unit !== "Box" || line.quantity !== 30) return `The line shows ${line.quantity} ${line.unit}. It should be 30 Box. Choose Edit Draft and fix it.`;
      if (line.price_cents !== 850) return `The unit price is ${money(line.price_cents)}, but Northstar's saved price is $8.50 per Box. Choose Edit Draft and fix it.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Draft saved and confirmed. It has not been activated.” It gave the order the next number, PO-00042.",
      "Choosing the customer filled in the delivery address from their shipping address. Choosing the product filled in the unit, the items per box (100) and the saved USD price ($8.50). You can edit that price because you're the Director. A Bookkeeper can't change a saved price.",
      "Only products linked to the selected vendor appear in the list. That's why the vendor had to be set up first in Lesson 2.",
    ],
  },
  {
    kind: "choice",
    prompt: "PO-00042 shows the status “Draft”. What has Luna done so far?",
    options: [
      { text: "Only saved the order details. Nothing has been sent, received, billed or posted.", correct: true, why: "Correct. A draft is a saved plan. It has no effect on stock or the books, and it still needs Director approval before it becomes active." },
      { text: "Ordered the gloves from Northstar and added 30 boxes to stock.", correct: false, why: "No. Stock only increases when goods are received against an approved order (Lesson 4)." },
      { text: "Created a vendor bill for $255.00.", correct: false, why: "No. Saving or activating an order does not create a vendor bill. Read the note at the top of Purchase Orders." },
    ],
    learn: ["The order view shows a large DRAFT heading until the order is activated."],
  },
  {
    kind: "do",
    prompt: "Send PO-00042 for approval. In the order view, click “Submit for Director Approval”.",
    check: (e) => (e.type !== "submitted" ? undefined : e.order.id === "o42" ? null : "That was a different order. Submit PO-00042."),
    learn: [
      "Luna confirmed: “Submitted for Director Approval. The email alert was accepted for delivery.” The status is now “Draft · Awaiting Director Approval”.",
      "Edit Draft has disappeared. A submitted order is locked so the Director approves exactly what was submitted. To change it, the Director must return it for correction.",
    ],
  },
  {
    kind: "do",
    prompt: "Now switch to your Director role and open the section where orders wait for your review.",
    check: (e) => (e.type !== "navigate" ? undefined : e.section === "Director Approval" ? null : `You opened ${e.section}. Look for the section where the Director reviews orders.`),
    learn: [
      "Director Approval has four tabs: Purchase orders, Supplier returns, Exchange rates and Accounting corrections. This lesson uses Purchase orders. The others come in later lessons.",
      "The queue lists every submitted draft. There are two: your PO-00042 and PO-00041, which a Bookkeeper prepared.",
    ],
  },
  {
    kind: "do",
    prompt: "St. Jude Community Hospital asked for 50 boxes of gauze pads. Open the Bookkeeper's PO-00041 with “View order” and check it against that request.",
    check: (e) => (e.type !== "view-approval" ? undefined : e.order.id === "o41" ? null : "That's your own order. Go back to the queue and open PO-00041."),
    learn: [
      "Review the complete order before approving, as Luna says: “Review the complete order above before approving this exact version.”",
      "Look at the Quantity column. It says 500 Box, not 50. At $4.25 a box, that's $2,125.00 instead of $212.50.",
    ],
  },
  {
    kind: "do",
    prompt: "Don't approve it. Type a reason in “Reason for returning it for correction” (at least 3 characters), then click “Return for Correction”.",
    details: ["Example reason: Customer requested 50 boxes, not 500."],
    check: (e) => (e.type !== "returned" ? undefined : e.order.id === "o41" ? null : "Return PO-00041, not your own order."),
    learn: [
      "Luna confirmed: “Returned to Draft. The reason has been recorded.” PO-00041 has left your queue and gone back to the preparer, with your reason shown on the order.",
      "Return for Correction stays disabled until the reason is at least 3 characters long. A clear reason tells the preparer exactly what to fix.",
    ],
  },
  {
    kind: "do",
    prompt: "Now approve your gloves order. Open PO-00042 from the queue, review it, tick “I approve activating this purchase order.” and click “Sign and Activate”.",
    check: (e) => (e.type !== "signed" ? undefined : e.order.id === "o42" ? null : "Sign PO-00042."),
    learn: [
      "Luna confirmed: “Purchase order signed and activated.” The status is now Active, and the DRAFT heading is gone.",
      "A Director approval block now appears on the order with your name, the date and time, and the approved order version (1). That's the record that this exact version was authorized.",
      "Sign and Activate stayed disabled until you ticked the box. Luna makes approval a deliberate act.",
    ],
  },
  {
    kind: "choice",
    prompt: "PO-00042 is now Active. Which statement is true?",
    options: [
      { text: "The order is authorized. Stock, the vendor bill and accounting entries still come later, through separate steps.", correct: true, why: "Correct. Luna's normal workflow is: approved PO → vendor bill → payment → receiving → Cost Analysis. Receiving can happen before payment." },
      { text: "The 30 boxes are now in stock.", correct: false, why: "No. Stock increases only when the delivery is recorded in Vendor Receiving (Lesson 4)." },
      { text: "Luna has paid Northstar $255.00.", correct: false, why: "No. Payment comes after the vendor bill and is a separate, recorded step." },
    ],
    learn: ["Active orders with goods still expected now appear in Vendor Receiving, which is where Lesson 4 begins."],
  },
  {
    kind: "choice",
    prompt: "What can a Bookkeeper do with purchase orders in Luna?",
    options: [
      { text: "Prepare, edit and submit drafts, but not sign and activate them or change a saved price.", correct: true, why: "Correct. In Luna's code only the Director can sign, and only the Director can adjust a saved purchase price. Bookkeepers can prepare and submit drafts." },
      { text: "Everything the Director can do, including Sign and Activate.", correct: false, why: "No. The Director review box appears only for the Director role." },
      { text: "Nothing. Bookkeepers can't open Purchase Orders.", correct: false, why: "No. Bookkeepers can open Purchase Orders and prepare drafts. Assistant Bookkeepers can't open the section." },
    ],
    learn: ["This split keeps preparing and approving apart. The person who authorizes spending reviews the work of the person who prepares it."],
  },
  {
    kind: "choice",
    prompt: "What happens to PO-00041 next?",
    options: [
      { text: "It's a Draft again, with your reason shown. The preparer corrects it and submits it again, and it comes back to your queue for a fresh review.", correct: true, why: "Correct. Open Purchase Orders and view PO-00041 to see the status “Draft” with “Returned for correction:” and your reason. Submit and Edit Draft are available again." },
      { text: "It's deleted.", correct: false, why: "No. Returned orders are kept, with the reason recorded." },
      { text: "Luna corrects the quantity automatically.", correct: false, why: "No. Luna records your reason, but a person must correct the order." },
    ],
    learn: ["Every submission, return and approval is tied to an order version, so you always know which version you approved."],
  },
];

/* ---------- Component ---------- */

type Feedback = { tone: "good" | "bad"; lines: string[] } | null;
type InputLine = { productId: string; unit: Line["unit"]; contents: string; quantity: string; price: string };
const blankLine = (): InputLine => ({ productId: "", unit: "Each", contents: "1", quantity: "1", price: "" });

const lesson3Styles = `
.lsim-form .lsim-fields > *, .lsim-po-line > * { min-width:0; }
.lsim-form select, .lsim-form input, .lsim-form textarea { width:100%; min-width:0; max-width:100%; box-sizing:border-box; }
.lsim-review label.check input { width:auto; }
.lsim-po-line { display:grid; grid-template-columns: 1.6fr .8fr .8fr .7fr .8fr .8fr auto; gap:8px; align-items:end; padding:8px 0; border-bottom:1px solid #edf3f9; }
@media (max-width:900px){ .lsim-po-line { grid-template-columns:1fr 1fr; } }
.lsim-po-line output { font-size:13px; padding-bottom:10px; }
.lsim-po-status { display:inline-block; font-size:12px; font-weight:600; background:#eef6ff; border:1px solid #cfe3f7; color:#174a7c; border-radius:999px; padding:3px 10px; }
.lsim-po-info { background:#f7fbff; border:1px solid #dceafa; border-radius:10px; padding:10px 12px; font-size:13px; line-height:1.5; }
.lsim-po-total { font-weight:700; color:#123d68; margin:8px 0 0; }
.lsim-draftmark { color:#b45309; letter-spacing:.2em; margin:0 0 4px; font-size:1.1rem; }
.lsim-review { border:1px solid #cfe3f7; background:#f7fbff; border-radius:12px; padding:12px; margin-top:12px; }
.lsim-review label.check { display:flex; gap:8px; align-items:center; font-size:14px; margin:8px 0; }
.lsim-warn { background:#fff7ed; border:1px solid #fdba74; border-radius:8px; padding:8px 10px; font-size:13px; }
`;

export default function DirectorLesson3Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approvalTab, setApprovalTab] = useState<"orders" | "returns" | "rates" | "corrections">("orders");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // draft form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expectedDate, setExpectedDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [lines, setLines] = useState<InputLine[]>([blankLine()]);
  const [discount, setDiscount] = useState("0.00");

  // review
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0 });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const vendorProducts = products.filter((p) => p.vendor_id === vendorId);

  /* ----- coaching ----- */

  function emit(event: Event) {
    if (!mission || advanceReady || mission.kind !== "do") return;
    const result = mission.check(event);
    if (result === undefined) return;
    if (result === null) {
      setFeedback({ tone: "good", lines: mission.learn });
      setAdvanceReady(true);
    } else {
      setFeedback({ tone: "bad", lines: [result, "Re-read the task and try again."] });
    }
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
      setFeedback({ tone: "bad", lines: [option.why] });
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
  }

  function clearForm() {
    setEditingId(null); setExpectedDate(""); setVendorId(""); setCustomerId(""); setDeliveryAddress("");
    setLines([blankLine()]); setDiscount("0.00");
  }

  function restart() {
    setStep(0); setFeedback(null); setAdvanceReady(false); setSaveStatus("idle");
    setActive("Home"); setOrders(seedOrders); setSelectedId(null); setApprovalTab("orders");
    setNotice(""); setSearch(""); clearForm(); setSignatureConfirmed(false); setReturnReason("");
  }

  function navigate(section: string) {
    setActive(section);
    setSelectedId(null);
    setNotice("");
    toTop();
    emit({ type: "navigate", section });
  }

  /* ----- draft form (app/purchase-orders.tsx) ----- */

  function changeVendor(nextId: string) {
    if (nextId === vendorId) return;
    const hadProducts = lines.some((l) => l.productId);
    setVendorId(nextId);
    setLines([blankLine()]);
    setNotice(hadProducts ? "Vendor changed. Product lines were cleared; choose items from the selected vendor." : "");
  }

  function defaultUnitFor(product: Product): Line["unit"] {
    const base = (["Pack", "Box", "Each"] as const).find((u) => u.toLowerCase() === product.unit_of_measure.toLowerCase());
    return base ?? "Each";
  }

  function chooseProduct(index: number, productId: string) {
    const product = vendorProducts.find((p) => p.id === productId);
    setLines((prev) => prev.map((line, i) => {
      if (i !== index) return line;
      if (!product) return blankLine();
      const unit = defaultUnitFor(product);
      const saved = priceFor(product, unit);
      return { ...line, productId: product.id, unit, contents: String(unitContents(product, unit) || ""), price: saved !== undefined ? centsText(saved) : "" };
    }));
  }

  function changeUnit(index: number, unit: Line["unit"]) {
    setLines((prev) => prev.map((line, i) => {
      if (i !== index) return line;
      const product = products.find((p) => p.id === line.productId);
      const saved = product ? priceFor(product, unit) : undefined;
      return {
        ...line, unit,
        contents: product ? String(unitContents(product, unit) || (unit === "Each" ? 1 : "")) : unit === "Each" ? "1" : "",
        price: saved !== undefined ? centsText(saved) : "",
      };
    }));
  }

  function estimate(line: InputLine): number | null {
    try {
      const q = Number(line.quantity);
      if (!Number.isSafeInteger(q) || q < 1) return null;
      return moneyToCents(line.price) * q;
    } catch { return null; }
  }

  const subtotal = lines.reduce((t, l) => t + (estimate(l) || 0), 0);
  let formTotal = 0;
  try { formTotal = subtotal - moneyToCents(discount); } catch { /* explained on save */ }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notYet(1)) return;
    setNotice("");
    try {
      if (!vendorId) throw new Error("Choose a vendor.");
      if (!customerId) throw new Error("Choose a customer.");
      if (!expectedDate) throw new Error("Enter the expected delivery date.");
      if (!deliveryAddress.trim()) throw new Error("Enter the delivery address.");
      const used = new Set<string>();
      const saved: Line[] = lines.map((line, index) => {
        if (!line.productId) throw new Error(`Item ${index + 1}: choose a product from the dropdown.`);
        const product = vendorProducts.find((p) => p.id === line.productId);
        if (!product) throw new Error(`Item ${index + 1}: choose an active product linked to the selected vendor.`);
        if (used.has(line.productId)) throw new Error("Combine repeated products into one product line.");
        used.add(line.productId);
        const quantity = Number(line.quantity);
        const contents = Number(line.contents);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) throw new Error(`Item ${index + 1}: enter a whole-number quantity.`);
        if (!Number.isSafeInteger(contents) || contents < 1) throw new Error(`Item ${index + 1}: enter the number of items per pack or box.`);
        let price: number;
        try { price = moneyToCents(line.price); } catch { throw new Error(`Item ${index + 1}: enter the purchase price in USD.`); }
        return { product_id: product.id, sku: product.sku, name: product.name, unit: line.unit, contents, quantity, price_cents: price };
      });
      const discountCents = moneyToCents(discount);
      const sub = saved.reduce((t, l) => t + l.price_cents * l.quantity, 0);
      if (discountCents > sub) throw new Error("Discount cannot be greater than the subtotal.");

      let order: Order;
      if (editingId) {
        const existing = orders.find((o) => o.id === editingId)!;
        order = { ...existing, vendor_id: vendorId, customer_id: customerId, expected: expectedDate, delivery_address: deliveryAddress.trim(), lines: saved, discount_cents: discountCents };
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      } else {
        const next = Math.max(...orders.map((o) => o.po_number)) + 1;
        order = {
          id: `o${next}`, po_number: next, vendor_id: vendorId, customer_id: customerId, prepared_by: "Training Director",
          created: new Date().toLocaleDateString("en-US"), expected: expectedDate, delivery_address: deliveryAddress.trim(),
          lines: saved, discount_cents: discountCents, status: "draft", submitted: false, version: 1,
        };
        setOrders((prev) => [order, ...prev]);
      }
      clearForm();
      setSelectedId(order.id);
      setNotice("Draft saved and confirmed. It has not been activated.");
      toTop();
      emit({ type: "draft-saved", order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the draft.";
      setNotice(message);
      const empty = /^Item (\d+): choose a product/.exec(message);
      if (empty && Number(empty[1]) > 1) {
        setFeedback({ tone: "bad", lines: [
          `Luna stopped the save because product line ${empty[1]} is empty. Clicking “Add product line” adds a new blank line. Luna won't save a blank line.`,
          `Click “Remove” on the empty line ${empty[1]} and save again. This order needs only one line, NSM-GLOVE-M.`,
        ] });
      }
    }
  }

  function editDraft() {
    if (!selected) return;
    if (selected.status !== "draft" || selected.submitted) { setNotice("Only a current, unsubmitted draft can be edited."); return; }
    setEditingId(selected.id);
    setVendorId(selected.vendor_id);
    setCustomerId(selected.customer_id);
    setDeliveryAddress(selected.delivery_address);
    setExpectedDate(selected.expected);
    setDiscount(centsText(selected.discount_cents));
    setLines(selected.lines.map((l) => ({ productId: l.product_id, unit: l.unit, contents: String(l.contents), quantity: String(l.quantity), price: centsText(l.price_cents) })));
    setSelectedId(null);
    setNotice("");
    toTop();
  }

  function submitForApproval() {
    if (!selected) return;
    if (notYet(3)) return;
    const updated: Order = { ...selected, submitted: true, returned_reason: selected.returned_reason };
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setNotice("Submitted for Director Approval. The email alert was accepted for delivery.");
    emit({ type: "submitted", order: updated });
  }

  /* ----- Director Approval ----- */

  function viewForApproval(order: Order) {
    setSelectedId(order.id);
    setSignatureConfirmed(false);
    setReturnReason("");
    setNotice("");
    toTop();
    emit({ type: "view-approval", order });
  }

  function returnForCorrection() {
    if (!selected) return;
    if (notYet(6)) return;
    const updated: Order = { ...selected, submitted: false, version: selected.version + 1, returned_reason: returnReason.trim() };
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setNotice("Returned to Draft. The reason has been recorded.");
    emit({ type: "returned", order: updated });
  }

  function signAndActivate() {
    if (!selected) return;
    if (!signatureConfirmed) { setNotice("Confirm your approval before signing and activating."); return; }
    if (selected.id === "o41" && selected.lines.some((l) => l.quantity === 500)) {
      setFeedback({ tone: "bad", lines: [
        "Stop. Compare the order with the customer's request before signing. St. Jude asked for 50 boxes, and this order says 500.",
        "In real Luna, signing would activate the wrong order. In this practice workspace the signature was not applied. Return it for correction instead.",
      ] });
      setSignatureConfirmed(false);
      return;
    }
    if (notYet(7)) return;
    const updated: Order = {
      ...selected, status: "approved", approved_by: "Training Director",
      approved_at: new Date().toLocaleString("en-US"), approved_version: selected.version,
    };
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setNotice("Purchase order signed and activated.");
    setSignatureConfirmed(false);
    emit({ type: "signed", order: updated });
  }

  /* ----- render ----- */

  const vendorOf = (o: Order) => vendors.find((v) => v.id === o.vendor_id)!;
  const customerOf = (o: Order) => customers.find((c) => c.id === o.customer_id)!;
  const isError = (msg: string) => !/confirmed|Submitted|Returned to Draft|signed and activated/.test(msg);

  function orderView(page: "orders" | "approvals") {
    if (!selected) return null;
    const v = vendorOf(selected);
    const c = customerOf(selected);
    const awaiting = selected.status === "draft" && selected.submitted;
    return (
      <section className="lsim-module">
        <div className="lsim-panelhead">
          <div>
            <button type="button" className="lsim-sbtn" onClick={() => { setSelectedId(null); setNotice(""); }}>
              Back to {page === "approvals" ? "Director Approval" : "Purchase Orders"}
            </button>
            <button type="button" className="lsim-sbtn" disabled title="Printing is not part of this practice">Print / Save as PDF</button>
          </div>
        </div>
        {page === "orders" && ["approved"].includes(selected.status) && (
          <p className="lsim-foot">Normal workflow: approved PO → vendor bill → payment → receiving → Cost Analysis. Receiving is allowed before payment. Cost Analysis becomes available after all PO items are received.</p>
        )}
        {selected.status === "draft" && <h2 className="lsim-draftmark">DRAFT</h2>}
        <h2>Elevate Medical Solutions</h2>
        <div className="lsim-panelhead">
          <h2 style={{ fontSize: "1rem" }}>Purchase Order {poNumber(selected.po_number)}</h2>
          <span className="lsim-po-status">{statusText(selected)}</span>
        </div>
        <div className="lsim-fields lsim-dl">
          <p><strong>Date created:</strong> {selected.created}</p>
          <p><strong>Prepared by:</strong> {selected.prepared_by}</p>
          <p><strong>Expected delivery to customer:</strong> {dateText(selected.expected)}</p>
          <p><strong>Order currency:</strong> USD</p>
        </div>
        <div className="lsim-fields" style={{ margin: "8px 0" }}>
          <div className="lsim-po-info">
            <strong>Vendor</strong><br />{v.company_name}<br />{v.address}<br />{v.country}<br />{v.contact_name} · {v.phone}<br />{v.email}<br />Currency: {v.currency}
          </div>
          <div className="lsim-po-info">
            <strong>Customer</strong><br />{c.company_name}<br />{c.billing_address}<br />{c.contact_name} · {c.phone}<br />{c.email}
          </div>
        </div>
        <p className="lsim-pre" style={{ fontSize: 13 }}><strong>Deliver to:</strong> {selected.delivery_address}</p>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>SKU / Code</th><th>Description</th><th>Unit</th><th>Items per unit</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr></thead>
            <tbody>
              {selected.lines.map((l) => (
                <tr key={l.product_id}>
                  <td>{l.sku}</td><td>{l.name}</td><td>{l.unit}</td><td>{l.contents}</td><td>{l.quantity}</td>
                  <td>{money(l.price_cents)}</td><td>{money(l.price_cents * l.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lsim-dl" style={{ marginTop: 8 }}>
          <p>Subtotal: {money(total(selected) + selected.discount_cents)}</p>
          <p>Discount: {money(selected.discount_cents)}</p>
          <p>Shipping / freight: {money(0)}</p>
          <p>Tax: {money(0)}</p>
          <p className="lsim-po-total">Purchase order total: {money(total(selected))}</p>
        </div>
        {selected.approved_at && (
          <div className="lsim-po-info" style={{ marginTop: 10 }}>
            <strong>Director approval</strong><br />
            Approved by: {selected.approved_by}<br />
            Date and time: {selected.approved_at}<br />
            Approved order version: {selected.approved_version}
          </div>
        )}

        {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
        {selected.returned_reason && selected.status === "draft" && !selected.submitted && (
          <p className="lsim-warn">Returned for correction: {selected.returned_reason}</p>
        )}

        {page === "orders" && awaiting && (
          <p style={{ fontSize: 13 }}>
            <button type="button" className="lsim-sbtn" onClick={() => { setActive("Director Approval"); emit({ type: "navigate", section: "Director Approval" }); setNotice(""); }}>
              Open this order in Director Approval
            </button>
          </p>
        )}
        {page === "approvals" && !awaiting && (
          <p role="status" style={{ fontSize: 13 }}>This order is no longer awaiting approval. Return to the queue and refresh it.</p>
        )}
        {page === "approvals" && awaiting && (
          <div className="lsim-review lsim-form">
            <h2>Director review</h2>
            <p style={{ fontSize: 13, margin: 0 }}>Review the complete order above before approving this exact version.</p>
            <label className="check">
              <input type="checkbox" checked={signatureConfirmed} onChange={(e) => setSignatureConfirmed(e.target.checked)} />
              I approve activating this purchase order.
            </label>
            <button type="button" className="lsim-pbtn" disabled={!signatureConfirmed} onClick={signAndActivate}>Sign and Activate</button>
            <label style={{ marginTop: 12 }}>
              Reason for returning it for correction
              <textarea rows={3} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
            </label>
            <button type="button" className="lsim-sbtn" disabled={returnReason.trim().length < 3} onClick={returnForCorrection}>Return for Correction</button>
          </div>
        )}
        {page === "orders" && selected.status === "draft" && !selected.submitted && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="lsim-pbtn" onClick={submitForApproval}>Submit for Director Approval</button>
            <button type="button" className="lsim-sbtn" onClick={editDraft}>Edit Draft</button>
          </div>
        )}
      </section>
    );
  }

  function orderList(page: "orders" | "approvals") {
    const q = search.trim().toLowerCase();
    const list = orders
      .filter((o) => (page === "approvals" ? o.status === "draft" && o.submitted : true))
      .filter((o) => [poNumber(o.po_number), vendorOf(o).company_name, customerOf(o).company_name, statusText(o)].some((x) => x.toLowerCase().includes(q)));
    return (
      <section className="lsim-module">
        <div className="lsim-panelhead">
          <h2>{page === "approvals" ? "Director Approval" : "Recent Purchase Orders"}</h2>
          {page === "approvals" ? <button type="button" className="lsim-sbtn">Refresh queue</button> : <button type="button" className="lsim-sbtn">Show archived orders</button>}
        </div>
        <p>
          {page === "approvals"
            ? "Completed drafts submitted for Director review. Open the full order, confirm approval, then sign and activate, or return it for correction."
            : "Choose View order to open the complete purchase order by itself."}
        </p>
        <label className="lsim-search">
          Search orders
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PO number, vendor, customer, or status" />
        </label>
        <div className="lsim-table-wrap">
          <table className="lsim-table">
            <thead><tr><th>PO number</th><th>Vendor</th><th>Customer</th><th>Date</th><th>Currency</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{poNumber(o.po_number)}</td><td>{vendorOf(o).company_name}</td><td>{customerOf(o).company_name}</td>
                  <td>{o.created}</td><td>USD</td><td>{money(total(o))}</td><td>{statusText(o)}</td>
                  <td>
                    <button type="button" className="lsim-sbtn"
                      onClick={() => (page === "approvals" ? viewForApproval(o) : (setSelectedId(o.id), setNotice(""), toTop()))}>
                      View order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p>{page === "approvals" ? "No submitted purchase orders await approval on this page." : "No purchase orders found."}</p>}
        </div>
      </section>
    );
  }

  function renderPurchaseOrders() {
    if (selected) return orderView("orders");
    return (
      <>
        <p style={{ fontSize: 13, marginTop: 0 }}>
          Prepare supplier orders for customer deliveries. Saving or activating an order does not receive inventory, create a vendor bill, or post an accounting entry.
        </p>
        <section className="lsim-module">
          <div className="lsim-panelhead">
            <div>
              <h2>{editingId ? "Edit Draft Purchase Order" : "New Purchase Order"}</h2>
              <p style={{ margin: 0, fontSize: 13 }}>Every new purchase order begins as a Draft.</p>
            </div>
            <span className="lsim-po-status">Draft</span>
          </div>
          <form className="lsim-form" onSubmit={saveDraft} noValidate style={{ marginTop: 10 }}>
            <div className="lsim-fields">
              <label>Prepared by<input readOnly value="Training Director" /></label>
              <label>PO date<input readOnly value={new Date().toLocaleDateString("en-US")} /></label>
              <label>Expected delivery date<input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></label>
              <label>Vendor
                <select value={vendorId} onChange={(e) => changeVendor(e.target.value)}>
                  <option value="">Choose a vendor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name} — {v.country} ({v.currency})</option>)}
                </select>
              </label>
              <label>Customer
                <select value={customerId} onChange={(e) => {
                  setCustomerId(e.target.value);
                  setDeliveryAddress(customers.find((c) => c.id === e.target.value)?.shipping_address || "");
                }}>
                  <option value="">Choose a customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </label>
              <label>Purchase currency<input readOnly value="USD" /></label>
            </div>
            <label>Delivery address
              <textarea rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </label>

            <div className="lsim-panelhead" style={{ marginTop: 6 }}>
              <div>
                <strong style={{ color: "#123d68" }}>Products</strong>
                <p style={{ margin: 0, fontSize: 13 }}>Choose by SKU or description. Only active products linked to the selected vendor are shown.</p>
                {!vendorId && <p role="status" style={{ margin: 0, fontSize: 13 }}>Choose a vendor to select products.</p>}
              </div>
              <button type="button" className="lsim-sbtn" disabled={!vendorId || lines.length >= 100}
                onClick={() => setLines((p) => [...p, blankLine()])}>Add product line</button>
            </div>
            {lines.map((line, index) => {
              const product = products.find((p) => p.id === line.productId);
              const saved = product ? priceFor(product, line.unit) : undefined;
              const est = estimate(line);
              return (
                <div className="lsim-po-line" key={index}>
                  <label>SKU / code
                    <select value={line.productId} disabled={!vendorId} onChange={(e) => chooseProduct(index, e.target.value)}>
                      <option value="">{vendorId ? "Choose a product" : "Choose a vendor first"}</option>
                      {vendorProducts.map((p) => {
                        const u = defaultUnitFor(p); const sp = priceFor(p, u);
                        return <option key={p.id} value={p.id}>{p.sku} — {p.name} — {u} — {sp !== undefined ? money(sp) : "Price not saved (USD)"}</option>;
                      })}
                    </select>
                  </label>
                  <label>Order unit
                    <select value={line.unit} onChange={(e) => changeUnit(index, e.target.value as Line["unit"])}>
                      <option>Pack</option><option>Box</option><option>Each</option>
                    </select>
                  </label>
                  <label>Items per pack / box
                    <input type="number" min={1} value={line.contents} readOnly={line.unit === "Each"}
                      onChange={(e) => setLines((p) => p.map((l, i) => (i === index ? { ...l, contents: e.target.value } : l)))} />
                  </label>
                  <label>Quantity
                    <input type="number" min={1} value={line.quantity}
                      onChange={(e) => setLines((p) => p.map((l, i) => (i === index ? { ...l, quantity: e.target.value } : l)))} />
                  </label>
                  <label>Unit price (USD)
                    <input inputMode="decimal" value={line.price} placeholder={saved !== undefined ? "Saved purchase price" : "Enter price"}
                      onChange={(e) => setLines((p) => p.map((l, i) => (i === index ? { ...l, price: e.target.value } : l)))} />
                  </label>
                  <output><span style={{ display: "block", color: "#173b70" }}>Line total</span>{est === null ? "—" : money(est)}</output>
                  {lines.length > 1
                    ? <button type="button" className="lsim-sbtn" onClick={() => setLines((p) => p.filter((_, i) => i !== index))}>Remove</button>
                    : <span />}
                  {product && saved !== undefined && (
                    <p className="lsim-foot" style={{ gridColumn: "1 / -1", margin: 0 }}>
                      Saved vendor price: <strong>{money(saved)} per {line.unit}</strong> ({product.sku}, {unitContents(product, line.unit)} items per {line.unit.toLowerCase()}).
                    </p>
                  )}
                  {line.productId && saved === undefined && (
                    <p className="lsim-foot" style={{ gridColumn: "1 / -1", margin: 0 }}>
                      No vendor price is available for this unit. Check the purchase cost in Products & Inventory or enter the correct purchase price.
                    </p>
                  )}
                </div>
              );
            })}

            <div className="lsim-fields" style={{ marginTop: 10 }}>
              <label>Subtotal<input readOnly value={money(subtotal)} /></label>
              <label>Discount<input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
            </div>
            <p className="lsim-foot" style={{ marginTop: 0 }}>After receiving, enter shipping, freight and related costs in GYD in Cost Analysis. Enter nonrecoverable tax as a GYD procurement cost. Do not duplicate costs.</p>
            <p className="lsim-po-total">Purchase order total: {money(formTotal)}</p>
            <div style={{ marginTop: 8 }}>
              <button className="lsim-pbtn">Save Draft</button>
              {editingId && <button type="button" className="lsim-sbtn" onClick={clearForm}>Cancel editing</button>}
            </div>
            {notice && <p className={`lsim-status ${isError(notice) ? "error" : ""}`} role="status">{notice}</p>}
          </form>
        </section>
        {orderList("orders")}
      </>
    );
  }

  function renderDirectorApproval() {
    return (
      <>
        <section className="lsim-module">
          <div className="lsim-tabs" role="group" aria-label="Approval sections">
            {([["orders", "Purchase orders"], ["returns", "Supplier returns"], ["rates", "Exchange rates"], ["corrections", "Accounting corrections"]] as const).map(([key, label]) => (
              <button key={key} type="button" className="lsim-sbtn" aria-pressed={approvalTab === key} onClick={() => setApprovalTab(key)}>{label}</button>
            ))}
          </div>
        </section>
        {approvalTab === "orders"
          ? selected ? orderView("approvals") : orderList("approvals")
          : <p className="lsim-note">This tab is practised in a later lesson. This lesson uses the Purchase orders tab.</p>}
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
    if (active === "Purchase Orders") return renderPurchaseOrders();
    if (active === "Director Approval") return renderDirectorApproval();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">This lesson works in Purchase Orders and Director Approval. You’ll practise {active} in {coveredIn[active] ?? "a later lesson"}.</p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 3">
      <style>{simulatorStyles + formStyles + lesson3Styles}</style>
      <div className="lsim-top">TRAINING SIMULATOR · Fictional purchase orders · Not connected to production Luna</div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>Lesson 3 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}</h4>
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
            <p><strong>Lesson 3 complete.</strong></p>
            <p>You can now prepare a purchase order, submit it, check an order against what the customer asked for, return a wrong order with a clear reason, and sign and activate a correct one. You can also explain what activation does and doesn’t do.</p>
            <p>Next: Lesson 4 records the Northstar delivery in Vendor Receiving and enters the supplier’s bill.</p>
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
          </div>
        ) : (
          <div className="lsim-note" style={{ marginTop: 0 }}>Do the task in the practice workspace below. Feedback will appear here.</div>
        ))}

        <p className="lsim-footnote">Labels, statuses, validation messages and confirmations match the current Luna code. Records are fictional and reset when you restart, and nothing here changes production Luna.</p>
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
