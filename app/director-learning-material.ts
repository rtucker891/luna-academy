export type DirectorLearningMaterial = {
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
  workedExample: {
    scenario: string;
    explanation: string[];
  };
  practice: {
    task: string;
    questions: string[];
    answerGuide: string[];
  };
};

export const directorLearningMaterial: Record<
  string,
  DirectorLearningMaterial
> = {
  "Getting started with Luna": {
    sections: [
      {
        heading: "1. Understand the workspace",
        paragraphs: [
          "Luna brings business records and operational workflows into one workspace. The Director's first task is to understand where information belongs—not to approve or change records immediately.",
          "In the accounting workspace, the main navigation lists the available sections. Selecting a section changes the working area. On a small screen, the navigation is opened with the menu control. The sections shown depend on the account's access permissions.",
          "For this introductory lesson, use the navigation map below as a reference. If you inspect the actual application, use an authorized account and remain in observation mode. Do not create practice transactions, change settings, approve requests, or edit user access in production.",
        ],
      },
      {
        heading: "2. Find customers, suppliers, and products",
        paragraphs: [
          "Customers is the section for customer profiles, contacts, billing addresses, and payment terms. Start here when the question concerns who the customer is or which details belong to that customer.",
          "Vendors contains supplier profiles, contacts, purchasing terms, and authorization records. A vendor record describes the supplier; it is not itself a purchase order or proof that goods have arrived.",
          "Products & Inventory covers products, lots, and stock. Use this area to investigate what an item is and its inventory records. A product identifies an item, while a lot distinguishes a particular group of stock associated with that item.",
          "Director review often connects these areas. For example, a purchase question may require checking the supplier in Vendors, the item in Products & Inventory, and the transaction in Purchase Orders. One record rarely tells the entire story.",
        ],
      },
      {
        heading: "3. Follow purchasing and sales through separate sections",
        paragraphs: [
          "Purchase Orders is the preparation and tracking area for supplier orders. Director Approval is a separate review area whose workspace description covers purchase-order review and supplier-return authorization.",
          "Vendor Receiving is the area for recording goods received against approved purchase orders. Supplier Returns supports preparing, dispatching, and settling receipt-linked supplier returns.",
          "Customer Orders is the area for entering customer orders and tracking fulfillment. Customer Returns covers return authorization, receiving, inspection, restocking, credits, and refunds.",
          "Invoices & Bills contains customer invoices and vendor bills. An order, a receipt, an invoice, and a payment are different business events. Finding one does not establish that the others have happened. Later lessons will explain how to examine their supporting records.",
        ],
      },
      {
        heading: "4. Find financial evidence and management review",
        paragraphs: [
          "Banking supports transaction imports, payment matching, and bank reconciliation. General Ledger contains accounts, journal entries, and accounting periods.",
          "Financial Reports provides financial statements and management reports. Month-end Review is a separate area for reviewing unfinished accounting work before preparing final monthly reports.",
          "Budget Planning is used for monthly income and expense plans and comparison with recorded entries. Scheduled Reports is for configuring reporting schedules and owner email notifications. Email & Reminders covers business notifications and delivery history.",
          "These areas answer different questions. A report summarizes recorded information, while a source record explains an individual event. If a total looks unexpected, identify the period, source records, and outstanding work before treating the summary as a complete explanation.",
        ],
      },
      {
        heading: "5. Locate documents, AI assistance, and activity evidence",
        paragraphs: [
          "Document Center is the place for uploading and organizing invoices, receipts, and other business records. Documents provide evidence to compare with the structured records used in purchasing, sales, and accounting.",
          "Luna AI Assistant, Chat History, and Luna Task History are separate navigation entries. The workspace describes Luna Task History as a place to see saved document-accounting tasks, their outcomes, and pending reviews.",
          "Do not treat an assistant's written response as proof that a transaction was approved, recorded, paid, or completed. Verify the relevant business record and its outcome. A conversation and an accounting result are not interchangeable evidence.",
          "Approvals & Audit is the section for reviewing pending actions and inspecting recorded activity. When investigating a decision, identify the business record, its supporting documents, and the available activity evidence rather than relying only on someone remembering what happened.",
        ],
      },
      {
        heading: "6. Distinguish administration from PharmaBridge",
        paragraphs: [
          "Settings and User Access are separate navigation entries. The workspace describes Settings as the area for configuring Elevate Medical Solutions and Luna's operating policies. User access concerns who can use the system and the permissions attached to their account.",
          "Do not change either area as part of this orientation. A missing section should be investigated with the authorized administrator rather than worked around by sharing credentials or changing permissions for convenience.",
          "PharmaBridge is a separate workspace entry for pharmaceutical operations. Selecting it switches away from the ordinary accounting navigation into its own working area.",
          "For now, learn where PharmaBridge is located and distinguish pharmaceutical documentation from ordinary purchasing and accounting records. The detailed PharmaBridge lesson will cover its screens and controls after those have been reviewed.",
        ],
      },
    ],

    workedExample: {
      scenario:
        "Fictional orientation case: A supplier says that an order has been delivered and asks for payment. The Director has not yet checked the order, receiving record, or supplier bill.",

      explanation: [
        "Begin with Vendors if the supplier's identity or purchasing terms need checking.",
        "Use Purchase Orders to locate the order. Use Director Approval if its approval information needs review.",
        "Use Vendor Receiving to investigate recorded receipt of the goods. The supplier's statement alone does not establish what quantities were received.",
        "Use Invoices & Bills to investigate the supplier bill. Use Banking and the relevant accounting records to investigate payment evidence where appropriate.",
        "Use Document Center for supporting records and Approvals & Audit for available activity evidence. This is a navigation plan, not permission to approve payment or change the records.",
      ],
    },

    practice: {
      task:
        "Without changing any production records, prepare a navigation plan for the fictional requests below. Name the section you would start with and explain what you would look for.",

      questions: [
        "A customer says their billing address is incorrect. Where would you start?",
        "An approved supplier order may have arrived short. Which purchasing and receiving areas would you investigate?",
        "The Director wants to review unfinished accounting work before monthly reporting. Which area is the starting point?",
        "A colleague says Luna AI completed a task. What would you inspect before accepting that the underlying business action is complete?",
        "A user cannot see a section they expect to use. Which administration area is relevant, and what should you avoid doing?",
        "Where would you begin investigating pharmaceutical operational records?",
      ],

      answerGuide: [
        "Start with Customers and identify the correct customer profile and billing details. Identifying the record does not authorize changing it.",
        "Review Purchase Orders and Vendor Receiving. Compare the order with the recorded receipt and supporting evidence rather than assuming that approval proves full delivery.",
        "Start with Month-end Review. Financial Reports is relevant to the reporting output, but the unfinished-work review has its own section.",
        "Inspect Luna Task History where relevant, then verify the actual business record, its outcome, and available approval or activity evidence. Chat text alone is not sufficient.",
        "User Access is relevant. Ask the authorized administrator to investigate the account's permissions. Do not share credentials or alter permissions merely to bypass the restriction.",
        "Begin with PharmaBridge. Detailed pharmaceutical workflows and the meaning of their statuses will be covered separately.",
      ],
    },
  },
};