"use client"

import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import {
  ArrowDown01Icon,
  ArrowDown02Icon,
  Copy01Icon,
  Edit02Icon,
  RefreshIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button } from "@madoo/design-system";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const messagesRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const messages = messagesRef.current;

    if (!messages) return;

    setCanScrollDown(
      messages.scrollTop + messages.clientHeight < messages.scrollHeight - 24,
    );
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToBottom = () => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-white">
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
      <section className="flex min-h-0 w-full flex-1 flex-col pb-4">
        {/* messages */}
        <div
          ref={messagesRef}
          className="madoo-chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-4 text-sm font-figtree pb-48"
          onScroll={updateScrollState}
        >
          <div className="mx-auto w-full max-w-3xl px-4">
            {/* time */}
            <span className="text-xs text-madoo-ink-muted flex w-full justify-center">Jun 8 at 9:42 AM</span>

            <div className="mt-8 flex flex-col gap-8">
              {/* user message */}
              <HumanMessage>{userGreeting}</HumanMessage>
              {/* ai message */}
              <AiMessage>{aiGreeting}</AiMessage>
              <HumanMessage>{userCampaignRequest}</HumanMessage>
              <AiMessage>{aiCampaignResponse}</AiMessage>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-3xl shrink-0 px-4">
          <div className="pointer-events-none absolute inset-x-0 -top-4 h-4 bg-gradient-to-b from-white/0 via-white/80 to-white" />
          {canScrollDown ? (
            <Button
              aria-label="Scroll to latest message"
              className="absolute left-1/2 top-0 z-10 h-9 w-9 -translate-x-1/2 translate-y-[-150%] shadow-madoo-border rounded-full bg-white text-madoo-ink hover:bg-madoo-bg"
              onClick={scrollToBottom}
              size="sm"
              variant="icon"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowDown02Icon}
                primaryColor="currentColor"
                size={18}
                strokeWidth={1.6}
              />
            </Button>
          ) : null}
          <ClientPromptBox
            classNames={{
              root: "w-full",
              panel: "bg-madoo-bg shadow-madoo-border",
              textarea: "min-h-19 rounded-t-2xl px-4.5 pt-[17px]",
            }}
            variant="chat"
          />
        </div>
      </section>
    </main>
  )
}
