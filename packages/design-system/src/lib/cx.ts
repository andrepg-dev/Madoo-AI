/**
 * Pequeño helper para concatenar `className`s de manera segura.
 * No depende de `clsx` para mantener el paquete sin runtime extra.
 */
export type CxValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>;

export function cx(...values: CxValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      continue;
    }
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) out.push(key);
    }
  }
  return out.join(" ");
}
