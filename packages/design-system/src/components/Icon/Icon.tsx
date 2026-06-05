import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BarChartIcon,
  BoltIcon,
  Cancel01Icon,
  Copy01Icon,
  Download01Icon,
  Edit02Icon,
  Folder01Icon,
  GridIcon,
  Home01Icon,
  Image01Icon,
  InboxIcon,
  LockIcon,
  Logout01Icon,
  Notification01Icon,
  RefreshIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  Tick02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import type { SVGProps } from "react";

export type IconName =
  | "sparkle"
  | "arrow"
  | "arrowUp"
  | "plus"
  | "search"
  | "lock"
  | "check"
  | "chevron"
  | "chevronDown"
  | "home"
  | "grid"
  | "folder"
  | "bolt"
  | "settings"
  | "edit"
  | "copy"
  | "download"
  | "send"
  | "refresh"
  | "image"
  | "star"
  | "x"
  | "sliders"
  | "inbox"
  | "bell"
  | "logOut"
  | "barChart"
  | "user";

const ICONS: Record<IconName, IconSvgElement> = {
  sparkle: SparklesIcon,
  arrow: ArrowRight01Icon,
  arrowUp: ArrowUp01Icon,
  plus: Add01Icon,
  search: Search01Icon,
  lock: LockIcon,
  check: Tick02Icon,
  chevron: ArrowRight01Icon,
  chevronDown: ArrowDown01Icon,
  home: Home01Icon,
  grid: GridIcon,
  folder: Folder01Icon,
  bolt: BoltIcon,
  settings: Settings01Icon,
  edit: Edit02Icon,
  copy: Copy01Icon,
  download: Download01Icon,
  send: SentIcon,
  refresh: RefreshIcon,
  image: Image01Icon,
  star: StarIcon,
  x: Cancel01Icon,
  sliders: SlidersHorizontalIcon,
  inbox: InboxIcon,
  bell: Notification01Icon,
  logOut: Logout01Icon,
  barChart: BarChartIcon,
  user: UserIcon,
};

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
} & Omit<SVGProps<SVGSVGElement>, "stroke" | "strokeWidth">;

export function Icon({ name, size = 16, stroke = 1.6, ...rest }: IconProps) {
  return (
    <HugeiconsIcon
      icon={ICONS[name]}
      size={size}
      strokeWidth={stroke}
      primaryColor="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
}
