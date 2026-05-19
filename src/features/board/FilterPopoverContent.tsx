import { CheckCircle2, Eye } from "lucide-react";
import { Input } from "#/components/ui/input";
import { labelStyle } from "#/lib/board-constants";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export function FilterPopoverContent({
	query,
	setQuery,
	labelIds,
	setLabelIds,
	boardLabels,
	colorBlind,
	setColorBlind,
}: {
	query: string;
	setQuery: (v: string) => void;
	labelIds: Array<Id<"labels">>;
	setLabelIds: (v: Array<Id<"labels">>) => void;
	boardLabels: Array<Doc<"labels">>;
	colorBlind: boolean;
	setColorBlind: (v: boolean) => void;
}) {
	function toggleLabel(labelId: Id<"labels">) {
		if (labelIds.includes(labelId)) {
			setLabelIds(labelIds.filter((id) => id !== labelId));
		} else {
			setLabelIds([...labelIds, labelId]);
		}
	}

	function clearAll() {
		setQuery("");
		setLabelIds([]);
	}

	const hasActive = query.trim() !== "" || labelIds.length > 0;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-[#172b4d]">Filtrer</h4>
				{hasActive && (
					<button
						type="button"
						onClick={clearAll}
						className="text-xs text-[#0c66e4] hover:underline"
					>
						Effacer
					</button>
				)}
			</div>

			<div>
				<label
					htmlFor="filter-query"
					className="text-[10px] font-semibold uppercase text-[#6b6e76]"
				>
					Mot-clé
				</label>
				<Input
					id="filter-query"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Filtrer par titre..."
					className="mt-1 h-8 text-sm"
				/>
			</div>

			<div>
				<span className="text-[10px] font-semibold uppercase text-[#6b6e76]">
					Étiquettes
				</span>
				{boardLabels.length === 0 ? (
					<p className="mt-1 text-xs text-[#6b6e76]">
						Aucune étiquette dans ce tableau.
					</p>
				) : (
					<ul className="mt-1 space-y-0.5">
						{boardLabels.map((label) => {
							const s = labelStyle(label.color);
							const active = labelIds.includes(label._id);
							return (
								<li key={label._id}>
									<button
										type="button"
										onClick={() => toggleLabel(label._id)}
										className="flex w-full items-center gap-2 rounded p-1 hover:bg-[#091e4214]"
									>
										<span
											data-label-color={label.color}
											className={`inline-flex h-5 flex-1 items-center truncate rounded-[3px] px-2 text-[12px] font-medium ${s.bg} ${s.fg}`}
										>
											{label.text || label.color}
										</span>
										{active && (
											<CheckCircle2 className="h-4 w-4 shrink-0 text-[#0c66e4]" />
										)}
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<div className="border-t border-[#091e4224] pt-2">
				<label className="flex cursor-pointer items-center gap-2 text-xs text-[#172b4d]">
					<input
						type="checkbox"
						checked={colorBlind}
						onChange={(e) => setColorBlind(e.target.checked)}
						className="h-3.5 w-3.5"
					/>
					<Eye className="h-3.5 w-3.5" />
					Mode daltonien (motifs sur étiquettes)
				</label>
			</div>
		</div>
	);
}
