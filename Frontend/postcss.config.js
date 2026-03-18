import { createRequire } from "module";

const require = createRequire(import.meta.url);

let tailwindcssPlugin = null;
try {
  // Optional dependency: allows Vite to start even if Tailwind isn't installed yet.
  // When Tailwind is installed, this resolves and the @tailwind directives compile.
  tailwindcssPlugin = require("tailwindcss");
} catch {
  tailwindcssPlugin = null;
}

export default {
  plugins: [
    ...(tailwindcssPlugin ? [tailwindcssPlugin()] : []),
    require("autoprefixer")(),
  ],
};
