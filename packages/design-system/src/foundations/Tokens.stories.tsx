import type { Meta, StoryObj } from "@storybook/react";
import { TokensReference } from "./Tokens";

const meta: Meta<typeof TokensReference> = {
  title: "Foundations/Tokens",
  component: TokensReference,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TokensReference>;

export const Reference: Story = { name: "Radii · Shadows · Spacing" };
