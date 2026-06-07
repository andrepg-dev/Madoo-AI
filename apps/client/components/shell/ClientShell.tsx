import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[100dvh] grid-cols-[auto_minmax(0,1fr)] overflow-hidden bg-[#FDFDFF]">
      <Sidebar />
      <main className="min-w-0 overflow-auto rounded-t-lg m-1 mb-0">{children}</main>
    </div>
  );
}
