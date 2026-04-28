import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    label: "Prompt",
    placeholder:
      "e.g. Announce our new pricing to existing customers — confident but not pushy.",
    rows: 4,
    variant: "default",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "filled", "ghost"] },
    noResize: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Filled: Story = {
  args: { variant: "filled", placeholder: "Tell AI what to change…" },
};

export const WithError: Story = {
  args: { error: "El prompt es muy corto. Da mas contexto." },
};

export const NoResize: Story = {
  args: { noResize: true, placeholder: "Resize disabled" },
};
