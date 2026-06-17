import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function HeaderMenuIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      icon={icon}
      primaryColor="currentColor"
      size={16}
      strokeWidth={1.55}
    />
  );
}
