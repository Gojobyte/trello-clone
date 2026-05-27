import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import ConvexProvider from "../integrations/convex/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { THEME_INIT_SCRIPT, useTheme } from "../lib/use-theme";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Flowboard — Du désordre à l'organisation",
			},
			{
				name: "description",
				content:
					"Flowboard t'aide à visualiser ton travail, organiser tes tâches et avancer en équipe. Tableaux Kanban, temps réel, collaboration.",
			},
			{
				name: "theme-color",
				content: "#18181a",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
		],
	}),
	notFoundComponent: () => (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="mt-2 text-muted-foreground">Page introuvable</p>
		</div>
	),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { theme } = useTheme();
	return (
		<html lang="fr">
			<head>
				<HeadContent />
				{/* Anti-FOUC : applique data-theme depuis localStorage avant hydration.
					Contenu statique contrôlé par nos soins, pas d'input utilisateur. */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: contenu statique du script anti-FOUC */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
			</head>
			<body>
				<ConvexProvider>
					{children}
					<Toaster
						position="bottom-right"
						richColors
						closeButton
						theme={theme}
					/>
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	);
}
