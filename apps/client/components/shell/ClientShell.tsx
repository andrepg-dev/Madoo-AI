import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <Sidebar />
      <main style={{ minWidth: 0, overflow: "auto", padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
