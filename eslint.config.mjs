import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [".next/**", ".vercel/**", "coverage/**", "node_modules/**"],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
