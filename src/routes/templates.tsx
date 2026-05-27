// ============ TEMPLATES · Lume Éclat (Phase 3d, group B) ============
// Tabs catégories + grille 3-col + cards avec gradient color strip.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { api } from "../../convex/_generated/api";

// ============ DONNÉES ============

const CATEGORIES: Array<{ id: string; label: string }> = [
	{ id: "all", label: "Tous" },
	{ id: "product", label: "Produit" },
	{ id: "engineering", label: "Ingénierie" },
	{ id: "design", label: "Design" },
	{ id: "marketing", label: "Marketing" },
	{ id: "ops", label: "Ops" },
];

interface Template {
	id: string;
	cat: string;
	name: string;
	emoji: string;
	accent: string;
	desc: string;
	cards: number;
	by: string;
	uses: number;
}

const TEMPLATES: Template[] = [
	{
		id: "t1",
		cat: "product",
		name: "Roadmap produit · pondérée RICE",
		emoji: "◆",
		accent: "#5B53C7",
		desc: "4 colonnes + champ pondération RICE. Filtre par initiative.",
		cards: 24,
		by: "Équipe Flowboard",
		uses: 1840,
	},
	{
		id: "t2",
		cat: "product",
		name: "Discovery & user research",
		emoji: "◉",
		accent: "#C45C8E",
		desc: "De l'insight au prototype validé. Inclut un canvas Jobs to be done.",
		cards: 16,
		by: "Studio Nord",
		uses: 410,
	},
	{
		id: "t3",
		cat: "engineering",
		name: "Sprint agile · 2 semaines",
		emoji: "◇",
		accent: "#3E8E72",
		desc: "Backlog → Sprint → En cours → En revue → Done. Burndown auto.",
		cards: 18,
		by: "Équipe Flowboard",
		uses: 2150,
	},
	{
		id: "t4",
		cat: "engineering",
		name: "Roadmap d'infra & migrations",
		emoji: "◊",
		accent: "#5C8EC4",
		desc: "Plan de migration en plusieurs phases, avec rollback et dépendances.",
		cards: 32,
		by: "Orbite",
		uses: 320,
	},
	{
		id: "t5",
		cat: "engineering",
		name: "Bug triage & QA",
		emoji: "◌",
		accent: "#A38B3F",
		desc: "Pipeline bug reports → priorisation → fix → vérif. Métriques MTTR.",
		cards: 14,
		by: "Équipe Flowboard",
		uses: 680,
	},
	{
		id: "t6",
		cat: "engineering",
		name: "Incidents & post-mortem",
		emoji: "◈",
		accent: "#C45C8E",
		desc: "Réponse à incident, ownership, timeline, post-mortem template.",
		cards: 8,
		by: "Méridien",
		uses: 95,
	},
	{
		id: "t7",
		cat: "design",
		name: "Design system · build & maintien",
		emoji: "◇",
		accent: "#7C5CC4",
		desc: "Tokens → composants → docs → adoption. Avec versionning.",
		cards: 22,
		by: "Atelier·M",
		uses: 540,
	},
	{
		id: "t8",
		cat: "design",
		name: "Design review hebdomadaire",
		emoji: "◉",
		accent: "#5B53C7",
		desc: "Lundi : à présenter. Mardi : reviewé. Vendredi : itéré.",
		cards: 9,
		by: "Studio Nord",
		uses: 220,
	},
	{
		id: "t9",
		cat: "design",
		name: "Brand identity refresh",
		emoji: "◈",
		accent: "#C45C8E",
		desc: "Audit → moodboard → exploration → décision → application.",
		cards: 28,
		by: "Fabrique·NV",
		uses: 130,
	},
	{
		id: "t10",
		cat: "design",
		name: "Asset library & ressources",
		emoji: "◌",
		accent: "#A38B3F",
		desc: "Logos, illustrations, photos. Avec licences et statut d'usage.",
		cards: 40,
		by: "Loupe & Co",
		uses: 88,
	},
	{
		id: "t11",
		cat: "marketing",
		name: "Lancement produit · 8 semaines",
		emoji: "◆",
		accent: "#3E8E72",
		desc: "Calendrier complet de lancement, content + comms + events.",
		cards: 36,
		by: "Équipe Flowboard",
		uses: 480,
	},
	{
		id: "t12",
		cat: "marketing",
		name: "Editorial calendar",
		emoji: "◉",
		accent: "#7C5CC4",
		desc: "Idée → brief → écriture → relecture → publication. Multi-canal.",
		cards: 24,
		by: "Studio Nord",
		uses: 320,
	},
	{
		id: "t13",
		cat: "marketing",
		name: "Funnel d'acquisition organique",
		emoji: "◇",
		accent: "#5C8EC4",
		desc: "SEO, partenariats, communauté, ads. Avec mesures par canal.",
		cards: 18,
		by: "Comète",
		uses: 140,
	},
	{
		id: "t14",
		cat: "marketing",
		name: "Events & meetups",
		emoji: "◈",
		accent: "#C45C8E",
		desc: "Sourcing speaker, logistique, comms pré/post. Réutilisable par event.",
		cards: 22,
		by: "Plein Sud",
		uses: 65,
	},
	{
		id: "t15",
		cat: "ops",
		name: "Recrutement · pipeline candidats",
		emoji: "◉",
		accent: "#5B53C7",
		desc: "Sourcing → entretien tech → final → offre. Avec scorecards.",
		cards: 16,
		by: "Équipe Flowboard",
		uses: 920,
	},
	{
		id: "t16",
		cat: "ops",
		name: "Onboarding nouvelle recrue",
		emoji: "◊",
		accent: "#3E8E72",
		desc: "Avant J1, semaine 1, mois 1, mois 3. Checklist personnalisable.",
		cards: 28,
		by: "Méridien",
		uses: 240,
	},
	{
		id: "t17",
		cat: "ops",
		name: "OKR trimestriels",
		emoji: "◆",
		accent: "#A38B3F",
		desc: "Définition, suivi, check-in mensuel, retro de fin de trimestre.",
		cards: 12,
		by: "Orbite",
		uses: 380,
	},
	{
		id: "t18",
		cat: "product",
		name: "Feedback utilisateur",
		emoji: "◌",
		accent: "#7C5CC4",
		desc: "Collecte multi-canal → tri par thème → priorisation → réponse.",
		cards: 14,
		by: "Cale Sèche",
		uses: 175,
	},
	{
		id: "t19",
		cat: "product",
		name: "Compétiteurs & veille",
		emoji: "◈",
		accent: "#5C8EC4",
		desc: "Suivi des concurrents, releases, prix. Mis à jour mensuellement.",
		cards: 18,
		by: "Studio Nord",
		uses: 95,
	},
	{
		id: "t20",
		cat: "product",
		name: "A/B tests & expérimentations",
		emoji: "◇",
		accent: "#3E8E72",
		desc: "Hypothèse → setup → résultats → décision. Avec stats de signif.",
		cards: 14,
		by: "PostHog",
		uses: 110,
	},
	{
		id: "t21",
		cat: "product",
		name: "Pricing & monétisation",
		emoji: "◆",
		accent: "#C45C8E",
		desc: "Itérations pricing, A/B, segmentation, plans Free/Premium.",
		cards: 12,
		by: "Orbite",
		uses: 60,
	},
	{
		id: "t22",
		cat: "engineering",
		name: "Migration legacy → moderne",
		emoji: "◊",
		accent: "#5B53C7",
		desc: "Plan étape par étape, avec stratégie de coexistence et rollback.",
		cards: 22,
		by: "Équipe Flowboard",
		uses: 95,
	},
];

// Structures réelles instanciées par modèle — listes + cartes de départ.
type Blueprint = {
	color: string;
	lists: Array<{ name: string; cards: string[] }>;
};

const CATEGORY_BLUEPRINT: Record<string, Blueprint> = {
	product: {
		color: "indigo",
		lists: [
			{
				name: "Idées",
				cards: [
					"Collecter les retours utilisateurs",
					"Analyser la concurrence",
					"Nouvelle idée de fonctionnalité",
				],
			},
			{
				name: "Planifié",
				cards: ["Spécifier le prochain incrément", "Estimer l'effort"],
			},
			{ name: "En cours", cards: ["Première itération"] },
			{ name: "Livré", cards: [] },
		],
	},
	engineering: {
		color: "emerald",
		lists: [
			{
				name: "Backlog",
				cards: [
					"Dette technique à traiter",
					"Bug à investiguer",
					"Amélioration de performance",
				],
			},
			{ name: "Sprint", cards: ["Tâche prioritaire du sprint"] },
			{ name: "En cours", cards: [] },
			{ name: "En revue", cards: [] },
			{ name: "Terminé", cards: [] },
		],
	},
	design: {
		color: "violet",
		lists: [
			{
				name: "À explorer",
				cards: ["Moodboard & références", "Explorations de direction"],
			},
			{ name: "En cours", cards: ["Maquettes haute fidélité"] },
			{ name: "En revue", cards: [] },
			{ name: "Validé", cards: [] },
		],
	},
	marketing: {
		color: "amber",
		lists: [
			{ name: "Idées", cards: ["Sujet d'article", "Idée de campagne"] },
			{ name: "En production", cards: ["Rédaction en cours"] },
			{ name: "Planifié", cards: ["Programmé pour publication"] },
			{ name: "Publié", cards: [] },
		],
	},
	ops: {
		color: "teal",
		lists: [
			{ name: "À faire", cards: ["Première tâche", "Deuxième tâche"] },
			{ name: "En cours", cards: [] },
			{ name: "Terminé", cards: [] },
		],
	},
};

function blueprintFor(t: Template): Blueprint {
	return CATEGORY_BLUEPRINT[t.cat] ?? CATEGORY_BLUEPRINT.ops;
}

// ============ ROUTE ============

export const Route = createFileRoute("/templates")({
	component: TemplatesRoute,
});

function TemplatesRoute() {
	return (
		<AppShell active={{ route: "templates" }} title="Templates">
			<TemplatesContent />
		</AppShell>
	);
}

// ============ CONTENU ============

function TemplatesContent() {
	const navigate = useNavigate();
	const createFromTemplate = useMutation(api.templates.createFromTemplate);
	const [cat, setCat] = useState("all");
	const [creatingId, setCreatingId] = useState<string | null>(null);

	async function handleUse(t: Template) {
		if (creatingId) return;
		setCreatingId(t.id);
		try {
			const bp = blueprintFor(t);
			const boardId = await createFromTemplate({
				name: t.name,
				color: bp.color,
				lists: bp.lists,
			});
			toast.success("Tableau créé depuis le modèle");
			navigate({ to: "/boards/$boardId", params: { boardId } });
		} catch {
			toast.error("Impossible de créer le tableau");
			setCreatingId(null);
		}
	}

	const counts: Record<string, number> = { all: TEMPLATES.length };
	for (const t of TEMPLATES) counts[t.cat] = (counts[t.cat] ?? 0) + 1;

	const filtered = TEMPLATES.filter((t) => cat === "all" || t.cat === cat).sort(
		(a, b) => b.uses - a.uses,
	);

	return (
		<div className="tools-page">
			{/* Page header */}
			<header className="mw-pagehead">
				<div className="mw-pagehead-dotgrid" aria-hidden="true" />
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Templates de <em className="serif-italic">boards</em>.
						</h1>
						<p className="mw-sub">
							<span className="mw-sub-live">
								<span className="ping" />
								{TEMPLATES.length} modèles
							</span>
							<span aria-hidden="true">·</span>
							<span>démarre un tableau en 10 secondes</span>
						</p>
					</div>
					<div className="tools-page-actions">
						<button
							type="button"
							className="btn btn--outline"
							onClick={() => navigate({ to: "/boards" })}
						>
							<Icon name="folder" size={13} /> Mes tableaux
						</button>
					</div>
				</div>
			</header>

			<div className="tools-body">
				{/* Catégories segmented */}
				<div className="template-tabs" role="tablist" aria-label="Catégories">
					{CATEGORIES.map((c) => (
						<button
							key={c.id}
							type="button"
							role="tab"
							aria-selected={cat === c.id}
							className={`template-tab${cat === c.id ? " is-active" : ""}`}
							onClick={() => setCat(c.id)}
						>
							<span>{c.label}</span>
							<span className="template-tab-count">{counts[c.id] ?? 0}</span>
						</button>
					))}
				</div>

				{/* Grille de templates */}
				{filtered.length === 0 ? (
					<div className="template-empty">
						<span className="template-empty-title">Aucun template ici.</span>
						<p className="text-subtle text-sm" style={{ margin: 0 }}>
							Choisis une autre catégorie pour voir d'autres modèles.
						</p>
					</div>
				) : (
					<div className="template-grid">
						{filtered.map((t) => {
							const bp = blueprintFor(t);
							const visibleLists = bp.lists.slice(0, 4);
							return (
								<article key={t.id} className="template-card">
									<div
										className="template-card-cover"
										style={{
											background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
										}}
									>
										<span className="template-card-emoji">{t.emoji}</span>
										<span className="template-card-cards">
											{t.cards} cartes
										</span>
									</div>
									<div className="template-card-body">
										<h3 className="template-card-title">{t.name}</h3>
										<p className="template-card-desc">{t.desc}</p>
										<div className="template-card-lists">
											{visibleLists.map((l) => (
												<span key={l.name} className="template-card-chip">
													{l.name}
												</span>
											))}
											{bp.lists.length > visibleLists.length && (
												<span className="template-card-chip">
													+{bp.lists.length - visibleLists.length}
												</span>
											)}
										</div>
									</div>
									<div className="template-card-foot">
										<span className="template-card-author">par {t.by}</span>
										<button
											type="button"
											className="template-card-cta"
											disabled={creatingId !== null}
											onClick={() => handleUse(t)}
										>
											{creatingId === t.id ? (
												"Création…"
											) : (
												<>
													Utiliser
													<Icon name="arrow" size={11} />
												</>
											)}
										</button>
									</div>
								</article>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
