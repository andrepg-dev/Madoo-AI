"use client";

import { Button, Icon, useToast } from "@madoo/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TemplateSlug } from "@madoo/shared";
import { templatesApi } from "@/actions/templates";
import { billingApi, billingKeys } from "@/actions/billing";
import { useCreateEmailFromTemplate } from "@/hooks/use-emails";

type Props = {
  slug: TemplateSlug;
  prompt: string;
  tone: string;
  length: string;
  audience: string;
  onBack: () => void;
};

export function TemplatePreviewScreen({ slug, prompt, tone, length, audience, onBack }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [previewHeight, setPreviewHeight] = useState<number>(640);
  const observerRef = useRef<ResizeObserver | null>(null);

  const previewQuery = useQuery({
    queryKey: ["template-seed-preview", slug],
    queryFn: () => templatesApi.previewSeed(slug),
    staleTime: 60_000,
  });

  const billingQuery = useQuery({
    queryKey: billingKeys.overview(),
    queryFn: billingApi.overview,
    staleTime: 30_000,
  });
  const genUsed = billingQuery.data?.usage.aiGenerations.used ?? 0;
  const genLimit = billingQuery.data?.usage.aiGenerations.limit ?? -1;
  const isAtGenerationLimit = genLimit !== -1 && genUsed >= genLimit;

  const saveMutation = useCreateEmailFromTemplate();

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const bindAutoHeight = (frame: HTMLIFrameElement) => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const resize = () => {
        const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
        if (h > 0) setPreviewHeight(h + 2);
      };
      resize();
      observerRef.current?.disconnect();
      observerRef.current = new ResizeObserver(resize);
      if (doc.body) observerRef.current.observe(doc.body);
    } catch {
      /* ignore cross-origin */
    }
  };

  if (previewQuery.isLoading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-soft)" }}>Loading template…</p>
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "var(--ink-soft)" }}>Could not load template.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
      </div>
    );
  }

  const seed = previewQuery.data;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            height: 52,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
            background: "var(--surface)",
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            leftIcon={
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
                <Icon name="arrow" size={12} />
              </span>
            }
          >
            Back
          </Button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{seed.name}</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: isAtGenerationLimit ? "var(--danger, #c0392b)" : "var(--ink-faint)",
              }}
            >
              <Icon name="bolt" size={11} /> {isAtGenerationLimit ? "No credits left" : "1 credit"}
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="check" size={12} />}
              disabled={saveMutation.isPending}
              onClick={() => {
                if (isAtGenerationLimit) {
                  toast({
                    tone: "danger",
                    title: "No AI credits left",
                    body: "You've reached your monthly AI credit limit. Upgrade your plan to save more templates.",
                  });
                  return;
                }
                saveMutation.mutate(
                  { templateSlug: slug, prompt, tone, length, audience },
                  {
                    onSuccess: (email) => {
                      void qc.invalidateQueries({ queryKey: billingKeys.overview() });
                      router.push(`/campaigns?compose=1&emailId=${encodeURIComponent(email.id)}`);
                    },
                    onError: (err) =>
                      toast({
                        tone: "danger",
                        title: "Cannot save template",
                        body: err instanceof Error ? err.message : "Something went wrong.",
                      }),
                  },
                );
              }}
            >
              {saveMutation.isPending ? "Saving…" : "Save template"}
            </Button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "32px 24px 60px",
            background: "var(--bg-2)",
          }}
        >
          <iframe
            title="Template preview"
            onLoad={(e) => bindAutoHeight(e.currentTarget)}
            srcDoc={seed.compiledHtml}
            sandbox="allow-same-origin"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 640,
              height: previewHeight,
              margin: "0 auto",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "#fff",
              overflow: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  );
}
