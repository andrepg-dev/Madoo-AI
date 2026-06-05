import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";
import { Icon } from "../Icon";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    "aria-label": "Cerrar",
    variant: "soft",
    size: "md",
    children: <Icon name="x" size={14} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["soft", "solid", "outline", "ghost", "accent"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Soft: Story = {};
export const Solid: Story = { args: { variant: "solid", children: <Icon name="arrowUp" size={14} /> } };
export const Outline: Story = { args: { variant: "outline", children: <Icon name="copy" size={14} /> } };
export const Ghost: Story = { args: { variant: "ghost", children: <Icon name="search" size={14} /> } };
export const Accent: Story = { args: { variant: "accent", children: <Icon name="sparkle" size={14} /> } };

export const SizeMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <IconButton key={size} aria-label={size} size={size}>
          <Icon name="settings" size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        </IconButton>
      ))}
    </div>
  ),
};
