import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Icon } from "../Icon";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Generate email",
    variant: "primary",
    size: "lg",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "accent", "secondary", "ghost", "dashed", "danger"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    block: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Accent: Story = { args: { variant: "accent", children: "Send campaign" } };

export const Secondary: Story = {
  args: { variant: "secondary", children: "Back", size: "md" },
};

export const Ghost: Story = { args: { variant: "ghost", children: "Skip" } };

export const Dashed: Story = {
  args: {
    variant: "dashed",
    size: "sm",
    children: "Brand kit",
    leftIcon: <Icon name="plus" size={12} />,
  },
};

export const Danger: Story = { args: { variant: "danger", children: "Delete workspace" } };

export const WithIcons: Story = {
  args: {
    children: "Generate email",
    leftIcon: <Icon name="sparkle" size={14} />,
    shortcut: "↵",
  },
};

export const Disabled: Story = {
  args: { children: "Generate email", disabled: true },
};

export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "grid", gap: 16, fontFamily: "var(--font-sans)" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 50, fontSize: 11, color: "var(--ink-faint)" }}>
            {size.toUpperCase()}
          </span>
          <Button size={size} variant="primary">Primary</Button>
          <Button size={size} variant="accent">Accent</Button>
          <Button size={size} variant="secondary">Secondary</Button>
          <Button size={size} variant="ghost">Ghost</Button>
          <Button size={size} variant="dashed" leftIcon={<Icon name="plus" size={12} />}>
            Dashed
          </Button>
          <Button size={size} variant="danger">Danger</Button>
        </div>
      ))}
    </div>
  ),
};
