import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { dueDateState } from "#/lib/board-helpers";
import { DUE_DATE_STYLES } from "#/lib/board-constants";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card/CardDetailModal";

// Vue Calendrier : grille mensuelle avec les cartes positionnées sur dueDate
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

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
	const daysInMonth = lastDay.getDate();
	const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

	const cells: Array<Date | null> = [];
	for (let i = 0; i < totalCells; i++) {
		if (i < firstDayOfWeek || i >= firstDayOfWeek + daysInMonth) {
			cells.push(null);
		} else {
			cells.push(new Date(year, month, i - firstDayOfWeek + 1));
		}
	}

	const cardsByDay = new Map<string, Array<Doc<"cards">>>();
	for (const card of cards) {
		if (!card.dueDate) continue;
		const d = new Date(card.dueDate);
		const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
		if (!cardsByDay.has(key)) cardsByDay.set(key, []);
		cardsByDay.get(key)?.push(card);
	}

	const monthLabel = currentMonth.toLocaleDateString("fr-FR", {
		month: "long",
		year: "numeric",
	});
	const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
	const todayStr = new Date().toDateString();
	const openCard = openCardId ? cards.find((c) => c._id === openCardId) : null;

	return (
		<main className="relative z-10 flex-1 overflow-y-auto bg-[#f7f8f9] px-6 py-6 pb-24">
			<div className="mx-auto max-w-6xl">
				<div className="mb-4 flex items-center justify-between rounded-lg border border-[#091e4224] bg-white px-4 py-3 shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f]">
					<h2 className="text-lg font-semibold capitalize text-[#172b4d]">
						{monthLabel}
					</h2>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
							className="flex h-8 w-8 items-center justify-center rounded-md text-[#44546f] transition-colors hover:bg-[#091e4214] hover:text-[#172b4d]"
							aria-label="Mois précédent"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => {
								const d = new Date();
								setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
							}}
							className="h-8 rounded-md bg-[#091e4214] px-3 text-xs font-medium text-[#172b4d] transition-colors hover:bg-[#091e4224]"
						>
							Aujourd'hui
						</button>
						<button
							type="button"
							onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
							className="flex h-8 w-8 items-center justify-center rounded-md text-[#44546f] transition-colors hover:bg-[#091e4214] hover:text-[#172b4d]"
							aria-label="Mois suivant"
						>
							<ArrowRight className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-[#091e4224] bg-white shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f]">
					<div className="grid grid-cols-7 border-b border-[#091e4224] bg-[#f7f8f9]">
						{dayLabels.map((label) => (
							<div
								key={label}
								className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b6e76]"
							>
								{label}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7 gap-px bg-[#091e4214]">
						{cells.map((date, idx) => {
							if (!date) {
								return (
									<div key={idx} className="min-h-[120px] bg-[#fafbfc]" />
								);
							}
							const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
							const dayCards = cardsByDay.get(key) ?? [];
							const isToday = date.toDateString() === todayStr;
							const visibleCards = dayCards.slice(0, 3);
							const extraCount = dayCards.length - visibleCards.length;
							return (
								<div
									key={idx}
									className={`min-h-[120px] bg-white p-1.5 transition-colors hover:bg-[#f7f8f9] ${isToday ? "bg-[#f0f7ff]" : ""}`}
								>
									<div
										className={`mb-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
											isToday
												? "bg-[#0c66e4] font-bold text-white shadow-sm"
												: "text-[#172b4d]"
										}`}
									>
										{date.getDate()}
									</div>
									<div className="space-y-1">
										{visibleCards.map((c) => {
											const state = c.dueDate
												? dueDateState(
														c.dueDate,
														c.dueDateCompleted ?? false,
													)
												: "normal";
											const style = DUE_DATE_STYLES[state];
											const bgClass = c.completed
												? "bg-[#dcfff1] text-[#216e4e] line-through"
												: state === "overdue"
													? style.bg + " " + style.fg
													: state === "soon"
														? style.bg + " " + style.fg
														: "bg-[#f0f1f2] text-[#172b4d]";
											return (
												<button
													type="button"
													key={c._id}
													onClick={() => setOpenCardId(c._id)}
													className={`block w-full truncate rounded-[3px] px-1.5 py-0.5 text-left text-[11px] font-medium shadow-sm transition-all hover:translate-x-px hover:shadow ${bgClass}`}
													title={c.title}
												>
													{c.title}
												</button>
											);
										})}
										{extraCount > 0 && (
											<div className="pt-0.5 text-[10px] font-medium text-[#6b6e76]">
												+ {extraCount} autre{extraCount > 1 ? "s" : ""}
											</div>
										)}
									</div>
								</div>
							);
						})}
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
