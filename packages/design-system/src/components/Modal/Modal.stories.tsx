import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../Button";
import { Icon } from "../Icon";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    size: "xl"
  },

  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          eyebrow="Step 4 of 5"
          title="When should it go out?"
          description="Pick a moment that matches your audience."
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setOpen(false)}>
                Back
              </Button>
              <Button
                size="md"
                rightIcon={<Icon name="arrow" size={12} />}
                onClick={() => setOpen(false)}
              >
                Continue
              </Button>
            </>
          }
        >
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 13.5 }}>
            Export now or keep editing. AI will preserve the template structure
            inside the next 24 hours when scheduling is enabled.
          </p>
        </Modal>
      </>
    );
  }
};

export const Login: Story = {
  args: {
    size: "sm"
  },

  parameters: { layout: "fullscreen" },

  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open login</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size="sm"
          title="Continue to Madoo AI"
          description="Sign in to generate, save, and export beautiful emails."
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "24px 0 8px",
            }}
          >
            <Button variant="primary" size="lg">
              <Icon name="user" size={14} /> Continue with Google
            </Button>
          </div>
          <p style={{ color: "var(--ink-faint)", fontSize: 11, textAlign: "center" }}>
            By continuing you agree to our Terms and Privacy.
          </p>
        </Modal>
      </>
    );
  }
};
