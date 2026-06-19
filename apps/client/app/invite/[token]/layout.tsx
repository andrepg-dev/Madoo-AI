import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Invite",
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
