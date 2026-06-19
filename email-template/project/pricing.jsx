// Mailmint AI — Pricing screen
const { useState: useStateP } = React;

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it without a card.',
    priceMonthly: 0,
    priceAnnual: 0,
    contacts: '500',
    sends: '2,000 emails/mo',
    features: [
      { label: '10 AI generations / month', included: true },
      { label: '12 free templates', included: true },
      { label: 'Send from a Mailmint subdomain', included: true },
      { label: 'Open & click tracking', included: true },
      { label: 'Email + chat support', included: false },
      { label: 'Custom sending domain', included: false },
      { label: 'A/B testing', included: false },
      { label: 'Premium templates', included: false },
    ],
    cta: 'Get started',
    highlight: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For founders shipping their first launches.',
    priceMonthly: 25,
    priceAnnual: 21,
    contacts: '5 workspaces',
    sends: '50 test emails/day',
    features: [
      { label: '100 AI credits / month', included: true },
      { label: '15 AI credits / day', included: true },
      { label: '50 stored templates', included: true },
      { label: '2 team members', included: true },
      { label: '5 workspaces', included: true },
      { label: '50 test emails / day', included: true },
    ],
    cta: 'Upgrade to Basic',
    highlight: false,
  },
  {
    id: 'medium',
    name: 'Medium',
    tagline: 'When sending is part of how you grow.',
    priceMonthly: 50,
    priceAnnual: 42,
    contacts: '15 workspaces',
    sends: '100 test emails/day',
    features: [
      { label: '250 AI credits / month', included: true },
      { label: '25 AI credits / day', included: true },
      { label: '150 stored templates', included: true },
      { label: '3 team members', included: true },
      { label: '15 workspaces', included: true },
      { label: '100 test emails / day', included: true },
    ],
    cta: 'Upgrade to Medium',
    highlight: true,
    badge: 'Most popular',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Big lists, big sends, big expectations.',
    priceMonthly: 95,
    priceAnnual: 80,
    contacts: 'Unlimited workspaces',
    sends: '300 test emails/day',
    features: [
      { label: 'Everything in Medium, plus:', included: true, header: true },
      { label: '550 AI credits / month', included: true },
      { label: '50 AI credits / day', included: true },
      { label: '300 stored templates', included: true },
      { label: '5 team members', included: true },
      { label: 'Unlimited workspaces', included: true },
      { label: '300 test emails / day', included: true },
    ],
    cta: 'Upgrade to Pro',
    highlight: false,
  },
];

const FAQ = [
  { q: 'What counts as an AI generation?', a: 'Each new email created from a prompt is one generation. Edits and revisions on the same email don\'t count — iterate freely.' },
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade and you\'re billed prorated; downgrade and the new rate kicks in next cycle. No fees, no calls, no awkward retention chats.' },
  { q: 'What if I exceed my send limit?', a: 'We\'ll email you at 80% and 100%. You can buy a top-up pack ($10 per 10k extra sends) or upgrade — we never throttle in the middle of a campaign.' },
  { q: 'Do you offer a discount for non-profits or students?', a: 'Yes, 50% off any paid plan. Just reach out from your .org or .edu email.' },
  { q: 'How does deliverability work?', a: 'We sign every email with SPF, DKIM, and DMARC, send through a network of warmed IPs, and monitor reputation 24/7. Open rates above industry average or your money back.' },
];

const PricingScreen = () => {
  const [billing, setBilling] = useStateP('annual'); // monthly | annual
  const [hovered, setHovered] = useStateP(null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '48px 32px 80px', maxWidth: 1280, margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
            <Icon name="sparkle" size={12} /> Pricing that grows with you
          </div>
          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 56, fontWeight: 400, lineHeight: 1.05, letterSpacing: -1, margin: '18px 0 0', color: 'var(--ink)' }}>
            Send beautiful emails<br /><span style={{ fontStyle: 'italic', color: 'var(--accent-deep)' }}>at any scale.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.55 }}>
            Start free. Upgrade when your list does. Cancel anytime — really.
          </p>

          {/* BILLING TOGGLE */}
          <div style={{ display: 'inline-flex', marginTop: 28, padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, gap: 4 }}>
            <button onClick={() => setBilling('monthly')} style={{
              padding: '8px 18px', borderRadius: 999, border: 'none',
              background: billing === 'monthly' ? 'var(--ink)' : 'transparent',
              color: billing === 'monthly' ? 'var(--bg)' : 'var(--ink-soft)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Monthly</button>
            <button onClick={() => setBilling('annual')} style={{
              padding: '8px 18px', borderRadius: 999, border: 'none',
              background: billing === 'annual' ? 'var(--ink)' : 'transparent',
              color: billing === 'annual' ? 'var(--bg)' : 'var(--ink-soft)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Annual
              <span style={{
                padding: '1px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3,
                background: billing === 'annual' ? 'var(--accent)' : 'var(--accent-soft)',
                color: billing === 'annual' ? 'var(--accent-fg)' : 'var(--accent-deep)',
              }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* PRICING GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 44, alignItems: 'stretch' }}>
          {PRICING_PLANS.map(plan => {
            const price = billing === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const isHigh = plan.highlight;
            const isHovered = hovered === plan.id;
            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  background: isHigh ? 'var(--ink)' : 'var(--surface)',
                  color: isHigh ? 'var(--bg)' : 'var(--ink)',
                  border: isHigh ? '1px solid var(--ink)' : '1px solid var(--border)',
                  borderRadius: 18,
                  padding: '28px 22px 22px',
                  boxShadow: isHovered ? '0 24px 50px -20px rgba(50,40,30,0.25)' : isHigh ? '0 18px 40px -16px rgba(20,15,10,0.3)' : '0 1px 0 rgba(0,0,0,0.02)',
                  transform: isHovered && !isHigh ? 'translateY(-3px)' : isHigh ? 'translateY(-8px)' : 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    background: 'var(--accent)', color: 'var(--accent-fg)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Icon name="star" size={10} /> {plan.badge}
                  </div>
                )}

                <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, fontWeight: 400, letterSpacing: -0.4, lineHeight: 1 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: isHigh ? 'rgba(250,247,240,0.7)' : 'var(--ink-soft)', marginTop: 8, lineHeight: 1.4, minHeight: 36 }}>{plan.tagline}</div>

                {/* PRICE */}
                <div style={{ marginTop: 18, paddingBottom: 18, borderBottom: isHigh ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>$</div>
                    <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 56, fontWeight: 400, letterSpacing: -2, lineHeight: 1 }}>{price}</div>
                    <div style={{ fontSize: 13, color: isHigh ? 'rgba(250,247,240,0.6)' : 'var(--ink-faint)', fontWeight: 500 }}>/mo</div>
                  </div>
                  {billing === 'annual' && plan.priceMonthly > 0 && (
                    <div style={{ fontSize: 11.5, color: isHigh ? 'rgba(250,247,240,0.55)' : 'var(--ink-faint)', marginTop: 4 }}>
                      <s>${plan.priceMonthly}/mo</s> billed annually
                    </div>
                  )}
                  {plan.priceMonthly === 0 && (
                    <div style={{ fontSize: 11.5, color: isHigh ? 'rgba(250,247,240,0.55)' : 'var(--ink-faint)', marginTop: 4 }}>Free forever, no card needed</div>
                  )}
                </div>

                {/* QUICK STATS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingBottom: 16, borderBottom: isHigh ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, color: isHigh ? 'rgba(250,247,240,0.5)' : 'var(--ink-faint)', textTransform: 'uppercase' }}>Contacts</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{plan.contacts}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, color: isHigh ? 'rgba(250,247,240,0.5)' : 'var(--ink-faint)', textTransform: 'uppercase' }}>Sends</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{plan.sends}</div>
                  </div>
                </div>

                {/* CTA */}
                <button style={{
                  marginTop: 16, padding: '11px 14px', borderRadius: 9, border: 'none',
                  background: isHigh ? 'var(--accent)' : 'var(--ink)',
                  color: isHigh ? 'var(--accent-fg)' : 'var(--bg)',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'opacity 0.15s',
                }}>
                  {plan.cta} <Icon name="arrow" size={12} />
                </button>

                {/* FEATURE LIST */}
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      fontSize: 12.5, lineHeight: 1.4,
                      color: f.header ? (isHigh ? 'rgba(250,247,240,0.95)' : 'var(--ink)') : (f.included ? (isHigh ? 'rgba(250,247,240,0.92)' : 'var(--ink-soft)') : (isHigh ? 'rgba(250,247,240,0.4)' : 'var(--ink-faint)')),
                      fontWeight: f.header ? 600 : 500,
                      textDecoration: f.included || f.header ? 'none' : 'line-through',
                      paddingTop: f.header && i > 0 ? 6 : 0,
                    }}>
                      {!f.header && (
                        <div style={{ flexShrink: 0, marginTop: 2, color: f.included ? (isHigh ? 'var(--accent)' : 'var(--accent-deep)') : 'inherit' }}>
                          {f.included ? <Icon name="check" size={13} stroke={2.4} /> : <Icon name="x" size={11} />}
                        </div>
                      )}
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* TRUST STRIP */}
        <div style={{ marginTop: 48, padding: '24px 28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: 'check', label: '14-day money-back guarantee' },
            { icon: 'lock', label: 'SOC 2 Type II + GDPR' },
            { icon: 'bolt', label: '99.9% uptime SLA' },
            { icon: 'sparkle', label: 'Cancel in one click' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={14} />
              </div>
              {t.label}
            </div>
          ))}
        </div>

        {/* COMPARISON CTA */}
        <div style={{ marginTop: 32, padding: 28, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5, color: 'var(--accent)', textTransform: 'uppercase' }}>
              <Icon name="sparkle" size={12} /> The Mailmint switch
            </div>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, fontWeight: 400, marginTop: 6, lineHeight: 1.1, letterSpacing: -0.3 }}>
              Coming from Mailchimp or Klaviyo?
            </div>
            <div style={{ fontSize: 14, color: 'rgba(250,247,240,0.7)', marginTop: 6, lineHeight: 1.5, maxWidth: 540 }}>
              We migrate your lists, templates, and automations free of charge. Most teams are sending from Mailmint within 48 hours.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '11px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--bg)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Compare features</button>
            <button style={{ padding: '11px 18px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              Book migration call <Icon name="arrow" size={12} />
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 56 }}>
          <div style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto 28px' }}>
            <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}>Common questions</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6 }}>Still wondering? <a style={{ color: 'var(--accent-deep)', fontWeight: 600, textDecoration: 'none' }}>Talk to a human →</a></p>
          </div>
          <div style={{ maxWidth: 720, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {FAQ.map((item, i) => <FaqItem key={i} item={item} first={i === 0} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const FaqItem = ({ item, first }) => {
  const [open, setOpen] = useStateP(false);
  return (
    <div style={{ borderTop: first ? 'none' : '1px solid var(--border-soft)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', gap: 16,
      }}>
        {item.q}
        <div style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--ink-soft)' }}>
          <Icon name="chevronDown" size={16} />
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          {item.a}
        </div>
      )}
    </div>
  );
};

window.PricingScreen = PricingScreen;
