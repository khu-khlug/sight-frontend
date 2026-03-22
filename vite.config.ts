import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globIgnores: ["assets/zbar-*.wasm"],
        },
        manifest: {
          name: "쿠러그",
          short_name: "쿠러그",
          description:
            "경희대학교 중앙 IT 동아리, 세상의 모든 ICT 기술을 다룹니다.",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          lang: "ko",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "icon/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "icon/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    preview: {
      host: "0.0.0.0",
    },
    define: {
      "process.env": env,
    },
  };
});
