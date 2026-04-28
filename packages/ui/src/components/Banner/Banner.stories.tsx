import type { Meta, StoryObj } from "@storybook/react";
import { Banner } from "./Banner";

const meta: Meta<typeof Banner> = {
  title: "Components/Banner",
  component: Banner,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    tone: "accent",
    title: "AI prediction",
    children:
      "Based on your past campaigns, expect ~580 opens and ~140 clicks.",
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["accent", "info", "success", "warn", "danger"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {};

export const All: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "grid", gap: 10, maxWidth: 540 }}>
      <Banner tone="accent" title="Suggestion">
        Subject lines under 50 chars get 22% more opens.
      </Banner>
      <Banner tone="info" title="Heads up">
        Your domain DKIM record will refresh in 12 hours.
      </Banner>
      <Banner tone="success" title="Domain verified">
        acme.co is ready to send marketing emails.
      </Banner>
      <Banner tone="warn" title="Variables missing">
        4 contacts will receive the fallback value for {"{Empresa}"}.
      </Banner>
      <Banner tone="danger" title="Send failed">
        Stripe rejected your card. Update billing to keep sending.
      </Banner>
    </div>
  ),
};
