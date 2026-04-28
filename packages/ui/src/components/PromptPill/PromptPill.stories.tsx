import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PromptPill } from "./PromptPill";

const meta: Meta<typeof PromptPill> = {
  title: "Components/PromptPill",
  component: PromptPill,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PromptPill>;

export const Tone: Story = {
  render: () => {
    const [tone, setTone] = useState("Friendly");
    return (
      <PromptPill
        label="Tone"
        value={tone}
        options={["Friendly", "Confident", "Playful", "Formal", "Punchy"]}
        onChange={setTone}
      />
    );
  },
};

export const Group: Story = {
  parameters: { layout: "padded" },
  render: () => {
    const [tone, setTone] = useState("Friendly");
    const [length, setLength] = useState("Medium");
    const [audience, setAudience] = useState("Existing customers");
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <PromptPill
          label="Tone"
          value={tone}
          options={["Friendly", "Confident", "Playful", "Formal"]}
          onChange={setTone}
        />
        <PromptPill
          label="Length"
          value={length}
          options={["Short", "Medium", "Long"]}
          onChange={setLength}
        />
        <PromptPill
          label="Audience"
          value={audience}
          options={["All contacts", "Existing customers", "Trial users"]}
          onChange={setAudience}
        />
      </div>
    );
  },
};
