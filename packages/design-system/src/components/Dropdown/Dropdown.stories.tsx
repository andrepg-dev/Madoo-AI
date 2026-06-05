import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../Button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const CustomTrigger: Story = {
  render: () => {
    const [action, setAction] = useState("No action selected");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="secondary" size="sm">
              Actions
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => setAction("Duplicate")}>
              Duplicate
            </DropdownItem>
            <DropdownItem onSelect={() => setAction("Archive")}>Archive</DropdownItem>
            <DropdownItem onSelect={() => setAction("Delete")}>Delete</DropdownItem>
          </DropdownContent>
        </Dropdown>
        <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>{action}</span>
      </div>
    );
  },
};
