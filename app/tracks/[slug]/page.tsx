import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { directorCurriculum } from "../../director-curriculum";
import DirectorWorkspaceSimulator from "../../director-workspace-simulator";
import DirectorLesson2Simulator from "../../director-lesson2-simulator";
import { directorLearningMaterial } from "../../director-learning-material";
const learningTracks = [
  {
    slug: "director",
    name: "Director",
    label: "Oversight and approvals",
    description:
      "Build confidence reviewing purchasing decisions, business exceptions, and PharmaBridge oversight.",
    lessons: [
      {
        title: "Review a purchase order",
        objective:
          "Identify the information needed before making an approval decision.",
        steps: [
          "Review the fictional supplier, currency, products, quantities, and totals.",
          "Check whether supporting documents are present.",
          "Identify missing information or differences that need clarification.",
        ],
        exercise:
          "A fictional purchase order lists 12 units, but the attached quotation lists 10. Explain what you would clarify before approving it.",
      },
      {
        title: "Review receiving and accounting exceptions",
        objective:
          "Recognize differences between ordered, received, and billed quantities.",
        steps: [
          "Compare the purchase order with the receiving record.",
          "Compare the receiving record with the supplier bill.",
          "Describe the discrepancy and the information needed to resolve it.",
        ],
        exercise:
          "A fictional order contains 20 units. The receiving record shows 18, but the supplier bill charges for 20. Write a short exception note.",
      },
      {
        title: "Understand PharmaBridge oversight",
        objective:
          "Identify documentation gaps that need specialist review.",
        steps: [
          "Review the fictional shipment document checklist.",
          "Identify missing permit, batch, or product information.",
          "Prepare a clear handoff to the Regulatory Specialist.",
        ],
        exercise:
          "A fictional shipment record has no batch documentation attached. Describe the gap and who should review it.",
      },
    ],
  },
  {
    slug: "bookkeeper",
    name: "Bookkeeper",
    label: "Preparation and accounting",
    description:
      "Practice reviewing supplier purchases, GYD customer transactions, and supporting records.",
    lessons: [
      {
        title: "Prepare a USD supplier purchase",
        objective:
          "Identify the records needed to prepare a fictional supplier purchase.",
        steps: [
          "Review the supplier quotation and purchase details.",
          "Check the currency, quantities, and supporting documents.",
          "Flag missing information before submitting for review.",
        ],
        exercise:
          "A fictional supplier quotation is in USD, but the purchase draft is marked GYD. Explain what needs to be checked before submission.",
      },
      {
        title: "Review a GYD customer payment",
        objective:
          "Compare a fictional customer payment with its supporting invoice.",
        steps: [
          "Identify the customer and invoice reference.",
          "Compare the payment amount and currency with the invoice.",
          "Record any difference that needs follow-up.",
        ],
        exercise:
          "A fictional GYD 50,000 invoice has a GYD 45,000 payment. Describe the outstanding difference and what you would verify.",
      },
      {
        title: "Reconcile supporting documents",
        objective:
          "Recognize when a transaction does not have enough supporting evidence.",
        steps: [
          "Match transaction references across the available documents.",
          "Identify missing or inconsistent evidence.",
          "Prepare a short follow-up note.",
        ],
        exercise:
          "A fictional supplier bill has no receiving record attached. List the information you would request before proceeding.",
      },
    ],
  },
  {
    slug: "salesman",
    name: "Salesman",
    label: "Customers and orders",
    description:
      "Practice selecting customers and products, checking approved prices, and preparing clear order handoffs.",
    lessons: [
      {
        title: "Select the customer and products",
        objective:
          "Identify the customer and product details needed for an order.",
        steps: [
          "Check the fictional customer name and account reference.",
          "Review the requested product and quantity.",
          "Clarify incomplete or ambiguous requests.",
        ],
        exercise:
          "Two fictional customers have similar names. Explain which details you would verify before entering the order.",
      },
      {
        title: "Check approved GYD selling prices",
        objective:
          "Recognize a price difference that needs review.",
        steps: [
          "Review the fictional approved GYD price list.",
          "Compare the order price with the listed price.",
          "Flag differences instead of assuming a discount is authorized.",
        ],
        exercise:
          "A fictional product has a listed price of GYD 5,000, but the order draft shows GYD 4,500. Describe what you would verify.",
      },
      {
        title: "Prepare an order-status handoff",
        objective:
          "Communicate the known order status without promising an unconfirmed outcome.",
        steps: [
          "Review the available order-status information.",
          "Separate confirmed details from items awaiting verification.",
          "Prepare a concise customer follow-up or internal handoff.",
        ],
        exercise:
          "A fictional order is awaiting a stock check. Write an update that does not promise a delivery date.",
      },
    ],
  },
  {
    slug: "regulatory-specialist",
    name: "Regulatory Specialist",
    label: "PharmaBridge operations",
    description:
      "Practice reviewing fictional pharmaceutical records, shipment documentation, and traceability information.",
    lessons: [
      {
        title: "Review product and permit records",
        objective:
          "Identify missing or inconsistent information in a fictional document set.",
        steps: [
          "Compare product identifiers across the supplied records.",
          "Review the example permit references and dates.",
          "List gaps for review without assuming regulatory clearance.",
        ],
        exercise:
          "A fictional product name differs between the product record and the attached permit example. Explain what needs clarification.",
      },
      {
        title: "Review shipment and batch traceability",
        objective:
          "Check whether a fictional shipment can be linked to its batch records.",
        steps: [
          "Review the shipment reference and listed products.",
          "Compare batch identifiers across the available documents.",
          "Identify missing links in the document trail.",
        ],
        exercise:
          "A fictional shipment lists two batches, but supporting evidence covers only one. Prepare a short exception note.",
      },
      {
        title: "Review quality and expiry evidence",
        objective:
          "Identify documentation differences requiring further review.",
        steps: [
          "Review the fictional batch and expiry information.",
          "Compare the dates and identifiers across the documents.",
          "Document uncertainties without treating them as resolved.",
        ],
        exercise:
          "Two fictional documents show different expiry dates for the same batch. Describe the discrepancy and the clarification needed.",
      },
    ],
  },
];

export function generateStaticParams() {
  return learningTracks.map((track) => ({
    slug: track.slug,
  }));
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const track =
    slug === "director"
      ? directorCurriculum
      : learningTracks.find((item) => item.slug === slug);
  

  if (!track) {
    notFound();
  }

  return (
    <main className="academy-shell">
      <div className="training-banner">
        TRAINING ONLY · No connection to production Luna
      </div>

      <header className="academy-header">
        <Link className="brand" href="/" aria-label="Luna Academy home">
          <span className="brand-icon" aria-hidden="true">
            L
          </span>

          <span>
            <span className="brand-name">Luna Academy</span>
            <span className="brand-subtitle">
              Learn. Practice. Demonstrate.
            </span>
          </span>
        </Link>

        <Image
          src="/ems-logo.png"
          alt="Elevate Medical Solutions"
          width={245}
          height={120}
          className="ems-header-logo"
          priority
        />
      </header>

      <section className="track-page-content">
        <Link className="academy-back-link" href="/">
          ← All learning tracks
        </Link>

        <p className="eyebrow">{track.label}</p>
        <h1 className="track-page-title">{track.name} learning track</h1>
        <p className="track-page-description">{track.description}</p>

        <div className="notice">
          <h2>How to use this track</h2>
         <p>
  Open a lesson and work through its practice simulator. Each
  simulator uses fictional records and never connects to the
  real Luna. When you finish a lesson, it is recorded in your
  Academy training record, which a Director can review.
</p>
        </div>


        <h2 className="track-lessons-heading">
          Your lessons · {track.lessons.length} outlines
        </h2>

        <div className="academy-lesson-list">
          {track.lessons.map((lesson, index) => (
            <details className="academy-lesson" key={lesson.title}>
              <summary>
                <span className="academy-lesson-number">
                  Lesson {index + 1}
                </span>
                <span>{lesson.title}</span>
              </summary>

              <div className="academy-lesson-body">
              {slug === "director" &&
  lesson.title === "Getting started with Luna" && (
    <DirectorWorkspaceSimulator />
  )}
              {slug === "director" &&
  lesson.title === "Customers, vendors, and products" && (
    <DirectorLesson2Simulator />
  )}
                <h3>Learning objective</h3>
                <p>{lesson.objective}</p>
          {slug === "director" &&
  directorLearningMaterial[lesson.title] && (
    <details className="academy-lesson">
  <summary>Background reading: how each part of Luna works</summary>
      {directorLearningMaterial[lesson.title].sections.map(
        (section) => (
          <div key={section.heading}>
            <h3>{section.heading}</h3>

            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ),
      )}

      <div className="academy-exercise">
        <h3>Worked example</h3>

        <p>
          {directorLearningMaterial[lesson.title].workedExample.scenario}
        </p>

        <ol>
          {directorLearningMaterial[
            lesson.title
          ].workedExample.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <div className="academy-exercise">
        <h3>Practice activity</h3>

        <p>
          {directorLearningMaterial[lesson.title].practice.task}
        </p>

        <ol>
          {directorLearningMaterial[
            lesson.title
          ].practice.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>

        <details>
          <summary>Show answer guidance</summary>

          <ol>
            {directorLearningMaterial[
              lesson.title
            ].practice.answerGuide.map((answer) => (
              <li key={answer}>{answer}</li>
            ))}
          </ol>
        </details>
      </div>
        </details>
     )}
                <h3>Review checklist</h3>
                <ul>
                  {lesson.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>

                <div className="academy-exercise">
                  <h3>Fictional practice exercise</h3>
                  <p>{lesson.exercise}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <footer className="academy-footer">
        Fictional training content only. Completing a course does not
        grant production permissions or regulatory certification.
      </footer>
    </main>
  );
}