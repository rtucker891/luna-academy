import Image from "next/image";
import Link from "next/link";

const tracks = [
  {
    slug: "director",
    name: "Director",
    label: "Complete Luna system training",
    description:
      "Learn all areas of Luna, including purchasing, sales, accounting, inventory, administration, Luna AI, and PharmaBridge.",
    topics: [
      "Purchasing, receiving, sales, and returns",
      "Banking, accounting, inventory, and reporting",
      "Administration, Luna AI, and complete PharmaBridge operations",
    ],
  },
  {
    slug: "bookkeeper",
    name: "Bookkeeper",
    label: "Preparation and accounting",
    description:
      "Practice purchase preparation, supplier bills, GYD customer transactions, costing, and reconciliation.",
    topics: [
      "USD supplier purchases",
      "GYD accounting and customer payments",
      "Supporting documents and reconciliation",
    ],
  },
  {
    slug: "salesman",
    name: "Salesman",
    label: "Customers and orders",
    description:
      "Practice customer selection, approved GYD selling prices, order entry, and responsible handoffs.",
    topics: [
      "Customer and product selection",
      "Approved GYD selling prices",
      "Order status and customer follow-up",
    ],
  },
  {
    slug: "regulatory-specialist",
    name: "Regulatory Specialist",
    label: "PharmaBridge operations",
    description:
      "Practice pharmaceutical records, import and permit tracking, batch documentation, and regulatory exceptions.",
    topics: [
      "Drug Registry, import records, and permits",
      "Shipment documents and batch traceability",
      "Quality reviews and expiry evidence",
    ],
  },
];

export default function Home() {
  return (
    <main className="academy-shell">
      <div className="training-banner">
        TRAINING ONLY · No connection to production Luna
      </div>

      <header className="academy-header">
        <Link
          className="brand"
          href="/"
          aria-label="Luna Academy home"
        >
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

      <section className="hero" aria-labelledby="welcome-heading">
        <p className="eyebrow">
          YOUR LUNA LEARNING ENVIRONMENT
        </p>

        <h1 id="welcome-heading">
          Build confidence before working in Luna.
        </h1>

        <p className="hero-description">
          Role-based learning with guided examples, fictional business
          records, and practical exercises. The Director track covers
          the full Luna system, including PharmaBridge.
        </p>

        <div className="notice">
          <h2>What this build includes</h2>

          <p>
            Four learning tracks, including 12 Director outlines
            covering the full Luna system. These are draft learning
            outlines with fictional discussion exercises. Sign-in,
            saved progress, and the working practice app are not
            connected yet.
          </p>
        </div>
      </section>

      <section
        className="tracks-section"
        aria-labelledby="tracks-heading"
      >
        <div className="section-heading">
          <p className="eyebrow">FOUR LEARNING TRACKS</p>

          <h2 id="tracks-heading">
            Training built around your role
          </h2>
        </div>

        <div className="track-grid">
          {tracks.map((track) => (
            <article className="track-card" key={track.slug}>
              <p className="track-label">{track.label}</p>

              <h3>{track.name}</h3>

              <p className="track-description">
                {track.description}
              </p>

              <ul>
                {track.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>

              <Link
                className="academy-track-link"
                href={`/tracks/${track.slug}`}
              >
                Explore this track →
              </Link>
            </article>
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