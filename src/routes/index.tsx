import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Icon } from "#/features/app/Icon";
import { MarketingShell } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/")({ component: LandingRoute });

function LandingRoute() {
	return (
		<MarketingShell active="home">
			<LandingContent />
		</MarketingShell>
	);
}

// ─────────────────────────────────────────────────────────────
// Reveal-on-scroll : ajoute `.is-on` aux noeuds `.reveal` /
// `.reveal-stagger` quand ils entrent dans le viewport.
// ─────────────────────────────────────────────────────────────
function useRevealOnScroll() {
	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const targets = document.querySelectorAll(
			".reveal, .reveal-stagger",
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

// ─────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────
function LandingContent() {
	useRevealOnScroll();

	return (
		<div className="landing">
			{/* Orbes ambiantes en arrière-plan */}
			<div className="landing-orbs" aria-hidden="true">
				<div className="landing-orb landing-orb--amber-tl" />
				<div className="landing-orb landing-orb--amber-c" />
				<div className="landing-orb landing-orb--plum-br" />
			</div>

			<HeroSection />
			<NumbersSection />
			<StoryOne />
			<StoryTwo />
			<StoryThree />
			<BentoSection />
			<ClosingCta />
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function HeroSection() {
	return (
		<section className="landing-hero">
			<div className="landing-shell">
				<div className="landing-hero-inner">
					<div className="landing-marker reveal">
						<span className="hero-ping" />
						Flowboard · v1.2 · Beta publique
					</div>
					<h1 className="reveal">
						La gestion de projet,
						<br />
						<em>posée et précise.</em>
					</h1>
					<p className="landing-sub reveal">
						Une donnée, quatre points de vue — Kanban, Calendrier, Timeline,
						Dashboard. Pas de plugin, pas de friction, pas de bruit. Juste votre
						travail, mis en lumière.
					</p>
					<div className="hero-cta reveal">
						<Link to="/register" className="btn btn--accent btn--lg">
							Commencer gratuitement
							<Icon name="arrow" size={14} />
						</Link>
						<a href="#bento" className="btn btn--outline btn--lg">
							<Icon name="eye" size={14} />
							Voir une démo
						</a>
					</div>
					<div className="hero-meta reveal">
						<span>
							ÉQUIPES<b>124</b>
						</span>
						<span>·</span>
						<span>
							VUES<b>4</b>
						</span>
						<span>·</span>
						<span>
							RACCOURCIS<b>40+</b>
						</span>
						<span>·</span>
						<span>SANS CB</span>
					</div>

					<HeroStage />
				</div>
			</div>
		</section>
	);
}

function HeroStage() {
	return (
		<div className="hero-stage reveal" aria-hidden="true">
			<div className="hero-product">
				<div className="mock-app">
					<div className="mock-titlebar">
						<div className="dots">
							<span className="dot" />
							<span className="dot" />
							<span className="dot" />
						</div>
						<div className="crumbs">
							<b>Flowboard</b> / atelier-m · <b>Roadmap 2026</b>
						</div>
						<div className="views">
							<span className="on">KANBAN</span>
							<span>CAL</span>
							<span>TIMELINE</span>
							<span>DASH</span>
						</div>
					</div>
					<div className="mock-board">
						<MockColumn
							title="À FAIRE"
							count={8}
							cards={[
								{ t: "Affiner la grille bento", tag: "design", id: "FB-204" },
								{
									t: "Calque grain SVG",
									tag: "détail",
									tagAlt: true,
									id: "FB-205",
								},
								{ t: "Survol des tuiles", id: "FB-206", avs: 1 },
							]}
						/>
						<MockColumn
							title="EN COURS"
							count={3}
							cards={[
								{
									t: "Hero cinématique — orbes",
									tag: "live",
									id: "FB-201",
									avs: 2,
									live: true,
								},
								{
									t: "Animation drift 28s",
									tag: "motion",
									tagAlt: true,
									id: "FB-202",
									avs: 1,
								},
							]}
						/>
						<MockColumn
							title="REVUE"
							count={5}
							cards={[
								{
									t: "Typo Instrument Serif italique",
									tag: "a11y",
									id: "FB-198",
									avs: 3,
								},
								{
									t: "Contraste WCAG dark/light",
									id: "FB-199",
									avs: 1,
								},
							]}
						/>
						<MockColumn
							title="FAIT"
							count={12}
							cards={[
								{
									t: "Palette ambre — 8 stops",
									tag: "tokens",
									tagAlt: true,
									id: "FB-180",
								},
								{ t: "Composant glass blur", id: "FB-181" },
								{ t: "Theme toggle", id: "FB-182", avs: 1 },
							]}
						/>
					</div>
				</div>
			</div>
			<div className="mock-cursor">
				<svg
					viewBox="0 0 16 16"
					fill="currentColor"
					stroke="white"
					strokeWidth="0.5"
					aria-hidden="true"
				>
					<title>Curseur Noémie</title>
					<path d="M2 2 L2 13 L5.5 10 L7.5 14 L9 13.3 L7 9.2 L11.5 9 Z" />
				</svg>
				<div className="lbl">Noémie</div>
			</div>
		</div>
	);
}

type MockCard = {
	t: string;
	tag?: string;
	tagAlt?: boolean;
	id: string;
	avs?: number;
	live?: boolean;
};

function MockColumn({
	title,
	count,
	cards,
}: {
	title: string;
	count: number;
	cards: MockCard[];
}) {
	return (
		<div className="mock-col">
			<div className="mock-col-head">
				{title}
				<span className="pill">{count}</span>
			</div>
			{cards.map((c) => (
				<div key={c.id} className={c.live ? "mock-card live" : "mock-card"}>
					<div className="title">{c.t}</div>
					<div className="meta">
						{c.tag && (
							<span className={c.tagAlt ? "tag alt" : "tag"}>{c.tag}</span>
						)}
						{c.tag && <span>·</span>}
						<span>{c.id}</span>
					</div>
				</div>
			))}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// BIG NUMBERS
// ─────────────────────────────────────────────────────────────
function NumbersSection() {
	return (
		<section className="landing-numbers reveal-stagger">
			<div className="landing-shell">
				<div className="landing-numbers-grid">
					<div className="num-cell">
						<div className="big">
							<em>124</em>
						</div>
						<div className="lbl">ÉQUIPES À BORD</div>
						<div className="desc">
							Des duos en garage aux scaleups de 60. Tous éclairés au même
							ambre.
						</div>
					</div>
					<div className="num-cell">
						<div className="big">
							<em>40+</em>
						</div>
						<div className="lbl">RACCOURCIS CLAVIER</div>
						<div className="desc">
							Tout se fait au clavier. La souris est devenue facultative.
						</div>
					</div>
					<div className="num-cell">
						<div className="big">
							<em>4</em>
						</div>
						<div className="lbl">VUES SUR UNE DONNÉE</div>
						<div className="desc">
							Kanban, Calendrier, Timeline, Dashboard. La même vérité, montrée
							autrement.
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// ─────────────────────────────────────────────────────────────
// STORY 1 — Une donnée, quatre vues (tab-switcher demo)
// ─────────────────────────────────────────────────────────────
type DemoTab = "kanban" | "cal" | "tl";

function StoryOne() {
	const [tab, setTab] = useState<DemoTab>("kanban");
	const userInteracted = useRef(false);

	// Auto-cycle si l'utilisateur n'a pas cliqué
	useEffect(() => {
		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReduced) return;
		const order: DemoTab[] = ["kanban", "cal", "tl"];
		const i = { v: 0 };
		const id = window.setInterval(() => {
			if (userInteracted.current) return;
			i.v = (i.v + 1) % order.length;
			setTab(order[i.v]);
		}, 3800);
		return () => window.clearInterval(id);
	}, []);

	const choose = (t: DemoTab) => {
		userInteracted.current = true;
		setTab(t);
	};

	return (
		<section className="story" id="views">
			<div className="landing-shell">
				<div className="story-inner">
					<div className="story-copy reveal">
						<div className="landing-marker">01 · Une seule vérité</div>
						<h2>
							Une donnée. <em>Quatre points de vue.</em>
						</h2>
						<p>
							Un ticket dans le Kanban est le même ticket dans le Calendrier, le
							même dans la Timeline, le même dans le Dashboard. Bougez-le là où
							vous regardez le travail — il se déplace partout, en même temps,
							sans réconciliation.
						</p>
						<figure className="testimonial-inline">
							<p>
								"On a arrêté de tenir un Notion à jour pour la roadmap, un
								Linear pour les tickets et un Google Calendar pour les sprints.
								C'est devenu une seule chose."
							</p>
							<footer>
								<span className="av-lg" />
								<span>
									<b>Mathilde Renard</b> · Head of Product, Vela
								</span>
							</footer>
						</figure>
					</div>
					<div className="story-visual reveal">
						<div className="demo-views">
							<div className="demo-tabs" role="tablist">
								<button
									type="button"
									className={`demo-tab${tab === "kanban" ? " is-active" : ""}`}
									onClick={() => choose("kanban")}
									role="tab"
									aria-selected={tab === "kanban"}
								>
									<Icon name="board" size={12} className="ic" />
									KANBAN
								</button>
								<button
									type="button"
									className={`demo-tab${tab === "cal" ? " is-active" : ""}`}
									onClick={() => choose("cal")}
									role="tab"
									aria-selected={tab === "cal"}
								>
									<Icon name="calendar" size={12} className="ic" />
									CALENDRIER
								</button>
								<button
									type="button"
									className={`demo-tab${tab === "tl" ? " is-active" : ""}`}
									onClick={() => choose("tl")}
									role="tab"
									aria-selected={tab === "tl"}
								>
									<Icon name="timeline" size={12} className="ic" />
									TIMELINE
								</button>
							</div>
							<div className="demo-panel">
								<DemoKanbanPanel active={tab === "kanban"} />
								<DemoCalPanel active={tab === "cal"} />
								<DemoTlPanel active={tab === "tl"} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function DemoKanbanPanel({ active }: { active: boolean }) {
	return (
		<div className={`panel panel-kanban${active ? " is-active" : ""}`}>
			<div className="col">
				<h5>
					À FAIRE <span className="count">8</span>
				</h5>
				<div className="card">
					Affiner la grille bento
					<div className="meta">
						<span className="dot-a" />
						FB-204
					</div>
				</div>
				<div className="card">
					Calque grain SVG<div className="meta">FB-205</div>
				</div>
				<div className="card">
					Survol des tuiles<div className="meta">FB-206</div>
				</div>
			</div>
			<div className="col">
				<h5>
					EN COURS <span className="count">3</span>
				</h5>
				<div className="card live">
					Hero cinématique — orbes
					<div className="meta">
						<span className="dot-a" />
						FB-201
					</div>
				</div>
				<div className="card">
					Animation drift 28s<div className="meta">FB-202</div>
				</div>
			</div>
			<div className="col">
				<h5>
					REVUE <span className="count">5</span>
				</h5>
				<div className="card">
					Instrument Serif italique<div className="meta">FB-198</div>
				</div>
				<div className="card">
					Contraste dark/light<div className="meta">FB-199</div>
				</div>
			</div>
		</div>
	);
}

function DemoCalPanel({ active }: { active: boolean }) {
	const days: {
		d: string;
		evts?: { t: string; alt?: boolean }[];
		today?: boolean;
	}[] = [
		{ d: "L 13" },
		{ d: "M 14", evts: [{ t: "Retro design" }] },
		{ d: "M 15", evts: [{ t: "Sprint planning", alt: true }] },
		{
			d: "J 16",
			evts: [{ t: "Hero — orbes" }, { t: "1:1 Maxime", alt: true }],
			today: true,
		},
		{ d: "V 17", evts: [{ t: "Demo FB-201" }] },
		{ d: "S 18" },
		{ d: "D 19" },
		{ d: "L 20", evts: [{ t: "Sprint kickoff" }] },
		{ d: "M 21" },
		{ d: "M 22", evts: [{ t: "Tokens v1.1" }] },
		{ d: "J 23" },
		{ d: "V 24", evts: [{ t: "Customer call", alt: true }] },
		{ d: "S 25" },
		{ d: "D 26" },
	];
	return (
		<div
			className={`panel panel-cal${active ? " is-active" : ""}`}
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(7, 1fr)",
				gridAutoRows: "1fr",
				gap: 4,
				height: "100%",
			}}
		>
			{days.map((c) => (
				<div
					key={c.d}
					style={{
						background: c.evts ? "var(--surface)" : "var(--bg-sunken)",
						border: `1px solid ${c.today ? "var(--accent)" : "var(--border-c)"}`,
						borderRadius: "var(--r-sm)",
						padding: "4px 6px",
						fontFamily: "var(--font-mono)",
						fontSize: 9,
						color: "var(--text-subtle)",
						letterSpacing: "0.04em",
						overflow: "hidden",
						minHeight: 0,
					}}
				>
					{c.d}
					{c.evts?.map((e) => (
						<div
							key={e.t}
							style={{
								marginTop: 4,
								padding: "1px 4px",
								background: e.alt
									? "rgba(124,77,255,0.18)"
									: "var(--accent-soft)",
								color: e.alt ? "var(--plum-500)" : "var(--accent-text)",
								borderRadius: "var(--r-xs)",
								fontSize: 8,
								fontFamily: "var(--font-sans)",
								lineHeight: 1.2,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{e.t}
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function DemoTlPanel({ active }: { active: boolean }) {
	type Lane = {
		name: string;
		who: string;
		left: number;
		width: number;
		alt?: boolean;
		muted?: boolean;
	};
	const lanes: Lane[] = [
		{ name: "Hero cinématique", who: "FB-201 · Maxime", left: 0, width: 32 },
		{ name: "Bento grid", who: "FB-204 · Léa", left: 25, width: 28, alt: true },
		{ name: "Tokens v1.1", who: "FB-220 · Noémie", left: 40, width: 22 },
		{
			name: "Onboarding",
			who: "FB-240 · à planifier",
			left: 65,
			width: 30,
			muted: true,
		},
	];
	return (
		<div
			className={`panel${active ? " is-active" : ""}`}
			style={{
				display: "grid",
				gridTemplateRows: "auto repeat(4, 1fr)",
				gap: 6,
				height: "100%",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "120px repeat(8, 1fr)",
					gap: 1,
					fontFamily: "var(--font-mono)",
					fontSize: 9,
					color: "var(--text-subtle)",
					letterSpacing: "0.04em",
					paddingBottom: 4,
					borderBottom: "1px solid var(--border-c)",
				}}
			>
				<span style={{ textAlign: "left", color: "var(--text-muted)" }}>
					EQUIPE
				</span>
				{["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"].map((w) => (
					<span key={w} style={{ textAlign: "center" }}>
						{w}
					</span>
				))}
			</div>
			{lanes.map((l) => (
				<div
					key={l.name}
					style={{
						display: "grid",
						gridTemplateColumns: "120px 1fr",
						gap: 8,
						alignItems: "center",
					}}
				>
					<div
						style={{
							fontSize: 11,
							color: "var(--text)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{l.name}
						<small
							style={{
								display: "block",
								fontFamily: "var(--font-mono)",
								fontSize: 9,
								color: "var(--text-subtle)",
								letterSpacing: "0.04em",
							}}
						>
							{l.who}
						</small>
					</div>
					<div
						style={{
							position: "relative",
							height: 10,
							background: "var(--bg-sunken)",
							borderRadius: 100,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								bottom: 0,
								left: `${l.left}%`,
								width: `${l.width}%`,
								borderRadius: 100,
								background: l.muted
									? "var(--surface)"
									: l.alt
										? "linear-gradient(90deg, var(--plum-500), #4A2DAA)"
										: "linear-gradient(90deg, var(--amber-300), var(--amber-500))",
								border: l.muted ? "1px solid var(--border-c)" : "none",
							}}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// STORY 2 — Le clavier, de partout
// ─────────────────────────────────────────────────────────────
function StoryTwo() {
	return (
		<section className="story flip">
			<div className="landing-shell">
				<div className="story-inner">
					<div className="story-copy reveal">
						<div className="landing-marker">02 · Le clavier, de partout</div>
						<h2>
							Tout se voit. <em>Rien ne se cherche.</em>
						</h2>
						<p>
							Une palette unique, ouverte à ⌘K, contient l'intégralité de
							Flowboard. Créez un ticket, naviguez, assignez, basculez de vue —
							au clavier, sans quitter le contexte. La souris devient
							facultative dès le deuxième jour.
						</p>
						<figure className="testimonial-inline">
							<p>
								"En une semaine, mon trackpad a pris la poussière. Tout passe
								par ⌘K. C'est ça qui m'a fait basculer."
							</p>
							<footer>
								<span className="av-lg purple" />
								<span>
									<b>Jules Khalfa</b> · Lead Engineer, Phare Labs
								</span>
							</footer>
						</figure>
					</div>

					<div className="story-visual reveal">
						<div className="demo-keys">
							<div className="key-stack">
								<KeyRow label="Créer un ticket" icon="plus" chord={["C"]} />
								<KeyRow
									label="Tout chercher"
									icon="search"
									chord={["⌘", "K"]}
									target
								/>
								<KeyRow
									label="Basculer de vue"
									icon="board"
									chord={["G", "V"]}
								/>
								<KeyRow label="Assigner à moi" icon="check" chord={["I"]} />
							</div>
							<div className="key-cmd">
								<Icon name="search" size={14} className="ic" />
								<div className="input">
									Aller à <b>hero cinématique</b>
									<span className="caret" />
								</div>
								<kbd>⌘K</kbd>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function KeyRow({
	label,
	icon,
	chord,
	target,
}: {
	label: string;
	icon: string;
	chord: string[];
	target?: boolean;
}) {
	return (
		<div className={`key-row${target ? " is-target" : ""}`}>
			<span className="label">
				<Icon name={icon} size={16} className="ic" />
				{label}
			</span>
			<span style={{ display: "inline-flex", gap: 6 }}>
				{chord.map((k) => (
					<kbd key={k}>{k}</kbd>
				))}
			</span>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// STORY 3 — Présence, pas notifications
// ─────────────────────────────────────────────────────────────
function StoryThree() {
	return (
		<section className="story">
			<div className="landing-shell">
				<div className="story-inner">
					<div className="story-copy reveal">
						<div className="landing-marker">
							03 · Présence, pas notifications
						</div>
						<h2>
							Penser en équipe, <em>agir seul.</em>
						</h2>
						<p>
							Vos coéquipiers apparaissent là où ils sont, leurs curseurs
							visibles sur la donnée. Aucune notification push, aucun email "X
							vous a mentionné" — juste une présence ambiante, qui dit qui
							regarde quoi, en ce moment.
						</p>
						<figure className="testimonial-inline">
							<p>
								"On a divisé par six nos notifications Slack. La présence
								remplace l'interruption."
							</p>
							<footer>
								<span className="av-lg bone" />
								<span>
									<b>Inès Mercier</b> · COO, Atelier Boréal
								</span>
							</footer>
						</figure>
					</div>

					<div className="story-visual reveal">
						<div className="demo-collab">
							<div className="collab-doc">
								<h6>SPEC · FB-201 · HERO CINÉMATIQUE</h6>
								<h4>Le hero ne doit pas être un titre + un bouton.</h4>
								<div className="line w90" />
								<div className="line w70" />
								<div className="line highlight w50" />
								<div className="line w90" />
								<div className="line w70" />
								<div className="line w50" />
								<div className="collab-cursor c1">
									<svg
										className="pt"
										viewBox="0 0 16 16"
										fill="currentColor"
										stroke="white"
										strokeWidth="0.5"
										aria-hidden="true"
									>
										<title>Curseur Noémie</title>
										<path d="M2 2 L2 13 L5.5 10 L7.5 14 L9 13.3 L7 9.2 L11.5 9 Z" />
									</svg>
									<div className="label">Noémie</div>
								</div>
								<div className="collab-cursor c2">
									<svg
										className="pt"
										viewBox="0 0 16 16"
										fill="currentColor"
										stroke="white"
										strokeWidth="0.5"
										aria-hidden="true"
									>
										<title>Curseur Maxime</title>
										<path d="M2 2 L2 13 L5.5 10 L7.5 14 L9 13.3 L7 9.2 L11.5 9 Z" />
									</svg>
									<div className="label">Maxime</div>
								</div>
							</div>
							<div className="collab-side">
								<div className="collab-presence">
									<h6>EN LIGNE · 4</h6>
									<div className="collab-row">
										<span className="av a" />
										<b>Noémie</b>
										<span className="meta">
											<span className="dot" />
											regarde
										</span>
									</div>
									<div className="collab-row">
										<span className="av p" />
										<b>Maxime</b>
										<span className="meta">
											<span className="dot" />
											écrit
										</span>
									</div>
									<div className="collab-row">
										<span className="av b" />
										Léa<span className="meta">il y a 3 min</span>
									</div>
									<div className="collab-row">
										<span className="av t" />
										Jules<span className="meta">il y a 12 min</span>
									</div>
								</div>
								<div className="collab-presence">
									<h6>ACTIVITÉ — TEMPS RÉEL</h6>
									<div className="collab-row" style={{ fontSize: 11 }}>
										<b>Maxime</b>&nbsp;a déplacé FB-201
									</div>
									<div className="collab-row" style={{ fontSize: 11 }}>
										<b>Léa</b>&nbsp;a commenté FB-204
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// ─────────────────────────────────────────────────────────────
// BENTO
// ─────────────────────────────────────────────────────────────
function BentoSection() {
	return (
		<section className="story" id="bento" style={{ minHeight: "auto" }}>
			<div className="landing-shell">
				<div className="landing-section-head reveal">
					<div className="landing-marker">04 · Quatre fenêtres, une pièce</div>
					<h2>
						Choisissez votre <em>angle de lumière.</em>
					</h2>
					<p>
						Chaque vue est complète, pas une projection. Le Kanban respire, le
						Calendrier dégrise, la Timeline découpe en sprints, le Dashboard
						pose les chiffres en gros.
					</p>
				</div>

				<div className="bento reveal-stagger">
					{/* Kanban 2x2 */}
					<article className="bento-tile bento-kanban">
						<div className="head">
							<Icon name="board" size={16} className="ic" />
							<span className="label">VUE PRINCIPALE</span>
						</div>
						<h3>
							Kanban <em>qui respire</em>
						</h3>
						<p>
							Drag-and-drop tactile. Colonnes WIP. Stickers d'assignation,
							étiquettes ambre.
						</p>
						<div className="preview bento-mini" aria-hidden="true">
							<div className="col-mini">
								<h6>À FAIRE</h6>
								<div className="c-mini">
									Bento grid
									<div className="m">
										<span className="dot-a" />
										FB-204
									</div>
								</div>
								<div className="c-mini">
									Grain SVG<div className="m">FB-205</div>
								</div>
								<div className="c-mini">Survol</div>
							</div>
							<div className="col-mini">
								<h6>EN COURS</h6>
								<div className="c-mini live">
									Hero
									<div className="m">
										<span className="dot-a" />
										FB-201
									</div>
								</div>
								<div className="c-mini">Motion</div>
							</div>
							<div className="col-mini">
								<h6>REVUE</h6>
								<div className="c-mini">
									A11y<div className="m">FB-198</div>
								</div>
								<div className="c-mini">Contraste</div>
							</div>
						</div>
					</article>

					{/* Calendar 2x1 */}
					<article className="bento-tile bento-cal">
						<div>
							<div className="head">
								<Icon name="calendar" size={16} className="ic" />
								<span className="label">PLANIFICATION</span>
							</div>
							<h3>Calendrier</h3>
							<p>Vue jour, semaine, mois. Tâches glissées sur les créneaux.</p>
						</div>
						<div className="preview cal-mini" aria-hidden="true">
							{[
								{ d: "13" },
								{ d: "14", evt: true },
								{ d: "15", evt: true, alt: true },
								{ d: "16", evt: true },
								{ d: "17" },
								{ d: "18" },
								{ d: "19" },
								{ d: "20", evt: true },
								{ d: "21" },
								{ d: "22", evt: true, alt: true },
								{ d: "23" },
								{ d: "24", evt: true },
								{ d: "25" },
								{ d: "26" },
							].map((c) => (
								<div
									key={c.d}
									className={`d${c.evt ? " evt" : ""}${c.alt ? " alt" : ""}`}
								>
									{c.d}
								</div>
							))}
						</div>
					</article>

					{/* Timeline 2x1 */}
					<article className="bento-tile bento-tl">
						<div>
							<div className="head">
								<Icon name="timeline" size={16} className="ic" />
								<span className="label">ROADMAP</span>
							</div>
							<h3>Timeline</h3>
							<p>Gantt léger. Sprints visibles. Dépendances en surbrillance.</p>
						</div>
						<div className="preview tl-mini" aria-hidden="true">
							<div className="tlrow r1" />
							<div className="tlrow r2" />
							<div className="tlrow r3" />
							<div className="tlrow r4" />
						</div>
					</article>

					{/* Dashboard full row */}
					<article className="bento-tile bento-dash">
						<div>
							<div className="head">
								<Icon name="dashboard" size={16} className="ic" />
								<span className="label">PILOTAGE</span>
							</div>
							<h3>
								Dashboard <em>qui dit l'essentiel</em>
							</h3>
							<p>
								Chiffres clés en gros, série temporelle en bas. Pas vingt
								widgets — quatre qui comptent.
							</p>
						</div>
						<div
							className="preview dash-mini"
							aria-hidden="true"
							style={{ position: "static", transform: "none", width: "100%" }}
						>
							<DashCard label="VÉLOCITÉ" value="38" delta="+ 12% vs S-1" />
							<DashCard
								label="CYCLE"
								value="3.2j"
								delta="– 0.4j"
								deltaColor="var(--teal-400)"
							/>
							<DashCard label="FOCUS" value="86%" delta="+ 4 pts" />
						</div>
					</article>
				</div>
			</div>
		</section>
	);
}

function DashCard({
	label,
	value,
	delta,
	deltaColor,
}: {
	label: string;
	value: string;
	delta: string;
	deltaColor?: string;
}) {
	return (
		<div className="dash-card">
			<div className="lbl">{label}</div>
			<div className="val">{value}</div>
			<div
				className="delta"
				style={deltaColor ? { color: deltaColor } : undefined}
			>
				{delta}
			</div>
			<svg
				className="spark"
				viewBox="0 0 100 30"
				preserveAspectRatio="none"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				aria-hidden="true"
			>
				<title>Tendance sur 7 jours</title>
				<polyline points="0,24 14,20 28,22 42,14 56,16 70,9 84,11 100,4" />
			</svg>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// CLOSING CTA
// ─────────────────────────────────────────────────────────────
function ClosingCta() {
	return (
		<section className="landing-closing">
			<div className="landing-shell">
				<div
					className="landing-marker reveal"
					style={{ justifyContent: "center" }}
				>
					Rejoignez les 124 équipes
				</div>
				<h2 className="reveal">
					Posez votre travail
					<br />
					<em>dans la lumière.</em>
				</h2>
				<p className="reveal">
					3 boards gratuits, sans carte bancaire, sans email de relance. La
					version sombre est belle, la claire aussi.
				</p>
				<div className="actions reveal">
					<Link to="/register" className="btn btn--accent btn--lg">
						Créer un compte
						<Icon name="arrow" size={14} />
					</Link>
					<Link to="/pricing" className="btn btn--outline btn--lg">
						Voir les tarifs
					</Link>
				</div>
			</div>
		</section>
	);
}
