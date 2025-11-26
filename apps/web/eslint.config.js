import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,

  {
    ignores: [
      "tailwind.config.js",
      "postcss.config.js",
      "next.config.js"
    ]
  }
];
