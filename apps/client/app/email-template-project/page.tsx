"use client"

import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import {
  ArrowDown01Icon,
  Copy01Icon,
  Download01Icon,
  Edit02Icon,
  RefreshIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, Tooltip } from "@madoo/design-system";
import Image from "next/image";

function ActionButton({
  icon,
  label,
}: {
  icon: IconSvgElement;
  label: string;
}) {
  return (
    <Tooltip content={label} side="top" tone="light">
      <Button
        aria-label={label}
        className="h-6 w-6 rounded-md"
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

export default function EmailTemplateProject() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="px-4 py-2">
        <Button className="px-4 py-0!" variant="ghost">
          <Image
            src={"/madoo-transparent.png"}
            alt="Madoo AI Logo"
            width={30}
            height={30}
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
        <div className="mt-8 flex flex-1 flex-col text-sm font-figtree">
          {/* user message */}
          <div className="ml-auto">
            <span className="bg-madoo-bg shadow-madoo-border px-4 py-2 rounded-lg text-right">Hi madoo, how are you?</span>

            <div className="flex gap-1 my-1.5 mt-3 max-w-min ml-auto">
              <ActionButton icon={Edit02Icon} label="Editar mensaje" />
              <ActionButton icon={Copy01Icon} label="Copiar mensaje" />
            </div>
          </div>
          {/* ai message */}
          <div className="rounded mr-auto text-left">
            <pre className="font-figtree whitespace-pre-wrap leading-6">
              {`¡Hola! Todo bien por aquí, ¿y tú? 😊

Estoy listo para ayudarte a crear o modificar tu aplicación web. ¿Qué te gustaría construir hoy? Por ejemplo:

- Una página de inicio o landing page
- Un blog o portafolio
- Una app con base de datos y login de usuarios
- Una tienda online

Cuéntame tu idea y empezamos. 🚀`}
            </pre>

            <div className="flex gap-1 mt-1.5">
              <ActionButton icon={Copy01Icon} label="Copiar respuesta" />
              <ActionButton icon={RefreshIcon} label="Regenerar respuesta" />
              <ActionButton icon={SparklesIcon} label="Mejorar respuesta" />
              <ActionButton icon={Download01Icon} label="Descargar respuesta" />
            </div>
          </div>
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
