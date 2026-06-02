
import {
  ArrowDown01Icon,
  Menu01Icon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function HomePage() {
  return (
    <section className="min-h-screen bg-[#f3faff]">
      <header>
        <div className="flex h-16 items-center justify-between px-4 sm:px-8 xl:px-48">
          <div className="flex gap-16">
            <a className="flex items-center gap-2.5" href="/" aria-label="Madoo AI home">
              <img
                className="h-8 w-8 object-contain"
                src="/madoo-transparent.png"
                alt=""
                aria-hidden="true"
              />
              <span className="text-xl leading-none tracking-normal text-[#2b3037] font-medium">
                Madoo AI
              </span>
            </a>

            <nav
              className="hidden items-center gap-8 text-[15px] text-[#23272f] lg:flex"
              aria-label="Primary navigation"
            >
              <a className="inline-flex items-center gap-2" href="#solutions">
                Solutions
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={15}
                  strokeWidth={2}
                  className="text-[#687382]"
                  aria-hidden="true"
                />
              </a>
              <a className="inline-flex items-center gap-2" href="#resources">
                Resources
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={15}
                  strokeWidth={2}
                  className="text-[#687382]"
                  aria-hidden="true"
                />
              </a>
              <a href="#community">Community</a>
              <a href="#pricing">Pricing</a>
            </nav>
          </div>

          <div className="flex gap-1.5">
            <a
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm leading-none text-[#101114] transition sm:inline-flex border border-zinc-400"
              href="mailto:hello@madoo.ai"
            >
              Login
            </a>

            <a
              className="hidden items-center gap-2 rounded-lg bg-[#101114] px-4 py-2 text-sm leading-none text-white transition hover:bg-[#26282d] sm:inline-flex"
              href="mailto:hello@madoo.ai"
            >
              Get started
            </a>
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#c8ddec] text-[#23272f] sm:hidden"
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
    </section>
  )
}
