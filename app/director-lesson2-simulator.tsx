"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAcademyAuth } from "./academy-auth";
import {
  Icon,
  WhyNotWorking,
  revealChoice,
  canOpenSection,
  coveredIn,
  descriptions,
  homeCards,
  navigationIcons,
  sections,
  simulatorStyles,
} from "./director-workspace-simulator";

/*
  Luna Academy — Lesson 2 simulator: "Customers, vendors, and products"

  Training only. This component never connects to production Luna.
  Form labels, list columns, validation messages and confirmations are
  copied from the Luna_Accounting source (app/customers.tsx,
  app/vendors.tsx, app/products.tsx, app/native-inventory-lots.tsx,
  accounting/journal.ts moneyToCents, accounting/luna-access.ts).
  All records are fictional and live only in this browser tab.
*/

const LESSON_TITLE = "Customers, vendors, and products";

/* ---------- Fictional records ---------- */

type Customer = {
  id: string;
  customer_number: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  billing_address: string;
  shipping_address: string;
  payment_terms_days: number;
  notes: string;
};

type Vendor = {
  id: string;
  vendor_number: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  payment_terms_days: number;
  notes: string;
  active: boolean;
};

type Product = {
  id: string;
  vendor_id: string;
  sku: string;
  name: string;
  category: string;
  unit_of_measure: string;
  purchase_cost_cents: number;
  selling_price_cents: number;
  reorder_level: number;
  quantity_on_hand: number;
  description: string;
};

type Lot = {
  product_id: string;
  lot: string;
  received: number;
  remaining: number;
  unit_cost_cents: number | null;
  verified: boolean;
};

const seedCustomers: Customer[] = [
  { id: "c15", customer_number: 15, company_name: "Eastbank Pharmacy", contact_name: "R. Persaud", email: "orders@eastbank.example", phone: "592-555-0115", billing_address: "8 Water Street\nGeorgetown", shipping_address: "8 Water Street\nGeorgetown", payment_terms_days: 30, notes: "" },
  { id: "c14", customer_number: 14, company_name: "Lakeside Care Home", contact_name: "M. Singh", email: "admin@lakeside.example", phone: "592-555-0114", billing_address: "2 Lake Road\nLinden", shipping_address: "2 Lake Road\nLinden", payment_terms_days: 30, notes: "" },
  { id: "c13", customer_number: 13, company_name: "St. Jude Community Hospital", contact_name: "Dr. A. Khan", email: "purchasing@stjude.example", phone: "592-555-0113", billing_address: "40 Hospital Avenue\nNew Amsterdam", shipping_address: "Receiving dock, 40 Hospital Avenue\nNew Amsterdam", payment_terms_days: 45, notes: "Deliveries before noon." },
  { id: "c12", customer_number: 12, company_name: "Bright Smile Dental Clinic", contact_name: "Dr. L. Thomas", email: "office@brightsmile.example", phone: "592-555-0112", billing_address: "14 Main Street\nGeorgetown", shipping_address: "14 Main Street\nGeorgetown", payment_terms_days: 30, notes: "" },
  { id: "c11", customer_number: 11, company_name: "Riverside Family Clinic", contact_name: "N. Ramdass", email: "accounts@riverside.example", phone: "592-555-0111", billing_address: "6 River Drive\nParika", shipping_address: "6 River Drive\nParika", payment_terms_days: 15, notes: "" },
];

const seedVendors: Vendor[] = [
  { id: "v8", vendor_number: 8, company_name: "Atlantic Clinical Supply", contact_name: "J. Moore", email: "sales@atlanticclinical.example", phone: "1-305-555-0108", address: "100 Harbor Blvd\nMiami, FL", country: "United States", currency: "USD", payment_terms_days: 30, notes: "", active: true },
  { id: "v7", vendor_number: 7, company_name: "Lotus Generics Pvt", contact_name: "P. Rao", email: "export@lotusgenerics.example", phone: "91-22-555-0107", address: "Plot 12, Industrial Area\nMumbai", country: "India", currency: "USD", payment_terms_days: 60, notes: "", active: true },
  { id: "v6", vendor_number: 6, company_name: "Jade River Surgical Co.", contact_name: "L. Chen", email: "trade@jaderiver.example", phone: "86-21-555-0106", address: "88 Export Road\nShanghai", country: "China", currency: "USD", payment_terms_days: 45, notes: "", active: true },
  { id: "v5", vendor_number: 5, company_name: "Bluewater Medical Ltd", contact_name: "S. Hughes", email: "orders@bluewater.example", phone: "44-20-555-0105", address: "5 Dock Lane\nLondon", country: "United Kingdom", currency: "USD", payment_terms_days: 30, notes: "", active: true },
];

const seedProducts: Product[] = [
  { id: "p3", vendor_id: "v6", sku: "JRS-GAUZE-4X4", name: "Sterile gauze pads 4x4", category: "medical_supply", unit_of_measure: "Box", purchase_cost_cents: 425, selling_price_cents: 135000, reorder_level: 25, quantity_on_hand: 64, description: "100 pads per box." },
  { id: "p2", vendor_id: "v8", sku: "ACS-SYR-5ML", name: "Syringe 5 mL, luer lock", category: "medical_supply", unit_of_measure: "Box", purchase_cost_cents: 1150, selling_price_cents: 365000, reorder_level: 20, quantity_on_hand: 72, description: "" },
  { id: "p1", vendor_id: "v7", sku: "LG-AMOX-500", name: "Amoxicillin 500 mg capsules", category: "pharmaceutical", unit_of_measure: "Case", purchase_cost_cents: 8800, selling_price_cents: 2650000, reorder_level: 5, quantity_on_hand: 4, description: "" },
];

const seedLots: Lot[] = [
  { product_id: "p2", lot: "TR-LOT-0231", received: 40, remaining: 12, unit_cost_cents: 245000, verified: true },
  { product_id: "p2", lot: "TR-LOT-0245", received: 60, remaining: 60, unit_cost_cents: null, verified: false },
  { product_id: "p3", lot: "TR-LOT-0238", received: 80, remaining: 64, unit_cost_cents: 92000, verified: true },
  { product_id: "p1", lot: "TR-LOT-0219", received: 10, remaining: 4, unit_cost_cents: 1910000, verified: true },
];

/* ---------- Rules copied from Luna ---------- */

const vendorCurrencies: Record<string, string> = {
  "United States": "USD",
  "United Kingdom": "USD",
  China: "USD",
  India: "USD",
};

const categories: Record<string, string> = {
  medical_supply: "Medical supply",
  nonmedical_supply: "Nonmedical supply",
  pharmaceutical: "Pharmaceutical",
};

const customerNumber = (n: number) => "CUST-" + String(n).padStart(5, "0");
const vendorNumber = (n: number) => "VEND-" + String(n).padStart(5, "0");

function price(cents: number) {
  return "$" + Math.floor(cents / 100) + "." + String(cents % 100).padStart(2, "0");
}

function gyd(cents: number) {
  return "GYD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// accounting/journal.ts moneyToCents
function moneyToCents(value: string): number {
  const normalized = value.trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a nonnegative amount with at most two decimal places.");
  }
  const [whole, fraction = ""] = normalized.replace(/,/g, "").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function checkTerms(value: string) {
  const days = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(days) || days < 0 || days > 365) {
    throw new Error("Payment terms must be a whole number from 0 to 365 days.");
  }
  return days;
}

/* ---------- Missions ---------- */

type Event =
  | { type: "navigate"; section: string }
  | { type: "view-customer"; customer: Customer }
  | { type: "customer-saved"; mode: "add" | "edit"; customer: Customer }
  | { type: "vendor-saved"; vendor: Vendor }
  | { type: "product-saved"; product: Product }
  | { type: "tab"; tab: string };

type Mission =
  | {
      kind: "do";
      prompt: string;
      details?: string[];
      // Return null when the task is done, or a hint when it is not.
      check: (event: Event, vendorNameFor: (id: string) => string) => string | null | undefined;
      learn: string[];
    }
  | {
      kind: "choice";
      prompt: string;
      options: { text: string; correct: boolean; why: string }[];
      learn: string[];
    };

const NEW_BILLING = "27 Camp Street";

const missions: Mission[] = [
  {
    kind: "do",
    prompt:
      "Bright Smile Dental Clinic emailed to say their billing address has changed. Open the section where customer records are kept.",
    check: (e) =>
      e.type !== "navigate" ? undefined : e.section === "Customers" ? null : `You opened ${e.section}. Customer records are kept in their own section.`,
    learn: [
      "Customers is a master record. Customer orders, invoices and statements draw on it, so you fix customer details here, at the source.",
      "The page has three parts: “Add a customer” at the top, the Customers list, and a details panel that opens when you pick a customer.",
    ],
  },
  {
    kind: "do",
    prompt:
      "Find Bright Smile Dental Clinic. Type “bright” in “Search this list”, then click View on their row.",
    check: (e) =>
      e.type !== "view-customer"
        ? undefined
        : e.customer.id === "c12"
          ? null
          : `That is ${e.customer.company_name}. Look for Bright Smile Dental Clinic.`,
    learn: [
      "Search this list matches the customer number, name, contact or email. It searches only the 100 most recently created customers shown on the page.",
      "The details panel shows the customer number (CUST-00012), contact, payment terms, both addresses and notes. Below them is the Account statement, which you'll use in Lesson 6.",
    ],
  },
  {
    kind: "do",
    prompt:
      "Update the billing address. Click “Edit customer”, replace the billing address with the new one below, then click “Save changes”.",
    details: ["27 Camp Street", "Georgetown"],
    check: (e) => {
      if (e.type !== "customer-saved") return undefined;
      if (e.mode !== "edit" || e.customer.id !== "c12") return "That saved a different record. Edit Bright Smile Dental Clinic.";
      if (!e.customer.billing_address.includes(NEW_BILLING)) {
        return `The change was saved, but the billing address doesn't show “${NEW_BILLING}”. Click Edit customer again and correct it.`;
      }
      return null;
    },
    learn: [
      "Luna confirms every save: “Customer updated and confirmed: CUST-00012.” Without a confirmation message, don't assume the change was stored.",
      "Only the billing address changed. The shipping address is separate, so update it only when the customer asks you to.",
      "Invoices you've already created keep the details they were made with. New documents will use the corrected address.",
    ],
  },
  {
    kind: "do",
    prompt:
      "A new customer has been approved. Fill in “Add a customer” with the details below and click “Save customer”.",
    details: [
      "Company or individual name: Harbour View Pharmacy",
      "Contact name: K. Williams",
      "Payment due in how many days? 15",
    ],
    check: (e) => {
      if (e.type !== "customer-saved") return undefined;
      if (e.mode !== "add") return "That was an edit. Use the “Add a customer” form at the top.";
      if (!/harbour view pharmacy/i.test(e.customer.company_name)) return "A customer was saved, but not Harbour View Pharmacy. Check the name and add them.";
      if (e.customer.payment_terms_days !== 15) return `Harbour View Pharmacy was saved with ${e.customer.payment_terms_days}-day terms instead of 15. Edit the record and set the terms to 15.`;
      return null;
    },
    learn: [
      "Luna assigned the customer number automatically (CUST-00016). You never type it, which prevents duplicate or skipped numbers.",
      "Only the name and payment terms are required. Payment terms must be a whole number from 0 to 365 days. Try typing 15.5 some time and you'll see Luna's message.",
      "Payment terms decide when this customer's invoices fall due, which feeds aging reports in Lesson 10.",
    ],
  },
  {
    kind: "do",
    prompt:
      "Your team will buy gloves from a new supplier. Open the section where supplier records are kept.",
    check: (e) =>
      e.type !== "navigate" ? undefined : e.section === "Vendors" ? null : `You opened ${e.section}. Suppliers are called vendors in Luna.`,
    learn: [
      "Vendors holds supplier profiles. A vendor record describes who you buy from. It isn't a purchase order, and it doesn't prove that goods arrived.",
      "The layout matches Customers: Add a vendor, the Vendors list, and a details panel. Vendors also have a country and a currency.",
    ],
  },
  {
    kind: "do",
    prompt: "Add the new supplier with these details, then click “Save vendor”.",
    details: [
      "Company or individual name: Northstar Medical Supply",
      "Country: United States",
      "Payment due in how many days? 45",
    ],
    check: (e) => {
      if (e.type !== "vendor-saved") return undefined;
      if (!/northstar medical supply/i.test(e.vendor.company_name)) return "A vendor was saved, but not Northstar Medical Supply.";
      if (e.vendor.country !== "United States") return `Northstar was saved with the country ${e.vendor.country}. Open it, choose Edit vendor information and set United States.`;
      if (e.vendor.payment_terms_days !== 45) return `Northstar was saved with ${e.vendor.payment_terms_days}-day terms. Edit it and set 45.`;
      return null;
    },
    learn: [
      "Luna confirmed: “Vendor saved and confirmed: VEND-00009.” Like customer numbers, vendor numbers are assigned automatically.",
      "You didn't choose a currency. Luna sets it from the country you pick, and shows it under the Country field as “Vendor currency”.",
    ],
  },
  {
    kind: "choice",
    prompt: "You add a supplier based in China. What currency will Luna give that vendor?",
    options: [
      { text: "USD", correct: true, why: "Correct. All four countries Luna offers (United States, United Kingdom, China, India) map to USD. Supplier purchase prices are kept in US dollars." },
      { text: "CNY (Chinese yuan)", correct: false, why: "Not in Luna. Try selecting China in the Country list and look at “Vendor currency” under it." },
      { text: "GYD (Guyana dollars)", correct: false, why: "No. GYD is used for selling prices and stock values. Vendor purchases are kept in another currency. Check “Vendor currency” in the form." },
    ],
    learn: [
      "Vendor amounts stay in USD as the source amount. Luna converts them to GYD for stock and accounting using a verified exchange rate. That's Lesson 5.",
    ],
  },
  {
    kind: "do",
    prompt: "Now set up the gloves as a product. Open the section where products are managed.",
    check: (e) =>
      e.type !== "navigate"
        ? undefined
        : e.section === "Products & Inventory"
          ? null
          : `You opened ${e.section}. Look for the section that covers products, lots and stock.`,
    learn: [
      "Products & Inventory has three tabs: Product Catalog, Inventory Cost (GYD) and Expiry Alerts. You're on Product Catalog.",
      "Every product is linked to a vendor. That's why the vendor had to exist first.",
    ],
  },
  {
    kind: "do",
    prompt: "Add the gloves to the catalog with these details, then click “Save product”.",
    details: [
      "Vendor: Northstar Medical Supply",
      "Item code / SKU: nsm-glove-m",
      "Product name: Nitrile exam gloves, medium",
      "Purchase cost per unit (USD): 8.50",
      "Selling price per unit (GYD): 2500",
      "Reorder level (units): 20",
      "Unit: Box · Category: Medical supply",
    ],
    check: (e, vendorNameFor) => {
      if (e.type !== "product-saved") return undefined;
      const p = e.product;
      const problems: string[] = [];
      if (!/northstar medical supply/i.test(vendorNameFor(p.vendor_id))) problems.push("vendor should be Northstar Medical Supply");
      if (p.sku !== "NSM-GLOVE-M") problems.push("item code should be NSM-GLOVE-M");
      if (p.purchase_cost_cents !== 850) problems.push("purchase cost should be 8.50");
      if (p.selling_price_cents !== 250000) problems.push("selling price should be 2500");
      if (p.reorder_level !== 20) problems.push("reorder level should be 20");
      if (p.unit_of_measure !== "Box") problems.push("unit should be Box");
      if (p.category !== "medical_supply") problems.push("category should be Medical supply");
      return problems.length
        ? `The product was saved, but the ${problems.join("; ")}. Click Edit on its row in the catalog and correct it.`
        : null;
    },
    learn: [
      "Luna confirmed: “Product saved and confirmed: NSM-GLOVE-M”. You typed the item code in lower case and Luna turned it into capitals. Item codes must be unique and can use only letters, numbers, dots, hyphens and underscores.",
      "Costs and prices are for one unit, and the unit here is a Box. Purchase cost is in USD because it comes from the vendor. Selling price is in GYD because that's what customers pay.",
      "Once saved, the item code is read-only. When you edit the product later, every other field can change, but not the SKU.",
    ],
  },
  {
    kind: "choice",
    prompt:
      "Find NSM-GLOVE-M in the Product catalog. It shows 0 in stock and “Reorder needed”. Why?",
    options: [
      {
        text: "Saving a product doesn't add stock. Stock goes up only when a delivery against an approved purchase order is recorded.",
        correct: true,
        why: "Correct. Luna says so under the form: “Saving a product does not add stock or change account balances. Stock increases when deliveries against approved purchase orders are recorded.”",
      },
      { text: "The product needs Director approval before stock appears.", correct: false, why: "No. Director approval applies to purchase orders (Lesson 3), not to products. Read the note under the Add a product form." },
      { text: "You should type the stock count into the product record.", correct: false, why: "No. The product form has no stock field, by design. Read the note under the Add a product form." },
    ],
    learn: [
      "“Reorder needed” appears whenever stock is at or below the reorder level. 0 is below 20, so the new product is flagged straight away.",
      "This is the core control: stock can't be typed in. It comes only from recorded receipts, which keeps inventory and accounting in step.",
    ],
  },
  {
    kind: "do",
    prompt: "Open the “Inventory Cost (GYD)” tab to see stock lots.",
    check: (e) =>
      e.type !== "tab" ? undefined : e.tab === "inventory" ? null : "That's a different tab. Choose Inventory Cost (GYD).",
    learn: [
      "Each row is a lot: one batch of stock from one delivery. ACS-SYR-5ML has two lots, received at different times with different costs.",
      "Stock costs and values are in Guyana dollars. A lot marked “Exchange-rate review needed” has no verified cost yet. Luna doesn't count that cost as zero.",
    ],
  },
  {
    kind: "choice",
    prompt: "Which statement best describes the difference between a product and a lot?",
    options: [
      {
        text: "A product describes the item and its prices. A lot is a specific batch of that item received in one delivery, with its own quantity, cost and expiry.",
        correct: true,
        why: "Correct. One product can have many lots. The product's “In stock” figure is the total across its lots.",
      },
      { text: "They are the same thing. Lot is just another word for product.", correct: false, why: "No. Look at ACS-SYR-5ML: one product, two lots with different costs and quantities." },
      { text: "A lot is created when you save a new product.", correct: false, why: "No. NSM-GLOVE-M was saved but has no lot. Lots are created when deliveries are recorded." },
    ],
    learn: [
      "Lots let Luna track cost and expiry per batch. Expiry Alerts uses each lot's batch expiry date, and you'll work with lots and costing in Lesson 5.",
    ],
  },
  {
    kind: "choice",
    prompt:
      "A Bookkeeper asks you to add a new product because they can't find Products & Inventory. What's the reason?",
    options: [
      {
        text: "Bookkeepers can open Customers and Vendors, but Products & Inventory is a Director-only section.",
        correct: true,
        why: "Correct. In Luna's access rule, Customers and Vendors are open to Director, Bookkeeper and Assistant Bookkeeper. Products & Inventory isn't on the accounting list, so only the Director sees it.",
      },
      { text: "Their account is broken and needs to be reset.", correct: false, why: "No. Hidden sections are expected for their role (Lesson 1). Nothing is broken." },
      { text: "Products & Inventory is hidden only on Mondays.", correct: false, why: "No. Section access depends only on role." },
    ],
    learn: [
      "As the Director, you own the product catalog: item codes, prices and reorder levels. Bookkeepers keep customer and vendor details up to date.",
    ],
  },
];

/* ---------- Extra styles for record screens ---------- */

export const formStyles = `
.lsim-module h2 { margin:0 0 4px; font-size:1.1rem; color:#123d68; }
.lsim-module + .lsim-module { margin-top:14px; }
.lsim-module > p { margin:0 0 10px; font-size:13px; color:#3b5576; }
.lsim-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
@media (max-width:760px){ .lsim-fields { grid-template-columns:1fr; } }
.lsim-form label { display:grid; gap:4px; font-size:13px; color:#173b70; margin-bottom:8px; }
.lsim-form input, .lsim-form select, .lsim-form textarea, .lsim-search input { font:inherit; font-size:14px; padding:7px 9px; border:1px solid #cbd9e8; border-radius:8px; background:#fff; color:#0a2d66; }
.lsim-form input[readonly] { background:#eef3f8; color:#5b7290; }
.lsim-search { display:grid; gap:4px; font-size:13px; margin:6px 0 10px; color:#173b70; }
.lsim-panelhead { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
.lsim-panelhead > div { display:flex; gap:6px; flex-wrap:wrap; }
.lsim-table-wrap { overflow-x:auto; }
.lsim-table { width:100%; border-collapse:collapse; font-size:13px; }
.lsim-table th { text-align:left; background:#f1f7fd; color:#2a4a72; font-weight:600; padding:7px 8px; border-bottom:1px solid #dceafa; white-space:nowrap; }
.lsim-table td { white-space:nowrap; padding:7px 8px; border-bottom:1px solid #edf3f9; vertical-align:top; }
.lsim-table tr.new td { background:#f0fdf4; }
.lsim-sbtn { border:1px solid #cbd9e8; background:#fff; color:#173b70; border-radius:8px; padding:5px 10px; font:inherit; font-size:13px; cursor:pointer; margin-right:4px; }
.lsim-sbtn:disabled { opacity:.5; cursor:not-allowed; }
.lsim-pbtn { border:1px solid #1673c9; background:#1673c9; color:#fff; border-radius:8px; padding:7px 14px; font:inherit; font-size:14px; cursor:pointer; margin-right:6px; }
.lsim-status { font-size:13px; margin:8px 0 0; padding:8px 10px; border-radius:8px; background:#eef6ff; border:1px solid #cfe3f7; }
.lsim-status.error { background:#fff7ed; border-color:#fdba74; }
.lsim-dl p { margin:0 0 4px; font-size:13px; }
.lsim-pre { white-space:pre-line; }
.lsim-tabs { display:flex; flex-wrap:wrap; gap:8px; }
.lsim-tabs button[aria-pressed="true"] { background:#1673c9; border-color:#1673c9; color:#fff; }
.lsim-foot { font-size:12px; color:#5b7290; margin-top:10px; }
.lsim-details-list { margin:6px 0 0; padding-left:18px; font-size:14px; }
.lsim-details-list li { margin:2px 0; }
`;

/* ---------- Component ---------- */

type Feedback = { tone: "good" | "bad"; lines: string[]; help?: string[] } | null;

// Step-by-step help shown after the second unsuccessful try on a task (by task number).
const missionHelp: Record<number, string[]> = {
  0: ["Customer records live in the Customers section.", "Click “Customers” in the left sidebar."],
  1: [
    "Make sure you're in Customers. Type “bright” in the “Search this list” box above the Customers list.",
    "Only Bright Smile Dental Clinic (CUST-00012) should remain. Click View on that row.",
  ],
  2: [
    "With Bright Smile's details open, click “Edit customer”. Their details fill the form at the top of the page.",
    "In Billing address, delete the old address and type “27 Camp Street” on the first line and “Georgetown” on the second.",
    "Leave Shipping address alone, then click “Save changes”.",
  ],
  3: [
    "Use the “Add a customer” form at the top of Customers. If it says you're editing a customer, cancel the edit first.",
    "Type Harbour View Pharmacy as the name and K. Williams as the contact.",
    "Payment due must be a whole number: type 15, with no decimals and no word “days”. Then click “Save customer”.",
    "If Luna shows a message under the form, it names the field that needs fixing.",
  ],
  4: ["Luna calls suppliers vendors.", "Click “Vendors” in the left sidebar."],
  5: [
    "In “Add a vendor”, type Northstar Medical Supply as the name.",
    "Leave Country as United States, and type 45 in Payment due.",
    "Click “Save vendor”. If a message appears under the form, fix the field it names.",
  ],
  7: ["Products are managed in Products & Inventory.", "Click “Products & Inventory” in the left sidebar."],
  8: [
    "Check each field against the task: Vendor Northstar Medical Supply, item code nsm-glove-m, purchase cost 8.50, selling price 2500, reorder level 20, unit Box, category Medical supply.",
    "Northstar appears in the Vendor list only after you saved it in the Vendors task.",
    "Prices allow at most two decimals. Item codes must be new, so if NSM-GLOVE-M already exists, click Edit on its row instead.",
    "Read the message under the form. It names exactly what Luna rejected.",
  ],
  10: [
    "The tabs are across the top of Products & Inventory: Product Catalog, Inventory Cost (GYD) and Expiry Alerts.",
    "Click the middle tab, “Inventory Cost (GYD)”.",
  ],
};

const emptyCustomer = {
  company_name: "", contact_name: "", email: "", phone: "",
  billing_address: "", shipping_address: "", payment_terms_days: "30", notes: "",
};
const emptyVendor = {
  company_name: "", contact_name: "", email: "", phone: "",
  address: "", country: "United States", payment_terms_days: "30", notes: "",
};
const emptyProduct = {
  vendor_id: "", sku: "", name: "", category: "medical_supply", unit_of_measure: "Each",
  purchase_cost: "0.00", selling_price: "0.00", reorder_level: "0", description: "",
};

export default function DirectorLesson2Simulator() {
  const auth = useAcademyAuth();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [active, setActive] = useState("Home");
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [newIds, setNewIds] = useState<string[]>([]);

  // Customers screen
  const [cForm, setCForm] = useState(emptyCustomer);
  const [cEditing, setCEditing] = useState<Customer | null>(null);
  const [cSelected, setCSelected] = useState<Customer | null>(null);
  const [cSearch, setCSearch] = useState("");
  const [cNotice, setCNotice] = useState("");

  // Vendors screen
  const [vForm, setVForm] = useState(emptyVendor);
  const [vEditForm, setVEditForm] = useState(emptyVendor);
  const [vSelected, setVSelected] = useState<Vendor | null>(null);
  const [vEditing, setVEditing] = useState(false);
  const [vSearch, setVSearch] = useState("");
  const [vNotice, setVNotice] = useState("");
  const [vEditNotice, setVEditNotice] = useState("");

  // Products screen
  const [tab, setTab] = useState<"catalog" | "inventory" | "expiry">("catalog");
  const [pForm, setPForm] = useState(emptyProduct);
  const [pEditing, setPEditing] = useState<Product | null>(null);
  const [pNotice, setPNotice] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const toTop = () => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const finished = step >= missions.length;
  const mission = finished ? null : missions[step];
  const progress = Math.round((Math.min(step, missions.length) / missions.length) * 100);
  const visibleSections = sections.filter((s) => canOpenSection("director", s));

  /* ----- coaching ----- */

  function emit(event: Event) {
    if (!mission || advanceReady || mission.kind !== "do") return;
    const result = mission.check(event, (id) => vendors.find((v) => v.id === id)?.company_name ?? "");
    if (result === undefined) return;
    if (result === null) {
      setFeedback({ tone: "good", lines: mission.learn });
      setAdvanceReady(true);
    } else {
      miss([result, "Re-read the task and try again."]);
    }
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
    if (!auth) {
      setSaveStatus("error");
      return;
    }
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
    setStep(0);
    setFeedback(null);
    setAdvanceReady(false);
    setMisses(0);
    setSaveStatus("idle");
    setActive("Home");
    setCustomers(seedCustomers);
    setVendors(seedVendors);
    setProducts(seedProducts);
    setNewIds([]);
    setCForm(emptyCustomer); setCEditing(null); setCSelected(null); setCSearch(""); setCNotice("");
    setVForm(emptyVendor); setVEditForm(emptyVendor); setVSelected(null); setVEditing(false); setVSearch(""); setVNotice(""); setVEditNotice("");
    setTab("catalog"); setPForm(emptyProduct); setPEditing(null); setPNotice("");
  }

  function navigate(section: string) {
    setActive(section);
    contentRef.current?.scrollTo({ top: 0 });
    emit({ type: "navigate", section });
  }

  /* ----- Customers (app/customers.tsx) ----- */

  function editCustomer(c: Customer) {
    setCEditing({ ...c });
    setCSelected(c);
    setCForm({
      company_name: c.company_name, contact_name: c.contact_name, email: c.email, phone: c.phone,
      billing_address: c.billing_address, shipping_address: c.shipping_address,
      payment_terms_days: String(c.payment_terms_days), notes: c.notes,
    });
    setCNotice("");
    toTop();
  }

  function cancelCustomerEdit() {
    setCEditing(null);
    setCForm(emptyCustomer);
    setCNotice("");
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const companyName = cForm.company_name.trim();
      if (!companyName) throw new Error("Enter the customer's company or individual name.");
      const days = checkTerms(cForm.payment_terms_days);
      const values = {
        company_name: companyName, contact_name: cForm.contact_name.trim(), email: cForm.email.trim(),
        phone: cForm.phone.trim(), billing_address: cForm.billing_address.trim(),
        shipping_address: cForm.shipping_address.trim(), payment_terms_days: days, notes: cForm.notes.trim(),
      };
      if (cEditing) {
        const updated: Customer = { ...cEditing, ...values };
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setCSelected(updated);
        setCEditing(null);
        setCForm(emptyCustomer);
        setCNotice(`Customer updated and confirmed: ${customerNumber(updated.customer_number)}.`);
        emit({ type: "customer-saved", mode: "edit", customer: updated });
        return;
      }
      const next = Math.max(...customers.map((c) => c.customer_number)) + 1;
      const created: Customer = { id: `c${next}`, customer_number: next, ...values };
      setCustomers((prev) => [created, ...prev]);
      setNewIds((prev) => [...prev, created.id]);
      setCSelected(created);
      setCForm(emptyCustomer);
      setCNotice(`Customer saved and confirmed: ${customerNumber(next)}.`);
      emit({ type: "customer-saved", mode: "add", customer: created });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save customer.";
      setCNotice(message);
      formMiss(message);
    }
  }

  /* ----- Vendors (app/vendors.tsx) ----- */

  function validateVendor(values: typeof emptyVendor) {
    const companyName = values.company_name.trim();
    if (!companyName) throw new Error("Enter the vendor's company or individual name.");
    if (!Object.prototype.hasOwnProperty.call(vendorCurrencies, values.country)) {
      throw new Error("Choose a country from the list.");
    }
    const days = checkTerms(values.payment_terms_days);
    return {
      company_name: companyName, contact_name: values.contact_name.trim(), email: values.email.trim(),
      phone: values.phone.trim(), address: values.address.trim(), country: values.country,
      currency: vendorCurrencies[values.country], payment_terms_days: days, notes: values.notes.trim(),
    };
  }

  function vendorToForm(v: Vendor) {
    return {
      company_name: v.company_name, contact_name: v.contact_name, email: v.email, phone: v.phone,
      address: v.address, country: v.country, payment_terms_days: String(v.payment_terms_days), notes: v.notes,
    };
  }

  function saveVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const values = validateVendor(vForm);
      const next = Math.max(...vendors.map((v) => v.vendor_number)) + 1;
      const created: Vendor = { id: `v${next}`, vendor_number: next, active: true, ...values };
      setVendors((prev) => [created, ...prev]);
      setNewIds((prev) => [...prev, created.id]);
      setVSelected(created);
      setVEditing(false);
      setVForm(emptyVendor);
      setVNotice(`Vendor saved and confirmed: ${vendorNumber(next)}.`);
      emit({ type: "vendor-saved", vendor: created });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save vendor.";
      setVNotice(message);
      formMiss(message);
    }
  }

  function updateVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vSelected) return;
    try {
      const values = validateVendor(vEditForm);
      const updated: Vendor = { ...vSelected, ...values };
      setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setVSelected(updated);
      setVEditing(false);
      setVEditNotice(`${vendorNumber(updated.vendor_number)} changes saved and confirmed.`);
      emit({ type: "vendor-saved", vendor: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save vendor changes.";
      setVEditNotice(message);
      formMiss(message);
    }
  }

  /* ----- Products (app/products.tsx) ----- */

  function editProduct(p: Product) {
    setPEditing(p);
    setPNotice("");
    setPForm({
      vendor_id: p.vendor_id, sku: p.sku, name: p.name, category: p.category, unit_of_measure: p.unit_of_measure,
      purchase_cost: price(p.purchase_cost_cents).slice(1), selling_price: price(p.selling_price_cents).slice(1),
      reorder_level: String(p.reorder_level), description: p.description,
    });
    toTop();
  }

  function cancelProductEdit() {
    setPEditing(null);
    setPForm(emptyProduct);
    setPNotice("");
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!pForm.vendor_id) throw new Error("Choose a vendor.");
      const vendor = vendors.find((v) => v.id === pForm.vendor_id);
      if (!vendor || !vendor.active) throw new Error("Choose an active vendor.");
      const sku = pForm.sku.trim().toUpperCase();
      const name = pForm.name.trim();
      const unit = pForm.unit_of_measure.trim();
      const reorder = Number(pForm.reorder_level);
      if (!/^[A-Z0-9][A-Z0-9._-]{0,49}$/.test(sku))
        throw new Error("Use a unique item code with letters, numbers, dots, hyphens, or underscores.");
      if (!name || !unit) throw new Error("Enter the product name and unit.");
      if (!/^\d+$/.test(pForm.reorder_level) || !Number.isInteger(reorder) || reorder > 2147483647)
        throw new Error("Reorder quantity must be a whole number from 0 to 2147483647.");
      const cost = moneyToCents(pForm.purchase_cost);
      const selling = moneyToCents(pForm.selling_price);

      if (pEditing) {
        const updated: Product = {
          ...pEditing, vendor_id: pForm.vendor_id, name, category: pForm.category, unit_of_measure: unit,
          purchase_cost_cents: cost, selling_price_cents: selling, reorder_level: reorder,
          description: pForm.description.trim(),
        };
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setPEditing(null);
        setPForm(emptyProduct);
        setPNotice("Product changes saved and confirmed: " + updated.sku);
        emit({ type: "product-saved", product: updated });
        return;
      }

      if (products.some((p) => p.sku === sku)) throw new Error("That item code already exists. Use another code.");
      const created: Product = {
        id: `p${products.length + 1}`, vendor_id: pForm.vendor_id, sku, name, category: pForm.category,
        unit_of_measure: unit, purchase_cost_cents: cost, selling_price_cents: selling, reorder_level: reorder,
        quantity_on_hand: 0, description: pForm.description.trim(),
      };
      setProducts((prev) => [created, ...prev]);
      setNewIds((prev) => [...prev, created.id]);
      setPForm(emptyProduct);
      setPNotice("Product saved and confirmed: " + sku);
      emit({ type: "product-saved", product: created });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save product.";
      setPNotice(message);
      formMiss(message);
    }
  }

  function openTab(next: "catalog" | "inventory" | "expiry") {
    setTab(next);
    emit({ type: "tab", tab: next });
  }

  /* ----- render helpers ----- */

  const isError = (msg: string) => !/confirmed/.test(msg);

  const cQuery = cSearch.trim().toLowerCase();
  const visibleCustomers = customers.filter((c) =>
    [customerNumber(c.customer_number), c.company_name, c.contact_name, c.email].some((v) =>
      v.toLowerCase().includes(cQuery),
    ),
  );
  const vQuery = vSearch.trim().toLowerCase();
  const visibleVendors = vendors.filter((v) =>
    [vendorNumber(v.vendor_number), v.company_name, v.contact_name, v.email, v.country, v.currency].some((x) =>
      x.toLowerCase().includes(vQuery),
    ),
  );

  function renderCustomers() {
    return (
      <>
        <section className="lsim-module">
          <h2>{cEditing ? `Edit customer — ${customerNumber(cEditing.customer_number)}` : "Add a customer"}</h2>
          <p>{cEditing ? "Update the existing customer information below." : "Customer numbers are assigned automatically when saved."}</p>
          <form className="lsim-form" onSubmit={saveCustomer}>
            <div className="lsim-fields">
              {([
                ["company_name", "Company or individual name", "text"],
                ["contact_name", "Contact name", "text"],
                ["email", "Email address", "email"],
                ["phone", "Phone", "tel"],
              ] as [keyof typeof emptyCustomer, string, string][]).map(([field, label, type]) => (
                <label key={field}>
                  {label}
                  <input
                    type={type}
                    required={field === "company_name"}
                    value={cForm[field]}
                    onChange={(e) => { setCNotice(""); setCForm((p) => ({ ...p, [field]: e.target.value })); }}
                  />
                </label>
              ))}
              <label>
                Billing address
                <textarea rows={3} value={cForm.billing_address}
                  onChange={(e) => { setCNotice(""); setCForm((p) => ({ ...p, billing_address: e.target.value })); }} />
              </label>
              <label>
                Shipping address
                <textarea rows={3} value={cForm.shipping_address}
                  onChange={(e) => { setCNotice(""); setCForm((p) => ({ ...p, shipping_address: e.target.value })); }} />
              </label>
              <label>
                Payment due in how many days?
                <input value={cForm.payment_terms_days} inputMode="numeric"
                  onChange={(e) => { setCNotice(""); setCForm((p) => ({ ...p, payment_terms_days: e.target.value })); }} />
              </label>
            </div>
            <label>
              Notes
              <textarea rows={2} value={cForm.notes}
                onChange={(e) => { setCNotice(""); setCForm((p) => ({ ...p, notes: e.target.value })); }} />
            </label>
            <div>
              <button className="lsim-pbtn">{cEditing ? "Save changes" : "Save customer"}</button>
              {cEditing && <button type="button" className="lsim-sbtn" onClick={cancelCustomerEdit}>Cancel editing</button>}
            </div>
            {cNotice && <p className={`lsim-status ${isError(cNotice) ? "error" : ""}`} role="status">{cNotice}</p>}
          </form>
        </section>

        <section className="lsim-module">
          <div className="lsim-panelhead">
            <h2>Customers</h2>
            <button type="button" className="lsim-sbtn">Refresh list</button>
          </div>
          <p>The 100 most recently created customers.</p>
          <label className="lsim-search">
            Search this list
            <input type="search" value={cSearch} onChange={(e) => setCSearch(e.target.value)}
              placeholder="Customer number, name, contact, or email" />
          </label>
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Number</th><th>Customer</th><th>Contact</th><th>Details</th></tr></thead>
              <tbody>
                {visibleCustomers.map((c) => (
                  <tr key={c.id} className={newIds.includes(c.id) ? "new" : ""}>
                    <td>{customerNumber(c.customer_number)}</td>
                    <td>{c.company_name}</td>
                    <td>{c.contact_name || "—"}</td>
                    <td>
                      <button type="button" className="lsim-sbtn"
                        onClick={() => { setCSelected(c); emit({ type: "view-customer", customer: c }); }}>View</button>
                      <button type="button" className="lsim-sbtn" disabled={cEditing !== null} onClick={() => editCustomer(c)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleCustomers.length && <p>No customers match this list.</p>}
          </div>
        </section>

        {cSelected && (
          <section className="lsim-module lsim-dl">
            <div className="lsim-panelhead">
              <h2>{cSelected.company_name}</h2>
              <div>
                <button type="button" className="lsim-sbtn" disabled={cEditing !== null} onClick={() => editCustomer(cSelected)}>Edit customer</button>
                <button type="button" className="lsim-sbtn" onClick={() => setCSelected(null)}>Close details</button>
              </div>
            </div>
            <p><strong>Customer number:</strong> {customerNumber(cSelected.customer_number)}</p>
            <p><strong>Contact:</strong> {cSelected.contact_name || "Not entered"}</p>
            <p><strong>Email:</strong> {cSelected.email || "Not entered"}</p>
            <p><strong>Phone:</strong> {cSelected.phone || "Not entered"}</p>
            <p><strong>Payment terms:</strong> {cSelected.payment_terms_days} days</p>
            <p><strong>Billing address:</strong></p>
            <p className="lsim-pre">{cSelected.billing_address || "Not entered"}</p>
            <p><strong>Shipping address:</strong></p>
            <p className="lsim-pre">{cSelected.shipping_address || "Not entered"}</p>
            <p><strong>Notes:</strong></p>
            <p className="lsim-pre">{cSelected.notes || "None"}</p>
            <p className="lsim-note">Account statement: Luna shows the customer’s statement here. You’ll practise it in Lesson 6.</p>
          </section>
        )}
      </>
    );
  }

  function vendorFields(values: typeof emptyVendor, set: (f: keyof typeof emptyVendor, v: string) => void) {
    return (
      <>
        <div className="lsim-fields">
          {([
            ["company_name", "Company or individual name", "text"],
            ["contact_name", "Contact name", "text"],
            ["email", "Email address", "email"],
            ["phone", "Phone", "tel"],
          ] as [keyof typeof emptyVendor, string, string][]).map(([field, label, type]) => (
            <label key={field}>
              {label}
              <input type={type} required={field === "company_name"} value={values[field]}
                onChange={(e) => set(field, e.target.value)} />
            </label>
          ))}
          <label>
            Country
            <select required value={values.country} onChange={(e) => set("country", e.target.value)}>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="China">China</option>
              <option value="India">India</option>
            </select>
          </label>
          <p style={{ alignSelf: "end", margin: "0 0 14px", fontSize: 13 }}>
            Vendor currency: <strong>{vendorCurrencies[values.country]}</strong>
          </p>
          <label>
            Address
            <textarea rows={3} value={values.address} onChange={(e) => set("address", e.target.value)} />
          </label>
          <label>
            Payment due in how many days?
            <input value={values.payment_terms_days} inputMode="numeric"
              onChange={(e) => set("payment_terms_days", e.target.value)} />
          </label>
        </div>
        <label>
          Notes
          <textarea rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </>
    );
  }

  function renderVendors() {
    return (
      <>
        <section className="lsim-module">
          <h2>Add a vendor</h2>
          <p>Vendor numbers are assigned automatically when saved.</p>
          <form className="lsim-form" onSubmit={saveVendor}>
            {vendorFields(vForm, (f, v) => { setVNotice(""); setVForm((p) => ({ ...p, [f]: v })); })}
            <button className="lsim-pbtn">Save vendor</button>
            {vNotice && <p className={`lsim-status ${isError(vNotice) ? "error" : ""}`} role="status">{vNotice}</p>}
          </form>
        </section>

        <section className="lsim-module">
          <div className="lsim-panelhead">
            <h2>Vendors</h2>
            <button type="button" className="lsim-sbtn">Refresh list</button>
          </div>
          <p>The 100 most recently created vendors.</p>
          <label className="lsim-search">
            Search this list
            <input type="search" value={vSearch} onChange={(e) => setVSearch(e.target.value)}
              placeholder="Number, name, contact, email, country, or currency" />
          </label>
          <div className="lsim-table-wrap">
            <table className="lsim-table">
              <thead><tr><th>Number</th><th>Vendor</th><th>Country</th><th>Currency</th><th>Contact</th><th>Details</th></tr></thead>
              <tbody>
                {visibleVendors.map((v) => (
                  <tr key={v.id} className={newIds.includes(v.id) ? "new" : ""}>
                    <td>{vendorNumber(v.vendor_number)}</td>
                    <td>{v.company_name}</td>
                    <td>{v.country}</td>
                    <td>{v.currency}</td>
                    <td>{v.contact_name || "—"}</td>
                    <td>
                      <button type="button" className="lsim-sbtn"
                        onClick={() => { setVSelected(v); setVEditing(false); setVEditNotice(""); }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleVendors.length && <p>No vendors match this list.</p>}
          </div>
        </section>

        {vSelected && (
          <section className="lsim-module lsim-dl">
            <div className="lsim-panelhead">
              <h2>{vEditing ? "Edit vendor" : vSelected.company_name}</h2>
              <div>
                {!vEditing && (
                  <button type="button" className="lsim-pbtn"
                    onClick={() => { setVEditForm(vendorToForm(vSelected)); setVEditNotice(""); setVEditing(true); }}>
                    Edit vendor information
                  </button>
                )}
                <button type="button" className="lsim-sbtn"
                  onClick={() => { setVSelected(null); setVEditing(false); setVEditNotice(""); }}>Close details</button>
              </div>
            </div>
            {!vEditing ? (
              <>
                <p><strong>Vendor number:</strong> {vendorNumber(vSelected.vendor_number)}</p>
                <p><strong>Country:</strong> {vSelected.country} · <strong>Currency:</strong> {vSelected.currency}</p>
                <p><strong>Contact:</strong> {vSelected.contact_name || "Not entered"}</p>
                <p><strong>Email:</strong> {vSelected.email || "Not entered"}</p>
                <p><strong>Phone:</strong> {vSelected.phone || "Not entered"}</p>
                <p><strong>Payment terms:</strong> {vSelected.payment_terms_days} days</p>
                <p><strong>Address:</strong></p>
                <p className="lsim-pre">{vSelected.address || "Not entered"}</p>
                <p><strong>Notes:</strong></p>
                <p className="lsim-pre">{vSelected.notes || "None"}</p>
                <p className="lsim-note">Account statement: Luna shows the vendor’s statement here. You’ll practise it in Lesson 4.</p>
              </>
            ) : (
              <form className="lsim-form" onSubmit={updateVendor}>
                {vendorFields(vEditForm, (f, v) => setVEditForm((p) => ({ ...p, [f]: v })))}
                <button className="lsim-pbtn">Save changes</button>
                <button type="button" className="lsim-sbtn"
                  onClick={() => { setVEditForm(vendorToForm(vSelected)); setVEditing(false); setVEditNotice(""); }}>Cancel</button>
              </form>
            )}
            {vEditNotice && <p className={`lsim-status ${isError(vEditNotice) ? "error" : ""}`} role="status">{vEditNotice}</p>}
          </section>
        )}
      </>
    );
  }

  function renderProducts() {
    const vendorName = (id: string) => vendors.find((v) => v.id === id)?.company_name || "Vendor unavailable";
    return (
      <>
        <nav className="lsim-module" aria-label="Products and inventory sections">
          <div className="lsim-tabs">
            <button type="button" className="lsim-sbtn" aria-pressed={tab === "catalog"} onClick={() => openTab("catalog")}>Product Catalog</button>
            <button type="button" className="lsim-sbtn" aria-pressed={tab === "inventory"} onClick={() => openTab("inventory")}>Inventory Cost (GYD)</button>
            <button type="button" className="lsim-sbtn" aria-pressed={tab === "expiry"} onClick={() => openTab("expiry")}>Expiry Alerts</button>
          </div>
        </nav>

        {tab === "catalog" && (
          <>
            <section className="lsim-module">
              <h2>{pEditing ? "Edit product: " + pEditing.sku : "Add a product"}</h2>
              <p>Purchase cost and selling price apply to one unit.</p>
              <form className="lsim-form" onSubmit={saveProduct}>
                <div className="lsim-fields">
                  <label>
                    Vendor
                    <select value={pForm.vendor_id}
                      onChange={(e) => { setPNotice(""); setPForm((p) => ({ ...p, vendor_id: e.target.value })); }}>
                      <option value="">Choose a vendor</option>
                      {[...vendors]
                        .filter((v) => v.active)
                        .sort((a, b) => a.company_name.localeCompare(b.company_name))
                        .map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                    </select>
                  </label>
                  {([
                    ["sku", "Item code / SKU"],
                    ["name", "Product name"],
                    ["purchase_cost", "Purchase cost per unit (USD)"],
                    ["selling_price", "Selling price per unit (GYD)"],
                    ["reorder_level", "Reorder level (units)"],
                  ] as [keyof typeof emptyProduct, string][]).map(([field, label]) => (
                    <label key={field}>
                      {label}
                      <input
                        readOnly={field === "sku" && pEditing !== null}
                        value={pForm[field]}
                        onChange={(e) => { setPNotice(""); setPForm((p) => ({ ...p, [field]: e.target.value })); }}
                      />
                    </label>
                  ))}
                  <label>
                    Unit
                    <select value={pForm.unit_of_measure}
                      onChange={(e) => { setPNotice(""); setPForm((p) => ({ ...p, unit_of_measure: e.target.value })); }}>
                      <option value="Each">Each</option>
                      <option value="Box">Box</option>
                      <option value="Case">Case</option>
                    </select>
                  </label>
                  <label>
                    Category
                    <select value={pForm.category}
                      onChange={(e) => { setPNotice(""); setPForm((p) => ({ ...p, category: e.target.value })); }}>
                      {Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <label>
                  Description
                  <textarea rows={2} value={pForm.description}
                    onChange={(e) => { setPNotice(""); setPForm((p) => ({ ...p, description: e.target.value })); }} />
                </label>
                <button className="lsim-pbtn">{pEditing ? "Save changes" : "Save product"}</button>
                {pEditing && <button type="button" className="lsim-sbtn" onClick={cancelProductEdit}>Cancel edit</button>}
                {pNotice && <p className={`lsim-status ${isError(pNotice) ? "error" : ""}`} role="status">{pNotice}</p>}
              </form>
              <p className="lsim-foot">
                Saving a product does not add stock or change account balances. Stock increases when deliveries
                against approved purchase orders are recorded. Use Inventory Expiry Alerts to record lot expiry
                dates. PharmaBridge stores pharmaceutical regulatory records; those records alone do not release
                stock for sale.
              </p>
            </section>

            <section className="lsim-module">
              <h2>Product catalog</h2>
              <p>The 100 most recently created products.</p>
              <div className="lsim-table-wrap">
                <table className="lsim-table">
                  <thead>
                    <tr><th>Item code</th><th>Product</th><th>Vendor</th><th>Category</th><th>Unit</th><th>In stock</th><th>Vendor unit price (USD)</th><th>Selling price (GYD)</th><th>Stock status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className={newIds.includes(p.id) ? "new" : ""}>
                        <td>{p.sku}</td>
                        <td>{p.name}</td>
                        <td>{vendorName(p.vendor_id)}</td>
                        <td>{categories[p.category]}</td>
                        <td>{p.unit_of_measure}</td>
                        <td>{p.quantity_on_hand.toLocaleString("en-US")}</td>
                        <td>{price(p.purchase_cost_cents)}</td>
                        <td>GYD {price(p.selling_price_cents).slice(1)}</td>
                        <td>{p.quantity_on_hand <= p.reorder_level ? "Reorder needed" : "In stock"}</td>
                        <td>
                          <button type="button" className="lsim-sbtn" onClick={() => editProduct(p)} aria-label={"Edit " + p.name}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === "inventory" && (
          <section className="lsim-module">
            <div className="lsim-panelhead">
              <h2>Inventory costs (GYD)</h2>
              <button type="button" className="lsim-sbtn">Refresh GYD inventory</button>
            </div>
            <p>Stock costs and values are recorded in Guyana dollars. Vendor purchase prices remain USD source amounts.</p>
            <div className="lsim-table-wrap">
              <table className="lsim-table">
                <thead><tr><th>Product</th><th>Lot</th><th>Received</th><th>In stock</th><th>Unit cost (GYD)</th><th>Stock value (GYD)</th><th>Status</th></tr></thead>
                <tbody>
                  {seedLots.map((l) => {
                    const p = products.find((x) => x.id === l.product_id);
                    return (
                      <tr key={l.lot}>
                        <td>{p ? `${p.sku} — ${p.name}` : "Product unavailable"}</td>
                        <td>{l.lot}</td>
                        <td>{l.received}</td>
                        <td>{l.remaining}</td>
                        <td>{l.unit_cost_cents === null ? "Unknown" : gyd(l.unit_cost_cents)}</td>
                        <td>{l.unit_cost_cents === null ? "Unknown" : gyd(l.unit_cost_cents * l.remaining)}</td>
                        <td>{l.verified ? "Verified" : "Exchange-rate review needed"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="lsim-foot">The 100 most recent stock lots. Unknown costs are not counted as zero. Lot numbers here are fictional.</p>
          </section>
        )}

        {tab === "expiry" && (
          <section className="lsim-module">
            <h2>Expiry Alerts</h2>
            <p>Stocked lots only. Expired, 30-day, 60-day and 90-day warnings use the recorded batch expiry date. Missing required dates also need attention.</p>
            <p className="lsim-note">Recording batch details and expiry dates is practised in Lesson 5.</p>
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
                <span>
                  <strong>{card.title}</strong>
                  <span>{card.description}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      );
    }
    if (active === "Customers") return renderCustomers();
    if (active === "Vendors") return renderVendors();
    if (active === "Products & Inventory") return renderProducts();
    return (
      <div className="lsim-module">
        <p style={{ marginTop: 0 }}>{descriptions[active] ?? "Luna does not show a description for this section."}</p>
        <p className="lsim-note">
          This lesson works in Customers, Vendors and Products & Inventory. You’ll practise {active} in{" "}
          {coveredIn[active] ?? "a later lesson"}.
        </p>
      </div>
    );
  }

  return (
    <div className="lsim" aria-label="Luna training simulator, Lesson 2">
      <style>{simulatorStyles + formStyles}</style>
      <div className="lsim-top">
        TRAINING SIMULATOR · Fictional customers, vendors and products · Not connected to production Luna
      </div>

      <div className="lsim-coach">
        <div className="lsim-coach-head">
          <h4>
            Lesson 2 · {LESSON_TITLE} · Task {Math.min(step + 1, missions.length)} of {missions.length}
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
            <p><strong>Lesson 2 complete.</strong></p>
            <p>
              You can now find and correct a customer, add customers and vendors, set up a product, and explain
              why stock comes only from recorded deliveries. You can also tell a product from a lot and say who
              can open each section.
            </p>
            <p>Next: Lesson 3 uses these records to prepare a purchase order and take it through Director approval.</p>
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
              {mission.kind === "do" && mission.details && (
                <ul className="lsim-details-list">
                  {mission.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
              )}
              {mission.kind === "choice" && (
                <div style={{ marginTop: 8 }}>
                  {mission.options.map((o) => (
                    <button key={o.text} type="button" className="lsim-btn secondary lsim-choice"
                      disabled={advanceReady} onClick={() => choose(o)}>
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
              {feedback.lines.map((line) => <p key={line}>{line}</p>)}
              <WhyNotWorking help={feedback.help} />
            </div>
          ) : (
            <div className="lsim-note" style={{ marginTop: 0 }}>
              Do the task in the practice workspace below. Feedback will appear here.
            </div>
          )
        )}

        <p className="lsim-footnote">
          Form labels, list columns, validation messages and confirmations match the current Luna code. Records
          are fictional and reset when you restart, and nothing here changes production Luna.
        </p>
      </div>

      <div className="lsim-stage">
        <div className="lsim-bar">
          <span>Signed in as <strong>Training Director</strong> · Director</span>
        </div>
        <div className="lsim-shell">
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
