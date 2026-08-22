import tseslint from "typescript-eslint";
import baseConfig from "./index.js";

export const nodeConfig = tseslint.config(...baseConfig, {
  rules: {
    "no-console": "off",
  },
});

export default nodeConfig;
