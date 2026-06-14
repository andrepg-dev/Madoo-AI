// Copies axe-core's prebuilt UMD bundle into public/ so the accessibility
// checker can load it into an iframe via a same-origin <script src>.
//
// We can't use the bundled `import("axe-core")` / `axe.source` in the browser:
// Turbopack wraps axe-core as a CJS module, so its stringified source references
// `exports`, which throws "exports is not defined" when run standalone in the
// frame. The standalone axe.min.js is clean UMD and self-attaches `window.axe`.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "public", "vendor", "axe.min.js");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(require.resolve("axe-core/axe.min.js"), dest);
console.log(`[copy-axe] ${dest}`);
