import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card, SelectableCard } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { size: "md" },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 360 }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 22 }}>
        Welcome series
      </h3>
      <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.5 }}>
        Onboard new subscribers in three friendly emails over a week.
      </p>
    </Card>
  ),
};

export const Large: Story = {
  args: { size: "lg", padded: true },
  render: (args) => (
    <Card {...args} style={{ maxWidth: 420 }}>
      <h3 style={{ margin: 0 }}>Brand kit</h3>
      <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.5 }}>
        Save your colors, fonts and logos so every email feels like you.
      </p>
    </Card>
  ),
};

export const Selectable: Story = {
  render: () => {
    const [selected, setSelected] = useState("now");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 540 }}>
        <SelectableCard
          padded
          title="Send now"
          description="Goes out immediately to 1,452 contacts"
          selected={selected === "now"}
          onClick={() => setSelected("now")}
        />
        <SelectableCard
          padded
          title="Schedule for later"
          description="Pick a date and time"
          selected={selected === "later"}
          onClick={() => setSelected("later")}
        />
      </div>
    );
  },
};
