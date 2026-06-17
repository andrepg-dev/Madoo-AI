
export function StatusMessage({ children }: { children: string }) {
  return (
    <div className="mr-auto max-w-xl rounded-lg bg-madoo-surface-2 px-3 py-2 text-xs text-madoo-ink-muted shadow-madoo-border">
      {children}
    </div>
  );
}
