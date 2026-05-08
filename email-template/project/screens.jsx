// Mailmint AI — screens
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo: useMemoS } = React;

// ============ SIDEBAR ============
const Sidebar = ({ active, onNav, brand }) => {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'campaigns', label: 'Campaigns', icon: 'send' },
    { id: 'contacts', label: 'Contacts', icon: 'inbox' },
    { id: 'analytics', label: 'Analytics', icon: 'bolt' },
    { id: 'domain', label: 'Domain', icon: 'settings' },
    { id: 'pricing', label: 'Pricing', icon: 'bolt' },
  ];
  return (
    <aside style={{ width: 220, borderRight: '1px solid var(--border)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--surface)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 16px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}>M</div>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{brand}</div>
        <div style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 4, fontWeight: 600 }}>BETA</div>
      </div>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: 'none',
          background: active === it.id ? 'var(--surface-2)' : 'transparent',
          color: active === it.id ? 'var(--ink)' : 'var(--ink-soft)',
          fontWeight: active === it.id ? 600 : 500, fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.12s'
        }}>
          <Icon name={it.icon} size={16}/>
          {it.label}
        </button>
      ))}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', padding: '20px 10px 6px' }}>WORKSPACE</div>
      {['Acme Brand', 'Side project'].map((w, i) => (
        <button key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: i === 0 ? 'var(--accent)' : '#D8C4B0' }}/>
          {w}
        </button>
      ))}
      <div style={{ marginTop: 'auto', padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--accent-deep)' }}>
          <Icon name="bolt" size={12}/> Free plan
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.4 }}>7 of 10 generations left this month.</div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: '70%', height: '100%', background: 'var(--accent)' }}/>
        </div>
        <button style={{ width: '100%', marginTop: 10, padding: '7px 10px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Upgrade to Pro</button>
      </div>
    </aside>
  );
};

// ============ COMMAND PALETTE ============
const CommandPalette = ({ onClose, onNav }) => {
  const [q, setQ] = useStateS('');
  const [idx, setIdx] = useStateS(0);
  const inputRef = useRefS(null);
  useEffectS(() => { inputRef.current?.focus(); }, []);

  const isAsk = q.trim().length > 0 && q.trim().endsWith('?') || q.toLowerCase().startsWith('ask ') || q.toLowerCase().startsWith('how ') || q.toLowerCase().startsWith('what ') || q.toLowerCase().startsWith('write ');

  const items = useMemoS(() => {
    const all = [
      { kind: 'action', icon: 'sparkle', title: 'Generate new email', sub: 'Start with an AI prompt', go: 'home' },
      { kind: 'action', icon: 'send', title: 'New campaign', sub: 'Send to a segment', go: 'campaigns' },
      { kind: 'nav', icon: 'home', title: 'Home', sub: 'Dashboard', go: 'home' },
      { kind: 'nav', icon: 'send', title: 'Campaigns', sub: 'All your sends', go: 'campaigns' },
      { kind: 'nav', icon: 'inbox', title: 'Contacts', sub: 'Audience & segments', go: 'contacts' },
      { kind: 'nav', icon: 'bolt', title: 'Analytics', sub: 'Open & click rates', go: 'analytics' },
      { kind: 'nav', icon: 'settings', title: 'Domain', sub: 'DNS & sender identity', go: 'domain' },
      { kind: 'doc', icon: 'folder', title: 'Spring launch announcement', sub: 'Draft · edited 2h ago' },
      { kind: 'doc', icon: 'folder', title: 'Pricing update notice', sub: 'Draft · edited yesterday' },
      { kind: 'doc', icon: 'inbox', title: 'Sofia Martinez', sub: 'sofia@acme.co · Pro customer' },
    ];
    if (!q) return all.slice(0, 7);
    return all.filter(i => (i.title + ' ' + i.sub).toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }, [q]);

  const askSuggestions = ['Why did open rates drop last week?', 'Who hasn\'t opened my last 3 campaigns?', 'Best time to send to Pro customers'];

  useEffectS(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && items[idx]?.go) { onNav(items[idx].go); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, idx]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,10,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, paddingTop: '12vh' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: 'var(--surface)', borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(20,15,10,0.4)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* INPUT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ color: isAsk ? 'var(--accent-deep)' : 'var(--ink-faint)' }}>
            {isAsk ? <Icon name="sparkle" size={16}/> : <Icon name="search" size={16}/>}
          </div>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setIdx(0); }}
            placeholder="Search anything, or ask a question…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: 'var(--ink)', background: 'transparent', fontFamily: 'inherit' }}
          />
          {isAsk && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
              <Icon name="sparkle" size={10}/> Ask AI
            </span>
          )}
          <kbd style={{ padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 500 }}>esc</kbd>
        </div>

        {/* RESULTS */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 6 }}>
          {isAsk ? (
            <div style={{ padding: '14px 14px 10px' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 10, border: 'none', background: 'var(--accent-soft)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkle" size={14}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-deep)' }}>Ask Mailmint AI</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>"{q}"</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--surface)', borderRadius: 6, fontSize: 11, color: 'var(--ink-soft)', fontWeight: 500, alignSelf: 'center' }}>↵</div>
              </button>
              {items.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', padding: '14px 4px 6px' }}>OR JUMP TO</div>
                  {items.slice(0, 3).map((it, i) => (
                    <CommandRow key={i} item={it} active={false} onClick={() => { it.go && onNav(it.go); onClose(); }}/>
                  ))}
                </>
              )}
            </div>
          ) : !q ? (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', padding: '12px 14px 6px' }}>SUGGESTED</div>
              {items.map((it, i) => (
                <CommandRow key={i} item={it} active={i === idx} onClick={() => { it.go && onNav(it.go); onClose(); }}/>
              ))}
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', padding: '14px 14px 6px' }}>ASK AI</div>
              {askSuggestions.map((s, i) => (
                <button key={i} onClick={() => setQ(s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name="sparkle" size={12}/>
                  <span style={{ flex: 1 }}>{s}</span>
                  <Icon name="arrow" size={11}/>
                </button>
              ))}
            </>
          ) : (
            items.length > 0 ? items.map((it, i) => (
              <CommandRow key={i} item={it} active={i === idx} onClick={() => { it.go && onNav(it.go); onClose(); }}/>
            )) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                Nothing matches "{q}". Try ending with <b>?</b> to ask AI.
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderTop: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--ink-faint)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><kbd style={{ padding: '1px 5px', background: 'var(--surface-2)', borderRadius: 3 }}>↑↓</kbd> navigate</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><kbd style={{ padding: '1px 5px', background: 'var(--surface-2)', borderRadius: 3 }}>↵</kbd> select</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>End with <b>?</b> to ask AI</span>
        </div>
      </div>
    </div>
  );
};

const CommandRow = ({ item, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    border: 'none', background: active ? 'var(--surface-2)' : 'transparent',
    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    borderRadius: 8,
  }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
     onMouseLeave={e => e.currentTarget.style.background = active ? 'var(--surface-2)' : 'transparent'}>
    <div style={{ width: 28, height: 28, borderRadius: 7, background: item.kind === 'action' ? 'var(--accent-soft)' : 'var(--bg-2)', color: item.kind === 'action' ? 'var(--accent-deep)' : 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={item.icon} size={13}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{item.sub}</div>
    </div>
    <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{item.kind}</span>
  </button>
);

window.CommandPalette = CommandPalette;

// ============ ONBOARDING CHECKLIST ============
const ONBOARDING_STEPS = [
  { id: 'verify', title: 'Verify your sender domain', sub: 'Add 4 DNS records so emails land in inboxes, not spam.', cta: 'Open Domain', go: 'domain', time: '5 min', done: true },
  { id: 'import', title: 'Import your contacts', sub: 'Upload a CSV or sync from your existing tool.', cta: 'Go to Contacts', go: 'contacts', time: '2 min', done: true },
  { id: 'segment', title: 'Create your first segment', sub: 'Group contacts so the right people get the right email.', cta: 'Build segment', go: 'contacts', time: '3 min', done: false },
  { id: 'generate', title: 'Generate your first email with AI', sub: 'Describe what you want to say — Mailmint writes it for you.', cta: 'Try it now', go: 'home', time: '1 min', done: false },
  { id: 'send', title: 'Send your first campaign', sub: 'Pick the audience, map variables, and hit send.', cta: 'New campaign', go: 'campaigns', time: '4 min', done: false },
  { id: 'analytics', title: 'Review the results', sub: 'See opens, clicks, and which links worked best.', cta: 'View analytics', go: 'analytics', time: '2 min', done: false },
];

const OnboardingDropdown = ({ onNav, onClose }) => {
  const completed = ONBOARDING_STEPS.filter(s => s.done).length;
  const total = ONBOARDING_STEPS.length;
  const pct = Math.round(completed / total * 100);
  const ref = useRefS(null);
  useEffectS(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', top: 42, right: 0, width: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 20px 50px -12px rgba(20,15,10,0.25)', zIndex: 50, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)' }}>GETTING STARTED</div>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, color: 'var(--ink)', marginTop: 2, lineHeight: 1.2 }}>Set up your sending</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-deep)', background: 'var(--accent-soft)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{completed}/{total}</span>
        </div>
        <div style={{ marginTop: 12, height: 6, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.4s' }}/>
        </div>
        <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--ink-faint)' }}>{pct}% complete · about 12 min left</div>
      </div>
      {/* Steps */}
      <div style={{ maxHeight: 380, overflowY: 'auto', padding: 6 }}>
        {ONBOARDING_STEPS.map((s, i) => (
          <button key={s.id} onClick={() => { onNav(s.go); onClose(); }} style={{
            width: '100%', display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 12px',
            borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: s.done ? 'var(--accent)' : 'var(--surface)',
              border: s.done ? 'none' : '1.5px solid var(--border)',
              color: 'var(--accent-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {s.done ? <Icon name="check" size={11}/> : <span style={{ color: 'var(--ink-faint)' }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.done ? 'var(--ink-faint)' : 'var(--ink)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</div>
                <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{s.time}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.45 }}>{s.sub}</div>
              {!s.done && (
                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--accent-deep)' }}>
                  {s.cta} <Icon name="arrow" size={11}/>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
        <a style={{ color: 'var(--ink-soft)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>📚 Read the docs</a>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 11.5, fontFamily: 'inherit' }}>Dismiss</button>
      </div>
    </div>
  );
};

window.OnboardingDropdown = OnboardingDropdown;
window.ONBOARDING_STEPS = ONBOARDING_STEPS;

// ============ TOP BAR ============
const TopBar = ({ onSearch, onOpenPalette, onNav }) => {
  const [scope, setScope] = useStateS('Acme Brand');
  const [guideOpen, setGuideOpen] = useStateS(false);
  const completed = ONBOARDING_STEPS.filter(s => s.done).length;
  const total = ONBOARDING_STEPS.length;
  const pct = Math.round(completed / total * 100);
  return (
    <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, background: 'var(--bg)', flexShrink: 0, borderBottom: '1px solid var(--border-soft)', minWidth: 0 }}>
      {/* Workspace breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontSize: 9, fontWeight: 700 }}>A</div>
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{scope}</span>
      </div>

      {/* Live status pill */}
      <div className="topbar-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--accent-soft)', borderRadius: 999, fontSize: 11.5, color: 'var(--accent-deep)', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
        <span style={{ position: 'relative', width: 6, height: 6 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.6s ease-in-out infinite' }}/>
        </span>
        67 queued
      </div>

      {/* Center: ⌘K — flexible */}
      <button onClick={onOpenPalette} style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 12px',
        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
        fontSize: 12.5, color: 'var(--ink-faint)', cursor: 'pointer', fontFamily: 'inherit',
        flexShrink: 1, minWidth: 0, maxWidth: 280,
      }}>
        <Icon name="search" size={13}/>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Find or ask AI…</span>
        <kbd style={{ marginLeft: 'auto', padding: '1px 6px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 500, fontFamily: 'inherit', flexShrink: 0 }}>⌘K</kbd>
      </button>

      {/* Send-credits meter */}
      <div className="topbar-credits" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 30, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <Icon name="send" size={12} stroke={1.8}/>
        <div style={{ fontSize: 12, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          <b>8.2k</b> <span style={{ color: 'var(--ink-faint)' }}>/ 10k</span>
        </div>
      </div>

      {/* Getting started dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setGuideOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 10px 0 8px',
          borderRadius: 8, border: '1px solid var(--border)', background: guideOpen ? 'var(--surface-2)' : 'var(--surface)',
          fontSize: 12, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>
          {/* Mini progress ring */}
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.5"
              strokeDasharray={`${(pct / 100) * 40.84} 40.84`} strokeLinecap="round"
              transform="rotate(-90 8 8)"/>
          </svg>
          <span><b>{completed}</b><span style={{ color: 'var(--ink-faint)' }}>/{total}</span></span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 10 }}>▾</span>
        </button>
        {guideOpen && <OnboardingDropdown onNav={onNav} onClose={() => setGuideOpen(false)}/>}
      </div>

      {/* Avatar */}
      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px 3px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>Jamie</span>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'Instrument Serif, serif' }}>J</div>
      </button>
    </div>
  );
};

// ============ HOME / DASHBOARD ============
const HomeScreen = ({ onGenerate, onSelectTemplate, brand }) => {
  const [prompt, setPrompt] = useStateS('');
  const [tone, setTone] = useStateS('Friendly');
  const [length, setLength] = useStateS('Medium');
  const [audience, setAudience] = useStateS('Existing customers');
  const [activeCat, setActiveCat] = useStateS('All');
  const [hoveredId, setHoveredId] = useStateS(null);
  const taRef = useRefS(null);

  const filtered = activeCat === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCat);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt, tone, length, audience });
  };

  const useSuggestion = (s) => {
    setPrompt(s);
    taRef.current?.focus();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      {/* HERO PROMPT */}
      <section style={{ padding: '64px 48px 40px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 999, fontSize: 12, fontWeight: 500, marginBottom: 18 }}>
            <Icon name="sparkle" size={12}/> Trained on 10,000+ high-converting emails
          </div>
          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 52, fontWeight: 400, lineHeight: 1.05, letterSpacing: -1, margin: 0, color: 'var(--ink)' }}>
            What email do you want<br/><span style={{ fontStyle: 'italic', color: 'var(--accent-deep)' }}>to send today?</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.5 }}>
            Describe it in plain words. {brand} writes, designs, and ships it.
          </p>
        </div>

        {/* PROMPT BOX */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 4,
          boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 12px 40px -12px rgba(60, 50, 40, 0.12)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}>
          <div style={{ padding: '18px 20px 4px' }}>
            <textarea
              ref={taRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Announce our new pricing to existing customers — confident but not pushy, with a soft CTA to upgrade."
              style={{
                width: '100%', minHeight: 96, border: 'none', outline: 'none', resize: 'none',
                background: 'transparent', fontSize: 16, fontFamily: 'inherit', color: 'var(--ink)',
                lineHeight: 1.55,
              }}
            />
          </div>

          {/* CONTROL ROW */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
            <PromptPill label="Tone" value={tone} options={['Friendly', 'Professional', 'Bold', 'Witty', 'Urgent']} onChange={setTone}/>
            <PromptPill label="Length" value={length} options={['Short', 'Medium', 'Long']} onChange={setLength}/>
            <PromptPill label="Audience" value={audience} options={['Existing customers', 'New signups', 'Free users', 'Lapsed users', 'Internal team']} onChange={setAudience}/>
            <button title="Add brand kit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--ink-faint)', fontSize: 12.5, cursor: 'pointer' }}>
              <Icon name="plus" size={12}/> Brand kit
            </button>
            <div style={{ flex: 1 }}/>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: prompt.trim() ? 'var(--ink)' : 'var(--surface-2)',
                color: prompt.trim() ? 'var(--bg)' : 'var(--ink-faint)',
                fontSize: 13.5, fontWeight: 600, cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              <Icon name="sparkle" size={14}/> Generate email
              <kbd style={{ marginLeft: 4, padding: '1px 6px', background: 'rgba(255,255,255,0.12)', borderRadius: 4, fontSize: 10.5, fontFamily: 'inherit', fontWeight: 500 }}>↵</kbd>
            </button>
          </div>
        </div>

        {/* SUGGESTIONS */}
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {PROMPT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => useSuggestion(s)} style={{
              padding: '7px 12px', borderRadius: 999, border: '1px solid var(--border)',
              background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; }}
               onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}>
              <Icon name="sparkle" size={10}/> &nbsp;{s}
            </button>
          ))}
        </div>
      </section>

      {/* TEMPLATES SECTION */}
      <section style={{ padding: '24px 48px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 32, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}>
              Or start with a template <span style={{ fontStyle: 'italic', color: 'var(--ink-soft)' }}>—</span>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>Hand-crafted designs. Edit anything with AI.</p>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', overflowX: 'auto' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{
                padding: '6px 12px', borderRadius: 7, border: 'none',
                background: activeCat === c ? 'var(--surface)' : 'transparent',
                color: activeCat === c ? 'var(--ink)' : 'var(--ink-soft)',
                fontWeight: activeCat === c ? 600 : 500, fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                boxShadow: activeCat === c ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* TEMPLATE GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {filtered.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              hovered={hoveredId === t.id}
              onHover={(h) => setHoveredId(h ? t.id : null)}
              onClick={() => onSelectTemplate(t)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

// ============ PROMPT PILL ============
const PromptPill = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useStateS(false);
  const ref = useRefS(null);
  useEffectS(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7,
        border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12.5,
        color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span style={{ color: 'var(--ink-faint)' }}>{label}:</span>
        <span style={{ fontWeight: 500 }}>{value}</span>
        <Icon name="chevronDown" size={11}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 160,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9,
          boxShadow: '0 12px 32px -8px rgba(40,30,20,0.18)', padding: 4, zIndex: 50,
        }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none',
              background: 'transparent', fontSize: 12.5, color: 'var(--ink)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {o}
              {o === value && <Icon name="check" size={12}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ TEMPLATE CARD ============
const TemplateCard = ({ template, hovered, onHover, onClick }) => {
  const isPremium = template.tier === 'premium';
  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: 10, cursor: 'pointer', transition: 'all 0.18s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 16px 32px -12px rgba(50,40,30,0.18)' : '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div style={{
        aspectRatio: '4 / 5', borderRadius: 9, overflow: 'hidden',
        position: 'relative', background: template.bg, border: '1px solid var(--border-soft)'
      }}>
        <TemplatePreview template={template} scale={1.4}/>
        {isPremium && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(20,15,10,0.85)', backdropFilter: 'blur(6px)', color: '#F8E5C0', borderRadius: 999, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3 }}>
            <Icon name="lock" size={10}/> PRO
          </div>
        )}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(20,15,10,0.5))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
            <div style={{ padding: '8px 14px', background: 'var(--bg)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPremium ? <><Icon name="lock" size={11}/> Unlock template</> : <>Use this template <Icon name="arrow" size={11}/></>}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 6px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>{template.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{template.category}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-faint)' }}>
          <Icon name="star" size={11}/> {(4.6 + (template.id.charCodeAt(0) % 4) * 0.05).toFixed(1)}
        </div>
      </div>
    </div>
  );
};

// ============ GENERATING SCREEN ============
const GeneratingScreen = ({ params, onDone }) => {
  const steps = [
    'Reading your prompt…',
    'Studying your audience…',
    'Drafting subject lines…',
    'Composing the body…',
    'Designing the layout…',
  ];
  const [step, setStep] = useStateS(0);
  useEffectS(() => {
    if (step < steps.length - 1) {
      const t = setTimeout(() => setStep(s => s + 1), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ display: 'inline-flex', position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent)', opacity: 0.18, animation: 'pulse 1.6s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)' }}>
            <div style={{ animation: 'spin 2.4s linear infinite' }}><Icon name="sparkle" size={24} stroke={1.8}/></div>
          </div>
        </div>
        <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 32, fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
          <span style={{ fontStyle: 'italic' }}>Crafting</span> your email
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8, fontStyle: 'italic' }}>"{params.prompt.slice(0, 90)}{params.prompt.length > 90 ? '…' : ''}"</p>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: i <= step ? 'var(--ink)' : 'var(--ink-faint)', transition: 'color 0.3s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < step ? 'var(--accent)' : i === step ? 'var(--accent-soft)' : 'var(--surface-2)', color: i < step ? 'var(--accent-fg)' : 'var(--accent-deep)' }}>
                {i < step ? <Icon name="check" size={10}/> : i === step ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite' }}/> : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-faint)' }}/>}
              </div>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ EDITOR / RESULT SCREEN ============
const EditorScreen = ({ params, template, onBack }) => {
  const [aiPrompt, setAiPrompt] = useStateS('');
  const [subject, setSubject] = useStateS(generateSubject(params?.prompt));
  const [variant, setVariant] = useStateS(0);

  const subjects = useMemoS(() => [
    generateSubject(params?.prompt),
    altSubject(params?.prompt, 1),
    altSubject(params?.prompt, 2),
  ], [params]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* MAIN PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, background: 'var(--surface)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Icon name="arrow" size={12}/></span> Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
          <input value={subject} onChange={e => setSubject(e.target.value)} style={{ flex: 1, maxWidth: 460, fontSize: 13.5, fontWeight: 500, border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit' }}/>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {subjects.map((_, i) => (
              <button key={i} onClick={() => { setVariant(i); setSubject(subjects[i]); }} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: variant === i ? 'var(--ink)' : 'var(--surface)', color: variant === i ? 'var(--bg)' : 'var(--ink-soft)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>v{i + 1}</button>
            ))}
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}><Icon name="copy" size={12}/> Copy</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 7, border: 'none', background: 'var(--ink)', color: 'var(--bg)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Icon name="send" size={12}/> Send test</button>
          </div>
        </div>
        {/* CANVAS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 60px', background: 'var(--bg-2)' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 30px 60px -30px rgba(50,40,30,0.18)', border: '1px solid var(--border)' }}>
            <EmailContent params={params} subject={subject} variant={variant} template={template}/>
          </div>
        </div>
      </div>

      {/* AI SIDEBAR */}
      <aside style={{ width: 320, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)' }}><Icon name="sparkle" size={12}/></div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>AI Editor</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}>Live</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--accent-soft)', borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.5, color: 'var(--accent-deep)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>✱ Suggestion</div>
            Subject lines under 50 chars get 22% more opens. Try variant <b>v2</b>.
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', marginBottom: 8 }}>QUICK EDITS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Make it shorter', 'More casual tone', 'Add urgency', 'Strengthen the CTA', 'Translate to Spanish'].map(q => (
                <button key={q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  {q} <Icon name="arrow" size={11}/>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-faint)', marginBottom: 8 }}>LAYOUT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Single column', 'Two column', 'Hero + grid', 'Minimal'].map((l, i) => (
                <button key={l} style={{ padding: '8px 10px', borderRadius: 7, border: i === 0 ? '1.5px solid var(--ink)' : '1px solid var(--border)', background: 'var(--surface)', fontSize: 11.5, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: i === 0 ? 600 : 500 }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Tell AI what to change…" style={{ width: '100%', minHeight: 60, padding: '10px 36px 10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none', resize: 'none' }}/>
            <button style={{ position: 'absolute', right: 6, bottom: 6, width: 28, height: 28, borderRadius: 7, border: 'none', background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="arrowUp" size={14}/></button>
          </div>
        </div>
      </aside>
    </div>
  );
};

// ============ EMAIL CONTENT (RENDERED EMAIL) ============
const EmailContent = ({ params, subject, variant, template }) => {
  const tpl = template || TEMPLATES[0];
  const body = generateBody(params?.prompt, params?.tone, variant);
  return (
    <div style={{ background: tpl.bg, color: tpl.accent, fontFamily: 'Inter, sans-serif' }}>
      {/* From */}
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${tpl.accent}15`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: tpl.accent, color: tpl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>A</div>
        <div style={{ fontSize: 12, lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600 }}>Acme Brand</div>
          <div style={{ opacity: 0.6 }}>hello@acme.co</div>
        </div>
      </div>
      <div style={{ padding: '32px 32px 12px' }}>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1.5, fontWeight: 600 }}>{(tpl.category || 'EMAIL').toUpperCase()}</div>
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.5, margin: '8px 0 0' }}>{subject}</h1>
      </div>
      <div style={{ padding: '0 32px 24px' }}>
        <div style={{ aspectRatio: '16/9', background: `linear-gradient(135deg, ${tpl.accent}30, ${tpl.accent}10)`, borderRadius: 8, marginTop: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 14, border: `1px dashed ${tpl.accent}40`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'monospace', opacity: 0.6 }}>hero image</div>
        </div>
        {body.map((p, i) => (
          <p key={i} style={{ fontSize: 15, lineHeight: 1.65, margin: '20px 0 0', color: tpl.accent, opacity: 0.92 }}>{p}</p>
        ))}
        <div style={{ marginTop: 28 }}>
          <a style={{ display: 'inline-block', padding: '12px 22px', background: tpl.accent, color: tpl.bg, fontSize: 14, fontWeight: 600, borderRadius: 8, textDecoration: 'none' }}>Read more →</a>
        </div>
        <div style={{ marginTop: 32, paddingTop: 18, borderTop: `1px solid ${tpl.accent}15`, fontSize: 11.5, opacity: 0.55, lineHeight: 1.6 }}>
          You're getting this because you signed up at acme.co. <u>Unsubscribe</u> · <u>Preferences</u>
        </div>
      </div>
    </div>
  );
};

// ============ AI TEXT GEN HELPERS (deterministic, prompt-aware) ============
function generateSubject(prompt) {
  if (!prompt) return 'Something new for you.';
  const p = prompt.toLowerCase();
  if (p.includes('pricing')) return 'A small change to our pricing.';
  if (p.includes('welcome') || p.includes('onboard')) return 'Welcome — here\'s where to start.';
  if (p.includes('sale') || p.includes('off') || p.includes('black friday')) return '40% off ends Sunday.';
  if (p.includes('re-engage') || p.includes("haven't")) return 'It\'s been a minute.';
  if (p.includes('launch') || p.includes('announce')) return 'Something new is shipping today.';
  return 'A note from our team.';
}
function altSubject(prompt, i) {
  const base = generateSubject(prompt);
  if (i === 1) return base.replace('.', ' →');
  return '✱ ' + base.toLowerCase();
}
function generateBody(prompt, tone = 'Friendly', variant = 0) {
  const intros = {
    Friendly: 'Hey there,',
    Professional: 'Hello,',
    Bold: 'Listen —',
    Witty: 'Quick one:',
    Urgent: 'Heads up —',
  };
  const intro = intros[tone] || intros.Friendly;
  return [
    `${intro} we wanted to write you directly about something we've been working on.`,
    'It\'s a small change, but the kind that adds up. We rebuilt the part of the product you use most — and it\'s faster, calmer, and a little more thoughtful.',
    'Take a look when you have a minute. We\'d love to hear what you think.',
  ];
}

window.HomeScreen = HomeScreen;
window.GeneratingScreen = GeneratingScreen;
window.EditorScreen = EditorScreen;
window.Sidebar = Sidebar;
window.TopBar = TopBar;
