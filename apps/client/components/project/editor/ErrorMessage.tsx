export function ErrorMessage({ children }: { children: string }) {
  return (
    <div className="mr-auto max-w-xl rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow-madoo-border">
      {children}
    </div>
  );
}
