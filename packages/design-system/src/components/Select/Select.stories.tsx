import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { NativeSelect, Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const PromptControls: Story = {
  parameters: { layout: "padded" },
  render: () => {
    const [tone, setTone] = useState("Friendly");
    const [length, setLength] = useState("Medium");
    const [audience, setAudience] = useState("Existing customers");

    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Select
          label="Tone"
          value={tone}
          options={["Friendly", "Confident", "Playful", "Formal"]}
          onChange={setTone}
          size="sm"
          variant="ghost"
        />
        <Select
          label="Length"
          value={length}
          options={["Short", "Medium", "Long"]}
          onChange={setLength}
          size="sm"
          variant="ghost"
        />
        <Select
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

export const Large: Story = {
  render: () => {
    const [visibility, setVisibility] = useState("Any visibility");

    return (
      <Select
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

export const NativeFormSelect = {
  render: () => (
    <NativeSelect
      label="Audience"
      selectSize="md"
      options={[
        { value: "all", label: "All contacts" },
        { value: "vip", label: "VIPs" },
        { value: "free", label: "Free tier" },
        { value: "trial", label: "Trial" },
      ]}
    />
  ),
};
