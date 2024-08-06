const colors = require("tailwindcss/colors");
/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: ["dark"],
  theme: {
    colors: {
      ...colors,
      primaryBgColor: colors.white,
      primaryDarkBgColor: colors.gray[800],
    },
    extend: {
      typography: (theme) => ({
        invert: {
          css: {
            "--tw-prose-body": "var(--tw-prose-invert-body)",
            "--tw-prose-headings": "var(--tw-prose-invert-headings)",
            "--tw-prose-lead": "var(--tw-prose-invert-lead)",
            "--tw-prose-links": "var(--tw-prose-invert-links)",
            "--tw-prose-bold": "var(--tw-prose-invert-bold)",
            "--tw-prose-counters": "var(--tw-prose-invert-counters)",
            "--tw-prose-bullets": "var(--tw-prose-invert-bullets)",
            "--tw-prose-hr": "var(--tw-prose-invert-hr)",
            "--tw-prose-quotes": "var(--tw-prose-invert-quotes)",
            "--tw-prose-quote-borders": "var(--tw-prose-invert-quote-borders)",
            "--tw-prose-captions": "var(--tw-prose-invert-captions)",
            "--tw-prose-code": "var(--tw-prose-invert-code)",
            "--tw-prose-code-bg": "var(--tw-prose-invert-code-bg)",
            "--tw-prose-pre-code": "var(--tw-prose-invert-pre-code)",
            "--tw-prose-pre-bg": "var(--tw-prose-invert-pre-bg)",
            "--tw-prose-th-borders": "var(--tw-prose-invert-th-borders)",
            "--tw-prose-td-borders": "var(--tw-prose-invert-td-borders)",
          },
        },
        DEFAULT: {
          css: {
            "--tw-prose-code": theme("colors.neutral.700"),
            "--tw-prose-code-bg": theme("colors.neutral.300"),
            "--tw-prose-invert-code": theme("colors.neutral.200"),
            "--tw-prose-invert-code-bg": theme("colors.neutral.600"),
            code: {
              color: "var(--tw-prose-code)",
              padding: "2px 4px",
              borderRadius: "4px",
              backgroundColor: "var(--tw-prose-code-bg)",
              whiteSpace: "break-spaces",
            },
            a: {
              "overflow-wrap": "break-word",
            },
            ".astro-code code": {
              whiteSpace: "inherit",
            },
            p: {
              fontSize: "1.125rem",
            },
          },
        },
      }),
    },
  },
  variants: {
    extend: { typography: ["dark"] },
  },
  plugins: [require("@tailwindcss/typography")],
};
