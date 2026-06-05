import type { Meta, StoryObj } from "@storybook/react";
import { ColorPalette } from "./Color";

const meta: Meta<typeof ColorPalette> = {
  title: "Foundations/Color",
  component: ColorPalette,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const Palette: Story = { name: "Palette" };
