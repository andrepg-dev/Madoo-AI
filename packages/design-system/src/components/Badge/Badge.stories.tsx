import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { Icon } from "../Icon";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Trained on 10,000+ high-converting emails" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["accent", "neutral", "success", "warn", "danger", "info", "solid"],
    },
    dot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Icon name="sparkle" size={11} /> Trained on 10,000+ emails
      </>
    ),
  },
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 480 }}>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="success" dot>
        Live
      </Badge>
      <Badge tone="warn" dot>
        Pending
      </Badge>
      <Badge tone="danger" dot>
        Failed
      </Badge>
      <Badge tone="info">Scheduled</Badge>
      <Badge tone="solid">PRO</Badge>
    </div>
  ),
};
