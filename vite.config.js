
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Cv-creater/",
  build: {
    outDir: "dist"
  }
});
