import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "#/features/app/Icon";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/roadmap")({
	component: RoadmapRoute,
});

function RoadmapRoute() {
	return (
		<MarketingShell active="roadmap">
			<RoadmapContent />
		</MarketingShell>
	);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "low" | "med" | "high";
type Effort = "small" | "medium" | "large";

interface RoadmapItem {
	id: string;
	title: string;
	desc: string;
	votes: number;
	priority: Priority;
	effort: Effort;
	/** Pour les items livrés. */
	shippedAt?: string;
}

type ColumnId = "thinking" | "doing" | "shipped";

interface Column {
	id: ColumnId;
	title: string;
	subtitle: string;
	dotClass: string;
	items: RoadmapItem[];
}

const PRIO_META: Record<Priority, { label: string; className: string }> = {
	low: { label: "Basse", className: "pr-tag" },
	med: { label: "Moyenne", className: "pr-tag" },
	high: { label: "Haute", className: "pr-tag pr-tag--prio" },
};
const EFFORT_META: Record<Effort, { label: string; className: string }> = {
	small: { label: "S", className: "pr-tag pr-tag--quick" },
	medium: { label: "M", className: "pr-tag pr-tag--effort" },
	large: { label: "L", className: "pr-tag pr-tag--effort" },
};

// ─── Données ─────────────────────────────────────────────────────────────────

const BOARD: Column[] = [
	{
		id: "thinking",
		title: "En réflexion",
		subtitle: "Idées que l'on étudie · vos votes nous aident à trancher.",
		dotClass: "pr-col-dot pr-col-dot--bone",
		items: [
			{
				id: "t1",
				title: "Assistant IA contextuel",
				desc: "Diviser une carte, résumer un fil, générer un brief — toujours en français.",
				votes: 142,
				priority: "high",
				effort: "large",
			},
			{
				id: "t2",
				title: "Time-tracking intégré",
				desc: "Démarrer / arrêter un timer sur une carte. Rapport hebdo par personne.",
				votes: 64,
				priority: "med",
				effort: "medium",
			},
			{
				id: "t3",
				title: "Permissions granulaires",
				desc: "Restreindre la lecture d'une carte ou d'une colonne à un groupe.",
				votes: 48,
				priority: "med",
				effort: "large",
			},
			{
				id: "t4",
				title: "Mode focus / Pomodoro",
				desc: "Une carte, un timer, zéro notification. Idéal pour le travail en blocs.",
				votes: 31,
				priority: "low",
				effort: "small",
			},
			{
				id: "t5",
				title: "Templates publics",
				desc: "Bibliothèque communautaire de templates de boards, déjà testés.",
				votes: 27,
				priority: "low",
				effort: "medium",
			},
		],
	},
	{
		id: "doing",
		title: "En cours",
		subtitle: "Ce sur quoi on travaille concrètement — visibilité totale.",
		dotClass: "pr-col-dot pr-col-dot--amber",
		items: [
			{
				id: "d1",
				title: "Vue Table avec champs personnalisés",
				desc: "Spreadsheet-like : champs texte, nombre, sélection, formule simple.",
				votes: 89,
				priority: "high",
				effort: "large",
			},
			{
				id: "d2",
				title: "App mobile (iOS & Android)",
				desc: "Lecture rapide, check des notifications, ajout de cartes. Pas de duplication d'usage.",
				votes: 124,
				priority: "high",
				effort: "large",
			},
			{
				id: "d3",
				title: "Automatisations no-code",
				desc: "Règles « Quand X → Y », bibliothèque de templates, journal d'exécution.",
				votes: 71,
				priority: "med",
				effort: "medium",
			},
			{
				id: "d4",
				title: "API publique v1 + Webhooks",
				desc: "REST API stable, OAuth 2.0, événements sortants signés.",
				votes: 58,
				priority: "high",
				effort: "medium",
			},
			{
				id: "d5",
				title: "Sprints & vélocité",
				desc: "Planning de sprint, burndown, vélocité par équipe.",
				votes: 42,
				priority: "med",
				effort: "medium",
			},
		],
	},
	{
		id: "shipped",
		title: "Livré",
		subtitle: "Sorti récemment. Couvert dans le changelog.",
		dotClass: "pr-col-dot pr-col-dot--teal",
		items: [
			{
				id: "s1",
				title: "Vue Timeline stable",
				desc: "Sortie de beta, drag pour replanifier, swimlanes par étiquette.",
				votes: 96,
				priority: "high",
				effort: "large",
				shippedAt: "v1.4 · mai 2026",
			},
			{
				id: "s2",
				title: "Command palette ⌘K",
				desc: "Recherche globale, actions, ouvert depuis n'importe quelle page.",
				votes: 78,
				priority: "high",
				effort: "small",
				shippedAt: "v1.4 · mai 2026",
			},
			{
				id: "s3",
				title: "Inbox unifié & Mon jour",
				desc: "Une seule page pour ce qui vous attend, retards en tête.",
				votes: 63,
				priority: "med",
				effort: "medium",
				shippedAt: "v1.3 · mai 2026",
			},
			{
				id: "s4",
				title: "Section Outils (OKR, Docs, Sprints, Charge)",
				desc: "Quatre nouveaux espaces, alimentés par les mêmes cartes.",
				votes: 54,
				priority: "med",
				effort: "large",
				shippedAt: "v1.2 · avril 2026",
			},
			{
				id: "s5",
				title: "Intégrations Slack & GitHub natives",
				desc: "Notifications dans le canal, PR liées aux cartes, sans Zapier.",
				votes: 47,
				priority: "high",
				effort: "small",
				shippedAt: "v1.0 · mars 2026",
			},
		],
	},
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoadmapCard({ item }: { item: RoadmapItem }) {
	const prio = PRIO_META[item.priority];
	const eff = EFFORT_META[item.effort];
	return (
		<article className="pr-card">
			<h3 className="pr-card-title">{item.title}</h3>
			<p className="pr-card-desc">{item.desc}</p>
			<div className="pr-tags">
				<span className={prio.className}>Prio · {prio.label}</span>
				<span className={eff.className}>Effort · {eff.label}</span>
				{item.shippedAt && (
					<span className="pr-tag pr-tag--quick">{item.shippedAt}</span>
				)}
			</div>
			<div className="pr-card-foot">
				<span className="pr-votes">{item.votes}</span>
				<span className="pr-card-meta">
					<Icon name="chat" size={11} stroke={1.6} />
					{Math.round(item.votes / 5)}
				</span>
			</div>
		</article>
	);
}

function RoadmapColumn({ col }: { col: Column }) {
	return (
		<section className="pr-col" aria-label={col.title}>
			<header className="pr-col-head">
				<span className={col.dotClass} aria-hidden="true" />
				<h2 className="pr-col-title">{col.title}</h2>
				<span className="pr-col-count">{col.items.length}</span>
			</header>
			<p
				className="text-subtle text-xs"
				style={{ margin: "0 4px 8px", lineHeight: 1.45 }}
			>
				{col.subtitle}
			</p>
			{col.items.map((item) => (
				<RoadmapCard key={item.id} item={item} />
			))}
		</section>
	);
}

// ─── Contenu principal ───────────────────────────────────────────────────────

function RoadmapContent() {
	const totalVotes = BOARD.flatMap((c) => c.items).reduce(
		(acc, it) => acc + it.votes,
		0,
	);

	return (
		<>
			{/* Hero */}
			<section className="mk-hero">
				<MkEyebrow>Roadmap publique</MkEyebrow>
				<h1 className="mk-h1">
					Là où <em className="serif-italic">on va</em>.
				</h1>
				<p className="mk-sub">
					Ce qui mijote, ce qu&apos;on construit maintenant, ce qu&apos;on vient
					de livrer. Pas de promesses, mais un horizon clair — mis à jour à
					chaque revue produit.
				</p>
				<div className="row" style={{ marginTop: 22, gap: 8 }}>
					<Link to="/register" className="btn btn--primary">
						Démarrer &amp; voter
					</Link>
					<button type="button" className="btn btn--outline">
						<Icon name="chat" size={13} /> Discord communauté
					</button>
					<span className="text-subtle text-xs" style={{ marginLeft: 12 }}>
						{totalVotes} votes · mise à jour le 27 mai 2026
					</span>
				</div>
			</section>

			{/* Board */}
			<section
				className="mk-section"
				style={{ paddingTop: 24, paddingBottom: 64 }}
			>
				<div className="pr-board">
					{BOARD.map((col) => (
						<RoadmapColumn key={col.id} col={col} />
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="mk-cta">
				<h2
					style={{
						fontSize: 32,
						margin: 0,
						letterSpacing: "-0.02em",
						fontWeight: 500,
					}}
				>
					Une idée qu&apos;on n&apos;a pas listée ?{" "}
					<em className="serif-italic">Dites-nous</em>.
				</h2>
				<p
					className="text-muted"
					style={{ fontSize: 15, marginTop: 12, maxWidth: 480 }}
				>
					Toutes les suggestions sont lues par l&apos;équipe produit. Les
					meilleures finissent ici, soumises au vote.
				</p>
				<div className="row" style={{ gap: 10, marginTop: 24 }}>
					<Link to="/changelog" className="btn btn--ghost btn--lg">
						Voir le changelog →
					</Link>
					<Link to="/register" className="btn btn--primary btn--lg">
						Créer un compte
					</Link>
				</div>
			</section>
		</>
	);
}
