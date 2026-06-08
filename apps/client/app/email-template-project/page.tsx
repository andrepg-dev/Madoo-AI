"use client"

import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import {
  ArrowDown01Icon,
  Copy01Icon,
  Edit02Icon,
  RefreshIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, Tooltip } from "@madoo/design-system";
import Image from "next/image";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip content={label} side="bottom" tone="ink">
      <Button
        aria-label={label}
        className="h-6 w-6 rounded-md"
        onClick={onClick}
        variant="icon"
        size="sm"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={icon}
          primaryColor="currentColor"
          size={13}
          strokeWidth={1.5}
        />
      </Button>
    </Tooltip>
  );
}

const userGreeting = "Hi madoo, how are you?";

const aiGreeting = `¡Hola! Todo bien por aquí, ¿y tú? 😊

Estoy listo para ayudarte a crear o modificar tu aplicación web. ¿Qué te gustaría construir hoy? Por ejemplo:

- Una página de inicio o landing page
- Un blog o portafolio
- Una app con base de datos y login de usuarios
- Una tienda online

Cuéntame tu idea y empezamos. 🚀`;

const userCampaignRequest =
  "Create a polished launch email for our new AI campaign builder. Keep it concise and make the CTA feel clear.";

const aiCampaignResponse = `Here’s a sharper direction:

**Subject:** Build campaigns faster with Madoo

Hi there,

Meet Madoo, your AI workspace for turning campaign ideas into polished email templates without starting from a blank page.

- Draft launch emails in minutes
- Adjust tone and length without rewriting
- Keep brand structure consistent across campaigns

**CTA:** Start your next campaign`;

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

function HumanMessage({ children }: { children: string }) {
  return (
    <div className="ml-auto">
      <span className="bg-madoo-bg shadow-madoo-border px-4 py-2 rounded-lg text-right">{children}</span>

      <div className="flex gap-1 my-1.5 mt-3 max-w-min ml-auto">
        <ActionButton icon={Edit02Icon} label="Edit message" />
        <ActionButton
          icon={Copy01Icon}
          label="Copy message"
          onClick={() => copyText(children)}
        />
      </div>
    </div>
  );
}

function AiMessage({ children }: { children: string }) {
  return (
    <div className="rounded mr-auto text-left">
      <Streamdown className="ai-conversation-markdown font-figtree leading-6">
        {children}
      </Streamdown>

      <div className="flex gap-1 mt-1.5">
        <ActionButton
          icon={Copy01Icon}
          label="Copy response"
          onClick={() => copyText(children)}
        />
        <ActionButton icon={ThumbsUpIcon} label="Like response" />
        <ActionButton icon={ThumbsDownIcon} label="Dislike response" />
        <ActionButton icon={RefreshIcon} label="Regenerate response" />
      </div>
    </div>
  );
}

export default function EmailTemplateProject() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="px-4 py-2">
        <Button className="px-4 py-0!" variant="ghost">
          <Image
            src={"/madoo-transparent.png"}
            alt="Madoo AI Logo"
            width={26}
            height={26}
          />
          <div className="flex gap-2 items-center">
            <span className="font-medium">Hello friends</span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowDown01Icon}
              primaryColor="currentColor"
              className="size-4 text-madoo-ink-muted"
            />
          </div>
        </Button>
      </header>

      {/* CHAT SECTION, (User messages, AI agent messages, date at the top, and so on...) */}
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4">
        {/* time */}
        <span className="text-xs text-madoo-ink-muted w-full flex justify-center">Jun 8 at 9:42 AM</span>

        {/* messages */}
        <div className="mt-8 flex flex-1 flex-col gap-8 text-sm font-figtree">
          {/* user message */}
          <HumanMessage>{userGreeting}</HumanMessage>
          {/* ai message */}
          <AiMessage>{aiGreeting}</AiMessage>
          <HumanMessage>{userCampaignRequest}</HumanMessage>
          <AiMessage>{aiCampaignResponse}</AiMessage>
        </div>

        <ClientPromptBox
          classNames={{
            root: "mt-8 w-full",
            panel: "bg-madoo-bg shadow-madoo-border",
            textarea: "min-h-19 rounded-t-2xl px-4.5 pt-[17px]",
          }}
          variant="chat"
        />
      </section>
    </main>
  )
}
