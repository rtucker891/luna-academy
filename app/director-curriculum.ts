export const directorCurriculum = {
  slug: "director",
  name: "Director",
  label: "Complete Luna system training",
  description:
    "Learn the full Luna system: purchasing, sales, receiving, returns, banking, accounting, inventory, reporting, administration, Luna AI, and PharmaBridge.",

  lessons: [
    {
      title: "Getting started with Luna",
      objective:
        "Understand the complete workspace, the account roles, and the relationship between Luna and PharmaBridge.",
      steps: [
        "Identify the main Luna navigation sections and their purposes.",
        "Review Settings and User Access as separate administration areas.",
        "Distinguish Director, Bookkeeper, Assistant Bookkeeper, and Salesman access.",
        "Locate PharmaBridge and its separate navigation.",
      ],
      exercise:
        "Create a navigation checklist for the Director. Identify which areas involve financial records, physical stock, user access, or pharmaceutical documentation.",
    },

    {
      title: "Customers, vendors, and products",
      objective:
        "Understand the master records that support purchasing, sales, and inventory workflows.",
      steps: [
        "Locate customer profiles, contacts, billing details, and payment terms.",
        "Locate vendor profiles, purchasing terms, and supporting records.",
        "Review product identifiers, categories, ordering units, and pack quantities.",
        "Distinguish a product record from an inventory lot.",
      ],
      exercise:
        "Using fictional records, identify the customer, vendor, product, ordering unit, and pack quantity needed for an example transaction. List any missing information.",
    },

    {
      title: "Purchase orders and Director approval",
      objective:
        "Understand purchase-order preparation, version-specific submission, and the Director's approval decision.",
      steps: [
        "Review the supplier, product lines, quantities, USD amounts, delivery address, and expected delivery date.",
        "Distinguish an ordinary saved draft from a version submitted for Director approval.",
        "Review the submitted order before confirming and signing to activate it.",
        "Identify when to return an order for correction with a reason.",
        "Recognize that approval does not receive stock or create a vendor bill.",
      ],
      exercise:
        "A fictional submitted purchase order has quantities that differ from its quotation. Explain the discrepancy and prepare a return-for-correction note instead of approving it.",
    },

    {
      title: "Vendor receiving and supplier bills",
      objective:
        "Distinguish physical receiving from supplier billing and accounting recording.",
      steps: [
        "Locate approved purchase orders awaiting receipt.",
        "Review the arrival date, ordering unit, and quantities actually received.",
        "Understand partial deliveries, remaining quantities, and receipt history.",
        "Distinguish receiving stock from creating or recording a supplier bill.",
        "Identify received deliveries that still need accounting attention.",
      ],
      exercise:
        "A fictional approved order contains 20 units, but only 18 arrive and the supplier bill lists 20. Describe the receiving record and the separate billing exception that need review.",
    },

    {
      title: "Exchange rates and inventory costing",
      objective:
        "Understand Luna's USD supplier boundary, GYD accounting records, and evidence-based stock valuation.",
      steps: [
        "Distinguish USD supplier amounts from GYD accounting and inventory amounts.",
        "Identify exchange-rate evidence and the relevant review controls.",
        "Review the relationship between receipts, supplier bills, and inventory costing.",
        "Locate landed-cost and acquisition-expense review areas.",
        "Treat a Needs review valuation as incomplete rather than as zero.",
      ],
      exercise:
        "A fictional received lot has no verified GYD base cost. List the source records and rate evidence that need review without inventing an exchange rate or stock value.",
    },

    {
      title: "Customer orders, invoices, payments, and shipments",
      objective:
        "Understand the connected sales workflow while keeping orders, invoices, payments, and shipments distinct.",
      steps: [
        "Review customer selection, product selection, quantities, and approved selling prices.",
        "Distinguish an order from its customer invoice and payment records.",
        "Review GYD customer-facing amounts and required rate information.",
        "Check shipment prerequisites instead of assuming an order can ship immediately.",
        "Review partial shipments and the available customer documents.",
      ],
      exercise:
        "A fictional order has an invoice but no recorded payment. Identify which conditions must be checked before shipment and write a customer update that does not promise an unconfirmed delivery.",
    },

    {
      title: "Customer returns, credits, and refunds",
      objective:
        "Understand the separate stages of a customer return and its inventory and financial consequences.",
      steps: [
        "Review return eligibility against the original sale and shipped quantities.",
        "Distinguish the return request from physical receiving and inspection.",
        "Separate the restocking decision from credit and refund decisions.",
        "Identify the required approval and accounting reviews.",
        "Follow the supporting document trail through the return.",
      ],
      exercise:
        "A fictional customer requests a return for an item that has not shipped. Explain why the original order, invoice, and shipment evidence must be checked before proceeding.",
    },

    {
      title: "Supplier returns and settlement",
      objective:
        "Understand receipt-linked supplier returns from preparation through settlement.",
      steps: [
        "Identify the original supplier, receipt, lot, and available quantity.",
        "Distinguish preparing a request from Director authorization and dispatch.",
        "Review supplier credit, refund, and adjustment records as separate outcomes.",
        "Follow the return through the settlement register.",
        "Check supporting evidence before treating a return as financially settled.",
      ],
      exercise:
        "A fictional supplier return has been dispatched, but no supplier credit or refund is recorded. Explain what is complete, what remains unresolved, and which evidence is needed.",
    },

    {
      title: "Banking and General Ledger",
      objective:
        "Understand bank setup, reconciliation, journal records, and controlled accounting corrections.",
      steps: [
        "Locate bank accounts and their linked ledger accounts.",
        "Review transaction import, payment matching, and reconciliation areas.",
        "Distinguish a bank transaction from its accounting entry.",
        "Review journal entries and their source-document links.",
        "Locate correction and period controls without assuming posted entries can be overwritten.",
      ],
      exercise:
        "A fictional customer payment cannot be recorded because no suitable GYD deposit account is available. Identify the setup issue without creating an arbitrary bank or ledger account.",
    },

    {
      title: "Reports, budgets, and month-end review",
      objective:
        "Understand management reports and the conditions that make their results incomplete or blocked.",
      steps: [
        "Locate financial statements, aging, purchasing, inventory, and sales reports.",
        "Distinguish verified inventory subtotals from a complete stock valuation.",
        "Review stock movement and sales profitability using their stated reporting basis.",
        "Locate budget planning and month-end review flags.",
        "Recognize that balanced journals do not alone prove complete or correctly classified accounts.",
      ],
      exercise:
        "A fictional report shows a verified inventory subtotal but excludes two products marked Needs review. Explain why the subtotal must not be presented as the complete inventory value.",
    },

    {
      title: "Documents, Luna AI, audit, and automation",
      objective:
        "Understand document handling, AI-assisted proposals, action histories, and administrative automation.",
      steps: [
        "Locate Document Center and supporting business records.",
        "Distinguish an AI response or proposal from an approved, recorded action.",
        "Review Chat History and Luna Task History for their different purposes.",
        "Locate Approvals & Audit and trace actions to supporting records.",
        "Distinguish configuring a report or reminder from verifying execution or delivery.",
      ],
      exercise:
        "Luna produces a fictional accounting proposal from a document. List the source details, permissions, and approval requirements that must be checked before any record-changing action.",
    },

    {
      title: "Complete PharmaBridge operations",
      objective:
        "Understand PharmaBridge's operational sections and the limits of its current integration with stock and sales controls.",
      steps: [
        "Review Overview, Drug Registry, and Government Applications.",
        "Review Import Permit Tracker and International Shipments.",
        "Review Batch Tracking, supporting documents, and expiry evidence.",
        "Review Quality Control and Customer Compliance records.",
        "Review Regulatory Reports and Activity History.",
        "Distinguish recorded statuses from enforced inventory restrictions, stock release, or sales authorization.",
      ],
      exercise:
        "A fictional batch has a quarantine recommendation. Explain why a recorded recommendation must not be assumed to enforce a stock restriction, and identify the operational verification needed before further action.",
    },
  ],
};