// Mailmint AI — main app
const { useState, useEffect, useRef, useMemo } = React;

// ============ TEMPLATES DATA ============
const TEMPLATES = [
  { id: 'launch-bright', name: 'Bright Launch', category: 'Product Launch', tier: 'free', accent: '#0E1F1A', bg: '#F2EFE8', preview: 'launch' },
  { id: 'editorial', name: 'The Editorial', category: 'Newsletter', tier: 'premium', accent: '#1A1A1A', bg: '#FAF7F0', preview: 'editorial' },
  { id: 'sale-bold', name: 'Bold Drop', category: 'Promotion', tier: 'free', accent: '#FF5C2B', bg: '#FFF1EB', preview: 'sale' },
  { id: 'minimal-update', name: 'Minimal Update', category: 'Changelog', tier: 'free', accent: '#0A0A0A', bg: '#FFFFFF', preview: 'minimal' },
  { id: 'welcome-soft', name: 'Soft Welcome', category: 'Onboarding', tier: 'premium', accent: '#2C5F4F', bg: '#EFF4F0', preview: 'welcome' },
  { id: 'event-card', name: 'Event Invite', category: 'Event', tier: 'premium', accent: '#3B2F8C', bg: '#F0EEFA', preview: 'event' },
  { id: 'digest', name: 'Weekly Digest', category: 'Newsletter', tier: 'free', accent: '#1A1A1A', bg: '#FFFCF5', preview: 'digest' },
  { id: 'thanks', name: 'Thank You Note', category: 'Transactional', tier: 'free', accent: '#7A3E2D', bg: '#FBF3EC', preview: 'thanks' },
  { id: 'feature-spot', name: 'Feature Spotlight', category: 'Product', tier: 'premium', accent: '#0E5C4A', bg: '#EAF3EE', preview: 'feature' },
  { id: 'survey', name: 'Quick Survey', category: 'Engagement', tier: 'free', accent: '#1A1A1A', bg: '#F5F4F0', preview: 'survey' },
  { id: 'reengage', name: 'Come Back', category: 'Re-engagement', tier: 'premium', accent: '#A23E2F', bg: '#FBEEE9', preview: 'reengage' },
  { id: 'referral', name: 'Refer a Friend', category: 'Growth', tier: 'premium', accent: '#1A4D8A', bg: '#EAF1F8', preview: 'referral' },
];

const CATEGORIES = ['All', 'Product Launch', 'Newsletter', 'Promotion', 'Onboarding', 'Event', 'Transactional'];

const PROMPT_SUGGESTIONS = [
  'Announce our new pricing plans to existing customers',
  'Welcome new signups with a warm onboarding email',
  'Black Friday sale — 40% off everything, urgency-driven',
  'Re-engage users who haven\'t logged in for 30 days',
];

// ============ ICONS ============
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    sparkle: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    check: <><path d="M5 12l5 5L20 7"/></>,
    chevron: <><path d="m9 6 6 6-6 6"/></>,
    chevronDown: <><path d="m6 9 6 6 6-6"/></>,
    home: <><path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V11z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></>,
    bolt: <><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7z"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
    star: <><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    sliders: <><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></>,
    inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z"/></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

// ============ TEMPLATE PREVIEW THUMBNAIL ============
const TemplatePreview = ({ template, scale = 1 }) => {
  const { preview, accent, bg, name } = template;
  const styles = {
    wrap: { width: '100%', height: '100%', background: bg, padding: 16 * scale, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 8 * scale, color: accent, overflow: 'hidden', position: 'relative' },
  };

  if (preview === 'launch') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 8 * scale, opacity: 0.5, fontWeight: 500 }}>MAILMINT · ISSUE 04</div>
        <div style={{ fontSize: 22 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1.05, marginTop: 6 * scale, fontWeight: 400 }}>Something new<br/>is shipping.</div>
        <div style={{ flex: 1, background: accent, borderRadius: 4 * scale, marginTop: 8 * scale, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(45deg, transparent, transparent ${4 * scale}px, rgba(255,255,255,0.04) ${4 * scale}px, rgba(255,255,255,0.04) ${8 * scale}px)` }}/>
          <div style={{ position: 'absolute', bottom: 8 * scale, left: 8 * scale, color: bg, fontSize: 7 * scale, opacity: 0.6 }}>v2.0 →</div>
        </div>
        <div style={{ fontSize: 7 * scale, opacity: 0.7, lineHeight: 1.4 }}>We rebuilt the engine from scratch. Faster, calmer, more yours.</div>
        <div style={{ display: 'inline-block', padding: `${4 * scale}px ${8 * scale}px`, background: accent, color: bg, fontSize: 7 * scale, borderRadius: 999, alignSelf: 'flex-start', fontWeight: 500 }}>Read the post →</div>
      </div>
    );
  }
  if (preview === 'editorial') {
    return (
      <div style={styles.wrap}>
        <div style={{ borderBottom: `1px solid ${accent}20`, paddingBottom: 6 * scale, display: 'flex', justifyContent: 'space-between', fontSize: 7 * scale, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 }}>
          <span>Vol. 12</span><span>Apr 2026</span>
        </div>
        <div style={{ fontSize: 26 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1, marginTop: 4 * scale, fontStyle: 'italic' }}>Slow letters,<br/>fast ideas.</div>
        <div style={{ display: 'flex', gap: 6 * scale, marginTop: 4 * scale }}>
          <div style={{ flex: 1, height: 30 * scale, background: `${accent}15`, borderRadius: 2 * scale }}/>
          <div style={{ flex: 1, fontSize: 6 * scale, lineHeight: 1.5, opacity: 0.7 }}>This week we're reading about attention, monks, and the death of the inbox.</div>
        </div>
        <div style={{ fontSize: 6 * scale, opacity: 0.5, marginTop: 'auto', fontStyle: 'italic' }}>— Continue reading</div>
      </div>
    );
  }
  if (preview === 'sale') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 7 * scale, fontWeight: 700, letterSpacing: 2 }}>LIMITED · 48 HOURS</div>
        <div style={{ fontSize: 36 * scale, fontWeight: 900, lineHeight: 0.9, marginTop: 4 * scale, color: accent, letterSpacing: -1 }}>40%<br/>OFF.</div>
        <div style={{ fontSize: 8 * scale, marginTop: 4 * scale, fontWeight: 500 }}>Everything. No exclusions.</div>
        <div style={{ marginTop: 'auto', padding: `${6 * scale}px ${10 * scale}px`, background: accent, color: bg, fontSize: 8 * scale, fontWeight: 700, alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: 1 }}>Shop now →</div>
      </div>
    );
  }
  if (preview === 'minimal') {
    return (
      <div style={{ ...styles.wrap, padding: 18 * scale }}>
        <div style={{ width: 14 * scale, height: 14 * scale, background: accent, borderRadius: 3 * scale }}/>
        <div style={{ fontSize: 10 * scale, fontWeight: 600, marginTop: 10 * scale }}>Changelog · v2.4</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * scale, marginTop: 8 * scale }}>
          {['New: Realtime collaboration', 'Improved: Search 3× faster', 'Fixed: Editor cursor jump'].map((t, i) => (
            <div key={i} style={{ fontSize: 7 * scale, paddingLeft: 8 * scale, position: 'relative', opacity: 0.85 }}>
              <span style={{ position: 'absolute', left: 0, top: 4 * scale, width: 3 * scale, height: 3 * scale, background: accent, borderRadius: '50%' }}/>
              {t}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 6 * scale, opacity: 0.5 }}>See full notes →</div>
      </div>
    );
  }
  if (preview === 'welcome') {
    return (
      <div style={styles.wrap}>
        <div style={{ width: 22 * scale, height: 22 * scale, background: accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bg, fontSize: 10 * scale, fontWeight: 600 }}>M</div>
        <div style={{ fontSize: 18 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1.1, marginTop: 6 * scale }}>Hi there,<br/>welcome in.</div>
        <div style={{ fontSize: 7 * scale, lineHeight: 1.5, opacity: 0.8, marginTop: 4 * scale }}>We're glad you're here. Three quick things to get you started:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * scale, marginTop: 4 * scale }}>
          {['Set up your profile', 'Invite your team', 'Send your first email'].map((t, i) => (
            <div key={i} style={{ fontSize: 6 * scale, display: 'flex', gap: 4 * scale, alignItems: 'center' }}>
              <div style={{ width: 8 * scale, height: 8 * scale, border: `1px solid ${accent}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5 * scale }}>{i + 1}</div>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (preview === 'event') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 7 * scale, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>You're invited</div>
        <div style={{ fontSize: 20 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1.05, marginTop: 4 * scale }}>An evening<br/>of ideas.</div>
        <div style={{ marginTop: 6 * scale, padding: 8 * scale, border: `1px solid ${accent}30`, borderRadius: 4 * scale, fontSize: 7 * scale, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600 }}>May 14 · 7:00 PM</div>
          <div style={{ opacity: 0.7 }}>The Foundry, Brooklyn</div>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 4 * scale }}>
          <div style={{ padding: `${4 * scale}px ${8 * scale}px`, background: accent, color: bg, fontSize: 6 * scale, borderRadius: 999 }}>RSVP yes</div>
          <div style={{ padding: `${4 * scale}px ${8 * scale}px`, border: `1px solid ${accent}40`, fontSize: 6 * scale, borderRadius: 999 }}>Maybe</div>
        </div>
      </div>
    );
  }
  if (preview === 'digest') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 8 * scale, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}>The Weekly</div>
        <div style={{ fontSize: 15 * scale, fontWeight: 600, marginTop: 2 * scale, lineHeight: 1.1 }}>5 things worth your attention this week.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * scale, marginTop: 6 * scale }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 4 * scale, fontSize: 6 * scale, lineHeight: 1.3 }}>
              <span style={{ fontWeight: 700 }}>0{i}</span>
              <span style={{ opacity: 0.8 }}>{['The case for slower email', 'Why notifications are broken', 'A new way to read'][i-1]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (preview === 'thanks') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 28 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1, marginTop: 10 * scale, fontStyle: 'italic' }}>Thank<br/>you.</div>
        <div style={{ fontSize: 7 * scale, marginTop: 6 * scale, lineHeight: 1.5, opacity: 0.8 }}>Your order #2841 is on its way. We hand-pack every order and we genuinely appreciate you.</div>
        <div style={{ marginTop: 'auto', fontSize: 6 * scale, opacity: 0.6, fontStyle: 'italic' }}>— The team</div>
      </div>
    );
  }
  if (preview === 'feature') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 7 * scale, fontWeight: 600, color: accent, letterSpacing: 1, textTransform: 'uppercase' }}>★ Spotlight</div>
        <div style={{ fontSize: 14 * scale, fontWeight: 600, marginTop: 4 * scale, lineHeight: 1.15 }}>Meet smart blocks.</div>
        <div style={{ flex: 1, marginTop: 6 * scale, background: `linear-gradient(135deg, ${accent}25, ${accent}10)`, borderRadius: 4 * scale, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 6 * scale, border: `1px dashed ${accent}40`, borderRadius: 2 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6 * scale, opacity: 0.6 }}>preview</div>
        </div>
        <div style={{ fontSize: 6 * scale, opacity: 0.7 }}>Drag, drop, done.</div>
      </div>
    );
  }
  if (preview === 'survey') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 12 * scale, fontWeight: 600, lineHeight: 1.2 }}>How did we do?</div>
        <div style={{ fontSize: 7 * scale, opacity: 0.7, marginTop: 2 * scale }}>One quick question.</div>
        <div style={{ display: 'flex', gap: 3 * scale, marginTop: 8 * scale, justifyContent: 'space-between' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ flex: 1, aspectRatio: '1', border: `1px solid ${accent}30`, borderRadius: 3 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 * scale, fontWeight: 500, background: i === 4 ? accent : 'transparent', color: i === 4 ? bg : accent }}>{i}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 5 * scale, opacity: 0.5, marginTop: 2 * scale }}>
          <span>Awful</span><span>Great</span>
        </div>
      </div>
    );
  }
  if (preview === 'reengage') {
    return (
      <div style={styles.wrap}>
        <div style={{ fontSize: 22 * scale, fontFamily: 'Instrument Serif, serif', lineHeight: 1, fontStyle: 'italic', marginTop: 8 * scale }}>We've missed you.</div>
        <div style={{ fontSize: 7 * scale, marginTop: 6 * scale, lineHeight: 1.5, opacity: 0.85 }}>It's been a minute. Here's what's new since you last visited:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * scale, marginTop: 4 * scale, fontSize: 6 * scale, opacity: 0.8 }}>
          <span>· 12 new templates</span>
          <span>· AI is 2× faster</span>
          <span>· Custom brand kits</span>
        </div>
        <div style={{ marginTop: 'auto', padding: `${4 * scale}px ${8 * scale}px`, background: accent, color: bg, fontSize: 7 * scale, borderRadius: 2 * scale, alignSelf: 'flex-start' }}>Come back →</div>
      </div>
    );
  }
  if (preview === 'referral') {
    return (
      <div style={styles.wrap}>
        <div style={{ display: 'flex', gap: 4 * scale, alignItems: 'center' }}>
          <div style={{ width: 14 * scale, height: 14 * scale, borderRadius: '50%', background: accent }}/>
          <div style={{ width: 14 * scale, height: 14 * scale, borderRadius: '50%', background: `${accent}60`, marginLeft: -8 * scale }}/>
          <div style={{ width: 14 * scale, height: 14 * scale, borderRadius: '50%', background: `${accent}30`, marginLeft: -8 * scale }}/>
        </div>
        <div style={{ fontSize: 14 * scale, fontWeight: 600, marginTop: 6 * scale, lineHeight: 1.15 }}>Bring a friend, get $20.</div>
        <div style={{ marginTop: 6 * scale, padding: 6 * scale, background: `${accent}10`, borderRadius: 3 * scale, fontFamily: 'monospace', fontSize: 7 * scale, fontWeight: 600, textAlign: 'center', letterSpacing: 1 }}>SHARE-MINT</div>
        <div style={{ fontSize: 6 * scale, opacity: 0.6, marginTop: 'auto' }}>Tap to copy your code</div>
      </div>
    );
  }
  return <div style={styles.wrap}><div style={{ fontSize: 10 * scale }}>{name}</div></div>;
};

window.TEMPLATES = TEMPLATES;
window.CATEGORIES = CATEGORIES;
window.PROMPT_SUGGESTIONS = PROMPT_SUGGESTIONS;
window.Icon = Icon;
window.TemplatePreview = TemplatePreview;
