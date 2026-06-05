import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    label: "Run A/B test on subject lines",
    description:
      "Create 3 variants, compare the copy, then keep the strongest version.",
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const NoDescription: Story = {
  args: { label: "Acepto los terminos", description: undefined },
};
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
