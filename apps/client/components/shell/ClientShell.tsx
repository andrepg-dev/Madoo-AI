import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[100dvh] grid-cols-[auto_minmax(0,1fr)] overflow-hidden bg-madoo-bg">
      <Sidebar />
      <main className="min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
