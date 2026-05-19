import { useQuery } from "convex/react";
import {
	AlertCircle,
	CheckCircle2,
	Circle,
	Clock,
} from "lucide-react";
import { useState } from "react";
import {
	dueDateState,
	formatDueDate,
} from "#/lib/board-helpers";
import { DUE_DATE_STYLES, labelStyle } from "#/lib/board-constants";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card/CardDetailModal";

// Vue Tableau : toutes les cartes du board en table avec colonnes triables
export function TableView({
	cards,
	lists,
	boardId,
}: {
	cards: Array<Doc<"cards">>;
	lists: Array<Doc<"lists">>;
	boardId: Id<"boards">;
}) {
	const boardLabels = useQuery(api.labels.listForBoard, { boardId });
	const [openCardId, setOpenCardId] = useState<Id<"cards"> | null>(null);
	const [sortKey, setSortKey] = useState<"title" | "list" | "dueDate">("title");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	const listById = new Map(lists.map((l) => [l._id, l]));
	const labelById = new Map((boardLabels ?? []).map((l) => [l._id, l]));

	const sorted = [...cards].sort((a, b) => {
		let cmp = 0;
		if (sortKey === "title") cmp = a.title.localeCompare(b.title);
		else if (sortKey === "list")
			cmp = (listById.get(a.listId)?.name ?? "").localeCompare(
				listById.get(b.listId)?.name ?? "",
			);
		else if (sortKey === "dueDate")
			cmp =
				(a.dueDate ?? Number.POSITIVE_INFINITY) -
				(b.dueDate ?? Number.POSITIVE_INFINITY);
		return sortDir === "asc" ? cmp : -cmp;
	});

	function toggleSort(key: typeof sortKey) {
		if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	}

	const openCard = openCardId ? cards.find((c) => c._id === openCardId) : null;
	const arrow = (key: typeof sortKey) =>
		sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "";

	return (
		<main className="relative z-10 flex-1 overflow-y-auto bg-[#f7f8f9] px-6 py-6 pb-24">
			<div className="mx-auto max-w-6xl">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-base font-semibold text-[#172b4d]">
						{sorted.length} carte{sorted.length > 1 ? "s" : ""}
					</h2>
				</div>
				<div className="overflow-hidden rounded-lg border border-[#091e4224] bg-white shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f]">
					<table className="w-full border-collapse text-sm">
						<thead className="bg-[#f7f8f9]">
							<tr className="border-b border-[#091e4224] text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b6e76]">
								<th className="w-12 px-3 py-3 text-center">État</th>
								<th
									className="cursor-pointer px-3 py-3 transition-colors hover:text-[#172b4d]"
									onClick={() => toggleSort("title")}
								>
									Titre <span className="text-[#0c66e4]">{arrow("title")}</span>
								</th>
								<th
									className="cursor-pointer px-3 py-3 transition-colors hover:text-[#172b4d]"
									onClick={() => toggleSort("list")}
								>
									Liste <span className="text-[#0c66e4]">{arrow("list")}</span>
								</th>
								<th className="px-3 py-3">Étiquettes</th>
								<th
									className="cursor-pointer px-3 py-3 transition-colors hover:text-[#172b4d]"
									onClick={() => toggleSort("dueDate")}
								>
									Échéance{" "}
									<span className="text-[#0c66e4]">{arrow("dueDate")}</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{sorted.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="px-3 py-12 text-center text-sm text-[#6b6e76]"
									>
										Aucune carte à afficher.
									</td>
								</tr>
							)}
							{sorted.map((card) => (
								<tr
									key={card._id}
									onClick={() => setOpenCardId(card._id)}
									onKeyDown={(e) => {
										if (e.key === "Enter") setOpenCardId(card._id);
									}}
									tabIndex={0}
									className="cursor-pointer border-b border-[#091e4214] transition-colors last:border-b-0 hover:bg-[#f7f8f9]"
								>
									<td className="px-3 py-3 text-center">
										{card.completed ? (
											<CheckCircle2 className="inline h-5 w-5 text-[#22A06B]" />
										) : (
											<Circle className="inline h-5 w-5 text-[#6B6E76]" />
										)}
									</td>
									<td
										className={`px-3 py-3 font-medium ${card.completed ? "text-[#6b6e76] line-through" : "text-[#172b4d]"}`}
									>
										{card.title}
									</td>
									<td className="px-3 py-3">
										<span className="inline-flex items-center rounded bg-[#091e4214] px-2 py-0.5 text-xs font-medium text-[#44546f]">
											{listById.get(card.listId)?.name ?? "—"}
										</span>
									</td>
									<td className="px-3 py-3">
										<div className="flex flex-wrap gap-1">
											{(card.labelIds ?? []).map((id) => {
												const label = labelById.get(id);
												if (!label) return null;
												const s = labelStyle(label.color);
												return (
													<span
														key={id}
														data-label-color={label.color}
														className={`inline-flex h-5 max-w-[120px] items-center truncate rounded-[3px] px-2 text-[11px] font-medium ${s.bg} ${s.fg}`}
													>
														{label.text ?? ""}
													</span>
												);
											})}
											{(card.labelIds ?? []).length === 0 && (
												<span className="text-xs text-[#6b6e76]">—</span>
											)}
										</div>
									</td>
									<td className="px-3 py-3">
										{card.dueDate ? (
											(() => {
												const state = dueDateState(
													card.dueDate,
													card.dueDateCompleted ?? false,
												);
												const style = DUE_DATE_STYLES[state];
												const Icon =
													state === "completed"
														? CheckCircle2
														: state === "overdue"
															? AlertCircle
															: Clock;
												return (
													<span
														className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-xs font-semibold ${style.bg} ${style.fg}`}
													>
														<Icon className="h-3 w-3 shrink-0" />
														{formatDueDate(card.dueDate)}
													</span>
												);
											})()
										) : (
											<span className="text-xs text-[#6b6e76]">—</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
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
