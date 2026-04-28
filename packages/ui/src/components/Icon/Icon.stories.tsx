import type { Meta, StoryObj } from "@storybook/react";
import { Icon, ICON_NAMES, type IconName } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Foundations/Iconography",
  component: Icon,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    name: { control: "select", options: ICON_NAMES },
    size: { control: { type: "range", min: 10, max: 48, step: 1 } },
    stroke: { control: { type: "range", min: 1, max: 3, step: 0.1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {
  args: { name: "sparkle", size: 24, stroke: 1.6 },
};

export const Library: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 12,
        maxWidth: 720,
      }}
    >
      {ICON_NAMES.map((name: IconName) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: 16,
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--surface)",
            color: "var(--ink)",
            fontFamily: "var(--font-sans)",
            fontSize: 11.5,
          }}
        >
          <Icon name={name} size={22} />
          <span style={{ color: "var(--ink-soft)" }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};
