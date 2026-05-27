import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "#/features/app/Icon";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/changelog")({
	component: ChangelogRoute,
});

function ChangelogRoute() {
	return (
		<MarketingShell active="changelog">
			<ChangelogContent />
		</MarketingShell>
	);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Kind = "feature" | "fix" | "improvement";

interface ReleaseEntry {
	version: string;
	date: string; // affiché en mono uppercase (ex. "27 MAI 2026")
	title: string;
	summary: string;
	kinds: Kind[]; // chips visibles dans le head
	changes: string[]; // bullets
}

const KIND_META: Record<Kind, { label: string; className: string }> = {
	feature: { label: "Feature", className: "pc-kind pc-kind--feature" },
	fix: { label: "Fix", className: "pc-kind pc-kind--fix" },
	improvement: {
		label: "Amélioration",
		className: "pc-kind pc-kind--improvement",
	},
};

// ─── Données ─────────────────────────────────────────────────────────────────
// Ordre décroissant : la plus récente en premier.

const RELEASES: ReleaseEntry[] = [
	{
		version: "v1.4.0",
		date: "27 MAI 2026",
		title: "Vue Timeline en stable, command palette ⌘K",
		summary:
			"La timeline sort de beta. La command palette devient le centre de contrôle global de Flowboard.",
		kinds: ["feature", "improvement"],
		changes: [
			"Timeline stable : swimlanes par étiquette, drag pour replanifier.",
			"⌘K ouvre la palette partout, avec recherche sur cartes, boards et actions.",
			"Onglet « Sous-tâches » avec progression visuelle sur la modal de carte.",
			"Transitions soignées entre Board, Calendrier, Timeline et Dashboard.",
		],
	},
	{
		version: "v1.3.0",
		date: "5 MAI 2026",
		title: "Inbox unifié & vue « Mon jour »",
		summary:
			"Tout ce qui requiert votre attention en un seul écran. Le matin, vous savez quoi faire.",
		kinds: ["feature"],
		changes: [
			"Inbox unifié : mentions, assignations, échéances, activités.",
			"Vue « Mon jour » : cartes prioritaires du jour, retards en tête.",
			"Vues sauvegardées partageables à l'équipe.",
			"Recherche full-text sur commentaires et descriptions.",
		],
	},
	{
		version: "v1.2.1",
		date: "18 AVRIL 2026",
		title: "Performances et accessibilité",
		summary:
			"Une release plus calme, beaucoup de polish — vous devriez sentir Flowboard plus rapide.",
		kinds: ["improvement", "fix"],
		changes: [
			"Temps de rendu initial du board réduit de 30 %.",
			"Drag-and-drop sur Safari 17.4 : l'assigné est conservé au drop.",
			"Navigation clavier complète sur la modal de carte.",
			"Contrastes WCAG AA sur tous les badges et chips.",
		],
	},
	{
		version: "v1.2.0",
		date: "2 AVRIL 2026",
		title: "Section « Outils » : Objectifs, Docs, Sprints, Charge équipe",
		summary:
			"Quatre nouvelles vues outils dans la sidebar, alimentées par les mêmes cartes.",
		kinds: ["feature"],
		changes: [
			"Objectifs (OKR) : suivi trimestriel lié aux cartes.",
			"Docs : wiki léger relié aux boards.",
			"Sprints : planning, burndown, vélocité.",
			"Charge équipe : visualisation de la disponibilité par personne.",
		],
	},
	{
		version: "v1.1.0",
		date: "28 MARS 2026",
		title: "Filtres croisés et étiquettes intelligentes",
		summary:
			"Croisez vos filtres entre boards. Les étiquettes apprennent de votre usage.",
		kinds: ["feature", "improvement"],
		changes: [
			"Filtres inter-boards : « tout ce qui est urgent et m'est assigné ».",
			"Suggestions d'étiquettes basées sur le titre de la carte.",
			"Notifications Slack dédupliquées en cas d'assignations simultanées.",
		],
	},
	{
		version: "v1.0.2",
		date: "20 MARS 2026",
		title: "Stabilité post-lancement",
		summary: "Quelques cas marginaux corrigés grâce aux premiers retours.",
		kinds: ["fix"],
		changes: [
			"Cartes archivées qui réapparaissaient après un refresh.",
			"Erreur 500 lors de la duplication de boards de plus de 200 cartes.",
			"Synchro temps réel sur Firefox 124 fiabilisée.",
		],
	},
	{
		version: "v1.0.0",
		date: "15 MARS 2026",
		title: "Sortie publique — Flowboard est là",
		summary:
			"Après 4 mois de beta privée avec 40 équipes, Flowboard ouvre ses portes.",
		kinds: ["feature"],
		changes: [
			"Vues Board et Calendrier partagent les mêmes cartes.",
			"Cartes riches : étiquettes, sous-tâches, commentaires, pièces jointes, échéances.",
			"Workspaces avec rôles et permissions par board.",
			"Intégrations Slack et GitHub natives.",
			"Plans Free (jusqu'à 3 boards) et Premium (illimité).",
		],
	},
	{
		version: "v0.9.0",
		date: "12 FÉVRIER 2026",
		title: "Beta privée — itérations finales",
		summary:
			"Templates, imports, et un composant de carte deux fois plus rapide.",
		kinds: ["feature", "improvement"],
		changes: [
			"Templates : Sprint agile, Roadmap RICE, Recrutement.",
			"Imports en un clic depuis Trello et depuis un CSV.",
			"Composant carte refait : 2× plus rapide à manipuler.",
		],
	},
];

// ─── Filtre ──────────────────────────────────────────────────────────────────

type Filter = "all" | Kind;

const FILTERS: { id: Filter; label: string }[] = [
	{ id: "all", label: "Tout" },
	{ id: "feature", label: "Features" },
	{ id: "fix", label: "Fixes" },
	{ id: "improvement", label: "Améliorations" },
];

// ─── Composant ───────────────────────────────────────────────────────────────

function ChangelogContent() {
	const [filter, setFilter] = useState<Filter>("all");

	const visible = useMemo(() => {
		if (filter === "all") return RELEASES;
		return RELEASES.filter((r) => r.kinds.includes(filter));
	}, [filter]);

	// « kind dominant » : celui qui colore le point de la timeline.
	const dominantKind = (r: ReleaseEntry): Kind => {
		if (r.kinds.includes("feature")) return "feature";
		if (r.kinds.includes("improvement")) return "improvement";
		return "fix";
	};

	return (
		<>
			{/* Hero */}
			<section className="mk-hero" style={{ paddingBottom: 32 }}>
				<MkEyebrow>Changelog</MkEyebrow>
				<h1 className="mk-h1">
					Tout ce qui a <em className="serif-italic">changé</em>.
				</h1>
				<p className="mk-sub">
					Une release par mois, parfois plus. Pas de pop-up « Quoi de neuf ? »,
					juste cette page — datée, signée, lisible.
				</p>
				<div className="row" style={{ marginTop: 22, gap: 8 }}>
					<button type="button" className="btn btn--outline btn--sm">
						<Icon name="bell" size={12} /> S&apos;abonner par email
					</button>
					<button type="button" className="btn btn--ghost btn--sm">
						RSS
					</button>
					<span className="text-subtle text-xs" style={{ marginLeft: 12 }}>
						Mis à jour le 27 mai 2026
					</span>
				</div>
			</section>

			{/* Filtres */}
			<section
				className="mk-section"
				style={{ paddingTop: 0, paddingBottom: 16 }}
			>
				<div
					className="ps-chip-row"
					role="tablist"
					aria-label="Filtrer le changelog"
				>
					{FILTERS.map(({ id, label }) => (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={filter === id}
							className={`ps-chip${filter === id ? " is-active" : ""}`}
							onClick={() => setFilter(id)}
						>
							{label}
						</button>
					))}
				</div>
			</section>

			{/* Timeline */}
			<section
				className="mk-section"
				style={{ paddingTop: 8, paddingBottom: 64 }}
			>
				{visible.length === 0 ? (
					<div className="ps-empty">
						<p className="ps-empty-title">
							Aucune note dans cette catégorie pour le moment.
						</p>
						<p className="ps-empty-sub">
							Choisissez « Tout » pour voir l&apos;ensemble de
							l&apos;historique.
						</p>
					</div>
				) : (
					<>
						<ol className="pc-list">
							{visible.map((r) => (
								<li
									key={r.version}
									className="pc-entry"
									data-kind={dominantKind(r)}
								>
									<header className="pc-entry-head">
										<span className="pc-date">{r.date}</span>
										<span className="pc-version">{r.version}</span>
										<span className="pc-kind-row">
											{r.kinds.map((k) => {
												const meta = KIND_META[k];
												return (
													<span key={k} className={meta.className}>
														{meta.label}
													</span>
												);
											})}
										</span>
									</header>
									<h2 className="pc-title">{r.title}</h2>
									<p className="pc-body">{r.summary}</p>
									<ul className="pc-changes">
										{r.changes.map((c) => (
											<li key={c}>{c}</li>
										))}
									</ul>
								</li>
							))}
						</ol>

						<div className="pc-load-more">
							<button
								type="button"
								className="btn btn--outline btn--sm"
								onClick={() => {
									// TODO : pagination réelle quand la liste passera côté Convex.
									// eslint-disable-next-line no-console
									console.log("[changelog] load more");
								}}
							>
								Charger plus →
							</button>
						</div>
					</>
				)}
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
					On expédie en <em className="serif-italic">public</em>.
				</h2>
				<p
					className="text-muted"
					style={{ fontSize: 15, marginTop: 12, maxWidth: 460 }}
				>
					Roadmap publique, votes ouverts, Discord pour échanger avec
					l&apos;équipe produit. Pas de bouton « Contacter le commercial ».
				</p>
				<div className="row" style={{ gap: 10, marginTop: 24 }}>
					<Link to="/roadmap" className="btn btn--primary btn--lg">
						Voir la roadmap
					</Link>
					<button type="button" className="btn btn--outline btn--lg">
						Rejoindre le Discord
					</button>
				</div>
			</section>
		</>
	);
}
