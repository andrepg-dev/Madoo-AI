import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

const meta: Meta<typeof SegmentedControl> = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const ITEMS = [
  { value: "all", label: "All" },
  { value: "promo", label: "Promotions" },
  { value: "new", label: "Newsletters" },
  { value: "trans", label: "Transactional" },
  { value: "ann", label: "Announcements" },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("all");
    return <SegmentedControl items={ITEMS} value={value} onChange={setValue} />;
  },
};

export const Minimal: Story = {
  render: () => {
    const [value, setValue] = useState("promo");
    return (
      <SegmentedControl
        items={ITEMS}
        value={value}
        onChange={setValue}
        variant="minimal"
      />
    );
  },
};
