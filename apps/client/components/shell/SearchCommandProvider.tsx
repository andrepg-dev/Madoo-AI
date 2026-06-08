"use client";

import { useClientStore } from "@/stores/client-store";
import { useEffect } from "react";
import { SearchCommandModal } from "./SearchCommandModal";

export function SearchCommandProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchCommandOpen = useClientStore((state) => state.searchCommandOpen);
  const setSearchCommandOpen = useClientStore(
    (state) => state.setSearchCommandOpen,
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setSearchCommandOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchCommandOpen]);

  return (
    <>
      {children}
      <SearchCommandModal
        open={searchCommandOpen}
        onClose={() => setSearchCommandOpen(false)}
      />
    </>
  );
}
