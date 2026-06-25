import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-[#FDFDFF] md:grid md:grid-cols-[auto_minmax(0,1fr)] md:overflow-hidden">
      <Sidebar />
      {/* md:contents dissolves this wrapper into the grid so <main> becomes the
          second column on desktop, while on mobile it stacks the top bar + main. */}
      <div className="flex h-dvh flex-col md:contents">
        <MobileTopBar />
        <main className="min-w-0 flex-1 overflow-auto md:m-1 md:mb-0 md:rounded-t-lg">
          {children}
        </main>
      </div>
      <FeedbackWidget />
    </div>
  );
}
