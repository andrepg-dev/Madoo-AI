import { cx } from "@madoo/design-system";

type LayoutPageProps = {
  children: React.ReactNode;
  className?: string;
};

export function LayoutPage({ children, className }: LayoutPageProps) {
  return <div className={cx("min-h-full p-6", className)}>{children}</div>;
}
