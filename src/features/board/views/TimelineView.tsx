import type { JSX } from "react";
import { useMemo, useState } from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card/CardDetailModal";

// ── Vue Timeline (Gantt) — Lume Éclat Phase 3c ──────────────────
// Affiche les cartes sur une frise temporelle horizontale.
//
// Heuristique de dates :
//  - startDate : pas de champ dédié au schéma → on utilise _creationTime
//  - endDate   : dueDate si présent, sinon startDate + 3 jours (fallback)
//  - Les cartes sans aucune date sont positionnées sur leur _creationTime
//
// Zoom : 3 niveaux (jours / semaines / mois) — pilote --day-w en CSS
//  - days   = 32px / jour (vue compacte sur 2–4 semaines)
//  - weeks  = 18px / jour (défaut, sprint mensuel)
//  - months = 8px  / jour (vue stratégique trimestrielle)
//
// Dépendances : les arcs SVG sont stubbés (le schéma n'a pas de champ deps).
//
// Groupement : par `listId` → libellé "Liste {id court}" faute de listName
// dans le contrat de props. À enrichir plus tard si l'on accepte d'élargir
// l'API du composant.

const MS_PER_DAY = 86_400_000;

const ZOOM_LEVELS = [
	{ id: "days", label: "Jours", dayWidth: 32 },
	{ id: "weeks", label: "Semaines", dayWidth: 18 },
	{ id: "months", label: "Mois", dayWidth: 8 },
] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number]["id"];

const FRENCH_MONTHS = [
	"Janv.",
	"Févr.",
	"Mars",
	"Avr.",
	"Mai",
	"Juin",
	"Juil.",
	"Août",
	"Sept.",
	"Oct.",
	"Nov.",
	"Déc.",
] as const;

const FRENCH_DOWS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const;

function startOfDay(t: number): number {
	const d = new Date(t);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

function daysBetween(a: number, b: number): number {
	return Math.round((startOfDay(b) - startOfDay(a)) / MS_PER_DAY);
}

function formatDate(t: number): string {
	const d = new Date(t);
	return `${String(d.getDate()).padStart(2, "0")} ${FRENCH_MONTHS[d.getMonth()]}`;
}

// Dérive start/end d'une carte selon la règle ci-dessus
function deriveSpan(card: Doc<"cards">): { start: number; end: number } {
	const start = card._creationTime;
	const end = card.dueDate ?? start + 3 * MS_PER_DAY;
	// Si l'utilisateur a saisi une dueDate antérieure à la création
	// (cas marginal), on garantit end >= start.
	if (end < start) return { start: end, end: start };
	return { start, end };
}

function progressFor(
	card: Doc<"cards">,
	span: { start: number; end: number },
): number {
	if (card.completed) return 1;
	const now = Date.now();
	if (now <= span.start) return 0;
	if (now >= span.end) return 1;
	const total = span.end - span.start || 1;
	return Math.max(0, Math.min(1, (now - span.start) / total));
}

export function TimelineView({
	cards,
	onCardClick,
}: {
	cards: Array<Doc<"cards">>;
	onCardClick?: (cardId: string) => void;
}): JSX.Element {
	const [zoom, setZoom] = useState<ZoomLevel>("weeks");
	const [openCardId, setOpenCardId] = useState<Id<"cards"> | null>(null);

	const dayWidth = ZOOM_LEVELS.find((z) => z.id === zoom)?.dayWidth ?? 18;

	// Calcul de la fenêtre temporelle visible
	const range = useMemo(() => {
		if (cards.length === 0) {
			const today = startOfDay(Date.now());
			return {
				start: today - 7 * MS_PER_DAY,
				end: today + 21 * MS_PER_DAY,
				days: 29,
			};
		}
		let minT = Number.POSITIVE_INFINITY;
		let maxT = Number.NEGATIVE_INFINITY;
		for (const card of cards) {
			const span = deriveSpan(card);
			if (span.start < minT) minT = span.start;
			if (span.end > maxT) maxT = span.end;
		}
		// Pad : début du mois courant et +14 jours après la dernière dueDate
		const startDate = new Date(minT);
		startDate.setDate(1);
		startDate.setHours(0, 0, 0, 0);
		const start = startDate.getTime();
		const end = startOfDay(maxT) + 14 * MS_PER_DAY;
		const days = daysBetween(start, end) + 1;
		return { start, end, days };
	}, [cards]);

	const totalW = range.days * dayWidth;
	const todayMs = startOfDay(Date.now());
	const todayInRange =
		todayMs >= range.start && todayMs <= range.end + MS_PER_DAY;
	const todayX = todayInRange
		? daysBetween(range.start, todayMs) * dayWidth + dayWidth / 2
		: -1;

	// Regroupement par listId — bucket "Sans liste" pour les orphelines
	const groups = useMemo(() => {
		const byList = new Map<string, Array<Doc<"cards">>>();
		for (const card of cards) {
			const key = card.listId ?? "__none__";
			const bucket = byList.get(key);
			if (bucket) {
				bucket.push(card);
			} else {
				byList.set(key, [card]);
			}
		}
		// Tri stable par taille de groupe décroissante
		return Array.from(byList.entries())
			.map(([listId, items]) => ({
				listId,
				label:
					listId === "__none__"
						? "Sans liste"
						: `Liste ${listId.slice(-4).toUpperCase()}`,
				items: items.slice().sort((a, b) => {
					const sa = deriveSpan(a);
					const sb = deriveSpan(b);
					return sa.start - sb.start;
				}),
			}))
			.sort((a, b) => b.items.length - a.items.length);
	}, [cards]);

	const earliest = range.start;
	const latest = range.end;
	const rangeLabel = `${formatDate(earliest)} → ${formatDate(latest)}`;

	const handleCardClick = (cardId: Id<"cards">) => {
		if (onCardClick) {
			onCardClick(cardId);
		} else {
			setOpenCardId(cardId);
		}
	};

	const openCard = openCardId ? cards.find((c) => c._id === openCardId) : null;

	// ── Construction de la frise (header mois + jours) ──────────────
	const headerCells = useMemo(() => {
		const cells: Array<{
			date: Date;
			isWeekend: boolean;
			isToday: boolean;
			monthKey: string;
		}> = [];
		for (let i = 0; i < range.days; i += 1) {
			const d = new Date(range.start + i * MS_PER_DAY);
			const isWeekend = d.getDay() === 0 || d.getDay() === 6;
			const isToday = startOfDay(d.getTime()) === todayMs;
			const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
			cells.push({ date: d, isWeekend, isToday, monthKey });
		}
		return cells;
	}, [range.start, range.days, todayMs]);

	const monthGroups = useMemo(() => {
		const acc: Array<{ key: string; label: string; days: number }> = [];
		for (const c of headerCells) {
			const last = acc[acc.length - 1];
			if (last && last.key === c.monthKey) {
				last.days += 1;
			} else {
				acc.push({
					key: c.monthKey,
					label: `${FRENCH_MONTHS[c.date.getMonth()]} ${c.date.getFullYear()}`,
					days: 1,
				});
			}
		}
		return acc;
	}, [headerCells]);

	return (
		<main className="relative z-10 flex flex-1 flex-col overflow-hidden">
			{/* Toolbar : zoom + meta */}
			<div className="gantt-toolbar">
				<div className="gantt-toolbar-meta">
					<b>{cards.length}</b> {cards.length > 1 ? "cartes" : "carte"}
					{" · "}
					{rangeLabel}
				</div>
				<fieldset className="gantt-zoom" aria-label="Niveau de zoom">
					<legend className="sr-only">Niveau de zoom</legend>
					{ZOOM_LEVELS.map((z) => (
						<button
							key={z.id}
							type="button"
							onClick={() => setZoom(z.id)}
							className={zoom === z.id ? "is-active" : ""}
							aria-pressed={zoom === z.id}
						>
							{z.label}
						</button>
					))}
				</fieldset>
			</div>

			<div className="gantt-wrap">
				<div className={`gantt zoom-${zoom}`}>
					{/* Rail gauche */}
					<aside className="gantt-rail">
						<div className="gantt-rail-head">
							<div className="label">
								<b>{cards.length}</b> tâches · {groups.length} liste
								{groups.length > 1 ? "s" : ""}
							</div>
							<div className="range">{rangeLabel}</div>
						</div>
						<div className="gantt-rail-body" id="gantt-rail-body">
							{cards.length === 0 ? (
								<div className="gantt-empty">
									<div className="gantt-empty-eyebrow">Timeline vide</div>
									<div className="gantt-empty-title">Aucune carte</div>
									<p className="gantt-empty-body">
										Ajoute des cartes au board pour les voir apparaître sur la
										frise.
									</p>
								</div>
							) : (
								groups.map((g) => (
									<div key={g.listId}>
										<div className="gantt-rail-group">
											<span className="grp-dot" aria-hidden="true" />
											<span className="grp-name">{g.label}</span>
											<span className="grp-count">{g.items.length}</span>
										</div>
										{g.items.map((card) => (
											<button
												type="button"
												key={card._id}
												className={`gantt-rail-row ${card.completed ? "is-done" : ""}`}
												onClick={() => handleCardClick(card._id)}
											>
												<span className="av" aria-hidden="true">
													{card.title.slice(0, 2).toUpperCase()}
												</span>
												<div className="info">
													<span className="row-id">
														{card._id.slice(-6).toUpperCase()}
													</span>
													<span className="row-title">{card.title}</span>
												</div>
												{card.dueDate && (
													<span className="row-meta">
														{formatDate(card.dueDate)}
													</span>
												)}
											</button>
										))}
									</div>
								))
							)}
						</div>
					</aside>

					{/* Canvas droit */}
					<div className="gantt-canvas">
						{/* Time scale */}
						<div className="gantt-timehead" style={{ minWidth: `${totalW}px` }}>
							<div className="gantt-timehead-top">
								{monthGroups.map((m) => (
									<div
										key={m.key}
										className="gth-month"
										style={{ width: `${m.days * dayWidth}px` }}
									>
										{m.label}
									</div>
								))}
							</div>
							<div className="gantt-timehead-bot">
								{headerCells.map((c, idx) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: positional cell list is stable across renders
										key={idx}
										className={`gth-cell ${c.isWeekend ? "is-weekend" : ""} ${c.isToday ? "is-today" : ""}`}
									>
										{zoom !== "months" && (
											<span className="dow">
												{FRENCH_DOWS[c.date.getDay()]}
											</span>
										)}
										<span className="num">{c.date.getDate()}</span>
									</div>
								))}
							</div>
						</div>

						{/* Body : barres + couches superposées */}
						<div
							className="gantt-canvas-body"
							style={{ minWidth: `${totalW}px` }}
						>
							{/* TODO: dépendances entre cartes — pas de champ deps au schéma */}
							<svg
								className="gantt-deps"
								width={totalW}
								height={1}
								aria-hidden="true"
							>
								<title>Dépendances entre cartes</title>
							</svg>

							{groups.map((g) => (
								<div key={g.listId}>
									{/* Header de groupe (côté canvas, juste un fond rayé) */}
									<div className="gantt-canvas-group">
										<div className="canvas-row-bg">
											{headerCells.map((c, idx) => (
												<div
													// biome-ignore lint/suspicious/noArrayIndexKey: bg columns mirror positional header cells
													key={idx}
													className={`col-bg ${c.isWeekend ? "is-weekend" : ""} ${c.isToday ? "is-today" : ""}`}
												/>
											))}
										</div>
									</div>

									{g.items.map((card) => {
										const span = deriveSpan(card);
										const startIdx = daysBetween(range.start, span.start);
										const endIdx = daysBetween(range.start, span.end);
										const x = startIdx * dayWidth;
										const w = Math.max(
											dayWidth,
											(endIdx - startIdx + 1) * dayWidth,
										);
										const p = progressFor(card, span);
										const fillW = w * p;
										const isOverdue =
											!card.completed &&
											card.dueDate !== undefined &&
											card.dueDate < todayMs;
										const tooltip = `${card.title} · ${formatDate(span.start)} → ${formatDate(span.end)}`;
										const isMilestone = card.completed === true;
										return (
											<div className="gantt-canvas-row" key={card._id}>
												{/* Fond colonnes */}
												<div className="canvas-row-bg">
													{headerCells.map((c, idx) => (
														<div
															// biome-ignore lint/suspicious/noArrayIndexKey: bg columns mirror positional header cells
															key={idx}
															className={`col-bg ${c.isWeekend ? "is-weekend" : ""} ${c.isToday ? "is-today" : ""}`}
														/>
													))}
												</div>
												{/* Barre */}
												<button
													type="button"
													className={`gantt-bar ${card.completed ? "is-done" : ""} ${isOverdue ? "is-overdue" : ""}`}
													style={{ left: `${x}px`, width: `${w}px` }}
													data-tooltip={tooltip}
													title={tooltip}
													onClick={() => handleCardClick(card._id)}
												>
													<span
														className="fill"
														style={{ width: `${fillW}px` }}
														aria-hidden="true"
													/>
													<span className="bar-content">
														<span className="bar-title">{card.title}</span>
													</span>
													<span className="bar-progress">
														{Math.round(p * 100)}%
													</span>
												</button>
												{/* Milestone : carte terminée → diamant à l'extrémité */}
												{isMilestone && (
													<div
														className="gantt-milestone"
														style={{ left: `${x + w - 8}px` }}
														data-label={`${card.title} · terminée`}
														aria-hidden="true"
													/>
												)}
											</div>
										);
									})}
								</div>
							))}

							{/* Ligne today */}
							{todayInRange && (
								<div
									className="gantt-today-line"
									style={{ left: `${todayX}px` }}
								>
									<span className="gantt-today-flag">aujourd'hui</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{openCard && (
				<CardDetailModal
					card={openCard}
					open={openCardId !== null}
					onOpenChange={(open) => {
						if (!open) setOpenCardId(null);
					}}
				/>
			)}
		</main>
	);
}
