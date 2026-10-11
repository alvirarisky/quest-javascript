import http from "node:http";
import { randomBytes } from "node:crypto";
import { createServer, loadEnv } from "vite";
import { dispatch } from "./core.js";
const configuredSecret =
  process.env.SESSION_SECRET ||
  loadEnv("development", process.cwd(), "SESSION_").SESSION_SECRET;
process.env.SESSION_SECRET =
  configuredSecret || randomBytes(32).toString("hex");
const port = Number(process.env.PORT || 5173);
console.log(
  "Local API active. Set SESSION_SECRET for sessions that survive server restarts.",
);
const vite = await createServer({
  server: {
    middlewareMode: true,
    hmr: { port: port + 10000, host: "127.0.0.1" },
  },
  appType: "spa",
});
http
  .createServer(async (req, res) => {
    if (req.url.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      if (req.method !== "POST") {
        res.writeHead(405);
        return res.end(JSON.stringify({ error: "Gunakan POST." }));
      }
      let raw = "";
      try {
        for await (const c of req) {
          raw += c;
          if (Buffer.byteLength(raw) > 8192)
            throw Object.assign(new Error("Payload terlalu besar."), {
              status: 413,
            });
        }
        const result = dispatch(req.url.split("/")[2], JSON.parse(raw));
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(e.status || 400);
        res.end(
          JSON.stringify({
            error: e.status ? e.message : "Payload tidak valid.",
          }),
        );
      }
      return;
    }
    vite.middlewares(req, res);
  })
  .listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}`));
