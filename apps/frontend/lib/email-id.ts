/** Short label for displaying CUID/email ids without eating the toolbar. */
export function shortEmailId(id: string): string {
  if (!id || id.length <= 12) return id;
  return `${id.slice(0, 4)}…${id.slice(-6)}`;
}
