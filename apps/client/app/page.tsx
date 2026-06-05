"use client";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  ProgressBar,
  SuggestionChip,
} from "@madoo/ui";

const navItems = [
  { icon: "home", label: "Home", active: true },
  { icon: "sparkle", label: "Generate" },
  { icon: "grid", label: "Templates" },
  { icon: "inbox", label: "Campaigns" },
  { icon: "settings", label: "Settings" },
] as const;

const workflowItems = [
  { label: "Brand voice", value: "Ready", tone: "success" },
  { label: "Audience", value: "New signups", tone: "neutral" },
  { label: "Provider", value: "Mailchimp", tone: "neutral" },
] as const;

const queue = [
  { title: "Pricing update", status: "Draft", progress: 72 },
  { title: "Welcome sequence", status: "Review", progress: 46 },
  { title: "Feature spotlight", status: "Queued", progress: 18 },
] as const;

const templates = [
  { name: "Launch", meta: "Product news", accent: "#071b38" },
  { name: "Welcome", meta: "Onboarding", accent: "#027a48" },
  { name: "Promo", meta: "Sale drop", accent: "#b42318" },
] as const;

export default function Page() {
  return (
    <main className="client-shell">
      <aside className="client-sidebar">
        <div className="client-brand">
          <div className="client-brandMark">M</div>
          <div>
            <p>Madoo</p>
            <span>Client</span>
          </div>
        </div>

        <nav className="client-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={
                "active" in item && item.active
                  ? "client-navItem client-navItemActive"
                  : "client-navItem"
              }
              type="button"
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <Card className="client-sidebarPanel" padded>
          <div className="client-panelHeader">
            <Icon name="bolt" size={16} />
            <span>Workspace</span>
          </div>
          <p className="client-sidebarMetric">18</p>
          <span className="client-muted">Active email drafts</span>
        </Card>
      </aside>

      <section className="client-main">
        <header className="client-topbar">
          <div>
            <p className="client-eyebrow">AI email platform</p>
            <h1>Generate, review, and ship campaigns.</h1>
          </div>
          <div className="client-topActions">
            <IconButton aria-label="Search">
              <Icon name="search" size={18} />
            </IconButton>
            <IconButton aria-label="Notifications">
              <Icon name="bell" size={18} />
            </IconButton>
            <Button leftIcon={<Icon name="plus" size={18} />}>New campaign</Button>
          </div>
        </header>

        <section className="client-grid">
          <Card className="client-composer" padded size="lg">
            <div className="client-cardHeader">
              <div>
                <p className="client-eyebrow">Composer</p>
                <h2>Campaign brief</h2>
              </div>
              <Badge tone="success">Live</Badge>
            </div>

            <div className="client-promptBox">
              <p>
                Launch a clean onboarding email for new customers, focused on
                first setup and template export.
              </p>
            </div>

            <div className="client-chipRow">
              <SuggestionChip>Short subject line</SuggestionChip>
              <SuggestionChip>Spanish variant</SuggestionChip>
              <SuggestionChip>Mailchimp export</SuggestionChip>
            </div>

            <div className="client-workflow">
              {workflowItems.map((item) => (
                <div key={item.label} className="client-workflowItem">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="client-composerActions">
              <Button leftIcon={<Icon name="sparkle" size={16} />}>
                Generate draft
              </Button>
              <Button
                variant="secondary"
                rightIcon={<Icon name="arrow" size={18} />}
              >
                Open editor
              </Button>
            </div>
          </Card>

          <Card className="client-preview" padded size="lg">
            <div className="client-previewFrame">
              <div className="client-emailHeader">
                <span>Subject</span>
                <strong>Your first campaign is ready</strong>
              </div>
              <div className="client-emailHero">
                <div>
                  <p>Welcome to Madoo</p>
                  <h3>Build client-ready emails in minutes.</h3>
                </div>
              </div>
              <div className="client-emailRows">
                <span />
                <span />
                <span />
              </div>
            </div>
          </Card>

          <Card padded className="client-queue">
            <div className="client-cardHeader">
              <h2>Production queue</h2>
              <Icon name="refresh" size={16} />
            </div>
            <div className="client-stack">
              {queue.map((item) => (
                <div className="client-queueItem" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.status}</span>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
              ))}
            </div>
          </Card>

          <Card padded className="client-templatePanel">
            <div className="client-cardHeader">
              <h2>Templates</h2>
              <Icon name="grid" size={16} />
            </div>
            <div className="client-templateGrid">
              {templates.map((template) => (
                <button className="client-template" key={template.name} type="button">
                  <span style={{ background: template.accent }} />
                  <strong>{template.name}</strong>
                  <small>{template.meta}</small>
                </button>
              ))}
            </div>
          </Card>
        </section>
      </section>
    </main>
  );
}
