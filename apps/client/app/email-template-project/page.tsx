"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@madoo/design-system";
import Image from "next/image";

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
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-madoo-ink-muted" />
          </div>
        </Button>
      </header>

      {/* CHAT SECTION, (User messages, AI agent messages, date at the top, and so on...) */}
      <section className="max-w-4xl h-full mx-auto">
        {/* time */}
        <span className="text-xs text-madoo-ink-muted w-full flex justify-center">Jun 8 at 9:42 AM</span>

        {/* messages */}
        <div className="flex flex-col text-sm">
          {/* user message */}
          <div className="rounded-xl ml-auto text-right bg-madoo-bg-2 px-4 py-1.5">
            Hi madoo, how are you?
          </div>
          {/* ai message */}
          <div className="rounded mr-auto text-left">Hi</div>
        </div>
      </section>
    </main>
  )
}
