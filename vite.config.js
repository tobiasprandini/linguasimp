import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes("node_modules")) {
						return;
					}

					if (id.includes("/react/") || id.includes("/react-dom/")) {
						return "react-vendor";
					}

					if (id.includes("/framer-motion/")) {
						return "motion-vendor";
					}

					if (id.includes("/@supabase/")) {
						return "supabase-vendor";
					}

					if (
						id.includes("/radix-ui/") ||
						id.includes("/class-variance-authority/") ||
						id.includes("/clsx/") ||
						id.includes("/tailwind-merge/")
					) {
						return "ui-vendor";
					}

					return "vendor";
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
