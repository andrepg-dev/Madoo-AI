export const SEED_TEMPLATE_SLUGS = [
  "launch",
  "newsletter",
  "sale",
  "welcome",
  "minimal",
  "event",
  "digest",
  "thanks",
  "feature",
  "survey",
  "reengage",
  "referral",
] as const;

export type SeedTemplateSlug = (typeof SEED_TEMPLATE_SLUGS)[number];

export const SEED_TEMPLATES: Record<
  SeedTemplateSlug,
  { name: string; category: string; description: string; componentCode: string }
> = {
  launch: {
    name: "Bright Launch",
    category: "Launch",
    description: "Hero product announcement with feature highlights and CTA",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  headline = 'Something new is shipping',
  bodyText = 'We rebuilt the engine from scratch — faster, calmer, and more powerful than ever before. Here is everything you need to know.',
  feature1 = '2x faster performance',
  feature2 = 'Redesigned for clarity',
  feature3 = 'AI assistant built in',
  ctaLabel = 'Explore the release',
  ctaUrl = '#',
  unsubscribeUrl = '#',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{headline}</Preview>
    <Body style={{ backgroundColor: '#F2EFE8', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 580, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#0E1F1A', borderRadius: '14px 14px 0 0', padding: '20px 32px' }}>
          <Text style={{ color: '#F2EFE8', fontSize: 16, fontWeight: 700, margin: 0 }}>{brandName}</Text>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '44px 36px 28px' }}>
          <Text style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0E1F1A', opacity: 0.5, margin: '0 0 18px', fontWeight: 600 }}>
            Product Launch
          </Text>
          <Text style={{ fontSize: 38, lineHeight: '1.06', color: '#0E1F1A', margin: '0 0 20px', fontWeight: 700, letterSpacing: '-1px' }}>
            {headline}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: '1.75', color: '#3A3530', margin: '0 0 32px' }}>
            {bodyText}
          </Text>
          <Button href={ctaUrl} style={{ backgroundColor: '#0E1F1A', color: '#F2EFE8', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            {ctaLabel} &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '8px 36px 40px' }}>
          <Hr style={{ borderColor: '#EAE6DC', margin: '0 0 22px' }} />
          <Row>
            <Column style={{ width: '33%', paddingRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#0E1F1A', margin: 0, fontWeight: 500 }}>&#10003; {feature1}</Text>
            </Column>
            <Column style={{ width: '33%', paddingRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#0E1F1A', margin: 0, fontWeight: 500 }}>&#10003; {feature2}</Text>
            </Column>
            <Column style={{ width: '33%' }}>
              <Text style={{ fontSize: 12, color: '#0E1F1A', margin: 0, fontWeight: 500 }}>&#10003; {feature3}</Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ backgroundColor: '#F2EFE8', borderRadius: '0 0 14px 14px', padding: '22px 36px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: '#0E1F1A', opacity: 0.4, margin: 0, lineHeight: '1.65' }}>
            You received this because you signed up for {brandName} updates.{' '}
            <a href={unsubscribeUrl} style={{ color: '#0E1F1A' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  newsletter: {
    name: "The Editorial",
    category: "Newsletter",
    description: "Editorial newsletter with masthead, articles, and signoff",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Hr, Link, Preview } from '@react-email/components';

const Email = ({
  issueLabel = 'THE EDITORIAL',
  issueNumber = 'Vol. 12',
  issueDate = 'May 2026',
  headline = 'Slow letters, fast ideas.',
  lead = 'This week we are thinking about attention, deep work, and why the inbox is having a moment again.',
  article1Title = 'The case for writing one thing a day',
  article1Url = '#',
  article1Excerpt = 'A small daily practice that quietly changes how you think long-form.',
  article2Title = 'Why you should reply to emails slower',
  article2Url = '#',
  article2Excerpt = 'Counter-intuitive, but the data backs it up. Slow responses build better relationships.',
  article3Title = 'May reading list',
  article3Url = '#',
  article3Excerpt = 'Six pieces worth an hour of your weekend.',
  signoff = 'Until next week,',
  authorName = 'The Editorial team',
  unsubscribeUrl = '#',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{headline} — {issueLabel} {issueNumber}</Preview>
    <Body style={{ backgroundColor: '#FAF7F0', margin: 0, padding: 0, fontFamily: 'Georgia, serif' }}>
      <Container style={{ maxWidth: 580, margin: '0 auto', padding: '36px 0 52px' }}>
        <Section style={{ padding: '0 32px 14px' }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 10.5, color: '#1A1A1A', opacity: 0.5, margin: 0, letterSpacing: '0.1em', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
                {issueLabel} &middot; {issueNumber}
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 10.5, color: '#1A1A1A', opacity: 0.4, margin: 0, fontFamily: 'system-ui, sans-serif' }}>
                {issueDate}
              </Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ padding: '0 32px 20px' }}>
          <Hr style={{ borderColor: '#1A1A1A', opacity: 0.15, margin: 0 }} />
        </Section>
        <Section style={{ padding: '0 32px 28px' }}>
          <Text style={{ fontSize: 40, lineHeight: '1.04', color: '#1A1A1A', margin: '0 0 18px', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.5px' }}>
            {headline}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: '1.78', color: '#2D2820', margin: 0 }}>
            {lead}
          </Text>
        </Section>
        <Section style={{ padding: '0 32px 8px' }}>
          <Hr style={{ borderColor: '#E0DDD5', margin: '0 0 28px' }} />
        </Section>
        <Section style={{ padding: '0 32px 20px' }}>
          <Text style={{ fontSize: 17, fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.3' }}>
            <Link href={article1Url} style={{ color: '#1A1A1A', textDecoration: 'none' }}>{article1Title}</Link>
          </Text>
          <Text style={{ fontSize: 14.5, lineHeight: '1.7', color: '#5A5550', margin: '0 0 22px' }}>
            {article1Excerpt}
          </Text>
          <Hr style={{ borderColor: '#E8E4DC', margin: '0 0 22px' }} />
          <Text style={{ fontSize: 17, fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.3' }}>
            <Link href={article2Url} style={{ color: '#1A1A1A', textDecoration: 'none' }}>{article2Title}</Link>
          </Text>
          <Text style={{ fontSize: 14.5, lineHeight: '1.7', color: '#5A5550', margin: '0 0 22px' }}>
            {article2Excerpt}
          </Text>
          <Hr style={{ borderColor: '#E8E4DC', margin: '0 0 22px' }} />
          <Text style={{ fontSize: 17, fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.3' }}>
            <Link href={article3Url} style={{ color: '#1A1A1A', textDecoration: 'none' }}>{article3Title}</Link>
          </Text>
          <Text style={{ fontSize: 14.5, lineHeight: '1.7', color: '#5A5550', margin: 0 }}>
            {article3Excerpt}
          </Text>
        </Section>
        <Section style={{ padding: '24px 32px 0' }}>
          <Hr style={{ borderColor: '#E0DDD5', margin: '0 0 18px' }} />
          <Text style={{ fontSize: 14, color: '#1A1A1A', margin: '0 0 2px', fontStyle: 'italic' }}>{signoff}</Text>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', margin: '0 0 28px', fontFamily: 'system-ui, sans-serif' }}>{authorName}</Text>
          <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.35, margin: 0, fontFamily: 'system-ui, sans-serif', lineHeight: '1.6' }}>
            You are subscribed to {issueLabel}.{' '}
            <a href={unsubscribeUrl} style={{ color: '#1A1A1A' }}>Unsubscribe</a>{' '}&middot;{' '}
            <a href="#" style={{ color: '#1A1A1A' }}>Manage preferences</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  sale: {
    name: "Bold Drop",
    category: "Promotion",
    description: "Urgency-driven flash sale with bold typography and CTA",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  urgencyLabel = 'LIMITED TIME',
  discountPercent = '40%',
  discountNote = 'off everything',
  exclusions = 'No exclusions. No minimums.',
  deadline = 'Ends Sunday at midnight.',
  bodyText = 'Our biggest sale of the year. Every product, every plan, every add-on — all 40% off for the next 48 hours.',
  ctaLabel = 'Shop the drop',
  ctaUrl = '#',
  couponCode = '',
  unsubscribeUrl = '#',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{discountPercent} off — ends Sunday</Preview>
    <Body style={{ backgroundColor: '#FFF1EB', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '28px 0 52px' }}>
        <Section style={{ backgroundColor: '#FF5C2B', borderRadius: '14px 14px 0 0', padding: '14px 28px' }}>
          <Row>
            <Column>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700, margin: 0 }}>{brandName}</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: '0.1em', opacity: 0.85 }}>{urgencyLabel}</Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '44px 36px 36px' }}>
          <Text style={{ fontSize: 80, fontWeight: 900, lineHeight: '0.88', color: '#FF5C2B', margin: '0 0 6px', letterSpacing: '-3px' }}>
            {discountPercent}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 800, color: '#2B160F', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            {discountNote}
          </Text>
          <Text style={{ fontSize: 15, lineHeight: '1.7', color: '#4B2E23', margin: '0 0 8px' }}>
            {bodyText}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#FF5C2B', margin: '0 0 32px' }}>
            {exclusions}
          </Text>
          <Button href={ctaUrl} style={{ backgroundColor: '#FF5C2B', color: '#FFFFFF', padding: '16px 32px', borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none', display: 'inline-block', letterSpacing: '0.02em' }}>
            {ctaLabel} &rarr;
          </Button>
          {couponCode ? (
            <Text style={{ fontSize: 12, color: '#4B2E23', margin: '16px 0 0', opacity: 0.65 }}>
              Use code <strong>{couponCode}</strong> at checkout
            </Text>
          ) : null}
        </Section>
        <Section style={{ backgroundColor: '#FFF1EB', borderRadius: '0 0 14px 14px', padding: '18px 36px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: '#2B160F', opacity: 0.4, margin: 0, lineHeight: '1.6' }}>
            {deadline} &mdash; You received this because you opted in to {brandName} promotions.{' '}
            <a href={unsubscribeUrl} style={{ color: '#2B160F' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  welcome: {
    name: "Soft Welcome",
    category: "Onboarding",
    description: "Warm onboarding email with 3-step checklist and CTA",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  firstName = 'there',
  intro = 'We are really glad you are here. Here are three quick things to get you started on the right foot.',
  step1 = 'Complete your profile',
  step1Detail = 'Add your name, photo, and timezone so your team knows who you are.',
  step2 = 'Invite your team',
  step2Detail = 'Collaboration is better with others. Invite up to 5 teammates for free.',
  step3 = 'Send your first email',
  step3Detail = 'Write a prompt and let Acme generate a beautiful email in seconds.',
  ctaLabel = 'Get started now',
  ctaUrl = '#',
  senderName = 'The Acme team',
  unsubscribeUrl = '#',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>Welcome to {brandName} — here is how to get started</Preview>
    <Body style={{ backgroundColor: '#EFF4F0', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#2C5F4F', borderRadius: '14px 14px 0 0', padding: '24px 32px' }}>
          <Text style={{ color: '#EFF4F0', fontSize: 16, fontWeight: 700, margin: 0 }}>{brandName}</Text>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '40px 36px 32px' }}>
          <Text style={{ fontSize: 36, lineHeight: '1.1', color: '#2C5F4F', margin: '0 0 16px', fontWeight: 600, letterSpacing: '-0.7px' }}>
            Hi {firstName},<br />welcome in.
          </Text>
          <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#1F3D34', margin: '0 0 32px' }}>
            {intro}
          </Text>
          <Hr style={{ borderColor: '#D8EAE2', margin: '0 0 28px' }} />
          {[
            { num: '01', title: step1, detail: step1Detail },
            { num: '02', title: step2, detail: step2Detail },
            { num: '03', title: step3, detail: step3Detail },
          ].map((s, i) => (
            <Section key={i} style={{ marginBottom: i < 2 ? 24 : 0 }}>
              <Text style={{ fontSize: 10.5, fontWeight: 700, color: '#2C5F4F', opacity: 0.55, margin: '0 0 4px', letterSpacing: '0.1em' }}>
                STEP {s.num}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 700, color: '#1F3D34', margin: '0 0 5px' }}>
                {s.title}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: '1.65', color: '#4A6B60', margin: 0 }}>
                {s.detail}
              </Text>
            </Section>
          ))}
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '28px 36px 40px' }}>
          <Hr style={{ borderColor: '#D8EAE2', margin: '0 0 28px' }} />
          <Button href={ctaUrl} style={{ backgroundColor: '#2C5F4F', color: '#EFF4F0', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            {ctaLabel} &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#EFF4F0', borderRadius: '0 0 14px 14px', padding: '22px 36px' }}>
          <Text style={{ fontSize: 13, color: '#2C5F4F', margin: '0 0 4px', fontWeight: 500 }}>— {senderName}</Text>
          <Text style={{ fontSize: 11, color: '#2C5F4F', opacity: 0.4, margin: 0, lineHeight: '1.6' }}>
            You received this because you created an account on {brandName}.{' '}
            <a href={unsubscribeUrl} style={{ color: '#2C5F4F' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  minimal: {
    name: "Minimal Update",
    category: "Launch",
    description: "Clean product changelog update with version badge",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  version = 'v2.4',
  releaseDate = 'May 6, 2026',
  headline = 'Product updates you should know',
  intro = 'A few things we shipped this week that should make your day a little smoother.',
  change1 = 'New: Realtime collaboration — edit with your team live',
  change2 = 'Improved: Search is now 3x faster with instant results',
  change3 = 'Fixed: Editor cursor no longer jumps on paste',
  change4 = 'New: Dark mode is finally here',
  change5 = 'Improved: Mobile layout on all screens',
  fullNotesUrl = '#',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{brandName} {version} — {headline}</Preview>
    <Body style={{ backgroundColor: '#FFFFFF', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '48px 0 64px' }}>
        <Section style={{ padding: '0 36px 32px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#0A0A0A', borderRadius: 4, marginBottom: 28 }} />
          <Text style={{ fontSize: 10.5, color: '#0A0A0A', opacity: 0.45, margin: '0 0 4px', letterSpacing: '0.1em', fontWeight: 600 }}>
            CHANGELOG &middot; {version}
          </Text>
          <Text style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.35, margin: 0 }}>
            {releaseDate}
          </Text>
        </Section>
        <Section style={{ padding: '0 36px 28px' }}>
          <Text style={{ fontSize: 32, lineHeight: '1.1', color: '#0A0A0A', margin: '0 0 14px', fontWeight: 700, letterSpacing: '-0.8px' }}>
            {headline}
          </Text>
          <Text style={{ fontSize: 15, lineHeight: '1.7', color: '#3A3A3A', margin: 0 }}>
            {intro}
          </Text>
        </Section>
        <Section style={{ padding: '0 36px 36px' }}>
          <Hr style={{ borderColor: '#EBEBEB', margin: '0 0 24px' }} />
          {[change1, change2, change3, change4, change5].map((c, i) => (
            <Text key={i} style={{ fontSize: 14.5, color: '#0A0A0A', margin: '0 0 14px', lineHeight: '1.55', paddingLeft: 16, position: 'relative' }}>
              &bull; {c}
            </Text>
          ))}
          <Hr style={{ borderColor: '#EBEBEB', margin: '10px 0 24px' }} />
          <Link href={fullNotesUrl} style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 600, textDecoration: 'none' }}>
            Read the full release notes &rarr;
          </Link>
        </Section>
        <Section style={{ padding: '0 36px', borderTop: '1px solid #F0F0F0' }}>
          <Text style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.35, margin: '24px 0 0', lineHeight: '1.65' }}>
            {brandName} &mdash; you are receiving this because you opted in to product updates.{' '}
            <a href="#" style={{ color: '#0A0A0A' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  event: {
    name: "Event Invite",
    category: "Event",
    description: "Elegant event invitation with date card and RSVP buttons",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  inviteLabel = "You're invited",
  eventName = 'An Evening of Ideas',
  eventTagline = 'An intimate gathering of founders, makers, and thinkers.',
  eventDate = 'Wednesday, May 14',
  eventTime = '7:00 PM &mdash; 10:00 PM',
  eventVenue = 'The Foundry',
  eventAddress = '55 Water Street, Brooklyn NY',
  dresscode = 'Smart casual',
  rsvpYesUrl = '#',
  rsvpNoUrl = '#',
  hostName = 'The Acme team',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{inviteLabel}: {eventName} on {eventDate}</Preview>
    <Body style={{ backgroundColor: '#F0EEFA', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#3B2F8C', borderRadius: '14px 14px 0 0', padding: '36px 36px 32px' }}>
          <Text style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F0EEFA', opacity: 0.65, margin: '0 0 14px', fontWeight: 600 }}>
            {inviteLabel}
          </Text>
          <Text style={{ fontSize: 36, lineHeight: '1.06', color: '#FFFFFF', margin: 0, fontWeight: 600, letterSpacing: '-0.8px' }}>
            {eventName}
          </Text>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '36px 36px 28px' }}>
          <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#1A1A1A', margin: '0 0 28px' }}>
            {eventTagline}
          </Text>
          <Section style={{ backgroundColor: '#F7F5FF', border: '1px solid #D8D0F5', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
            <Row style={{ marginBottom: 12 }}>
              <Column style={{ width: '50%' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 600, color: '#3B2F8C', opacity: 0.6, margin: '0 0 3px', letterSpacing: '0.08em' }}>DATE</Text>
                <Text style={{ fontSize: 15, fontWeight: 700, color: '#1A1033', margin: 0 }}>{eventDate}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 600, color: '#3B2F8C', opacity: 0.6, margin: '0 0 3px', letterSpacing: '0.08em' }}>TIME</Text>
                <Text style={{ fontSize: 15, fontWeight: 700, color: '#1A1033', margin: 0 }} dangerouslySetInnerHTML={{ __html: eventTime }} />
              </Column>
            </Row>
            <Hr style={{ borderColor: '#D8D0F5', margin: '12px 0' }} />
            <Row>
              <Column style={{ width: '50%' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 600, color: '#3B2F8C', opacity: 0.6, margin: '0 0 3px', letterSpacing: '0.08em' }}>VENUE</Text>
                <Text style={{ fontSize: 15, fontWeight: 700, color: '#1A1033', margin: '0 0 2px' }}>{eventVenue}</Text>
                <Text style={{ fontSize: 13, color: '#5A5070', margin: 0 }}>{eventAddress}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 600, color: '#3B2F8C', opacity: 0.6, margin: '0 0 3px', letterSpacing: '0.08em' }}>DRESS</Text>
                <Text style={{ fontSize: 14, color: '#1A1033', margin: 0 }}>{dresscode}</Text>
              </Column>
            </Row>
          </Section>
          <Row>
            <Column style={{ width: '50%', paddingRight: 8 }}>
              <Button href={rsvpYesUrl} style={{ backgroundColor: '#3B2F8C', color: '#FFFFFF', padding: '13px 0', borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center', width: '100%' }}>
                Yes, I will be there
              </Button>
            </Column>
            <Column style={{ width: '50%', paddingLeft: 8 }}>
              <Button href={rsvpNoUrl} style={{ backgroundColor: 'transparent', color: '#3B2F8C', padding: '12px 0', borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center', width: '100%', border: '1.5px solid #3B2F8C40' }}>
                Sorry, can not make it
              </Button>
            </Column>
          </Row>
        </Section>
        <Section style={{ backgroundColor: '#F0EEFA', borderRadius: '0 0 14px 14px', padding: '22px 36px', textAlign: 'center' }}>
          <Text style={{ fontSize: 13, color: '#3B2F8C', margin: '0 0 4px', fontWeight: 500, opacity: 0.75 }}>
            &mdash; {hostName}
          </Text>
          <Text style={{ fontSize: 11, color: '#3B2F8C', opacity: 0.35, margin: 0, lineHeight: '1.6' }}>
            <a href="#" style={{ color: '#3B2F8C' }}>Unsubscribe from event invites</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  digest: {
    name: "Weekly Digest",
    category: "Newsletter",
    description: "Curated digest with numbered items and short excerpts",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Hr, Link, Preview } from '@react-email/components';

const Email = ({
  digestName = 'The Weekly',
  issueNum = '42',
  issueDate = 'May 6, 2026',
  headline = '5 things worth your attention',
  item1Title = 'The case for slower email',
  item1Url = '#',
  item1Excerpt = 'Moving fast in your inbox does not mean you communicate better. A counterintuitive take on async speed.',
  item2Title = 'Why notifications are broken',
  item2Url = '#',
  item2Excerpt = 'We designed them for engagement, not for humans. Here is what actually works.',
  item3Title = 'A new way to read long-form',
  item3Url = '#',
  item3Excerpt = 'Serial reading via email is quietly making a comeback. The format that died is alive again.',
  item4Title = 'The quiet return of plain text',
  item4Url = '#',
  item4Excerpt = 'HTML email is everywhere, yet some of the most-read newsletters are still just words.',
  item5Title = 'Building in public, one week at a time',
  item5Url = '#',
  item5Excerpt = 'A founder shares their unfiltered weekly update. Authentic, messy, and impossible to look away from.',
  signoff = 'See you next week.',
  authorName = 'The Weekly team',
} = {}) => {
  const items = [
    { title: item1Title, url: item1Url, excerpt: item1Excerpt },
    { title: item2Title, url: item2Url, excerpt: item2Excerpt },
    { title: item3Title, url: item3Url, excerpt: item3Excerpt },
    { title: item4Title, url: item4Url, excerpt: item4Excerpt },
    { title: item5Title, url: item5Url, excerpt: item5Excerpt },
  ];
  return (
    <Html lang="en">
      <Head />
      <Preview>{headline} &mdash; {digestName} #{issueNum}</Preview>
      <Body style={{ backgroundColor: '#FFFCF5', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Container style={{ maxWidth: 580, margin: '0 auto', padding: '40px 0 56px' }}>
          <Section style={{ padding: '0 32px 20px' }}>
            <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.45, margin: '0 0 2px', letterSpacing: '0.1em', fontWeight: 600 }}>
              {digestName.toUpperCase()} &middot; #{issueNum}
            </Text>
            <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.35, margin: 0 }}>{issueDate}</Text>
          </Section>
          <Section style={{ padding: '0 32px 24px' }}>
            <Text style={{ fontSize: 34, lineHeight: '1.08', color: '#1A1A1A', margin: 0, fontWeight: 700, letterSpacing: '-0.8px' }}>
              {headline}
            </Text>
          </Section>
          <Section style={{ padding: '0 32px' }}>
            <Hr style={{ borderColor: '#E8E4DA', margin: '0 0 28px' }} />
            {items.map((item, i) => (
              <Section key={i}>
                <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.35, margin: '0 0 5px', fontWeight: 700, letterSpacing: '0.06em' }}>
                  0{i + 1}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', margin: '0 0 7px', lineHeight: '1.25', letterSpacing: '-0.3px' }}>
                  <Link href={item.url} style={{ color: '#1A1A1A', textDecoration: 'none' }}>{item.title}</Link>
                </Text>
                <Text style={{ fontSize: 14, lineHeight: '1.68', color: '#4A4540', margin: i < 4 ? '0 0 22px' : 0 }}>
                  {item.excerpt}
                </Text>
                {i < 4 && <Hr style={{ borderColor: '#EDE9E0', margin: '0 0 22px' }} />}
              </Section>
            ))}
          </Section>
          <Section style={{ padding: '28px 32px 0' }}>
            <Hr style={{ borderColor: '#E8E4DA', margin: '0 0 20px' }} />
            <Text style={{ fontSize: 14, color: '#1A1A1A', margin: '0 0 16px', lineHeight: '1.5', opacity: 0.75 }}>
              {signoff}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px' }}>{authorName}</Text>
            <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.35, margin: 0, lineHeight: '1.65' }}>
              You are subscribed to {digestName}.{' '}
              <a href="#" style={{ color: '#1A1A1A' }}>Unsubscribe</a>{' '}&middot;{' '}
              <a href="#" style={{ color: '#1A1A1A' }}>View in browser</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Email;`,
  },

  thanks: {
    name: "Thank You Note",
    category: "Transactional",
    description: "Warm post-purchase thank-you with order summary",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  firstName = 'there',
  orderNumber = '2841',
  orderDate = 'May 6, 2026',
  item1Name = 'Annual Pro Plan',
  item1Price = '$120.00',
  item2Name = 'Brand Kit Add-on',
  item2Price = '$24.00',
  subtotal = '$144.00',
  discount = '-$14.40',
  total = '$129.60',
  estimatedDelivery = 'Instant — your account is ready',
  supportUrl = '#',
  dashboardUrl = '#',
  senderName = 'The Acme team',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>Order #{orderNumber} confirmed &mdash; thank you!</Preview>
    <Body style={{ backgroundColor: '#FBF3EC', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#7A3E2D', borderRadius: '14px 14px 0 0', padding: '20px 32px' }}>
          <Row>
            <Column>
              <Text style={{ color: '#FBF3EC', fontSize: 15, fontWeight: 700, margin: 0 }}>{brandName}</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ color: '#FBF3EC', fontSize: 11, opacity: 0.7, margin: 0, fontWeight: 600, letterSpacing: '0.08em' }}>ORDER CONFIRMED</Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '44px 36px 32px' }}>
          <Text style={{ fontSize: 48, lineHeight: '0.95', color: '#7A3E2D', margin: '0 0 20px', fontWeight: 600, letterSpacing: '-1.5px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Thank<br />you.
          </Text>
          <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#2D1A12', margin: '0 0 32px' }}>
            Hi {firstName}, your order is confirmed. We hand-pack every order and genuinely appreciate you choosing {brandName}.
          </Text>
          <Section style={{ backgroundColor: '#FBF3EC', border: '1px solid #E8D5C4', borderRadius: 10, padding: '20px 22px', marginBottom: 28 }}>
            <Text style={{ fontSize: 10.5, fontWeight: 700, color: '#7A3E2D', opacity: 0.6, margin: '0 0 14px', letterSpacing: '0.1em' }}>
              ORDER SUMMARY &middot; #{orderNumber}
            </Text>
            <Row style={{ marginBottom: 8 }}>
              <Column><Text style={{ fontSize: 14, color: '#2D1A12', margin: 0 }}>{item1Name}</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: 14, color: '#2D1A12', margin: 0, fontWeight: 600 }}>{item1Price}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 14 }}>
              <Column><Text style={{ fontSize: 14, color: '#2D1A12', margin: 0 }}>{item2Name}</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: 14, color: '#2D1A12', margin: 0, fontWeight: 600 }}>{item2Price}</Text></Column>
            </Row>
            <Hr style={{ borderColor: '#E8D5C4', margin: '0 0 12px' }} />
            <Row style={{ marginBottom: 4 }}>
              <Column><Text style={{ fontSize: 13, color: '#7A3E2D', opacity: 0.65, margin: 0 }}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: 13, color: '#2D1A12', margin: 0 }}>{subtotal}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 10 }}>
              <Column><Text style={{ fontSize: 13, color: '#7A3E2D', opacity: 0.65, margin: 0 }}>Discount (10%)</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: 13, color: '#2C7A3E', margin: 0, fontWeight: 600 }}>{discount}</Text></Column>
            </Row>
            <Hr style={{ borderColor: '#E8D5C4', margin: '0 0 10px' }} />
            <Row>
              <Column><Text style={{ fontSize: 15, fontWeight: 700, color: '#2D1A12', margin: 0 }}>Total</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: 15, fontWeight: 700, color: '#2D1A12', margin: 0 }}>{total}</Text></Column>
            </Row>
          </Section>
          <Text style={{ fontSize: 13, color: '#4A2918', opacity: 0.7, margin: '0 0 28px' }}>
            {estimatedDelivery}
          </Text>
          <Button href={dashboardUrl} style={{ backgroundColor: '#7A3E2D', color: '#FBF3EC', padding: '13px 26px', borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Go to your dashboard &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#FBF3EC', borderRadius: '0 0 14px 14px', padding: '22px 36px' }}>
          <Text style={{ fontSize: 13, color: '#7A3E2D', margin: '0 0 4px', fontStyle: 'italic', fontFamily: 'Georgia, serif', opacity: 0.8 }}>
            &mdash; {senderName}
          </Text>
          <Text style={{ fontSize: 11, color: '#7A3E2D', opacity: 0.4, margin: 0, lineHeight: '1.6' }}>
            Questions? <a href={supportUrl} style={{ color: '#7A3E2D' }}>Contact support</a> &middot; Order #{orderNumber}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  feature: {
    name: "Feature Spotlight",
    category: "Launch",
    description: "Single feature reveal with mockup area and benefit bullets",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  badgeLabel = 'NEW FEATURE',
  featureName = 'Smart Blocks',
  featureTagline = 'Build any email layout in seconds — no code, no friction.',
  featureDescription = 'Smart Blocks are reusable content modules that snap together like LEGO. Start from a template, swap the content, and ship. Every block is designed to look great on any device.',
  benefit1 = 'Drag and drop to reorder any section instantly',
  benefit2 = 'AI suggests the right block for your content type',
  benefit3 = 'Syncs across every template automatically',
  ctaLabel = 'Try Smart Blocks',
  ctaUrl = '#',
  senderName = 'The Acme team',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{badgeLabel}: {featureName} &mdash; {featureTagline}</Preview>
    <Body style={{ backgroundColor: '#EAF3EE', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#0E5C4A', borderRadius: '14px 14px 0 0', padding: '20px 32px' }}>
          <Row>
            <Column>
              <Text style={{ color: '#EAF3EE', fontSize: 15, fontWeight: 700, margin: 0 }}>{brandName}</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ color: '#EAF3EE', fontSize: 11, opacity: 0.75, margin: 0, fontWeight: 700, letterSpacing: '0.1em' }}>
                &#9733; {badgeLabel}
              </Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '40px 36px 28px' }}>
          <Text style={{ fontSize: 38, lineHeight: '1.07', color: '#0E5C4A', margin: '0 0 14px', fontWeight: 700, letterSpacing: '-0.8px' }}>
            {featureName}
          </Text>
          <Text style={{ fontSize: 17, lineHeight: '1.55', color: '#1A3D30', margin: '0 0 24px', fontWeight: 500 }}>
            {featureTagline}
          </Text>
          <Section style={{ backgroundColor: '#F0F9F5', border: '1px solid #C8E8DA', borderRadius: 10, padding: '20px 22px', marginBottom: 28 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#0E5C4A', opacity: 0.55, margin: '0 0 12px', letterSpacing: '0.1em' }}>
              FEATURE PREVIEW
            </Text>
            <Section style={{ backgroundColor: '#0E5C4A', borderRadius: 6, padding: '10px 14px', marginBottom: 10 }}>
              <Row>
                {['Header', 'Image', 'CTA'].map((b) => (
                  <Column key={b} style={{ padding: '0 4px' }}>
                    <Text style={{ fontSize: 10, color: '#EAF3EE', fontWeight: 600, margin: 0, textAlign: 'center', backgroundColor: '#FFFFFF20', borderRadius: 4, padding: '5px 0' }}>{b}</Text>
                  </Column>
                ))}
              </Row>
            </Section>
            <Text style={{ fontSize: 11, color: '#0E5C4A', opacity: 0.6, margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
              Drag to reorder &bull; Click to edit
            </Text>
          </Section>
          <Text style={{ fontSize: 15, lineHeight: '1.7', color: '#2D3D35', margin: '0 0 24px' }}>
            {featureDescription}
          </Text>
          <Hr style={{ borderColor: '#D4EBE0', margin: '0 0 22px' }} />
          {[benefit1, benefit2, benefit3].map((b, i) => (
            <Text key={i} style={{ fontSize: 14, color: '#1A3D30', margin: '0 0 10px', lineHeight: '1.55', paddingLeft: 18 }}>
              &#10003; {b}
            </Text>
          ))}
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '8px 36px 40px' }}>
          <Button href={ctaUrl} style={{ backgroundColor: '#0E5C4A', color: '#EAF3EE', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            {ctaLabel} &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#EAF3EE', borderRadius: '0 0 14px 14px', padding: '22px 36px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: '#0E5C4A', opacity: 0.4, margin: 0, lineHeight: '1.65' }}>
            {brandName} &mdash; sent to you because you use {brandName}.{' '}
            <a href="#" style={{ color: '#0E5C4A' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  survey: {
    name: "Quick Survey",
    category: "Engagement",
    description: "NPS-style 1-5 rating email with optional feedback prompt",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Hr, Link, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  firstName = 'there',
  question = 'How would you rate your experience with Acme this month?',
  scaleMin = 'Not good',
  scaleMax = 'Excellent',
  rating1Url = '#',
  rating2Url = '#',
  rating3Url = '#',
  rating4Url = '#',
  rating5Url = '#',
  followupPrompt = 'Anything specific we can improve? Just reply to this email — we read every response.',
  signoff = 'Thank you for your time.',
  senderName = 'The Acme team',
} = {}) => {
  const ratings = [
    { label: '1', url: rating1Url },
    { label: '2', url: rating2Url },
    { label: '3', url: rating3Url },
    { label: '4', url: rating4Url },
    { label: '5', url: rating5Url },
  ];
  return (
    <Html lang="en">
      <Head />
      <Preview>Quick question for you, {firstName} — one click is all we need</Preview>
      <Body style={{ backgroundColor: '#F5F4F0', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: '32px 0 52px' }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '44px 40px 40px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.4, margin: '0 0 28px', letterSpacing: '0.1em', fontWeight: 600 }}>
              {brandName.toUpperCase()} &middot; FEEDBACK
            </Text>
            <Text style={{ fontSize: 28, lineHeight: '1.15', color: '#1A1A1A', margin: '0 0 12px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              How did we do?
            </Text>
            <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#3A3530', margin: '0 0 32px' }}>
              Hi {firstName}, {question}
            </Text>
            <Row style={{ marginBottom: 8 }}>
              {ratings.map((r) => (
                <Column key={r.label} style={{ padding: '0 4px', textAlign: 'center' }}>
                  <Link href={r.url} style={{ display: 'block', padding: '14px 0', backgroundColor: '#F5F4F0', border: '1.5px solid #E0DDD8', borderRadius: 8, fontSize: 18, fontWeight: 700, color: '#1A1A1A', textDecoration: 'none', lineHeight: 1 }}>
                    {r.label}
                  </Link>
                </Column>
              ))}
            </Row>
            <Row style={{ marginBottom: 28 }}>
              <Column>
                <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.4, margin: '6px 0 0', textAlign: 'left' }}>{scaleMin}</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.4, margin: '6px 0 0' }}>{scaleMax}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: '#EDEAE5', margin: '0 0 24px' }} />
            <Text style={{ fontSize: 14, lineHeight: '1.7', color: '#3A3530', margin: '0 0 28px' }}>
              {followupPrompt}
            </Text>
            <Text style={{ fontSize: 14, color: '#1A1A1A', margin: '0 0 4px', opacity: 0.75 }}>{signoff}</Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{senderName}</Text>
          </Section>
          <Section style={{ padding: '20px 40px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 11, color: '#1A1A1A', opacity: 0.35, margin: 0, lineHeight: '1.6' }}>
              You received this feedback request from {brandName}.{' '}
              <a href="#" style={{ color: '#1A1A1A' }}>Unsubscribe</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Email;`,
  },

  reengage: {
    name: "Come Back",
    category: "Engagement",
    description: "Win-back email with what-is-new summary and exclusive offer",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  firstName = 'there',
  daysSince = '30',
  update1 = '12 new email templates added',
  update2 = 'AI generation is now 2x faster',
  update3 = 'Custom brand kits now available',
  update4 = 'Dark mode across the entire app',
  discountPercent = '20%',
  couponCode = 'COMEBACK20',
  couponExpiry = 'May 20, 2026',
  ctaLabel = 'Come back',
  ctaUrl = '#',
  senderName = 'The Acme team',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>We have missed you, {firstName} &mdash; here is what is new</Preview>
    <Body style={{ backgroundColor: '#FBEEE9', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#A23E2F', borderRadius: '14px 14px 0 0', padding: '36px 36px 32px' }}>
          <Text style={{ fontSize: 44, lineHeight: '1.05', color: '#FBEEE9', margin: 0, fontWeight: 600, letterSpacing: '-1px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            We&apos;ve missed<br />you, {firstName}.
          </Text>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '36px 36px 28px' }}>
          <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#2D1A12', margin: '0 0 10px' }}>
            It has been {daysSince} days since we last saw you. A lot has changed &mdash; all of it for the better.
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#A23E2F', margin: '0 0 18px' }}>
            Here is what is new:
          </Text>
          {[update1, update2, update3, update4].map((u, i) => (
            <Text key={i} style={{ fontSize: 14.5, color: '#2D1A12', margin: '0 0 10px', lineHeight: '1.5', paddingLeft: 16 }}>
              &bull; {u}
            </Text>
          ))}
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '0 36px 36px' }}>
          <Hr style={{ borderColor: '#F0DDD5', margin: '0 0 24px' }} />
          <Section style={{ backgroundColor: '#FBF3EE', border: '1.5px solid #E8C4B0', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
            <Row>
              <Column style={{ width: '65%' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 700, color: '#A23E2F', opacity: 0.65, margin: '0 0 4px', letterSpacing: '0.08em' }}>
                  WELCOME BACK OFFER
                </Text>
                <Text style={{ fontSize: 22, fontWeight: 800, color: '#A23E2F', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                  {discountPercent} off your next month
                </Text>
                <Text style={{ fontSize: 12, color: '#4A2918', opacity: 0.65, margin: 0 }}>
                  Expires {couponExpiry}
                </Text>
              </Column>
              <Column style={{ width: '35%', textAlign: 'right', verticalAlign: 'middle' }}>
                <Text style={{ fontSize: 14, fontWeight: 800, color: '#A23E2F', margin: 0, fontFamily: 'monospace', letterSpacing: '0.06em', backgroundColor: '#FFFFFF', border: '1.5px dashed #E8C4B0', borderRadius: 6, padding: '8px 10px', display: 'inline-block' }}>
                  {couponCode}
                </Text>
              </Column>
            </Row>
          </Section>
          <Button href={ctaUrl} style={{ backgroundColor: '#A23E2F', color: '#FBEEE9', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            {ctaLabel} &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#FBEEE9', borderRadius: '0 0 14px 14px', padding: '22px 36px' }}>
          <Text style={{ fontSize: 13, color: '#A23E2F', margin: '0 0 4px', opacity: 0.7 }}>
            &mdash; {senderName}
          </Text>
          <Text style={{ fontSize: 11, color: '#A23E2F', opacity: 0.4, margin: 0, lineHeight: '1.6' }}>
            You are receiving this because you have not logged in for {daysSince}+ days.{' '}
            <a href="#" style={{ color: '#A23E2F' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },

  referral: {
    name: "Refer a Friend",
    category: "Growth",
    description: "Referral incentive email with code display and reward steps",
    componentCode: `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Hr, Preview } from '@react-email/components';

const Email = ({
  brandName = 'Acme',
  firstName = 'there',
  rewardAmount = '$20',
  referralCode = 'SHARE-ACME',
  referralUrl = '#',
  step1 = 'Share your unique link or code with a friend',
  step2 = 'They sign up and activate their account',
  step3 = 'You both get credited automatically',
  ctaLabel = 'Share your referral link',
  ctaUrl = '#',
  termsUrl = '#',
  senderName = 'The Acme team',
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>Give {rewardAmount}, get {rewardAmount} &mdash; share {brandName} with a friend</Preview>
    <Body style={{ backgroundColor: '#EAF1F8', margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 0 52px' }}>
        <Section style={{ backgroundColor: '#1A4D8A', borderRadius: '14px 14px 0 0', padding: '36px 36px 32px' }}>
          <Row style={{ marginBottom: 16 }}>
            {[1, 0.55, 0.28].map((op, i) => (
              <Column key={i} style={{ width: 36, paddingRight: i < 2 ? 0 : undefined }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FFFFFF', opacity: op, marginLeft: i > 0 ? -12 : 0, display: 'inline-block', border: '2px solid #1A4D8A' }} />
              </Column>
            ))}
          </Row>
          <Text style={{ fontSize: 38, lineHeight: '1.07', color: '#FFFFFF', margin: 0, fontWeight: 700, letterSpacing: '-0.8px' }}>
            Give {rewardAmount}, get {rewardAmount}.
          </Text>
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '40px 36px 32px' }}>
          <Text style={{ fontSize: 16, lineHeight: '1.7', color: '#1A2B40', margin: '0 0 28px' }}>
            Hi {firstName} &mdash; invite a friend to {brandName} and you both receive {rewardAmount} in account credit the moment they activate.
          </Text>
          <Section style={{ backgroundColor: '#EAF1F8', border: '1px solid #C5D8EE', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
            <Text style={{ fontSize: 10.5, fontWeight: 700, color: '#1A4D8A', opacity: 0.6, margin: '0 0 10px', letterSpacing: '0.1em' }}>
              YOUR REFERRAL CODE
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 800, color: '#1A4D8A', margin: '0 0 8px', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
              {referralCode}
            </Text>
            <Text style={{ fontSize: 12, color: '#1A2B40', opacity: 0.55, margin: 0 }}>
              Or share your link: <a href={referralUrl} style={{ color: '#1A4D8A', fontWeight: 600 }}>{referralUrl}</a>
            </Text>
          </Section>
          <Hr style={{ borderColor: '#DDE8F2', margin: '0 0 24px' }} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#1A4D8A', opacity: 0.6, margin: '0 0 16px', letterSpacing: '0.1em' }}>
            HOW IT WORKS
          </Text>
          {[step1, step2, step3].map((s, i) => (
            <Row key={i} style={{ marginBottom: 14 }}>
              <Column style={{ width: 32, verticalAlign: 'top' }}>
                <Text style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#1A4D8A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, margin: 0, textAlign: 'center', lineHeight: '24px', display: 'inline-block' }}>
                  {i + 1}
                </Text>
              </Column>
              <Column>
                <Text style={{ fontSize: 14, color: '#1A2B40', margin: 0, lineHeight: '1.6', paddingTop: 2 }}>{s}</Text>
              </Column>
            </Row>
          ))}
        </Section>
        <Section style={{ backgroundColor: '#FFFFFF', padding: '8px 36px 40px' }}>
          <Button href={ctaUrl} style={{ backgroundColor: '#1A4D8A', color: '#FFFFFF', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            {ctaLabel} &rarr;
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#EAF1F8', borderRadius: '0 0 14px 14px', padding: '22px 36px', textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: '#1A4D8A', opacity: 0.4, margin: 0, lineHeight: '1.65' }}>
            {brandName} Referral Program &mdash; <a href={termsUrl} style={{ color: '#1A4D8A' }}>Terms apply</a> &middot; <a href="#" style={{ color: '#1A4D8A' }}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;`,
  },
};
