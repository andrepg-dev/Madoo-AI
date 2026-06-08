"use client"

import {
  ArrowDown01Icon,
  Copy01Icon,
  Download01Icon,
  Edit02Icon,
  RefreshIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button } from "@madoo/design-system";
import Image from "next/image";

function ActionButton({
  icon,
  label,
}: {
  icon: IconSvgElement;
  label: string;
}) {
  return (
    <Button
      aria-label={label}
      className="h-6 w-6 rounded-md"
      title={label}
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

export default function EmailTemplateProject() {
  return (
    <main>
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
      <section className="max-w-3xl h-full mx-auto">
        {/* time */}
        <span className="text-xs text-madoo-ink-muted w-full flex justify-center">Jun 8 at 9:42 AM</span>

        {/* messages */}
        <div className="flex flex-col text-sm font-figtree mt-8">
          {/* user message */}
          <div className="ml-auto">
            <span className="bg-madoo-bg-2 px-4 py-2 rounded-xl text-right">Hi madoo, how are you?</span>

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
      </section>
    </main>
  )
}
