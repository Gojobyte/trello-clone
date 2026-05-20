// Serveur Node de production pour TanStack Start.
// Sert les assets statiques (dist/client/) + wrap le handler SSR (dist/server/server.js).
//
// Lancé par le container Docker en production : `node server-prod.mjs`.

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import handler from "./dist/server/server.js";

const app = new Hono();

// Compression gzip pour les réponses (au cas où Caddy ne le fait pas en amont)
app.use("*", compress());

// 1) Sert les assets statiques générés par Vite avec cache long (filename hashés)
app.use(
	"/assets/*",
	serveStatic({
		root: "./dist/client",
		// 1 an de cache (les filenames sont hashés donc safe)
		onFound: (_path, c) => {
			c.header("Cache-Control", "public, max-age=31536000, immutable");
		},
	}),
);

// 2) Autres fichiers statiques racine (favicon, robots.txt, etc.)
app.use(
	"/*",
	serveStatic({
		root: "./dist/client",
		// Skip static si pas trouvé → fallback SSR
	}),
);

// 3) SSR fallback pour toutes les routes non-statiques
app.all("*", async (c) => {
	const response = await handler.fetch(c.req.raw);
	return response;
});

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

serve(
	{
		fetch: app.fetch,
		port,
		hostname,
	},
	(info) => {
		console.log(`Server listening on http://${info.address}:${info.port}`);
	},
);
