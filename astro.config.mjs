import { defineConfig } from "astro/config";
export default defineConfig({
  site: process.env.SITE_URL || "https://erp4us-org.github.io",
  output: "static",
  trailingSlash: "always",
});
