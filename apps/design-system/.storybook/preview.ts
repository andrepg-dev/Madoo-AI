import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";

import "@madoo/ui/base.css";
import "@madoo/ui/fonts.css";
import "@madoo/ui/tokens.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "Madoo bg",
      values: [
        { name: "Madoo bg", value: "#F3F4F6" },
        { name: "Madoo surface", value: "#FFFFFF" },
        { name: "Madoo tint", value: "#F8FAFC" },
        { name: "White", value: "#FFFFFF" },
        { name: "Ink", value: "#101114" },
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
          ["Introduction", "Brand", "Tokens", "Typography", "Color", "Iconography"],
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
        Paper: "paper",
        Midnight: "midnight",
      },
      defaultTheme: "Default",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
