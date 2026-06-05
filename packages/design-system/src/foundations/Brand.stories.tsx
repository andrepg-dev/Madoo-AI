import type { Meta, StoryObj } from "@storybook/react";
import { BrandSystem } from "./Brand";

const meta: Meta<typeof BrandSystem> = {
  title: "Foundations/Brand",
  component: BrandSystem,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BrandSystem>;

export const System: Story = { name: "System" };
