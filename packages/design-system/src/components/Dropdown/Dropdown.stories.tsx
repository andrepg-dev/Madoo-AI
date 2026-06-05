import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dropdown } from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Visibility: Story = {
  render: () => {
    const [visibility, setVisibility] = useState("Any visibility");
    return (
      <Dropdown
        value={visibility}
        options={["Any visibility", "Workspace"]}
        onChange={setVisibility}
        menuTitle="Visibility"
        size="lg"
        menuWidth={340}
      />
    );
  },
};

export const PromptControls: Story = {
  parameters: { layout: "padded" },
  render: () => {
    const [tone, setTone] = useState("Friendly");
    const [length, setLength] = useState("Medium");
    const [audience, setAudience] = useState("Existing customers");
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Dropdown
          label="Tone"
          value={tone}
          options={["Friendly", "Confident", "Playful", "Formal"]}
          onChange={setTone}
          size="sm"
          variant="ghost"
        />
        <Dropdown
          label="Length"
          value={length}
          options={["Short", "Medium", "Long"]}
          onChange={setLength}
          size="sm"
          variant="ghost"
        />
        <Dropdown
          label="Audience"
          value={audience}
          options={["All contacts", "Existing customers", "Trial users"]}
          onChange={setAudience}
          size="sm"
          variant="ghost"
        />
      </div>
    );
  },
};
