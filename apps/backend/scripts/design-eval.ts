/**
 * Design eval harness. Not part of the Nest build (tsconfig includes src only).
 * Run: npx ts-node --transpile-only scripts/design-eval.ts
 *
 * Exercises the real generation system prompt + tool loop
 * against the Anthropic API without Nest/Postgres, then compiles the emitted
 * TSX with the real ReactToHtmlService and asserts on the rendered HTML.
 */
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { STATIC_INSTRUCTION, buildFewShotText } from "../src/generation/generation.prompts";
import {
  EMIT_EMAIL_TOOL,
  FIND_IMAGES_TOOL,
  GET_DESIGN_TECHNIQUE_TOOL,
  GET_FONT_PAIRING_TOOL,
} from "../src/generation/generation.tools";
import { getDesignTechnique } from "../src/generation/design-techniques";
import { getFontPairing, renderFontPairing } from "../src/generation/font-pairings";
import { ReactToHtmlService } from "../src/generation/react-to-html.service";
import { auditContrast, formatContrastFeedback } from "../src/generation/contrast-audit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 });
const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const reactToHtml = new ReactToHtmlService();

const STUB_IMAGES = [
  { url: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg", description: "gym supplement tub on a bench" },
  { url: "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg", description: "packed shipping box on a table" },
];

async function runBrief(label: string, brief: string) {
  const systemBlocks = [
    { type: "text" as const, text: STATIC_INSTRUCTION, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: buildFewShotText(brief), cache_control: { type: "ephemeral" as const } },
  ];
  let messages: MessageParam[] = [{ role: "user", content: brief }];
  const toolsCalled: string[] = [];

  for (let turn = 0; turn < 12; turn += 1) {
    const res = await anthropic.messages.stream({
      model,
      max_tokens: 24_000,
      output_config: { effort: "high" },
      system: systemBlocks,
      tools: [GET_DESIGN_TECHNIQUE_TOOL, GET_FONT_PAIRING_TOOL, FIND_IMAGES_TOOL, EMIT_EMAIL_TOOL],
      tool_choice: { type: "auto", disable_parallel_tool_use: true },
      messages,
    } as never).finalMessage();

    const tool = (res as never as { content: { type: string; name?: string; id?: string; input?: unknown }[] })
      .content.find((b) => b.type === "tool_use");
    if (!tool) {
      console.log(`[${label}] model stopped without a tool call`);
      return { label, toolsCalled, code: null as string | null };
    }
    toolsCalled.push(tool.name!);

    if (tool.name === "emit_email") {
      const input = tool.input as { subject: string; componentCode: string; variableSchema: unknown[] };
      return { label, toolsCalled, code: input.componentCode, subject: input.subject, variableSchema: input.variableSchema };
    }

    let result: string;
    if (tool.name === "get_design_technique") {
      const t = getDesignTechnique((tool.input as { name: string }).name);
      if (!t) throw new Error(`unknown technique ${JSON.stringify(tool.input)}`);
      console.log(`[${label}]   -> get_design_technique(${t.name})`);
      result = t.doc;
    } else if (tool.name === "get_font_pairing") {
      const p = getFontPairing((tool.input as { name: string }).name);
      if (!p) throw new Error(`unknown pairing ${JSON.stringify(tool.input)}`);
      console.log(`[${label}]   -> get_font_pairing(${p.name})`);
      result = renderFontPairing(p);
    } else if (tool.name === "find_images") {
      result = JSON.stringify(STUB_IMAGES);
    } else {
      throw new Error(`unexpected tool ${tool.name}`);
    }

    messages = [
      ...messages,
      { role: "assistant", content: (res as never as { content: unknown }).content as never },
      { role: "user", content: [{ type: "tool_result", tool_use_id: tool.id!, content: result }] as never },
    ];
  }
  throw new Error("tool loop did not terminate");
}

function buildRenderVariables(schema: { name: string; default: string }[]) {
  return Object.fromEntries(schema.map((v) => [v.name, v.default]));
}

const BRIEFS: [string, string][] = [
  [
    "post-purchase",
    "Write a post-purchase thank-you email for Ironclad Supplements, a DTC protein and creatine brand. Order confirmed, shipping in 2 days. Audience: repeat gym-goers. Near the bottom, include a next-order offer block with 10% off using code NEXT10 and a shop best sellers button, plus a note that the box includes a leaflet for a free starter training program. Primary CTA is track your order.",
  ],
  [
    "flash-sale",
    "Write a flash sale email for Ironclad Supplements: 5% off the entire cart with code AC5, free US shipping on all orders. Loud, high-energy retail promo aimed at existing customers. Use a big immersive lifestyle hero photo with the headline over it and a curved edge under the hero. Primary CTA: save 5% off.",
  ],
];

async function main() {
  const results = [];
  for (const [label, brief] of BRIEFS) {
    console.log(`\n=== ${label} ===`);
    let r = await runBrief(label, brief);
    console.log(`[${label}] tools: ${r.toolsCalled.join(" -> ")}`);
    if (!r.code) continue;

    let html = "";
    let vars = buildRenderVariables((r.variableSchema ?? []) as never);
    try {
      html = reactToHtml.compile(r.code, vars);
      console.log(`[${label}] compiled OK (${html.length} bytes)`);
    } catch (err) {
      console.log(`[${label}] COMPILE FAILED: ${(err as Error).message}`);
      continue;
    }

    // Mirrors the single contrast retry in generation.service.ts.
    const findings = auditContrast(reactToHtml.compileComponent(r.code), vars);
    if (findings.length > 0) {
      console.log(`[${label}] contrast findings (${findings.length}) -> retrying:`);
      for (const f of findings) {
        console.log(`[${label}]   ${f.kind} ${f.foreground} on ${f.background} (${f.ratio.toFixed(2)}:1) "${f.sample}"`);
      }
      r = await runBrief(`${label}/retry`, `${brief}\n\n${formatContrastFeedback(findings)}`);
      if (r.code) {
        vars = buildRenderVariables((r.variableSchema ?? []) as never);
        html = reactToHtml.compile(r.code, vars);
        const after = auditContrast(reactToHtml.compileComponent(r.code), vars);
        console.log(`[${label}] after retry: ${after.length === 0 ? "CLEAN" : `${after.length} still failing`}`);
        for (const f of after) {
          console.log(`[${label}]   ${f.kind} ${f.foreground} on ${f.background} (${f.ratio.toFixed(2)}:1) "${f.sample}"`);
        }
      }
    } else {
      console.log(`[${label}] contrast: clean`);
    }

    const fontFaces = [...html.matchAll(/font-family:\s*'([^']+)'[\s\S]{0,200}?src:\s*url\(([^)]+)\)/g)];
    console.log(`[${label}] @font-face: ${fontFaces.length ? fontFaces.map((m) => `${m[1]}`).join(", ") : "none"}`);
    for (const m of fontFaces) {
      const status = await fetch(m[2], { method: "GET", headers: { Range: "bytes=0-1" } })
        .then((res) => `${res.status} ${res.headers.get("content-type")}`)
        .catch((e) => `FETCH ERROR ${(e as Error).message}`);
      console.log(`[${label}]   ${m[1]} -> ${status}  ${m[2].slice(0, 70)}`);
    }
    const arcs = [...html.matchAll(/border-radius:\s*([^;"]*(?:\/|50%\s+50%)[^;"]*)/g)];
    console.log(`[${label}] elliptical radii: ${arcs.length ? arcs.map((a) => a[1].trim()).join(" | ") : "none"}`);
    results.push({ label, html, code: r.code });
  }

  const fs = await import("node:fs");
  for (const r of results) {
    fs.writeFileSync(`/tmp/madoo-${r.label}.html`, r.html);
    fs.writeFileSync(`/tmp/madoo-${r.label}.tsx`, r.code);
  }
  console.log("\nwrote /tmp/madoo-*.html and /tmp/madoo-*.tsx");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
