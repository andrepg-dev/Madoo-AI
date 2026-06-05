import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    label: "Audience",
    selectSize: "md",
    options: [
      { value: "all", label: "All contacts" },
      { value: "vip", label: "VIPs" },
      { value: "free", label: "Free tier" },
      { value: "trial", label: "Trial" },
    ],
  },
  argTypes: {
    selectSize: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: "Selecciona una audiencia." },
};

export const Small: Story = { args: { selectSize: "sm" } };

export const Disabled: Story = { args: { disabled: true } };
