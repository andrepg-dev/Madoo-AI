import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { value: 60 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    tone: { control: "inline-radio", options: ["accent", "success", "ink"] },
    variant: { control: "inline-radio", options: ["default", "thin"] },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const Thin: Story = {
  args: { variant: "thin", value: 40 },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};
