const proofItems = [
  "Private beta",
  "Built for operators",
  "Launching soon",
];

const steps = [
  {
    label: "01",
    title: "Capture demand",
    copy: "Collect qualified interest before full product release.",
  },
  {
    label: "02",
    title: "Shape positioning",
    copy: "Test message clarity with a page made for fast iteration.",
  },
  {
    label: "03",
    title: "Convert early users",
    copy: "Move visitors toward waitlist, demo, or sales workflows.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>Madoo</span>
          </a>
          <div className="nav-actions">
            <a href="#details">Details</a>
            <a className="nav-cta" href="mailto:hello@madoo.ai">
              Contact
            </a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">New product</p>
            <h1>Launch page ready for next Madoo product.</h1>
            <p className="lede">
              Focused landing shell for positioning, waitlist capture, and beta
              demand before product details are final.
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <a className="primary-action" href="mailto:hello@madoo.ai">
                Start conversation
              </a>
              <a className="secondary-action" href="#details">
                View structure
              </a>
            </div>
            <ul className="proof-list" aria-label="Launch status">
              {proofItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="product-visual" aria-label="Landing page preview">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-body">
              <div className="preview-head">
                <p>Launch pipeline</p>
                <strong>78%</strong>
              </div>
              <div className="preview-chart" aria-hidden="true">
                <span style={{ height: "42%" }} />
                <span style={{ height: "64%" }} />
                <span style={{ height: "56%" }} />
                <span style={{ height: "83%" }} />
                <span style={{ height: "72%" }} />
              </div>
              <div className="preview-panel">
                <span>Waitlist fit</span>
                <strong>High signal</strong>
              </div>
              <div className="preview-rows" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="details" className="section">
        <div className="section-heading">
          <p className="eyebrow">Project shell</p>
          <h2>Built to swap in real product copy fast.</h2>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.label}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
