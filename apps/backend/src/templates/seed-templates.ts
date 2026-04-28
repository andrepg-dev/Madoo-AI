/** Baseline React Email JSX sources for gallery template seeds (all 12 previews). */

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
    category: "Product Launch",
    description: "Hero announcement with CTA",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function LaunchEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F2EFE8', margin: 0 }}>
        <Container style={{ padding: '32px 24px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '28px 24px' }}>
            <Text style={{ fontSize: 11, letterSpacing: 2, color: '#0E1F1A', opacity: 0.55, margin: '0 0 12px' }}>
              PRODUCT LAUNCH
            </Text>
            <Text style={{ fontSize: 28, lineHeight: 1.15, color: '#0E1F1A', margin: '0 0 16px', fontWeight: 500 }}>
              Something new is ready for you
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#0E1F1A', opacity: 0.85, margin: '0 0 22px' }}>
              We built this launch template so your announcement feels confident without sounding stiff.
            </Text>
            <Button href="#" style={{ backgroundColor: '#0E1F1A', color: '#F2EFE8', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              See what&apos;s new
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  newsletter: {
    name: "The Editorial",
    category: "Newsletter",
    description: "Editorial hero + sections",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components';

export default function NewsletterEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FAF7F0', margin: 0 }}>
        <Container style={{ padding: '28px 20px', maxWidth: 580 }}>
          <Section style={{ paddingBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#1A1A1A', opacity: 0.55, margin: 0 }}>THE WEEKLY · VOL. 1</Text>
            <Text style={{ fontSize: 30, lineHeight: 1.1, color: '#1A1A1A', margin: '10px 0 0', fontWeight: 500 }}>
              Stories worth your inbox
            </Text>
          </Section>
          <Hr style={{ borderColor: '#E8E4DC', margin: '16px 0' }} />
          <Section>
            <Text style={{ fontSize: 15, lineHeight: 1.7, color: '#1A1A1A', margin: '0 0 14px' }}>
              Here&apos;s the opener paragraph — crisp, opinionated, and easy to skim on mobile.
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.7, color: '#1A1A1A', margin: 0 }}>
              Drop your short links, shout-outs, and closing thought below.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  sale: {
    name: "Bold Drop",
    category: "Promotion",
    description: "Sale urgency layout",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function SaleEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FFF1EB', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '26px 22px', border: '1px solid #FFD8C9' }}>
            <Text style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#FF5C2B', margin: '0 0 10px' }}>
              LIMITED TIME
            </Text>
            <Text style={{ fontSize: 32, lineHeight: 1.05, color: '#2B160F', margin: '0 0 14px', fontWeight: 700 }}>
              40% off ends Sunday
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#4B2E23', margin: '0 0 22px' }}>
              Bold promo layout — tune copy for urgency while staying readable in dark mode previews.
            </Text>
            <Button href="#" style={{ backgroundColor: '#FF5C2B', color: '#FFFFFF', padding: '14px 24px', borderRadius: 10, fontWeight: 700 }}>
              Shop the drop
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  welcome: {
    name: "Soft Welcome",
    category: "Onboarding",
    description: "Warm onboarding cadence",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#EFF4F0', margin: 0 }}>
        <Container style={{ padding: '30px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '26px 22px' }}>
            <Text style={{ fontSize: 26, lineHeight: 1.15, color: '#2C5F4F', margin: '0 0 12px', fontWeight: 500 }}>
              Welcome aboard
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1F3D34', margin: '0 0 20px' }}>
              Thanks for joining — here&apos;s a gentle path to your first success inside the product.
            </Text>
            <Button href="#" style={{ backgroundColor: '#2C5F4F', color: '#EFF4F0', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              Complete setup
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  minimal: {
    name: "Minimal Update",
    category: "Changelog",
    description: "Clean product changelog update",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text } from '@react-email/components';

export default function MinimalEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FFFFFF', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section>
            <Text style={{ fontSize: 12, color: '#0A0A0A', opacity: 0.55, margin: '0 0 10px' }}>CHANGELOG · V2.4</Text>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#0A0A0A', margin: '0 0 12px', fontWeight: 500 }}>
              Product updates you should know
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#0A0A0A', margin: 0 }}>
              New collaboration tools, faster search, and quality-of-life fixes for your daily workflow.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  event: {
    name: "Event Invite",
    category: "Event",
    description: "Invitation with date and CTA",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function EventEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F0EEFA', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 12, letterSpacing: 1.2, color: '#3B2F8C', margin: '0 0 10px' }}>YOU ARE INVITED</Text>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#1A1A1A', margin: '0 0 12px', fontWeight: 500 }}>
              An evening of ideas
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 16px' }}>May 14 · 7:00 PM · The Foundry, Brooklyn</Text>
            <Button href="#" style={{ backgroundColor: '#3B2F8C', color: '#FFFFFF', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              RSVP now
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  digest: {
    name: "Weekly Digest",
    category: "Newsletter",
    description: "Digest-style curated links",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text } from '@react-email/components';

export default function DigestEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FFFCF5', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section>
            <Text style={{ fontSize: 12, color: '#1A1A1A', opacity: 0.55, margin: '0 0 10px' }}>THE WEEKLY</Text>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#1A1A1A', margin: '0 0 14px', fontWeight: 500 }}>
              5 things worth your attention
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 8px' }}>01. The case for slower email</Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 8px' }}>02. Why notifications are broken</Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: 0 }}>03. A new way to read</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  thanks: {
    name: "Thank You Note",
    category: "Transactional",
    description: "Simple post-purchase thank-you",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text } from '@react-email/components';

export default function ThanksEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FBF3EC', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 30, lineHeight: 1.1, color: '#7A3E2D', margin: '0 0 14px', fontWeight: 500 }}>Thank you.</Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: 0 }}>
              Your order is on the way. We hand-pack every order and genuinely appreciate your support.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  feature: {
    name: "Feature Spotlight",
    category: "Product",
    description: "Single feature reveal with CTA",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function FeatureEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#EAF3EE', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 12, color: '#0E5C4A', letterSpacing: 1.2, margin: '0 0 10px' }}>SPOTLIGHT</Text>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#0E5C4A', margin: '0 0 12px', fontWeight: 500 }}>
              Meet smart blocks
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 16px' }}>
              Build high-converting emails faster with reusable content blocks.
            </Text>
            <Button href="#" style={{ backgroundColor: '#0E5C4A', color: '#FFFFFF', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              Try it now
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  survey: {
    name: "Quick Survey",
    category: "Engagement",
    description: "NPS-style quick feedback email",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text } from '@react-email/components';

export default function SurveyEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F5F4F0', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 24, lineHeight: 1.15, color: '#1A1A1A', margin: '0 0 10px', fontWeight: 500 }}>
              How did we do?
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: 0 }}>
              Rate your experience from 1 to 5 and help us improve.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  reengage: {
    name: "Come Back",
    category: "Re-engagement",
    description: "Reactivation with what-is-new summary",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function ReengageEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FBEEE9', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#A23E2F', margin: '0 0 12px', fontWeight: 500 }}>
              We have missed you
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 16px' }}>
              New templates, faster AI generation, and cleaner collaboration are waiting for you.
            </Text>
            <Button href="#" style={{ backgroundColor: '#A23E2F', color: '#FFFFFF', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              Come back
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
  referral: {
    name: "Refer a Friend",
    category: "Growth",
    description: "Referral incentive email",
    componentCode: `
import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function ReferralEmail() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#EAF1F8', margin: 0 }}>
        <Container style={{ padding: '28px 22px', maxWidth: 560 }}>
          <Section style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '24px 22px' }}>
            <Text style={{ fontSize: 12, color: '#1A4D8A', letterSpacing: 1.2, margin: '0 0 10px' }}>REFERRAL PROGRAM</Text>
            <Text style={{ fontSize: 28, lineHeight: 1.1, color: '#1A4D8A', margin: '0 0 12px', fontWeight: 500 }}>
              Bring a friend, get $20
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 1.65, color: '#1A1A1A', margin: '0 0 16px' }}>
              Share your link and both of you receive a reward after signup.
            </Text>
            <Button href="#" style={{ backgroundColor: '#1A4D8A', color: '#FFFFFF', padding: '12px 22px', borderRadius: 8, fontWeight: 600 }}>
              Share referral link
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
`.trim(),
  },
};
