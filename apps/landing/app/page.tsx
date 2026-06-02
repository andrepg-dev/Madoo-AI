
"use client";

import { useState } from "react";
import {
  Add01Icon,
  ArrowDown01Icon,
  MailLove01Icon,
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
    <section className="relative min-h-screen overflow-hidden bg-[#FAFBFD]">
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

      <div className="relative z-50 flex h-screen w-full flex-col items-center justify-center gap-9 mt-8">
        <div className="flex flex-col gap-1.5 font-figtree">
          <h3 className="text-center text-5xl font-medium leading-[0.94] tracking-normal text-[#071b38]">
            <span className="block">Artificial Intelligence</span>
            <span className="relative mt-1 inline-flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-[#0c346a] via-[#12629f] to-[#0c346a] bg-clip-text font-semibold text-transparent">
                Email Builder
              </span>
              <span className="inline-flex h-12 w-12 translate-y-0.5 items-center justify-center rounded-xl bg-white/85 text-[#0c346a] shadow-[0_10px_28px_rgba(12,52,106,0.12),inset_0_0_0_1px_rgba(12,52,106,0.12)] backdrop-blur">
                <HugeiconsIcon icon={MailLove01Icon} size={28} />
              </span>
              <svg
                viewBox="0 0 240 20"
                fill="none"
                className="pointer-events-none absolute -bottom-4 left-1/2 h-4 w-[82%] -translate-x-1/2 text-[#3ea7ff]"
                aria-hidden="true"
              >
                <path
                  d="M7 11.5C52 6.2 156 5.6 233 10.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.32"
                />
                <path
                  d="M38 14.2C91 11.3 153 11.1 202 13.6"
                  stroke="#0c346a"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.14"
                />
              </svg>
            </span>
          </h3>
          <h4 className="text-center text-lg font-light text-zinc-700 mt-1.5">Create Better Email Templates & Move Faster with AI</h4>
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
                  className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${hasPrompt ? "bg-[#0c346a] hover:bg-[#092952]" : "bg-[#7d7d7a] hover:bg-[#666663]"
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
