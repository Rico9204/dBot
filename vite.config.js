import "dotenv/config";
import { defineConfig } from "vite";
import gameServer from "./game-server.js";

export default defineConfig({
  plugins: [gameServer()],
  server: {
    allowedHosts: [
      ".trycloudflare.com",
      ".discordsays.com"
    ],

    hmr: {
      clientPort: 443
    }
  }
});
