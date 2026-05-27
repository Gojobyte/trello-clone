// Serveur Node de production pour TanStack Start.
// Sert les assets statiques (dist/client/) + wrap le handler SSR (dist/server/server.js).
//
// Lancé par le container Docker en production : `node server-prod.mjs`.

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import handler from "./dist/server/server.js";

const app = new Hono();

// 1) Sert les assets statiques générés par Vite avec cache long (filename hashés)
app.use(
	"/assets/*",
	serveStatic({
		root: "./dist/client",
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
	}),
);

// 3) Proxy direct vers Convex pour /api/auth/* — bypass le router TanStack
// Start qui réemballe la response et perd les Set-Cookie. Reproduit la même
// logique que handler$1 mais retourne la Response sans intermédiaire.
const PUBLIC_ORIGIN =
	process.env.SITE_URL ||
	process.env.BETTER_AUTH_URL ||
	process.env.VITE_SITE_URL ||
	"https://trello.projetsynergie.fr";
const CONVEX_SITE_URL =
	process.env.CONVEX_SITE_URL ||
	process.env.VITE_CONVEX_SITE_URL ||
	"http://trello-convex-backend:3211";

app.all("/api/auth/*", async (c) => {
	const raw = c.req.raw;
	const url = new URL(raw.url);
	const nextUrl = `${CONVEX_SITE_URL}${url.pathname}${url.search}`;
	const headers = new Headers(raw.headers);
	headers.delete("transfer-encoding");
	headers.delete("content-length");
	headers.delete("connection");
	headers.set("host", new URL(CONVEX_SITE_URL).host);
	headers.set("x-forwarded-host", url.host);
	headers.set("x-forwarded-proto", "https");
	headers.set("x-better-auth-forwarded-host", url.host);
	headers.set("x-better-auth-forwarded-proto", "https");
	if (!headers.get("origin")) headers.set("origin", PUBLIC_ORIGIN);
	return await fetch(nextUrl, {
		method: raw.method,
		headers,
		body: raw.body,
		redirect: "manual",
		// @ts-ignore — duplex requis pour streamer le body POST
		duplex: "half",
	});
});

// 4) SSR fallback pour toutes les autres routes (pages React, etc.)
app.all("*", async (c) => {
	return await handler.fetch(c.req.raw);
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
