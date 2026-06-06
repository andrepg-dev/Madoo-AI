/**
 * @madoo/design-system — entry point.
 *
 * Re-exporta todos los componentes y tipos. Las apps pueden importar
 * por componente individual o desde la raiz:
 *
 *   import { Button, Input, Modal } from "@madoo/design-system";
 *
 * Recuerda importar tokens y Tailwind entry:
 *
 *   import "@madoo/design-system/tokens.css";
 *   import "@madoo/design-system/tailwind.css";
 */

export * from "./components/Avatar";
export * from "./components/Badge";
export * from "./components/Banner";
export * from "./components/Button";
export * from "./components/Card";
export * from "./components/Checkbox";
export * from "./components/Dropdown";
export * from "./components/GroupButtons";
export * from "./components/Icon";
export * from "./components/IconButton";
export * from "./components/Input";
export * from "./components/Kbd";
export * from "./components/Modal";
export * from "./components/ProgressBar";
export * from "./components/SegmentedControl";
export * from "./components/Select";
export * from "./components/Skeleton";
export * from "./components/Spinner";
export * from "./components/SuggestionChip";
export * from "./components/Tag";
export * from "./components/Textarea";
export * from "./components/Toast";
export * from "./components/Tooltip";

export { cx } from "./lib/cx";
