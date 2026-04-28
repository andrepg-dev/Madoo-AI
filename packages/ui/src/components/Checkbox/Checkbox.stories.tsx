import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    label: "Run A/B test on subject lines",
    description:
      "Send 3 variants to 10% of your list, then auto-send the winner to the rest after 4 hours.",
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
