
"use client";

import { useState } from "react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Menu01Icon,
  Mic02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Grainient from "../components/Grainient";

const promptOptions: Array<{ label: string; value?: string }> = [
  { label: "Tone" },
  { label: "Length" },
  { label: "Audience" },
]

const exportProviders = [
  {
    name: "Mailchimp",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    name: "Klaviyo",
    iconSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    name: "HubSpot",
    iconSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    name: "Brevo",
    iconSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    name: "MailerLite",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
  },
  {
    name: "ConvertKit",
    iconSrc: "https://www.google.com/s2/favicons?domain=convertkit.com&sz=64",
  },
  {
    name: "ActiveCampaign",
    iconSrc: "https://www.google.com/s2/favicons?domain=activecampaign.com&sz=64",
  },
  {
    name: "Customer.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=customer.io&sz=64",
  },
  {
    name: "Braze",
    iconSrc: "https://www.google.com/s2/favicons?domain=braze.com&sz=64",
  },
  {
    name: "Marketo",
    iconSrc: "https://www.google.com/s2/favicons?domain=marketo.com&sz=64",
  },
  {
    name: "Salesforce",
    iconSrc: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=64",
  },
]

const movingExportProviders = Array.from({ length: 4 }, () => exportProviders).flat()

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const hasPrompt = prompt.trim().length > 0;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f8fafb]">
      {/* 
      <img
        src={"/madoo-blur.svg"}
        className="fixed bottom-[-420px] left-1/2 z-10 h-[150vh]  -translate-x-1/3 object-fill"
      /> */}

      <header className="absolute top-0 left-0 right-0 z-[100] pointer-events-auto ">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8 xl:px-48">
          <div className="flex gap-16">
            <a className="flex cursor-pointer items-center gap-2.5" href="/" aria-label="Madoo AI home">
              <img
                className="h-7 w-7 object-contain"
                src="/madoo-transparent.png"
                alt=""
                aria-hidden="true"
              />
              <span className="leading-none tracking-normal text-[#2b3037] font-medium">
                Madoo AI
              </span>
            </a>

            <nav
              className="hidden items-center gap-8 text-sm text-[#23272f] lg:flex"
              aria-label="Primary navigation"
            >
              <a className="inline-flex cursor-pointer items-center gap-2" href="#solutions">
                Solutions
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={13}
                  strokeWidth={2.4}
                  className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                  aria-hidden="true"

                />
              </a>
              <a className="inline-flex cursor-pointer items-center gap-2" href="#resources">
                Resources
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={13}
                  strokeWidth={2.4}
                  className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                  aria-hidden="true"
                />
              </a>
              <a className="cursor-pointer" href="#community">Community</a>
              <a className="cursor-pointer" href="#pricing">Pricing</a>
            </nav>
          </div>

          <div className="flex gap-1.5">
            <a
              className="hidden cursor-pointer items-center gap-2 rounded-lg px-3 py-2 bg-white text-sm leading-none text-[#101114] shadow-[inset_0_0_0_0.5px_#b8d2e4] transition hover:bg-[#f3faff] sm:inline-flex"
              href="mailto:hello@madoo.ai"
            >
              Login
            </a>

            <a
              className="hidden cursor-pointer items-center gap-2 rounded-lg bg-[#101114] px-4 py-2 text-sm leading-none text-white transition hover:bg-[#26282d] sm:inline-flex"
              href="mailto:hello@madoo.ai"
            >
              Get started
            </a>
          </div>

          <button
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#c8ddec] text-[#23272f] sm:hidden"
            type="button"
            aria-label="Open navigation"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              size={21}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <div className="relative z-50 flex h-screen w-full flex-col items-center justify-center gap-9">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-center text-5xl text-[#000000]">
            <span className="inline-flex items-start justify-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="mt-1 h-7 w-7 text-[#0c346a]"
                aria-hidden="true"
              >
                <path
                  d="M9.35 5.5c-2.9 1.7-4.35 4.05-4.35 7.05v5.95h6.25v-6.25H8.1c.08-1.68.98-3.08 2.7-4.2L9.35 5.5Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M18.55 5.5c-2.9 1.7-4.35 4.05-4.35 7.05v5.95h6.25v-6.25H17.3c.08-1.68.98-3.08 2.7-4.2L18.55 5.5Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
              <span>Artificial Intelligence</span>
            </span>
            <br />
            <span className="inline-flex items-center justify-center gap-3">
              Email Builder
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[#0c346a] shadow-[0_10px_28px_rgba(12,52,106,0.12),inset_0_0_0_1px_rgba(12,52,106,0.12)] backdrop-blur">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7.25c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v9.5c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-9.5Z"
                    fill="#edf6ff"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m6.25 7.35 5.32 4.43c.28.23.58.35.93.35s.65-.12.93-.35l5.32-4.43"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9.35 11.55-3.1 3.35m8.4-3.35 3.1 3.35"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17.9 4.65v1.8m.9-.9h-1.8"
                    stroke="#3ea7ff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7 text-[#0c346a]"
                aria-hidden="true"
              >
                <path
                  d="M5.45 18.5c2.9-1.7 4.35-4.05 4.35-7.05V5.5H3.55v6.25H6.7c-.08 1.68-.98 3.08-2.7 4.2l1.45 2.55Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M14.65 18.5c2.9-1.7 4.35-4.05 4.35-7.05V5.5h-6.25v6.25h3.15c-.08 1.68-.98 3.08-2.7 4.2l1.45 2.55Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
            </span>
          </h3>
          <h4 className="text-lg text-zinc-700 text-center font-light">Create Better Email Templates & Move Faster with AI</h4>
        </div>

        <div className="flex flex-col gap-4">
          <div className="min-w-[700px] rounded-3xl bg-white shadow-[inset_0_0_0_0.5px_#b8d2e4]">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Hi Madoo, can you create an email template for my AWS Summer Event? Check this link.com for more information"
              className="min-h-24 w-full resize-none rounded-t-3xl bg-transparent px-5 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
            />

            <div className="flex items-center justify-between px-3.5 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]"
                  aria-label="Add attachment"
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1} aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1.5">
                  {promptOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-zinc-600 transition"
                    >
                      <span>{option.label}</span>
                      {option.value ? (
                        <>
                          <span className="text-[#928a80]">:</span>
                          <span className="font-medium text-[#1f1d1a]">{option.value}</span>
                        </>
                      ) : null}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={10}
                        strokeWidth={2.2}
                        className="text-zinc-600 [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]"
                  aria-label="Use microphone"
                >
                  <HugeiconsIcon icon={Mic02Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${
                    hasPrompt ? "bg-[#0c346a] hover:bg-[#092952]" : "bg-[#7d7d7a] hover:bg-[#666663]"
                  }`}
                  aria-label="Submit prompt"
                >
                  Generate email
                  {/* <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={2} aria-hidden="true" /> */}
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm">
            <h6 className="font-light text-zinc-800 text-xs">Export to any provider of you choise</h6>
            <div className="mt-3 w-[700px] overflow-hidden">
              <div className="madoo-provider-marquee flex w-max gap-3">
                {movingExportProviders.map((provider, index) => (
                  <div
                    key={`${provider.name}-${index}`}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 pr-4"
                  >
                    <img
                      src={provider.iconSrc}
                      alt={`${provider.name} logo`}
                      className="h-6 w-6 object-contain"
                      loading="lazy"
                    />
                    <span className="whitespace-nowrap text-xs font-medium text-[#1f2937]">{provider.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
