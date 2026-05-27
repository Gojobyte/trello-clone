import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { dueDateState } from "#/lib/board-helpers";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card/CardDetailModal";

// Vue Calendrier — Lume Éclat v3 (Phase 3c)
// Grille mensuelle 7×6 (lundi → dimanche) avec les cartes positionnées
// sur leur dueDate. Toolbar avec mois en serif italique + année mono,
// nav prev/today/next, tabs Month/Week/Agenda (Week/Agenda stub),
// option heatmap pour la densité.
export function CalendarView({
	cards,
	lists: _lists,
}: {
	cards: Array<Doc<"cards">>;
	lists: Array<Doc<"lists">>;
}) {
	const [currentMonth, setCurrentMonth] = useState(() => {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), 1);
	});
	const [openCardId, setOpenCardId] = useState<Id<"cards"> | null>(null);
	const [showHeatmap, setShowHeatmap] = useState(false);

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();

	// Construit toujours 6 lignes × 7 colonnes pour stabilité visuelle,
	// avec les jours hors-mois (prev/next) affichés en grisé.
	const cells = useMemo<Array<Date>>(() => {
		const first = new Date(year, month, 1);
		const startDow = (first.getDay() + 6) % 7; // lundi = 0
		const gridStart = new Date(year, month, 1 - startDow);
		const out: Array<Date> = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(gridStart);
			d.setDate(gridStart.getDate() + i);
			out.push(d);
		}
		return out;
	}, [year, month]);

	// Indexe les cartes par jour (clé "YYYY-M-D")
	const cardsByDay = useMemo(() => {
		const map = new Map<string, Array<Doc<"cards">>>();
		for (const card of cards) {
			if (!card.dueDate) continue;
			const d = new Date(card.dueDate);
			const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key)?.push(card);
		}
		return map;
	}, [cards]);

	const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long" });
	const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
	// Clés stables (lun..dim) avec label affiché (1 lettre, mode mono uppercase)
	const dayLabels: Array<{ key: string; label: string; isWeekend: boolean }> = [
		{ key: "lun", label: "L", isWeekend: false },
		{ key: "mar", label: "M", isWeekend: false },
		{ key: "mer", label: "M", isWeekend: false },
		{ key: "jeu", label: "J", isWeekend: false },
		{ key: "ven", label: "V", isWeekend: false },
		{ key: "sam", label: "S", isWeekend: true },
		{ key: "dim", label: "D", isWeekend: true },
	];
	const today = new Date();
	const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
	const totalTasks = cards.filter((c) => c.dueDate).length;

	const openCard = openCardId ? cards.find((c) => c._id === openCardId) : null;

	const goPrev = () => setCurrentMonth(new Date(year, month - 1, 1));
	const goNext = () => setCurrentMonth(new Date(year, month + 1, 1));
	const goToday = () => {
		const d = new Date();
		setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
	};

	// Niveau de heatmap (0 = aucun, 5 = très chargé)
	const heatLevel = (n: number): number => {
		if (n === 0) return 0;
		if (n === 1) return 1;
		if (n === 2) return 2;
		if (n === 3) return 3;
		if (n === 4) return 4;
		return 5;
	};

	return (
		<main className="cal-wrap">
			<div className="cal-card">
				{/* Toolbar */}
				<div className="cal-bar">
					<div className="cal-month">
						<span>
							<em className="serif-italic">{monthLabel}</em>
						</span>
						<span className="yr">{year}</span>
						<span className="yr" aria-hidden="true">
							·
						</span>
						<span className="yr">
							{totalTasks} {totalTasks > 1 ? "tâches" : "tâche"}
						</span>
					</div>

					<div className="cal-subviews">
						<button
							type="button"
							className="cal-subview-btn is-active"
							aria-pressed="true"
						>
							Mois
						</button>
						<button
							type="button"
							className="cal-subview-btn"
							disabled
							title="Vue Semaine — bientôt"
							aria-pressed="false"
						>
							Semaine
						</button>
						<button
							type="button"
							className="cal-subview-btn"
							disabled
							title="Vue Agenda — bientôt"
							aria-pressed="false"
						>
							Agenda
						</button>
					</div>

					<div className="cal-nav">
						<button
							type="button"
							onClick={() => setShowHeatmap((v) => !v)}
							className={`cal-heat-toggle${showHeatmap ? " is-on" : ""}`}
							aria-pressed={showHeatmap}
							title="Activer/désactiver la densité (heatmap)"
						>
							<Flame />
							<span>Densité</span>
						</button>
						<button type="button" onClick={goPrev} aria-label="Mois précédent">
							<ChevronLeft />
						</button>
						<button
							type="button"
							className="today-btn"
							onClick={goToday}
							aria-label="Aller à aujourd'hui"
						>
							Aujourd'hui
						</button>
						<button type="button" onClick={goNext} aria-label="Mois suivant">
							<ChevronRight />
						</button>
					</div>
				</div>

				{/* DOW header */}
				<div className="cal-dows">
					{dayLabels.map((d) => (
						<div key={d.key} className={d.isWeekend ? "is-weekend" : ""}>
							{d.label}
						</div>
					))}
				</div>

				{/* Month grid 7×6 */}
				<div className="cal-month-grid">
					{cells.map((date) => {
						const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
						const dayCards = cardsByDay.get(key) ?? [];
						const isOther = date.getMonth() !== month;
						const isToday = key === todayKey;
						const isWeekend = date.getDay() === 0 || date.getDay() === 6;
						const cellDate = new Date(date);
						cellDate.setHours(0, 0, 0, 0);
						const todayMid = new Date(today);
						todayMid.setHours(0, 0, 0, 0);
						const isPast = cellDate < todayMid && !isToday;

						const visibleCards = dayCards.slice(0, 3);
						const extra = dayCards.length - visibleCards.length;
						const lvl = showHeatmap ? heatLevel(dayCards.length) : 0;

						const classes = [
							"cal-cell",
							isOther ? "is-other-month" : "",
							isToday ? "is-today" : "",
							isWeekend && !isOther ? "is-weekend" : "",
							isPast && !isOther ? "is-past" : "",
							lvl ? `heat-${lvl}` : "",
						]
							.filter(Boolean)
							.join(" ");

						return (
							<div key={key} className={classes}>
								<div className="cal-cell-head">
									<span className="day-num">{date.getDate()}</span>
									{dayCards.length >= 3 && (
										<span className="day-meta">
											<b>{dayCards.length}</b>{" "}
											{dayCards.length > 1 ? "tâches" : "tâche"}
										</span>
									)}
								</div>

								{visibleCards.map((c) => {
									const state = c.dueDate
										? dueDateState(c.dueDate, c.dueDateCompleted ?? false)
										: "normal";
									const evClasses = [
										"cal-event",
										c.completed || state === "completed" ? "is-done" : "",
										state === "completed" ? "is-completed" : "",
										state === "overdue" ? "is-overdue" : "",
										state === "soon" ? "is-soon" : "",
									]
										.filter(Boolean)
										.join(" ");

									return (
										<button
											type="button"
											key={c._id}
											onClick={() => setOpenCardId(c._id)}
											className={evClasses}
											title={c.title}
										>
											<span className="ev-title">{c.title}</span>
										</button>
									);
								})}

								{extra > 0 && (
									<button
										type="button"
										className="ev-more"
										onClick={() => {
											// Ouvre la première carte cachée — UX simple pour l'instant
											const firstHidden = dayCards[3];
											if (firstHidden) setOpenCardId(firstHidden._id);
										}}
									>
										+ {extra} de plus
									</button>
								)}
							</div>
						);
					})}
				</div>

				{showHeatmap && (
					<div className="cal-heat-legend" aria-hidden="true">
						<span>calme</span>
						<span className="scale">
							<span />
							<span className="heat-1" />
							<span className="heat-2" />
							<span className="heat-3" />
							<span className="heat-4" />
							<span className="heat-5" />
						</span>
						<span>chargé</span>
					</div>
				)}
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
