import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Icon } from "../Icon";
import { GroupButtons } from "./GroupButtons";

const meta: Meta<typeof GroupButtons> = {
  title: "Components/GroupButtons",
  component: GroupButtons,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof GroupButtons>;

const ITEMS = [
  { value: "settings", label: "Settings", icon: <Icon name="sliders" size={22} /> },
  { value: "grid", label: "Grid view", icon: <Icon name="grid" size={22} /> },
  { value: "list", label: "List view", icon: <Icon name="barChart" size={22} /> },
];

export const IconOnly: Story = {
  render: () => {
    const [value, setValue] = useState("settings");

    return (
      <GroupButtons
        aria-label="View mode"
        items={ITEMS}
        value={value}
        onChange={setValue}
        size="lg"
      />
    );
  },
};

export const WithLabels: Story = {
  render: () => {
    const [value, setValue] = useState("grid");

    return (
      <GroupButtons
        aria-label="View mode"
        items={ITEMS}
        value={value}
        onChange={setValue}
        showLabels
      />
    );
  },
};
