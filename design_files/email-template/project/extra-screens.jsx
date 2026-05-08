// Mailmint AI — additional screens: Contacts, Campaigns, Analytics, Domain
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

// ============ MOCK DATA ============
const MOCK_CONTACTS = [
  { id: 1, name: 'Sofia Martinez', email: 'sofia@acme.co', tags: ['customer', 'pro'], joined: 'Apr 12', status: 'active', opens: 24 },
  { id: 2, name: 'James Liu', email: 'james@startup.io', tags: ['lead'], joined: 'Apr 14', status: 'active', opens: 8 },
  { id: 3, name: 'Priya Shah', email: 'priya@design.studio', tags: ['customer'], joined: 'Apr 02', status: 'active', opens: 41 },
  { id: 4, name: 'Marco Rossi', email: 'marco@trattoria.it', tags: ['customer', 'lapsed'], joined: 'Mar 18', status: 'unsubscribed', opens: 3 },
  { id: 5, name: 'Aisha Khan', email: 'aisha@fintech.co', tags: ['lead', 'enterprise'], joined: 'Apr 20', status: 'active', opens: 12 },
  { id: 6, name: 'David Park', email: 'd.park@consulting.com', tags: ['customer'], joined: 'Feb 09', status: 'active', opens: 67 },
  { id: 7, name: 'Lena Becker', email: 'lena@studio.de', tags: ['lead'], joined: 'Apr 18', status: 'active', opens: 5 },
  { id: 8, name: 'Tom Reilly', email: 'tom@agency.co', tags: ['customer', 'pro'], joined: 'Jan 27', status: 'bounced', opens: 0 },
];

const SEGMENTS = [
  { name: 'All contacts', count: 2847, accent: '#1F1A12' },
  { name: 'Pro customers', count: 412, accent: '#2F5C42' },
  { name: 'Free users', count: 1893, accent: '#A87E54' },
  { name: 'Lapsed (30d+)', count: 184, accent: '#A23E2F' },
  { name: 'New this week', count: 67, accent: '#5B5FCB' },
];

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Spring launch announcement', subject: 'Something new is shipping today.', status: 'sent', sentAt: 'Apr 18, 10:00 AM', recipients: 2847, opens: 1681, clicks: 412, audience: 'All contacts' },
  { id: 2, name: 'Welcome series — day 1', subject: 'Welcome — here\'s where to start.', status: 'sending', sentAt: 'Sending now', recipients: 67, opens: 12, clicks: 4, audience: 'New this week' },
  { id: 3, name: 'Re-engagement push', subject: 'It\'s been a minute.', status: 'scheduled', sentAt: 'Apr 26, 9:00 AM', recipients: 184, opens: 0, clicks: 0, audience: 'Lapsed (30d+)' },
  { id: 4, name: 'Pricing update notice', subject: 'A small change to our pricing.', status: 'draft', sentAt: '—', recipients: 412, opens: 0, clicks: 0, audience: 'Pro customers' },
  { id: 5, name: 'February newsletter', subject: 'The Weekly · Vol. 9', status: 'sent', sentAt: 'Feb 28, 9:00 AM', recipients: 2641, opens: 1320, clicks: 287, audience: 'All contacts' },
];

// ============ CONTACTS SCREEN ============
const ContactsScreen = () => {
  const [activeSegment, setActiveSegment] = useStateA('All contacts');
  const [selected, setSelected] = useStateA(new Set());
  const [search, setSearch] = useStateA('');

  const filtered = MOCK_CONTACTS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* SEGMENT SIDEBAR */}
      <aside style={{ width: 240, borderRight: '1px solid var(--border)', padding: '20px 14px', background: 'var(--surface)', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)' }}>SEGMENTS</div>
          <button style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="plus" size={12}/></button>
        </div>
        {SEGMENTS.map(s => (
          <button key={s.name} onClick={() => setActiveSegment(s.name)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none',
            background: activeSegment === s.name ? 'var(--surface-2)' : 'transparent',
            color: activeSegment === s.name ? 'var(--ink)' : 'var(--ink-soft)',
            fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontWeight: activeSegment === s.name ? 600 : 500,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.accent, flexShrink: 0 }}/>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>{s.count.toLocaleString()}</span>
          </button>
        ))}
        <div style={{ marginTop: 24, padding: 12, background: 'var(--accent-soft)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-deep)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkle" size={12}/> Smart segment
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--accent-deep)', opacity: 0.85, marginTop: 4, lineHeight: 1.45 }}>
            Describe a group in plain words and AI builds the filter.
          </div>
          <button style={{ marginTop: 8, padding: '5px 10px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Try it →</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* HEADER */}
        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: -0.4 }}>{activeSegment}</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                {SEGMENTS.find(s => s.name === activeSegment)?.count.toLocaleString()} contacts · updated 2 min ago
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Import CSV</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--ink)', color: 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Icon name="plus" size={12}/> Add contact
              </button>
            </div>
          </div>
          {/* TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}><Icon name="search" size={13}/></div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…" style={{ width: '100%', height: 32, padding: '0 12px 0 30px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit' }}/>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}><Icon name="sliders" size={12}/> Filter</button>
            {selected.size > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                <span>{selected.size} selected</span>
                <button style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Add tag</button>
                <button style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: 'var(--ink)', color: 'var(--bg)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Send campaign →</button>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
                <th style={{ padding: '10px 16px 10px 32px', textAlign: 'left', width: 30 }}>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--ink)', cursor: 'pointer' }}/>
                </th>
                {['Name', 'Tags', 'Joined', 'Engagement', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-soft)', background: selected.has(c.id) ? 'var(--accent-soft)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px 12px 32px' }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} style={{ accentColor: 'var(--ink)', cursor: 'pointer' }}/>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{c.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.tags.map(tag => (
                        <span key={tag} style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 500, textTransform: 'capitalize' }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink-soft)' }}>{c.joined}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, c.opens * 1.5)}%`, height: '100%', background: c.opens > 30 ? 'var(--accent)' : c.opens > 10 ? '#D6B98A' : '#C4B5A0' }}/>
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>{c.opens} opens</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                      background: c.status === 'active' ? '#E5EFE6' : c.status === 'unsubscribed' ? '#F4F0E6' : '#FBE8E2',
                      color: c.status === 'active' ? '#2F5C42' : c.status === 'unsubscribed' ? '#5C5246' : '#A23E2F',
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.status === 'active' ? '#2F5C42' : c.status === 'unsubscribed' ? '#5C5246' : '#A23E2F' }}/>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============ CAMPAIGNS SCREEN ============
const CampaignsScreen = ({ onCompose }) => {
  const [filter, setFilter] = useStateA('all');
  const filtered = filter === 'all' ? MOCK_CAMPAIGNS : MOCK_CAMPAIGNS.filter(c => c.status === filter);
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'sending', label: 'Sending' },
    { id: 'sent', label: 'Sent' },
  ];
  const statusStyles = {
    sent: { bg: '#E5EFE6', fg: '#2F5C42', dot: '#2F5C42' },
    sending: { bg: '#FFF1D6', fg: '#7A5A1E', dot: '#D69E2E' },
    scheduled: { bg: '#E5E5F5', fg: '#3B2F8C', dot: '#5B5FCB' },
    draft: { bg: '#F4F0E6', fg: '#5C5246', dot: '#9A8E7F' },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '32px 40px 16px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}>Campaigns</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6 }}>Plan, send, and track everything you ship.</p>
          </div>
          <button onClick={onCompose} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 9, border: 'none', background: 'var(--ink)', color: 'var(--bg)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="sparkle" size={13}/> New campaign
          </button>
        </div>

        {/* STAT STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
          {[
            { label: 'Sent this month', value: '4', delta: '+2' },
            { label: 'Total recipients', value: '12.4k', delta: '+1.2k' },
            { label: 'Avg. open rate', value: '58.2%', delta: '+3.1%' },
            { label: 'Avg. click rate', value: '14.6%', delta: '+0.8%' },
          ].map(s => (
            <div key={s.label} style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'Instrument Serif, serif', letterSpacing: -0.5 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-deep)', fontWeight: 600 }}>{s.delta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 4, marginTop: 28, padding: 4, background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)', alignSelf: 'flex-start', width: 'fit-content' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: filter === f.id ? 'var(--surface)' : 'transparent',
              color: filter === f.id ? 'var(--ink)' : 'var(--ink-soft)',
              fontWeight: filter === f.id ? 600 : 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>

        {/* LIST */}
        <div style={{ marginTop: 16, marginBottom: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((c, i) => {
            const ss = statusStyles[c.status];
            const openRate = c.recipients ? Math.round(c.opens / c.recipients * 100) : 0;
            const clickRate = c.recipients ? Math.round(c.clicks / c.recipients * 100) : 0;
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 120px 100px', gap: 16, padding: '18px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: ss.bg, color: ss.fg, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: ss.dot }}/>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>"{c.subject}"</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.audience}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{c.recipients.toLocaleString()} contacts</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{c.sentAt}</div>
                <div>
                  {c.status === 'sent' || c.status === 'sending' ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{openRate}%</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>opens</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</div>}
                </div>
                <div>
                  {c.status === 'sent' || c.status === 'sending' ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{clickRate}%</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>clicks</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============ COMPOSE / SEND CAMPAIGN MODAL ============
const DRAFT_EMAILS = [
  { id: 'd1', name: 'Spring launch announcement', subject: 'Something new is shipping today.', tpl: TEMPLATES[0], updated: '2 hours ago' },
  { id: 'd2', name: 'Pricing update notice', subject: 'A small change to our pricing.', tpl: TEMPLATES[3], updated: 'Yesterday' },
  { id: 'd3', name: 'Welcome series — day 1', subject: "Welcome — here's where to start.", tpl: TEMPLATES[4], updated: '3 days ago' },
  { id: 'd4', name: 'February newsletter', subject: 'The Weekly · Vol. 9', tpl: TEMPLATES[6], updated: '1 week ago' },
];

const EMAIL_VARIABLES = [
  { token: '{Nombre}', auto: 'first_name', confidence: 'high', missing: 0 },
  { token: '{Empresa}', auto: 'company', confidence: 'high', missing: 12 },
  { token: '{Ciudad}', auto: null, confidence: 'low', missing: 46, suggestions: ['city', 'location', 'country'] },
  { token: '{Última_compra}', auto: 'last_order_date', confidence: 'medium', missing: 8 },
];

const CSV_FIELDS = ['first_name', 'last_name', 'email', 'company', 'city', 'location', 'country', 'last_order_date', 'plan', 'signup_date'];

const PREVIEW_CONTACTS = [
  { name: 'Sofia Martinez', data: { '{Nombre}': 'Sofia', '{Empresa}': 'Acme Co', '{Ciudad}': 'Madrid', '{Última_compra}': 'Apr 12' } },
  { name: 'James Liu', data: { '{Nombre}': 'James', '{Empresa}': 'Startup.io', '{Ciudad}': '—', '{Última_compra}': 'Apr 14' } },
  { name: 'Priya Shah', data: { '{Nombre}': 'Priya', '{Empresa}': 'Design Studio', '{Ciudad}': 'Mumbai', '{Última_compra}': 'Apr 02' } },
];

const ComposeModal = ({ onClose, onSend }) => {
  const [step, setStep] = useStateA(1); // 1: email, 2: audience, 3: variables, 4: schedule, 5: review
  const [emailId, setEmailId] = useStateA('d1');
  const [audience, setAudience] = useStateA('All contacts');
  const [schedule, setSchedule] = useStateA('now');
  const [abTest, setAbTest] = useStateA(true);
  const [varMap, setVarMap] = useStateA(() => Object.fromEntries(EMAIL_VARIABLES.map(v => [v.token, { field: v.auto, fallback: v.token === '{Nombre}' ? 'friend' : v.token === '{Empresa}' ? 'your team' : v.token === '{Ciudad}' ? 'there' : 'recently' }])));
  const [previewIdx, setPreviewIdx] = useStateA(0);
  const audCount = SEGMENTS.find(s => s.name === audience)?.count || 0;
  const chosenEmail = DRAFT_EMAILS.find(e => e.id === emailId) || DRAFT_EMAILS[0];
  const totalMissing = EMAIL_VARIABLES.filter(v => !varMap[v.token]?.field).reduce((acc, v) => acc + audCount, 0) + EMAIL_VARIABLES.filter(v => varMap[v.token]?.field).reduce((acc, v) => acc + v.missing, 0);
  const fullCount = Math.max(0, audCount - Math.max(...EMAIL_VARIABLES.map(v => varMap[v.token]?.field ? v.missing : audCount)));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,10,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(20,15,10,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* HEADER */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)' }}>STEP {step} OF 5</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
              {step === 1 ? 'Choose an email' : step === 2 ? 'Choose your audience' : step === 3 ? 'Map your variables' : step === 4 ? 'When should it go out?' : 'Review and send'}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}><Icon name="x" size={14}/></button>
        </div>

        {/* PROGRESS */}
        <div style={{ display: 'flex', height: 3, background: 'var(--surface-2)' }}>
          <div style={{ width: `${step / 5 * 100}%`, background: 'var(--accent)', transition: 'width 0.3s' }}/>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: '1px dashed var(--border)', background: 'var(--accent-soft)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--accent-deep)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={14}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Generate a new email with AI</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Describe it and we'll write it on the spot.</div>
                </div>
                <Icon name="arrow" size={14}/>
              </button>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', marginTop: 6 }}>YOUR DRAFTS</div>
              {DRAFT_EMAILS.map(e => (
                <button key={e.id} onClick={() => setEmailId(e.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  borderRadius: 10, border: emailId === e.id ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: emailId === e.id ? 'var(--surface-2)' : 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{ width: 56, height: 70, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-soft)' }}>
                    <TemplatePreview template={e.tpl} scale={0.55}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{e.subject}"</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>Edited {e.updated}</div>
                  </div>
                  {emailId === e.id && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={11}/></div>}
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SEGMENTS.map(s => (
                <button key={s.name} onClick={() => setAudience(s.name)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 10, border: audience === s.name ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: audience === s.name ? 'var(--surface-2)' : 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.accent, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{s.count.toLocaleString()} contacts</div>
                  </div>
                  {audience === s.name && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11}/></div>}
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Health indicator */}
              <div style={{ padding: 12, background: totalMissing > 0 ? 'var(--accent-soft)' : '#E5EFE6', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkle" size={13}/></div>
                <div style={{ flex: 1, fontSize: 12.5, color: 'var(--accent-deep)', lineHeight: 1.5 }}>
                  <b>{audCount.toLocaleString()} of {audCount.toLocaleString()}</b> contacts will receive the email. Variables are auto-matched — review below.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
                {/* MAPPING TABLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 18px 1fr', gap: 8, padding: '0 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    <div>Email variable</div>
                    <div></div>
                    <div>Contact field</div>
                  </div>
                  {EMAIL_VARIABLES.map(v => {
                    const m = varMap[v.token];
                    const isMatched = !!m?.field;
                    return (
                      <div key={v.token} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 18px 1fr', gap: 8, alignItems: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', alignSelf: 'flex-start', width: 'fit-content' }}>
                            {v.token}
                          </div>
                          <div style={{ color: 'var(--ink-faint)', display: 'flex', justifyContent: 'center' }}><Icon name="arrow" size={12}/></div>
                          <select
                            value={m?.field || ''}
                            onChange={e => setVarMap(prev => ({ ...prev, [v.token]: { ...prev[v.token], field: e.target.value || null } }))}
                            style={{ width: '100%', height: 30, padding: '0 8px', borderRadius: 6, border: isMatched ? '1px solid var(--border)' : '1.5px solid #D69E2E', background: 'var(--surface)', fontSize: 12.5, color: isMatched ? 'var(--ink)' : 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                          >
                            <option value="">— select field —</option>
                            {CSV_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 500 }}>If empty, use:</span>
                          <input
                            value={m?.fallback || ''}
                            onChange={e => setVarMap(prev => ({ ...prev, [v.token]: { ...prev[v.token], fallback: e.target.value } }))}
                            placeholder="friend"
                            style={{ flex: 1, height: 24, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11.5, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }}
                          />
                          {isMatched && v.missing > 0 && (
                            <span style={{ fontSize: 10.5, color: '#7A5A1E', background: '#FFF1D6', padding: '2px 6px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>{v.missing} missing</span>
                          )}
                          {!isMatched && (
                            <span style={{ fontSize: 10.5, color: '#A23E2F', background: '#FBE8E2', padding: '2px 6px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>not mapped</span>
                          )}
                        </div>
                        {!isMatched && v.suggestions && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', alignSelf: 'center' }}>Try:</span>
                            {v.suggestions.map(s => (
                              <button key={s} onClick={() => setVarMap(prev => ({ ...prev, [v.token]: { ...prev[v.token], field: s } }))} style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 10.5, color: 'var(--accent-deep)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* PREVIEW PANE */}
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 12, height: 'fit-content', position: 'sticky', top: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Preview as</div>
                  <select value={previewIdx} onChange={e => setPreviewIdx(Number(e.target.value))} style={{ width: '100%', height: 30, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink)', fontFamily: 'inherit', cursor: 'pointer', marginBottom: 10 }}>
                    {PREVIEW_CONTACTS.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
                  </select>
                  <div style={{ background: 'var(--surface)', borderRadius: 7, padding: 12, border: '1px solid var(--border)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink)' }}>
                    {(() => {
                      const c = PREVIEW_CONTACTS[previewIdx];
                      const resolve = (tok) => {
                        const m = varMap[tok];
                        if (!m?.field) return m?.fallback || tok;
                        const v = c.data[tok];
                        return (v && v !== '—') ? v : (m.fallback || tok);
                      };
                      return (
                        <>
                          <div style={{ fontWeight: 600 }}>Hi {resolve('{Nombre}')},</div>
                          <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>We noticed {resolve('{Empresa}')} has been growing fast. Folks in {resolve('{Ciudad}')} love what we shipped since your last order ({resolve('{Última_compra}')}).</div>
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 8, lineHeight: 1.4, fontStyle: 'italic' }}>Switch contacts to see how the email renders for different recipients.</div>
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setSchedule('now')} style={{ padding: 18, borderRadius: 10, border: schedule === 'now' ? '1.5px solid var(--ink)' : '1px solid var(--border)', background: schedule === 'now' ? 'var(--surface-2)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Send now</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>Goes out immediately to {audCount.toLocaleString()} contacts</div>
                </button>
                <button onClick={() => setSchedule('later')} style={{ padding: 18, borderRadius: 10, border: schedule === 'later' ? '1.5px solid var(--ink)' : '1px solid var(--border)', background: schedule === 'later' ? 'var(--surface-2)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Schedule for later</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>Pick a date and time</div>
                </button>
              </div>
              {schedule === 'later' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>Date</div>
                    <input type="date" defaultValue="2026-04-30" style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>Time</div>
                    <input type="time" defaultValue="09:00" style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit' }}/>
                  </div>
                </div>
              )}
              <div style={{ padding: 14, background: 'var(--accent-soft)', borderRadius: 10, display: 'flex', gap: 10 }}>
                <input type="checkbox" checked={abTest} onChange={e => setAbTest(e.target.checked)} style={{ accentColor: 'var(--accent-deep)', marginTop: 2, cursor: 'pointer' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-deep)' }}>Run A/B test on subject lines</div>
                  <div style={{ fontSize: 12, color: 'var(--accent-deep)', opacity: 0.8, marginTop: 2, lineHeight: 1.45 }}>Send 3 variants to 10% of your list, then auto-send the winner to the rest after 4 hours.</div>
                </div>
              </div>
            </div>
          )}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ width: 60, height: 76, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-soft)' }}>
                  <TemplatePreview template={chosenEmail.tpl} scale={0.6}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Sending</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{chosenEmail.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, fontStyle: 'italic' }}>"{chosenEmail.subject}"</div>
                </div>
              </div>
              {[
                ['Email', chosenEmail.name],
                ['Subject', chosenEmail.subject],
                ['Audience', `${audience} (${audCount.toLocaleString()} contacts)`],
                ['Schedule', schedule === 'now' ? 'Sending immediately' : 'Apr 30, 2026 · 9:00 AM'],
                ['A/B test', abTest ? 'Yes — 3 subject variants' : 'No'],
                ['From', 'Acme Brand <hello@acme.co>'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500 }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: 14, background: 'var(--accent-soft)', borderRadius: 10, fontSize: 12.5, color: 'var(--accent-deep)', lineHeight: 1.5 }}>
                <b>✱ AI prediction:</b> Based on your past campaigns, expect <b>~{Math.round(audCount * 0.58).toLocaleString()} opens</b> and <b>~{Math.round(audCount * 0.14).toLocaleString()} clicks</b>.
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button onClick={() => step === 1 ? onClose() : setStep(s => s - 1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={() => step === 5 ? onSend() : setStep(s => s + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--ink)', color: 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === 5 ? <><Icon name="send" size={12}/> Send campaign</> : <>Continue <Icon name="arrow" size={12}/></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ ANALYTICS SCREEN ============
const AnalyticsScreen = () => {
  const campaign = MOCK_CAMPAIGNS[0];
  const openData = [12, 22, 38, 64, 78, 88, 94, 96, 98, 99, 100];
  const hoursLabels = ['0h', '2h', '4h', '6h', '8h', '12h', '24h', '48h', '3d', '5d', '7d'];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '32px 40px 60px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', display: 'flex', gap: 6, alignItems: 'center' }}>
          Campaigns <Icon name="chevron" size={11}/> Analytics
        </div>
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, margin: '6px 0 0', letterSpacing: -0.5 }}>{campaign.name}</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6, fontStyle: 'italic' }}>"{campaign.subject}" · sent {campaign.sentAt} to {campaign.recipients.toLocaleString()} contacts</div>

        {/* BIG STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 28 }}>
          {[
            { label: 'Delivered', value: '2,801', sub: '98.4% of sent', accent: '#2F5C42' },
            { label: 'Opens', value: '1,681', sub: '60.0% open rate', accent: '#5B5FCB' },
            { label: 'Clicks', value: '412', sub: '14.7% click rate', accent: '#A87E54' },
            { label: 'Unsubscribed', value: '8', sub: '0.3% rate', accent: '#A23E2F' },
          ].map(s => (
            <div key={s.label} style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: s.accent }}/>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 36, fontWeight: 400, fontFamily: 'Instrument Serif, serif', letterSpacing: -1, marginTop: 8, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* CHART */}
        <div style={{ marginTop: 24, padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Opens over time</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>Cumulative opens since send</div>
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-2)', borderRadius: 7, fontSize: 11.5 }}>
              {['7 days', '30 days', 'All time'].map((p, i) => (
                <button key={p} style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: i === 0 ? 'var(--surface)' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: i === 0 ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
              ))}
            </div>
          </div>
          {/* SVG CHART */}
          <div style={{ position: 'relative', height: 220 }}>
            <svg viewBox="0 0 600 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1="0" x2="600" y1={200 - v * 1.8} y2={200 - v * 1.8} stroke="var(--border)" strokeWidth="1" strokeDasharray="2,3"/>
                  <text x="-6" y={200 - v * 1.8 + 4} fontSize="10" fill="var(--ink-faint)" textAnchor="end">{v}%</text>
                </g>
              ))}
              <path d={`M 0 ${200 - openData[0] * 1.8} ${openData.map((v, i) => `L ${i / (openData.length - 1) * 600} ${200 - v * 1.8}`).join(' ')} L 600 200 L 0 200 Z`} fill="var(--accent)" opacity="0.15"/>
              <path d={`M 0 ${200 - openData[0] * 1.8} ${openData.map((v, i) => `L ${i / (openData.length - 1) * 600} ${200 - v * 1.8}`).join(' ')}`} fill="none" stroke="var(--accent)" strokeWidth="2.5"/>
              {openData.map((v, i) => (
                <circle key={i} cx={i / (openData.length - 1) * 600} cy={200 - v * 1.8} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"/>
              ))}
              {hoursLabels.map((l, i) => (
                <text key={l} x={i / (hoursLabels.length - 1) * 600} y="218" fontSize="10" fill="var(--ink-faint)" textAnchor="middle">{l}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top clicked links</div>
            {[
              { url: 'acme.co/whats-new', clicks: 187, pct: 45 },
              { url: 'acme.co/upgrade', clicks: 142, pct: 34 },
              { url: 'acme.co/changelog', clicks: 56, pct: 14 },
              { url: 'acme.co/unsubscribe', clicks: 27, pct: 7 },
            ].map(l => (
              <div key={l.url} style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{l.url}</span>
                  <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{l.clicks} · {l.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${l.pct}%`, height: '100%', background: 'var(--accent)' }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Where they read it</div>
            {[
              { client: 'Apple Mail', pct: 42, n: 706 },
              { client: 'Gmail', pct: 31, n: 521 },
              { client: 'Outlook', pct: 18, n: 303 },
              { client: 'Yahoo', pct: 6, n: 101 },
              { client: 'Other', pct: 3, n: 50 },
            ].map(c => (
              <div key={c.client} style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink)' }}>{c.client}</span>
                  <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{c.n} · {c.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--accent)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ DOMAIN SETUP SCREEN ============
const DomainScreen = () => {
  const [domain, setDomain] = useStateA('acme.co');
  const [verified, setVerified] = useStateA(true);
  const records = [
    { type: 'TXT', host: '@', value: 'v=spf1 include:mailmint.io ~all', label: 'SPF', ok: true },
    { type: 'CNAME', host: 'mm._domainkey', value: 'mm._domainkey.mailmint.io', label: 'DKIM', ok: true },
    { type: 'TXT', host: '_dmarc', host_full: '_dmarc.acme.co', value: 'v=DMARC1; p=none; rua=mailto:dmarc@acme.co', label: 'DMARC', ok: true },
    { type: 'CNAME', host: 'mail', value: 'track.mailmint.io', label: 'Tracking', ok: false },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '32px 40px 60px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}>Sending domain</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6 }}>Verify your domain so emails come from you, not us. Better deliverability, fewer spam folders.</p>

        {/* DOMAIN STATUS CARD */}
        <div style={{ marginTop: 24, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: verified ? 'var(--accent-soft)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: verified ? 'var(--accent-deep)' : 'var(--ink-faint)' }}>
              {verified ? <Icon name="check" size={22}/> : <Icon name="lock" size={20}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{domain}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: verified ? 'var(--accent-deep)' : 'var(--ink-soft)', marginTop: 4, fontWeight: 500 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: verified ? 'var(--accent)' : '#D69E2E' }}/>
                {verified ? '3 of 4 records verified · ready to send' : 'Pending verification'}
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name="refresh" size={12}/> Re-check
            </button>
          </div>
        </div>

        {/* DNS RECORDS */}
        <div style={{ marginTop: 16, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>DNS records</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>Add these to your domain provider (Cloudflare, Namecheap, GoDaddy…)</div>
            </div>
            <button style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="copy" size={11}/> Copy all
            </button>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 100px', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              <div>Type</div>
              <div>Host / Value</div>
              <div>Purpose</div>
              <div>Status</div>
            </div>
            {records.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 100px', gap: 12, padding: '14px', borderTop: '1px solid var(--border-soft)', alignItems: 'center', fontSize: 12.5 }}>
                <div><span style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', fontSize: 11, fontWeight: 600, color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace' }}>{r.type}</span></div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--ink)' }}>{r.host}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{r.label}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: r.ok ? '#E5EFE6' : '#FFF1D6', color: r.ok ? '#2F5C42' : '#7A5A1E' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.ok ? '#2F5C42' : '#D69E2E' }}/>
                    {r.ok ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SENDER IDENTITY */}
        <div style={{ marginTop: 16, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Sender identity</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, marginBottom: 14 }}>How recipients see you in their inbox.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>From name</div>
              <input defaultValue="Acme Brand" style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit' }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>From email</div>
              <input defaultValue="hello@acme.co" style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit' }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ContactsScreen = ContactsScreen;
window.CampaignsScreen = CampaignsScreen;
window.AnalyticsScreen = AnalyticsScreen;
window.DomainScreen = DomainScreen;
window.ComposeModal = ComposeModal;
