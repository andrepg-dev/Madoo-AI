import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";

import "../src/tokens/base.css";
import "../src/tokens/fonts.css";
import "../src/tokens/tokens.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "Madoo bg",
      values: [
        { name: "Madoo bg", value: "#FAF7F0" },
        { name: "Madoo bg-2", value: "#F4F0E6" },
        { name: "White", value: "#FFFFFF" },
        { name: "Ink", value: "#1F1A12" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Introduction", "Tokens", "Typography", "Color", "Iconography"],
          "Components",
          ["Button", "IconButton", "Input", "Textarea", "Select", "Checkbox"],
          "Patterns",
        ],
      },
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        Default: "default",
        Warm: "warm",
        Indigo: "indigo",
      },
      defaultTheme: "Default",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
