
import {
  Add01Icon,
  ArrowDown01Icon,
  Menu01Icon,
  Mic02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const promptOptions: Array<{ label: string; value?: string }> = [
  { label: "Tone" },
  { label: "Length" },
  { label: "Audience" },
]

export default function HomePage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f8fafb]">
      {/* 
      <img
        src={"/madoo-blur.svg"}
        className="fixed bottom-[-420px] left-1/2 z-10 h-[150vh]  -translate-x-1/3 object-fill"
      /> */}

      <img
        src="/background-3.svg"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-left-bottom opacity-70"
        alt=""
        aria-hidden="true"
      />

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
          <h3 className="text-5xl text-[#0c336a] text-center">Artificial Intelligence <br /> Email Builder</h3>
          <h4 className="text-lg text-zinc-800 text-center font-light">Create Better Email Templates & Move Faster with AI</h4>
        </div>

        <div className="flex flex-col gap-4">
          <div className="min-w-[700px] rounded-3xl bg-white shadow-[inset_0_0_0_0.5px_#b8d2e4]">
            <textarea
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
                  className="inline-flex h-8 text-xs px-4 cursor-pointer items-center justify-center rounded-full bg-[#7d7d7a] text-white transition hover:bg-[#666663]"
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
            <div className="flex gap-4">
                  
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
