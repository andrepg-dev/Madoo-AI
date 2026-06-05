import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  tags: ["autodocs"],
  args: { children: "{Nombre}", tone: "accent" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["accent", "neutral", "success", "warn", "danger", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    sans: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const States: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Tag tone="accent">{"{Nombre}"}</Tag>
      <Tag tone="neutral">draft</Tag>
      <Tag tone="success">12 sent</Tag>
      <Tag tone="warn" size="sm" sans>
        4 missing
      </Tag>
      <Tag tone="danger" size="sm" sans>
        not mapped
      </Tag>
      <Tag tone="info" sans>
        scheduled
      </Tag>
    </div>
  ),
};
