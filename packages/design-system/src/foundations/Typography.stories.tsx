import type { Meta, StoryObj } from "@storybook/react";
import { TypographyScale } from "./Typography";

const meta: Meta<typeof TypographyScale> = {
  title: "Foundations/Typography",
  component: TypographyScale,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TypographyScale>;

export const Scale: Story = { name: "Scale" };
