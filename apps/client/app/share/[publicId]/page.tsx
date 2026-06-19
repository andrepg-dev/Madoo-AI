import { fetchPublicEmail } from "@/actions/emails";
import { DeviceFramePreview } from "@/components/project/preview/DeviceFramePreview";
import type { PublicEmailDto } from "@madoo/shared";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";

export const dynamic = "force-dynamic";

const loadPublicEmail = cache(async function loadPublicEmail(
  publicId: string,
): Promise<PublicEmailDto | null> {
  try {
    return await fetchPublicEmail(publicId);
  } catch {
    return null;
  }
});

type SharedEmailPageProps = {
  params: Promise<{ publicId: string }>;
};

export async function generateMetadata({
  params,
}: SharedEmailPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const email = await loadPublicEmail(publicId);

  return {
    title: email?.title ?? email?.subject ?? "Shared Email",
  };
}

export default async function SharedEmailPage({
  params,
}: SharedEmailPageProps) {
  const { publicId } = await params;
  const email = await loadPublicEmail(publicId);

  if (!email) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b0c0f] px-6 text-center">
        <div className="grid max-w-sm gap-3">
          <Image
            alt="Madoo"
            className="mx-auto"
            height={40}
            src="/madoo-transparent.png"
            width={40}
          />
          <h1 className="text-lg font-semibold text-white">
            This link isn’t available
          </h1>
          <p className="text-sm text-white/60">
            The shared email was made private or no longer exists. Ask the owner
            for an up-to-date link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-[#0b0c0f]">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 text-white">
          <Image
            alt="Madoo"
            height={24}
            src="/madoo-transparent.png"
            width={24}
          />
          <span className="truncate text-sm font-medium">
            {email.title ?? email.subject}
          </span>
        </div>
        <Link
          className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white px-3.5 text-xs font-medium text-[#101114] transition hover:bg-white/90"
          href="/"
        >
          Make yours with Madoo
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 px-4 pb-6 sm:px-6">
        <DeviceFramePreview srcDoc={email.compiledHtml} subject={email.subject} />
      </div>
    </main>
  );
}
