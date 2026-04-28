import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Icon } from "../Icon";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    label: "Workspace name",
    placeholder: "Acme Inc.",
    inputSize: "md",
    variant: "default",
  },
  argTypes: {
    inputSize: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "filled", "ghost"] },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "Solo letras y numeros, sin espacios." },
};

export const WithError: Story = {
  args: { error: "Workspace name is required.", value: "" },
};

export const WithIcons: Story = {
  args: {
    label: "Search",
    placeholder: "Search templates",
    startAdornment: <Icon name="search" size={14} />,
    endAdornment: <kbd style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>⌘K</kbd>,
    inputSize: "lg",
  },
};

export const Filled: Story = {
  args: { variant: "filled", label: "Subject", placeholder: "Tu asunto..." },
};

export const Disabled: Story = {
  args: { disabled: true, value: "demo@madoo.ai" },
};
