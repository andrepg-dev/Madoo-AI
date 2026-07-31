import { config, requireServiceToken } from "./config.js";

/** Shape returned by the backend anonymous generate endpoint. */
export interface AnonGenerateResult {
  publicId: string;
  /** Fully-qualified public preview URL a client can open in a browser. */
  previewUrl: string;
  /** Edit CTA — client /share page for this email, with a path into the editor. */
  ctaUrl: string;
  /** Optional rendered subject line for display. */
  subject?: string;
  /** Pass back on the next call to keep the same free allowance. */
  continuationToken: string;
  /** Free generations left in this conversation. */
  freeRemaining: number;
  /** Where to send the user to create a free Madoo account. */
  signInUrl: string;
}

/** Free allowance spent — the user has to sign in to keep going. */
export interface AnonGenerateGate {
  requiresSignIn: true;
  message: string;
  signInUrl: string;
}

export type AnonGenerateResponse = AnonGenerateResult | AnonGenerateGate;

export function isGate(res: AnonGenerateResponse): res is AnonGenerateGate {
  return "requiresSignIn" in res;
}

export interface PublicTemplate {
  id: string;
  name: string;
  description?: string | null;
}

/** Thin client over the Madoo public backend surface. No user auth — service token only. */
export class MadooClient {
  private base = config.madooApiUrl;

  async generateAnonymous(input: {
    brief: string;
    brandName?: string;
    brandUrl?: string;
    continuationToken?: string;
  }): Promise<AnonGenerateResponse> {
    const res = await fetch(`${this.base}/public/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-madoo-service-token": requireServiceToken(),
      },
      body: JSON.stringify(input),
    });
    // 402 is the sign-in gate, not a failure: the free allowance for this
    // conversation is spent and the user should continue in Madoo.
    if (res.status === 402) {
      const gate = (await res.json()) as { message?: string; signInUrl?: string };
      return {
        requiresSignIn: true,
        message: gate.message ?? "Free limit reached — create a free Madoo account to keep generating.",
        signInUrl: gate.signInUrl ?? config.madooWebUrl,
      };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Madoo generate failed (${res.status}): ${text.slice(0, 300)}`);
    }
    return (await res.json()) as AnonGenerateResult;
  }

  async listTemplates(): Promise<PublicTemplate[]> {
    // Public template gallery — no auth required on the backend.
    const res = await fetch(`${this.base}/public/community-templates`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Madoo templates failed (${res.status}): ${text.slice(0, 300)}`);
    }
    return (await res.json()) as PublicTemplate[];
  }
}

export const madoo = new MadooClient();
