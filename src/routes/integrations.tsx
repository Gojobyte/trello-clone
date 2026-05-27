import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "#/features/app/Icon";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/integrations")({
	component: IntegrationsRoute,
});

function IntegrationsRoute() {
	return (
		<MarketingShell active="integrations">
			<IntegrationsContent />
		</MarketingShell>
	);
}

// ─── Data ────────────────────────────────────────────────────────────────────

type Category = "Productivité" | "Communication" | "Dev" | "Stockage" | "Autre";

type Status = "available" | "soon" | "beta";

interface Integration {
	name: string;
	desc: string;
	category: Category;
	status: Status;
	color: string;
	/** Lien d'usage, pour future activation. Pour l'instant : no-op + console.log. */
	href?: string;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
	available: { label: "Disponible", className: "pi-status pi-status--ok" },
	soon: { label: "Bientôt", className: "pi-status pi-status--soon" },
	beta: { label: "Pré-version", className: "pi-status pi-status--beta" },
};

const INTEGRATIONS: Integration[] = [
	// Communication
	{
		name: "Slack",
		category: "Communication",
		status: "available",
		color: "#4A154B",
		desc: "Notifications de cartes dans le canal de votre choix, création depuis un message.",
	},
	{
		name: "Microsoft Teams",
		category: "Communication",
		status: "available",
		color: "#5059C9",
		desc: "Canaux liés à vos boards et résumés quotidiens.",
	},
	{
		name: "Discord",
		category: "Communication",
		status: "available",
		color: "#5865F2",
		desc: "Webhooks ciblés sur les événements clés des boards.",
	},
	{
		name: "Email",
		category: "Communication",
		status: "available",
		color: "#6B6B68",
		desc: "Créez une carte en envoyant un email à votre board.",
	},

	// Dev
	{
		name: "GitHub",
		category: "Dev",
		status: "available",
		color: "#1A1A18",
		desc: "Liez automatiquement PR, issues et commits aux cartes.",
	},
	{
		name: "GitLab",
		category: "Dev",
		status: "available",
		color: "#FC6D26",
		desc: "Merge requests et pipelines CI/CD sync. avec vos cartes.",
	},
	{
		name: "Linear",
		category: "Dev",
		status: "beta",
		color: "#5E6AD2",
		desc: "Sync bidirectionnel des issues, migration en un clic.",
	},
	{
		name: "Sentry",
		category: "Dev",
		status: "soon",
		color: "#362D59",
		desc: "Une erreur en prod crée une carte typée bug, automatiquement.",
	},
	{
		name: "Vercel",
		category: "Dev",
		status: "available",
		color: "#1A1A18",
		desc: "Déploiements affichés en commentaire et statut des previews.",
	},
	{
		name: "Jira",
		category: "Dev",
		status: "soon",
		color: "#0052CC",
		desc: "Import en un coup et synchronisation continue.",
	},

	// Productivité
	{
		name: "Notion",
		category: "Productivité",
		status: "available",
		color: "#1A1A18",
		desc: "Pages Notion intégrées dans le contexte des cartes.",
	},
	{
		name: "Figma",
		category: "Productivité",
		status: "available",
		color: "#A259FF",
		desc: "Embarquez des frames vivantes, aperçus cliquables.",
	},
	{
		name: "Google Calendar",
		category: "Productivité",
		status: "available",
		color: "#1A73E8",
		desc: "Échéances synchronisées avec votre agenda Google.",
	},
	{
		name: "Loom",
		category: "Productivité",
		status: "beta",
		color: "#625DF5",
		desc: "Vidéos Loom embarquées dans les commentaires.",
	},
	{
		name: "Miro",
		category: "Productivité",
		status: "soon",
		color: "#FFD02F",
		desc: "Boards Miro affichés en card cover.",
	},

	// Stockage
	{
		name: "Google Drive",
		category: "Stockage",
		status: "available",
		color: "#1A73E8",
		desc: "Joignez des fichiers Drive sans quitter la carte.",
	},
	{
		name: "Dropbox",
		category: "Stockage",
		status: "available",
		color: "#0061FF",
		desc: "Aperçus inline, partage de fichiers en deux clics.",
	},
	{
		name: "OneDrive",
		category: "Stockage",
		status: "available",
		color: "#0078D4",
		desc: "Fichiers Microsoft 365 attachés aux cartes.",
	},
	{
		name: "Box",
		category: "Stockage",
		status: "soon",
		color: "#0061D5",
		desc: "Stockage entreprise, conformité incluse.",
	},

	// Autre
	{
		name: "Zapier",
		category: "Autre",
		status: "available",
		color: "#FF4F00",
		desc: "Plus de 5 000 applications en pont vers Flowboard.",
	},
	{
		name: "Webhook custom",
		category: "Autre",
		status: "available",
		color: "#3A3A36",
		desc: "POST personnalisé sur n'importe quel événement.",
	},
	{
		name: "PostHog",
		category: "Autre",
		status: "beta",
		color: "#1A1A18",
		desc: "Funnels analytics qui créent des cartes de suivi.",
	},
];

const ALL_CATEGORIES: Category[] = [
	"Productivité",
	"Communication",
	"Dev",
	"Stockage",
	"Autre",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function IntegrationLogo({ name, color }: { name: string; color: string }) {
	return (
		<div className="pi-logo" style={{ background: color }} aria-hidden="true">
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

function IntegrationCard({ item }: { item: Integration }) {
	const status = STATUS_META[item.status];

	// TODO : brancher la config réelle de l'intégration (OAuth, formulaire…).
	const handleClick = () => {
		// eslint-disable-next-line no-console
		console.log("[integrations] open config for", item.name);
	};

	return (
		<button type="button" className="pi-card" onClick={handleClick}>
			<div className="pi-card-head">
				<IntegrationLogo name={item.name} color={item.color} />
				<span className={status.className}>{status.label}</span>
			</div>
			<div>
				<h3 className="pi-card-name">{item.name}</h3>
				<div className="pi-card-cat">{item.category}</div>
			</div>
			<p className="pi-card-desc">{item.desc}</p>
			<div className="pi-card-foot">
				<span>
					<strong>Configurer</strong> →
				</span>
				<span>{item.status === "available" ? "OAuth" : "—"}</span>
			</div>
		</button>
	);
}

// ─── Page content ────────────────────────────────────────────────────────────

type Filter = "all" | Category;

function IntegrationsContent() {
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return INTEGRATIONS.filter((it) => {
			if (filter !== "all" && it.category !== filter) return false;
			if (!q) return true;
			return (
				it.name.toLowerCase().includes(q) ||
				it.desc.toLowerCase().includes(q) ||
				it.category.toLowerCase().includes(q)
			);
		});
	}, [filter, query]);

	const counts = useMemo(() => {
		const map: Record<Category, number> = {
			Productivité: 0,
			Communication: 0,
			Dev: 0,
			Stockage: 0,
			Autre: 0,
		};
		for (const it of INTEGRATIONS) map[it.category]++;
		return map;
	}, []);

	return (
		<>
			{/* Hero */}
			<section className="mk-hero">
				<MkEyebrow>Intégrations</MkEyebrow>
				<h1 className="mk-h1">
					Connecte <em className="serif-italic">tout ce que tu utilises</em>.
				</h1>
				<p className="mk-sub">
					Flowboard reste votre source de vérité. Les intégrations apportent le
					contexte — Slack, GitHub, Figma, Drive — sans déporter vos données
					ailleurs.
				</p>
				<div className="row" style={{ marginTop: 22, gap: 16 }}>
					<span className="pi-hero-meta">
						{INTEGRATIONS.length} intégrations · {ALL_CATEGORIES.length}{" "}
						catégories
					</span>
				</div>
			</section>

			{/* Toolbar */}
			<section
				className="mk-section"
				style={{ paddingTop: 16, paddingBottom: 8 }}
			>
				<div className="ps-toolbar">
					<label className="ps-search">
						<span className="ps-search-icon" aria-hidden="true">
							<Icon name="search" size={14} stroke={1.8} />
						</span>
						<input
							type="search"
							placeholder="Rechercher une intégration…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							aria-label="Rechercher une intégration"
						/>
					</label>
					<div
						className="ps-chip-row"
						role="tablist"
						aria-label="Filtrer par catégorie"
					>
						<button
							type="button"
							role="tab"
							aria-selected={filter === "all"}
							className={`ps-chip${filter === "all" ? " is-active" : ""}`}
							onClick={() => setFilter("all")}
						>
							Tout
							<span className="ps-chip-count">{INTEGRATIONS.length}</span>
						</button>
						{ALL_CATEGORIES.map((cat) => (
							<button
								key={cat}
								type="button"
								role="tab"
								aria-selected={filter === cat}
								className={`ps-chip${filter === cat ? " is-active" : ""}`}
								onClick={() => setFilter(cat)}
							>
								{cat}
								<span className="ps-chip-count">{counts[cat]}</span>
							</button>
						))}
					</div>
				</div>
			</section>

			{/* Grid */}
			<section
				className="mk-section"
				style={{ paddingTop: 8, paddingBottom: 64 }}
			>
				{filtered.length === 0 ? (
					<div className="ps-empty">
						<p className="ps-empty-title">
							Rien ne correspond à cette recherche.
						</p>
						<p className="ps-empty-sub">
							Essayez un autre mot-clé, ou réinitialisez les filtres.
						</p>
					</div>
				) : (
					<div className="pi-grid">
						{filtered.map((it) => (
							<IntegrationCard key={it.name} item={it} />
						))}
					</div>
				)}
			</section>

			{/* CTA */}
			<section className="mk-cta">
				<h2
					style={{
						fontSize: 36,
						margin: 0,
						letterSpacing: "-0.02em",
						fontWeight: 500,
					}}
				>
					Pas trouvé votre outil ?<br />
					<em className="serif-italic" style={{ fontSize: 36 }}>
						Construisez-le
					</em>{" "}
					avec notre API.
				</h2>
				<p
					className="text-muted"
					style={{ fontSize: 15, marginTop: 16, maxWidth: 520 }}
				>
					API REST complète, webhooks sortants, OAuth 2.0 et un SDK TypeScript.
					Une carte en quatre lignes de code.
				</p>
				<div className="row" style={{ gap: 10, marginTop: 24 }}>
					<Link to="/register" className="btn btn--primary btn--lg">
						Démarrer gratuitement
					</Link>
					<Link to="/pricing" className="btn btn--ghost btn--lg">
						Voir les tarifs →
					</Link>
				</div>
			</section>
		</>
	);
}
