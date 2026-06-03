const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Try Madoo with simple email generation.",
    features: ["5 AI emails", "Template gallery", "HTML preview"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$19",
    description: "Create, edit, and export campaigns faster.",
    features: ["Unlimited drafts", "Brand-aware templates", "Provider exports", "Priority rendering"],
    cta: "Get Pro",
    featured: true,
  },
  {
    name: "Team",
    price: "$49",
    description: "Shared email production for growing teams.",
    features: ["Shared workspace", "Team templates", "Review workflows", "Advanced support"],
    cta: "Start team",
  },
]

export default function PricingPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#fbfaf6] font-ibm-plex-sans">
      <div className="madoo-paper-background pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fbfaf6]/82 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <a className="flex cursor-pointer items-center gap-2.5" href="/" aria-label="Madoo AI home">
            <img className="h-7 w-7 object-contain" src="/madoo-transparent.png" alt="" aria-hidden="true" />
            <span className="font-medium leading-none tracking-normal text-[#2b3037]">Madoo AI</span>
          </a>

          <a className="text-sm font-medium text-[#23272f] transition hover:text-[#5b63ff]" href="/">
            Back home
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8d3c9] bg-white px-3 py-1.5 text-sm font-medium text-[#5f6670]">
            <img src="/madoo-transparent.png" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            Madoo pricing
          </div>
          <h1 className="text-5xl font-semibold leading-none text-[#171717] sm:text-6xl">
            Pick your email engine.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#6f6961]">
            Start small, then scale into faster email production with templates, AI drafts, and provider-ready exports.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`madoo-paper-border rounded-[28px] bg-white p-6 ${plan.featured ? "shadow-[0_24px_80px_rgba(12,52,106,0.16)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#171717]">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f6961]">{plan.description}</p>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-[#071b38] px-3 py-1 text-xs font-semibold text-white">Popular</span>
                ) : null}
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-semibold leading-none text-[#171717]">{plan.price}</span>
                <span className="pb-1 text-sm text-[#6f6961]">/ month</span>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-[#24221f]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5b63ff]" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                className={`mt-8 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-full text-sm font-medium transition ${
                  plan.featured ? "bg-[#101114] text-white hover:bg-[#26282d]" : "bg-[#f3faff] text-[#071b38] hover:bg-[#e6f2ff]"
                }`}
                href="/"
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
