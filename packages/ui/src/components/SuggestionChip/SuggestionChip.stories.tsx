import type { Meta, StoryObj } from "@storybook/react";
import { SuggestionChip } from "./SuggestionChip";
import { Icon } from "../Icon";

const meta: Meta<typeof SuggestionChip> = {
  title: "Components/SuggestionChip",
  component: SuggestionChip,
  tags: ["autodocs"],
  args: { children: "Black Friday teaser, urgent" },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "accent"] },
    pressed: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof SuggestionChip>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: { leadingIcon: <Icon name="sparkle" size={11} /> },
};

export const Accent: Story = { args: { variant: "accent" } };

export const Group: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 640 }}>
      {[
        "Black Friday teaser, urgent",
        "Welcome new subscribers",
        "We miss you (re-engagement)",
        "Product launch — confident & playful",
      ].map((s) => (
        <SuggestionChip key={s} leadingIcon={<Icon name="sparkle" size={11} />}>
          {s}
        </SuggestionChip>
      ))}
    </div>
  ),
};
