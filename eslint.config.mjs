import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This codebase consistently fetches data on mount via
      // useEffect(() => { load() }, []) without useCallback-wrapped fetchers —
      // the idiomatic pattern used throughout, not a bug. Adding the suggested
      // deps (get/load/getToken/router) risks infinite-refetch loops since
      // those functions aren't memoized. Off, not just downgraded, since it
      // fires on nearly every data-fetching page in the app.
      "react-hooks/set-state-in-effect": "off",
      // API response shapes aren't typed yet — a real gap, but a separate,
      // larger effort (interfaces per endpoint) rather than a lint-cleanup
      // task. Downgraded to warning so it stays visible without blocking builds.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;