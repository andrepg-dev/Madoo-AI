"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type LandingButtonVariant = "primary" | "secondary";

type LandingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: LandingButtonVariant;
};

const variantClasses: Record<LandingButtonVariant, string> = {
  primary: "bg-[#101114] px-4 text-white hover:bg-[#26282d]",
  secondary:
    "madoo-paper-border madoo-paper-border-hover bg-white px-3 text-[#101114] hover:bg-[#f3faff]",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LandingButton({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: LandingButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg py-2 text-sm leading-none transition",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
