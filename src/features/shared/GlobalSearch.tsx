import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Check, LayoutGrid, Search, X } from "lucide-react";
import { gradientFor } from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";

// Recherche globale : champ + menu déroulant de résultats (tableaux + cartes).
export function GlobalSearch({
	variant = "light",
}: {
	variant?: "light" | "dark";
}) {
	const navigate = useNavigate();
	const [term, setTerm] = useState("");
	const [debounced, setDebounced] = useState("");
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const t = setTimeout(() => setDebounced(term), 220);
		return () => clearTimeout(t);
	}, [term]);

	const results = useQuery(
		api.search.globalSearch,
		debounced.trim().length >= 2 ? { term: debounced } : "skip",
	);

	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, []);

	const isDark = variant === "dark";
	const ready = term.trim().length >= 2;
	const showDropdown = open && ready;

	function goToBoard(boardId: string) {
		setOpen(false);
		setTerm("");
		navigate({ to: "/boards/$boardId", params: { boardId } });
	}

	const empty =
		results &&
		results.boards.length === 0 &&
		results.cards.length === 0;

	return (
		<div ref={containerRef} className="relative w-full">
			<Search
				className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
					isDark ? "text-white/60" : "text-[#8993a4]"
				}`}
			/>
			<input
				type="text"
				value={term}
				onChange={(e) => {
					setTerm(e.target.value);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						setOpen(false);
						(e.target as HTMLInputElement).blur();
					}
				}}
				placeholder="Rechercher un tableau, une carte…"
				className={`h-9 w-full rounded-md pl-9 pr-8 text-sm transition-colors focus:outline-none ${
					isDark
						? "border border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15"
						: "border border-[#dfe1e6] bg-[#f7f8fa] text-[#172b4d] placeholder:text-[#8993a4] focus:border-[#0c66e4] focus:bg-white focus:ring-[3px] focus:ring-[#0c66e4]/15"
				}`}
			/>
			{term && (
				<button
					type="button"
					onClick={() => {
						setTerm("");
						setOpen(false);
					}}
					className={`absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded ${
						isDark
							? "text-white/70 hover:bg-white/15"
							: "text-[#626f86] hover:bg-[#091e420f]"
					}`}
					aria-label="Effacer"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			)}

			{showDropdown && (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[420px] overflow-y-auto rounded-xl border border-[#091e4224] bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(9,30,66,0.4)]">
					{results === undefined && (
						<div className="px-3 py-6 text-center text-[13px] text-[#626f86]">
							Recherche…
						</div>
					)}

					{empty && (
						<div className="px-3 py-6 text-center text-[13px] text-[#626f86]">
							Aucun résultat pour «&nbsp;{term.trim()}&nbsp;».
						</div>
					)}

					{results && results.boards.length > 0 && (
						<div className="mb-1">
							<div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#8993a4]">
								Tableaux
							</div>
							{results.boards.map((b) => (
								<button
									key={b._id}
									type="button"
									onClick={() => goToBoard(b._id)}
									className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[#091e420a]"
								>
									<span
										className={`h-7 w-9 shrink-0 rounded ${
											b.backgroundImage
												? "bg-[#dfe1e6]"
												: `bg-gradient-to-br ${gradientFor(b.color)}`
										}`}
									/>
									<span className="truncate text-[14px] text-[#172b4d]">
										{b.name}
									</span>
								</button>
							))}
						</div>
					)}

					{results && results.cards.length > 0 && (
						<div>
							<div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#8993a4]">
								Cartes
							</div>
							{results.cards.map((c) => (
								<button
									key={c._id}
									type="button"
									onClick={() => goToBoard(c.boardId)}
									className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[#091e420a]"
								>
									<span
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
											c.completed
												? "bg-[#dcfff1] text-[#22a06b]"
												: "bg-[#e9f2ff] text-[#0c66e4]"
										}`}
									>
										{c.completed ? (
											<Check className="h-3.5 w-3.5" strokeWidth={3} />
										) : (
											<LayoutGrid className="h-3.5 w-3.5" />
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[14px] text-[#172b4d]">
											{c.title}
										</span>
										<span className="block truncate text-[12px] text-[#626f86]">
											{c.boardName}
										</span>
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
