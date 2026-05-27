import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "#/features/app/Icon";
import { MarketingShell } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/pricing")({
	component: PricingRoute,
});

function PricingRoute() {
	return (
		<MarketingShell active="pricing">
			<PricingContent />
		</MarketingShell>
	);
}

// ─────────────────────────────────────────────────────────────
// Quiz state model
// ─────────────────────────────────────────────────────────────
type Size = "solo" | "small" | "large";
type Usage = "kanban" | "multi" | "reporting";
type Security = "standard" | "sso" | "custom";
type PlanId = "solo" | "studio" | "maison";
type Billing = "month" | "year";

function useRevealOnScroll() {
	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const targets = document.querySelectorAll(
			".pricing .reveal, .pricing .reveal-stagger",
		) as NodeListOf<HTMLElement>;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add("is-on");
						io.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
		);
		targets.forEach((t) => {
			io.observe(t);
		});
		return () => io.disconnect();
	}, []);
}

function PricingContent() {
	useRevealOnScroll();
	const navigate = useNavigate();

	// Quiz
	const [size, setSize] = useState<Size | null>(null);
	const [usage, setUsage] = useState<Usage | null>(null);
	const [security, setSecurity] = useState<Security | null>(null);

	// Pricing controls
	const [billing, setBilling] = useState<Billing>("month");
	const [members, setMembers] = useState(6);

	const recommended: PlanId | null = useMemo(() => {
		if (size === null || usage === null || security === null) return null;
		if (
			security === "sso" ||
			security === "custom" ||
			size === "large" ||
			usage === "reporting"
		) {
			return "maison";
		}
		if (size === "solo" && usage === "kanban" && security === "standard") {
			return "solo";
		}
		return "studio";
	}, [size, usage, security]);

	const filledCount =
		(size !== null ? 1 : 0) +
		(usage !== null ? 1 : 0) +
		(security !== null ? 1 : 0);

	function priceFor(plan: "studio" | "maison", b: Billing) {
		const base = plan === "studio" ? 9 : 19;
		return b === "year" ? +(base * 0.8).toFixed(1) : base;
	}

	const sliderPct = ((members - 1) / 49) * 100;
	const studioPrice = priceFor("studio", billing);
	const studioTotal = Math.round(studioPrice * members);
	const maisonPrice = priceFor("maison", billing);
	const maisonTotal = members >= 16 ? Math.round(maisonPrice * members) : null;
	const billedLabel =
		billing === "year" ? "facturation annuelle" : "facturation mensuelle";

	return (
		<div className="pricing">
			<div className="pricing-orbs" aria-hidden="true">
				<div className="pricing-orb pricing-orb--amber-tl" />
				<div className="pricing-orb pricing-orb--plum-br" />
			</div>

			{/* HERO */}
			<section className="pricing-hero">
				<div className="pricing-shell">
					<div className="eyebrow reveal">
						<span className="pricing-ping" />
						TARIFS · TRANSPARENTS · SANS PIÈGE
					</div>
					<h1 className="reveal">
						Trois plans. <em>Aucune surprise.</em>
					</h1>
					<p className="sub reveal">
						Pas de "à partir de", pas d'add-on facturé à l'année, pas de bouton
						"Contactez-nous" caché. Le prix que vous voyez est le prix payé.
					</p>
				</div>
			</section>

			{/* QUIZ */}
			<section>
				<div className="pricing-shell">
					<div className="quiz reveal">
						<div className="quiz-head">
							<h2>
								Quel plan vous va ?{" "}
								<span className="serif-italic">Trois questions.</span>
							</h2>
							<div className="step-pos">
								{filledCount === 0 ? "—" : filledCount} · 3
							</div>
						</div>

						<div className="quiz-grid">
							<QuizQuestion
								n="1"
								question="Combien êtes-vous dans l'équipe ?"
								options={[
									{ value: "solo", label: "Tout seul·e" },
									{ value: "small", label: "2 à 15 personnes" },
									{ value: "large", label: "16 personnes ou plus" },
								]}
								selected={size}
								onChange={(v) => setSize(v as Size)}
							/>
							<QuizQuestion
								n="2"
								question="Quel usage principal ?"
								options={[
									{ value: "kanban", label: "Kanban uniquement" },
									{ value: "multi", label: "Plusieurs vues, collaboration" },
									{
										value: "reporting",
										label: "Pilotage, reporting, intégrations",
									},
								]}
								selected={usage}
								onChange={(v) => setUsage(v as Usage)}
							/>
							<QuizQuestion
								n="3"
								question="Exigences de sécurité ?"
								options={[
									{ value: "standard", label: "Standard, c'est bien" },
									{ value: "sso", label: "SSO et journal d'audit" },
									{ value: "custom", label: "Hébergement dédié, sur mesure" },
								]}
								selected={security}
								onChange={(v) => setSecurity(v as Security)}
							/>
						</div>

						<QuizResult plan={recommended} />
					</div>
				</div>
			</section>

			{/* PLANS */}
			<section style={{ marginTop: 24 }}>
				<div className="pricing-shell">
					<div className="plan-controls reveal">
						<fieldset
							className="billing-toggle"
							aria-label="Période de facturation"
						>
							<button
								type="button"
								aria-pressed={billing === "month"}
								onClick={() => setBilling("month")}
							>
								MENSUEL
							</button>
							<button
								type="button"
								aria-pressed={billing === "year"}
								onClick={() => setBilling("year")}
							>
								ANNUEL <span className="save">– 20%</span>
							</button>
						</fieldset>
						<div className="member-slider">
							<label>
								MEMBRES DE L'ÉQUIPE
								<div className="row">
									<input
										type="range"
										min={1}
										max={50}
										value={members}
										onChange={(e) => setMembers(Number(e.target.value))}
										aria-label="Nombre de membres"
										style={{ "--p": `${sliderPct}%` } as React.CSSProperties}
									/>
								</div>
							</label>
							<div className="count">{members}</div>
						</div>
					</div>

					<div className="pricing-plans reveal-stagger">
						{/* SOLO */}
						<article
							className={`plan-card${recommended === "solo" ? " is-matched" : ""}`}
						>
							<div className="plan-head">
								<h3>
									Solo<em>Pour démarrer</em>
								</h3>
								{recommended === "solo" && (
									<span className="plan-badge is-match">POUR VOUS</span>
								)}
							</div>
							<div className="plan-price">
								<span className="amount">0</span>
								<div className="per">
									€ / mois
									<br />
									<b>gratuit pour toujours</b>
								</div>
							</div>
							<div className="plan-total">
								<span>Coût mensuel</span>
								<b>0 €</b>
							</div>
							<div className="plan-desc">
								Tout Flowboard pour une personne. Idéal pour les freelances, les
								side projects et les essais en équipe.
							</div>
							<ul className="plan-features">
								<PlanFeature>
									<b>3 boards</b>, 100 tickets
								</PlanFeature>
								<PlanFeature>
									Vues <b>Kanban</b> et <b>Calendrier</b>
								</PlanFeature>
								<PlanFeature>40+ raccourcis clavier</PlanFeature>
								<PlanFeature>Mode sombre et clair</PlanFeature>
							</ul>
							<div className="plan-cta">
								<button
									type="button"
									className="btn btn--outline btn--lg"
									onClick={() => void navigate({ to: "/register" })}
								>
									Démarrer gratuitement
								</button>
							</div>
						</article>

						{/* STUDIO */}
						<article
							className={`plan-card is-popular${
								recommended === "studio" ? " is-matched" : ""
							}`}
						>
							<div className="plan-head">
								<h3>
									Studio<em>Pour les équipes</em>
								</h3>
								<span className="plan-badge">
									{recommended === "studio" ? "POUR VOUS" : "POPULAIRE"}
								</span>
							</div>
							<div className="plan-price">
								<span className="currency">€</span>
								<span className="amount">
									{billing === "year" ? studioPrice.toFixed(1) : studioPrice}
								</span>
								<div className="per">
									<span>/ membre / mois</span>
									<br />
									<b>{billedLabel}</b>
								</div>
							</div>
							<div className="plan-total">
								<span>
									Coût pour {members} membre{members > 1 ? "s" : ""}
								</span>
								<b>{studioTotal} € / mois</b>
							</div>
							<div className="plan-desc">
								Tout Flowboard pour l'équipe. Les <b>quatre vues</b>,
								l'historique illimité, la collaboration temps réel.
							</div>
							<ul className="plan-features">
								<PlanFeature>
									<b>Boards illimités</b>
								</PlanFeature>
								<PlanFeature>
									Les <b>4 vues</b> + Dashboard personnalisable
								</PlanFeature>
								<PlanFeature>Curseurs et présence en temps réel</PlanFeature>
								<PlanFeature>Automatisations (20 par mois)</PlanFeature>
								<PlanFeature>Intégrations GitHub, Slack, Linear</PlanFeature>
								<PlanFeature>Support email · 24h ouvrées</PlanFeature>
							</ul>
							<div className="plan-cta">
								<button
									type="button"
									className="btn btn--accent btn--lg"
									onClick={() => void navigate({ to: "/register" })}
								>
									Essayer 14 jours
								</button>
							</div>
						</article>

						{/* MAISON */}
						<article
							className={`plan-card${recommended === "maison" ? " is-matched" : ""}`}
						>
							<div className="plan-head">
								<h3>
									Maison<em>Pour les structures</em>
								</h3>
								{recommended === "maison" && (
									<span className="plan-badge is-match">POUR VOUS</span>
								)}
							</div>
							<div className="plan-price">
								<span className="currency">€</span>
								<span className="amount">
									{billing === "year" ? maisonPrice.toFixed(1) : maisonPrice}
								</span>
								<div className="per">
									<span>/ membre / mois</span>
									<br />
									<b>à partir de 16 membres</b>
								</div>
							</div>
							<div className="plan-total">
								<span>
									Coût pour {members} membre{members > 1 ? "s" : ""}
								</span>
								<b>
									{maisonTotal !== null
										? `${maisonTotal} € / mois`
										: "— sur devis"}
								</b>
							</div>
							<div className="plan-desc">
								Pour les structures qui ont besoin d'auditabilité, de SSO, d'un
								référent dédié et d'un hébergement éventuellement dédié.
							</div>
							<ul className="plan-features">
								<PlanFeature>Tout Studio +</PlanFeature>
								<PlanFeature>
									<b>SSO SAML</b>, SCIM
								</PlanFeature>
								<PlanFeature>Journal d'audit illimité</PlanFeature>
								<PlanFeature>Automatisations illimitées</PlanFeature>
								<PlanFeature>Hébergement dédié (option, +€)</PlanFeature>
								<PlanFeature>Référent dédié · 4h ouvrées</PlanFeature>
							</ul>
							<div className="plan-cta">
								<button type="button" className="btn btn--outline btn--lg">
									Parler à Flowboard
								</button>
							</div>
						</article>
					</div>
				</div>
			</section>

			{/* FEATURE MATRIX */}
			<section className="features-matrix">
				<div className="pricing-shell">
					<div className="matrix-head reveal">
						<h2>
							Le détail, <em>par section.</em>
						</h2>
						<div className="note">CLIQUEZ POUR DÉPLIER</div>
					</div>
					<FeatureMatrix />
				</div>
			</section>

			{/* FAQ */}
			<section className="faq">
				<div className="pricing-shell">
					<div className="faq-head reveal">
						<h2>
							Questions <em>évidentes.</em>
						</h2>
					</div>
					<div className="faq-grid reveal">
						<FaqItem
							q="Puis-je changer de plan en cours d'année ?"
							a="Oui, à tout moment. Le passage à un plan supérieur est prorata du jour. Un retour à un plan inférieur prend effet à la fin de la période en cours — vous ne perdez jamais ce que vous avez déjà payé."
							defaultOpen
						/>
						<FaqItem
							q="Qu'arrive-t-il à mes données si j'annule ?"
							a="Vous gardez 60 jours de fenêtre d'export complet (JSON + CSV par board). Au-delà, vos données sont supprimées définitivement de nos serveurs et de nos sauvegardes. Aucun renvoi de relance ou tentative de rétention."
						/>
						<FaqItem
							q="Y a-t-il une remise pour les associations et l'éducation ?"
							a="Oui — 50% sur Studio pour les associations loi 1901, les coopératives et les structures d'enseignement. Envoyez un email depuis votre adresse institutionnelle."
						/>
						<FaqItem
							q="Hébergez-vous mes données en Europe ?"
							a="Oui. Nos serveurs sont chez Scaleway, Paris et Strasbourg. Aucun transfert hors UE, conformité RGPD complète. Le plan Maison propose un hébergement dédié sur demande."
						/>
						<FaqItem
							q="Acceptez-vous les paiements SEPA et virements ?"
							a="Carte bancaire et SEPA pour Studio. Virement annuel sur facture pour Maison. Pas de surcoût, pas de frais d'activation."
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Quiz sub-components
// ─────────────────────────────────────────────────────────────
function QuizQuestion({
	n,
	question,
	options,
	selected,
	onChange,
}: {
	n: string;
	question: string;
	options: { value: string; label: string }[];
	selected: string | null;
	onChange: (v: string) => void;
}) {
	return (
		<div className="quiz-q">
			<h3>
				<span className="n">{n}</span>
				{question}
			</h3>
			<div className="quiz-opts">
				{options.map((opt) => {
					const isOn = selected === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							className="quiz-opt"
							aria-pressed={isOn}
							onClick={() => onChange(opt.value)}
						>
							<span className="quiz-radio" />
							{opt.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function QuizResult({ plan }: { plan: PlanId | null }) {
	if (plan === null) {
		return (
			<output className="quiz-result" aria-live="polite">
				<Icon name="bell" size={18} className="ic" />
				<span>
					Répondez aux trois questions — on met le plan recommandé en lumière.
				</span>
			</output>
		);
	}
	const labels: Record<PlanId, { name: string; reason: string }> = {
		solo: {
			name: "Solo",
			reason: "suffit largement — gratuit, à vie.",
		},
		studio: {
			name: "Studio",
			reason:
				"est fait pour vous — les 4 vues, la collab temps réel, 14 jours d'essai.",
		},
		maison: {
			name: "Maison",
			reason: "— SSO, journal d'audit, référent dédié.",
		},
	};
	const cur = labels[plan];
	return (
		<output className="quiz-result has-result" aria-live="polite">
			<Icon name="spark" size={18} className="ic" />
			<span>
				<b>{cur.name}</b> {cur.reason}
			</span>
		</output>
	);
}

// ─────────────────────────────────────────────────────────────
// Plan feature row
// ─────────────────────────────────────────────────────────────
function PlanFeature({ children }: { children: React.ReactNode }) {
	return (
		<li>
			<Icon name="check" size={14} stroke={2.5} className="feature-check" />
			<span>{children}</span>
		</li>
	);
}

// ─────────────────────────────────────────────────────────────
// Feature matrix — collapsible per category
// ─────────────────────────────────────────────────────────────
type MatrixRow = {
	feature: string;
	hint?: string;
	solo: string | "yes" | "no";
	studio: string | "yes" | "no";
	maison: string | "yes" | "no";
};
type MatrixCategory = {
	id: string;
	label: string;
	defaultOpen: boolean;
	rows: MatrixRow[];
};

const MATRIX: MatrixCategory[] = [
	{
		id: "collab",
		label: "Collaboration",
		defaultOpen: true,
		rows: [
			{
				feature: "Membres par espace",
				hint: "Plafond du plan",
				solo: "1",
				studio: "Illimité",
				maison: "Illimité",
			},
			{
				feature: "Boards par espace",
				solo: "3",
				studio: "Illimités",
				maison: "Illimités",
			},
			{
				feature: "Curseurs en temps réel",
				hint: "Présence, sélection",
				solo: "no",
				studio: "yes",
				maison: "yes",
			},
			{
				feature: "Commentaires + mentions",
				solo: "yes",
				studio: "yes",
				maison: "yes",
			},
			{
				feature: "Invités externes",
				solo: "2",
				studio: "10 par board",
				maison: "Illimités",
			},
		],
	},
	{
		id: "vues",
		label: "Vues",
		defaultOpen: true,
		rows: [
			{
				feature: "Kanban",
				hint: "Drag-and-drop, WIP, swimlanes",
				solo: "yes",
				studio: "yes",
				maison: "yes",
			},
			{
				feature: "Calendrier",
				hint: "Jour, semaine, mois",
				solo: "yes",
				studio: "yes",
				maison: "yes",
			},
			{
				feature: "Timeline",
				hint: "Gantt léger, dépendances",
				solo: "no",
				studio: "yes",
				maison: "yes",
			},
			{
				feature: "Dashboard",
				hint: "Vélocité, cycle, focus",
				solo: "no",
				studio: "yes",
				maison: "yes",
			},
		],
	},
	{
		id: "auto",
		label: "Automatisation",
		defaultOpen: false,
		rows: [
			{
				feature: "Règles automatiques",
				hint: "Quand → alors",
				solo: "no",
				studio: "20 / mois",
				maison: "Illimitées",
			},
			{
				feature: "Webhooks sortants",
				solo: "no",
				studio: "5",
				maison: "Illimités",
			},
			{
				feature: "API et clés personnelles",
				solo: "no",
				studio: "yes",
				maison: "yes",
			},
		],
	},
	{
		id: "sup",
		label: "Support",
		defaultOpen: false,
		rows: [
			{
				feature: "Réponse first-touch",
				solo: "Communauté",
				studio: "24h ouvrées",
				maison: "4h ouvrées",
			},
			{ feature: "Référent dédié", solo: "no", studio: "no", maison: "yes" },
			{
				feature: "SLA de disponibilité",
				solo: "no",
				studio: "99.9%",
				maison: "99.95%",
			},
		],
	},
];

function FeatureMatrix() {
	const [open, setOpen] = useState<Record<string, boolean>>(() => {
		const init: Record<string, boolean> = {};
		for (const c of MATRIX) init[c.id] = c.defaultOpen;
		return init;
	});

	return (
		<div className="matrix reveal">
			<div className="mc mc-h" />
			<div className="mc mc-h plan">
				Solo<small>0 €</small>
			</div>
			<div className="mc mc-h plan recommended">
				Studio<small>9 € / membre</small>
			</div>
			<div className="mc mc-h plan">
				Maison<small>19 € / membre</small>
			</div>

			{MATRIX.map((cat) => {
				const isOpen = open[cat.id];
				return (
					<MatrixCategoryBlock
						key={cat.id}
						cat={cat}
						isOpen={isOpen}
						onToggle={() => setOpen((s) => ({ ...s, [cat.id]: !s[cat.id] }))}
					/>
				);
			})}
		</div>
	);
}

function MatrixCategoryBlock({
	cat,
	isOpen,
	onToggle,
}: {
	cat: MatrixCategory;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<>
			<button
				type="button"
				className="mc-section"
				aria-expanded={isOpen}
				onClick={onToggle}
			>
				<Icon name="chevron" size={14} stroke={2.5} className="chev" />
				{cat.label}
				<span className="count">{cat.rows.length} features</span>
			</button>
			<div className={`mc-section-body${isOpen ? "" : " is-collapsed"}`}>
				{cat.rows.map((r) => (
					<MatrixRowCells key={r.feature} row={r} />
				))}
			</div>
		</>
	);
}

function MatrixRowCells({ row }: { row: MatrixRow }) {
	return (
		<>
			<div className="mc mc-feature">
				{row.feature}
				{row.hint && <small>{row.hint}</small>}
			</div>
			<MatrixCell value={row.solo} />
			<MatrixCell value={row.studio} recommended />
			<MatrixCell value={row.maison} />
		</>
	);
}

function MatrixCell({
	value,
	recommended,
}: {
	value: string | "yes" | "no";
	recommended?: boolean;
}) {
	const cls = `mc mc-val${recommended ? " recommended" : ""}${
		value === "yes" ? " mc-yes" : ""
	}${value === "no" ? " mc-no" : ""}`;

	if (value === "yes") {
		return (
			<div className={cls}>
				<Icon name="check" size={16} stroke={2.5} />
			</div>
		);
	}
	if (value === "no") {
		return <div className={cls}>—</div>;
	}
	return <div className={cls}>{value}</div>;
}

// ─────────────────────────────────────────────────────────────
// FAQ accordion (uses native <details>)
// ─────────────────────────────────────────────────────────────
function FaqItem({
	q,
	a,
	defaultOpen,
}: {
	q: string;
	a: string;
	defaultOpen?: boolean;
}) {
	return (
		<details className="faq-item" open={defaultOpen}>
			<summary>
				{q}
				<Icon name="plus" size={16} stroke={2} className="chev" />
			</summary>
			<div className="faq-a">{a}</div>
		</details>
	);
}
