import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  args: { children: "↵" },
  argTypes: {
    inverse: { control: "boolean" },
    size: { control: "inline-radio", options: ["md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {};
export const Inverse: Story = {
  args: { inverse: true },
  decorators: [
    (Story) => (
      <div style={{ background: "var(--ink)", color: "var(--bg)", padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};
export const Combo: Story = {
  args: { children: "⌘K" },
};
