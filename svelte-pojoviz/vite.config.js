import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: {
        pojoviz: path.resolve(__dirname, "src/pojoviz/index.js"),
        "pojoviz-renderers": path.resolve(
          __dirname,
          "src/pojoviz/renderer/index.js",
        ),
      },
      name: "pojoviz",
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
  },
});
