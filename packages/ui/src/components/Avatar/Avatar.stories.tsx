import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Madoo AI", size: "lg" },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] },
    tone: { control: "inline-radio", options: ["accent", "ink", "surface"] },
    circle: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {};

export const FromName: Story = { args: { name: "Andrew Ponce" } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar size="xs" name="Madoo" />
      <Avatar size="sm" name="Madoo" />
      <Avatar size="md" name="Madoo" />
      <Avatar size="lg" name="Madoo" />
      <Avatar size="xl" name="Madoo" />
    </div>
  ),
};
