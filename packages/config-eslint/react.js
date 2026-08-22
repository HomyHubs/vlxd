import tseslint from "typescript-eslint";
import baseConfig from "./index.js";

export const reactConfig = tseslint.config(...baseConfig, {
  rules: {
    // React-specific linting rules can be expanded as needed
  },
});

export default reactConfig;
