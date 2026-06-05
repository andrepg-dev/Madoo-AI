import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Template saved automatically.",
    side: "top",
    align: "center",
    tone: "ink",
    disabled: false,
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    tone: { control: "inline-radio", options: ["ink", "light", "accent"] },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          minHeight: 240,
          placeItems: "center",
          padding: 48,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="secondary" size="md">
        Hover or focus me
      </Button>
    </Tooltip>
  ),
};

export const IconTrigger: Story = {
  args: {
    content: "Generate subject line",
    side: "right",
  },
  render: (args) => (
    <Tooltip {...args}>
      <IconButton aria-label="Generate subject line" variant="outline">
        <Icon name="sparkle" size={15} />
      </IconButton>
    </Tooltip>
  ),
};

export const Placement: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, max-content)",
        gap: 20,
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <span />
      <Tooltip content="Appears above" side="top">
        <Button variant="ghost" size="sm">
          Top
        </Button>
      </Tooltip>
      <span />
      <Tooltip content="Appears left" side="left">
        <Button variant="ghost" size="sm">
          Left
        </Button>
      </Tooltip>
      <Tooltip content="Centered tooltip" side="top" tone="accent">
        <IconButton aria-label="Centered tooltip" variant="accent">
          <Icon name="sparkle" size={15} />
        </IconButton>
      </Tooltip>
      <Tooltip content="Appears right" side="right">
        <Button variant="ghost" size="sm">
          Right
        </Button>
      </Tooltip>
      <span />
      <Tooltip content="Appears below" side="bottom" tone="light">
        <Button variant="ghost" size="sm">
          Bottom
        </Button>
      </Tooltip>
      <span />
    </div>
  ),
};

export const LongCopy: Story = {
  args: {
    content:
      "Used when contacts have missing first names. Madoo falls back to your workspace default greeting.",
    side: "bottom",
    align: "start",
    tone: "light",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="dashed" size="md">
        Personalization fallback
      </Button>
    </Tooltip>
  ),
};
