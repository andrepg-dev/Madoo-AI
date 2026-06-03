
"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  GlobalSearchIcon,
  Menu01Icon,
  Mic02Icon,
  PenTool03Icon,
  SparklesIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import AuthDialog from "../components/AuthDialog";
import ArrowUpComponent from "../components/arrow-up-component";
import { LandingButton } from "../components/LandingButton";

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

const templateCards = [
  {
    name: "Big news: We've been backed by Y Combinator 🚀",
    description: "Bold startup funding announcement.",
    date: "5/25/2026, 3:46:32 PM",
    imageSrc: "/templates/ycombinator.png",
  },
  {
    name: "Tu próximo hogar está a un clic — Hopta",
    description: "Clean real estate offer in Spanish.",
    imageSrc: "/templates/hopta-preview.png",
  },
  {
    name: "40% off everything — no exceptions",
    description: "High-contrast Black Friday promo.",
    imageSrc: "/templates/black-friday.png",
  },
  {
    name: "Beautiful emails, built in seconds — Madoo AI",
    description: "Editorial product update layout.",
    imageSrc: "/templates/news-letter-2.png",
  },
  {
    name: "We're officially backed by Y Combinator — here's what's next",
    description: "Investor-backed milestone note.",
    imageSrc: "/templates/black-friday-2.png",
  },
  {
    name: "We just shipped something big 🚀",
    description: "Dark invite-style product launch.",
    imageSrc: "/templates/letter.png",
  },
  {
    name: "Big ideas. Short sentences. Zero fluff.",
    description: "Minimal long-form newsletter.",
    date: "5/15/2026, 10:24:02 AM",
    imageSrc: "/templates/news-letter.png",
  },
]

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const hasPrompt = prompt.trim().length > 0;

  const openAuthDialog = () => setAuthDialogOpen(true);
  const closeAuthDialog = () => setAuthDialogOpen(false);

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      openAuthDialog();
    }
  };

  useEffect(() => {
    const textarea = promptTextareaRef.current;
    if (!textarea) return;

    const maxHeight = 320;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [prompt]);

  return (
    <>
      <AuthDialog open={authDialogOpen} onClose={closeAuthDialog} />

      <main className="relative min-h-screen w-full bg-[#fbfaf6]">
        <div className="madoo-paper-background pointer-events-none absolute inset-0 z-0" aria-hidden="true" />


        <header className="absolute top-0 left-0 right-0 z-[100] pointer-events-auto backdrop-blur-sm">
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
              <LandingButton variant="secondary" className="hidden sm:inline-flex" onClick={openAuthDialog}>
                Login
              </LandingButton>

              <LandingButton className="hidden sm:inline-flex" onClick={openAuthDialog}>
                Get started
              </LandingButton>
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

        <div className="madoo-paper-section madoo-paper-hero relative z-50 flex h-screen w-full flex-col items-center justify-center gap-9 font-ibm-plex-sans">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-center text-5xl font-medium leading-[0.94] tracking-normal text-[#071b38]">
              <span className="block text-zinc-700">Artific<span className="rotate-45 relative ">ia</span>l Intelligence</span>
              <span className="relative mt-1 inline-flex items-center justify-center">
                <span className="bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] via-[#2563eb] via-[#0284c7] to-[#1d4ed8] bg-clip-text font-semibold text-transparent">
                  Email Builder
                </span>
                <span className="madoo-gradient-icon relative inline-flex h-12 w-12 translate-y-0.5 items-center justify-center">
                  <svg width="0" height="0" aria-hidden="true" focusable="false">
                    <defs>
                      <linearGradient id="madoo-pen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6d28d9" />
                        <stop offset="30%" stopColor="#7c3aed" />
                        <stop offset="58%" stopColor="#2563eb" />
                        <stop offset="78%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <HugeiconsIcon icon={PenTool03Icon} size={28} className="text-[#0c346a]" />
                  <span
                    className="pointer-events-none absolute -right-1 top-0 inline-flex h-5 w-5 items-center justify-center text-[#0c346a]"
                    aria-hidden="true"
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={1.8} />
                  </span>
                  <span
                    className="pointer-events-none absolute right-3 top-1 inline-flex h-2 w-2 rounded-full bg-[#F9F9FA]"
                    aria-hidden="true"
                  />
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
            <h4 className="text-center text-lg font-light text-zinc-700 mt-1.5">
              Create better email templates and move faster with AI
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            <div className="madoo-paper-border min-w-[700px] overflow-hidden rounded-3xl bg-white">
              <textarea
                ref={promptTextareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={onPromptKeyDown}
                placeholder="Hi Madoo, can you create an email template for my AWS Summit event? Please check this link for more information: link.com"
                className="madoo-prompt-textarea mr-3 max-h-80 min-h-24 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
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
                    onClick={openAuthDialog}
                    className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${hasPrompt ? "bg-black" : "bg-[#7d7d7a] hover:bg-[#666663]"
                      }`}
                    aria-label="Submit prompt"
                  >
                    Generate email
                    <ArrowUpComponent className="ml-2 h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs underline decoration-1 decoration-dashed text-center text-zinc-400 cursor-pointer hover:text-zinc-950 hover:decoration-wavy transition-all">Explore templates examples</p>

            <div className="text-sm mt-7">
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

        <section className="madoo-paper-section madoo-paper-templates relative z-10 w-full px-4 py-24 sm:px-8 xl:px-0">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex w-full flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-5xl font-ibm-plex-sans font-semibold">Explore templates</h2>


                
                <h4 className="mt-3 max-w-xl text-zinc-600 font-ibm-plex-sans">
                  Start from 50+ community-tested email templates, then customize copy, layout, tone, and audience with AI.
                </h4>
              </div>

              <LandingButton variant="secondary" className="h-8 px-4" onClick={openAuthDialog}>
                <HugeiconsIcon icon={GlobalSearchIcon} size={16} />
                Explore all templates
              </LandingButton>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {templateCards.map((template) => (
                <article
                  key={template.name}
                  className="madoo-paper-border madoo-paper-border-hover group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white transition"
                >
                  <div className="relative h-[170px] overflow-hidden bg-[#f8f7f2]">
                    <img
                      src={template.imageSrc}
                      alt={`${template.name} email template preview`}
                      className="h-full w-full object-cover object-top brightness-[1.06] contrast-[1.03] saturate-[1.04]"
                      loading="lazy"
                    />
                  </div>

                  <div className="border-t border-[rgba(17,24,39,0.14)] px-3.5 py-3">
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1b1a18]">{template.name}</h3>
                    <p className="mt-1 line-clamp-1 text-[12px] leading-4 text-[#6f6961]">{template.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
