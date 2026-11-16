import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const FILES = new Set(["questlog-data.json", "web.json"]);

/** Serves gitignored fixtures during `vite` only. Never active in `vite build`. */
export function fixturePlugin(): Plugin {
  return {
    name: "qj-dev-fixtures",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        const marker = "/__fixture/";
        const at = url.indexOf(marker);
        if (at < 0) return next();
        const name = url.slice(at + marker.length);
        if (!FILES.has(name) || name.includes("..")) {
          res.statusCode = 404;
          res.end("unknown fixture");
          return;
        }
        const file = path.resolve(server.config.root, "fixtures", name);
        if (!fs.existsSync(file)) {
          res.statusCode = 404;
          res.end("missing fixture");
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}
