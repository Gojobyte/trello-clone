import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import {
	Archive,
	ArrowRight,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	History,
	Image as ImageIcon,
	Inbox,
	Info,
	LayoutGrid,
	Link2,
	Pencil,
	Plus,
	Printer,
	Tag,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import {
	BOARD_GRADIENTS,
	BOARD_PHOTOS,
} from "#/lib/board-backgrounds";
import { LABEL_COLORS, actionLabel, labelStyle } from "#/lib/board-constants";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

// Menu kebab du board (à droite du bouton Partager dans le sub-header)
export type BoardMenuPanel =
	| "main"
	| "about"
	| "background"
	| "activity"
	| "labels"
	| "archived"
	| "move";

export function BoardMenu({
	board,
	onClose,
}: {
	board: Doc<"boards">;
	onClose: () => void;
}) {
	const [panel, setPanel] = useState<BoardMenuPanel>("main");

	if (panel === "main")
		return <BoardMenuMain board={board} onClose={onClose} setPanel={setPanel} />;
	if (panel === "about")
		return <BoardAboutPanel board={board} onBack={() => setPanel("main")} />;
	if (panel === "background")
		return (
			<BoardBackgroundPanel board={board} onBack={() => setPanel("main")} />
		);
	if (panel === "activity")
		return <BoardActivityPanel board={board} onBack={() => setPanel("main")} />;
	if (panel === "labels")
		return <BoardLabelsPanel board={board} onBack={() => setPanel("main")} />;
	if (panel === "move")
		return (
			<BoardMoveToWorkspacePanel
				board={board}
				onBack={() => setPanel("main")}
			/>
		);
	return (
		<BoardArchivedCardsPanel board={board} onBack={() => setPanel("main")} />
	);
}

function BoardMenuMain({
	board,
	onClose,
	setPanel,
}: {
	board: Doc<"boards">;
	onClose: () => void;
	setPanel: (p: BoardMenuPanel) => void;
}) {
	const navigate = useNavigate();
	const removeBoard = useMutation(api.boards.remove);
	const duplicateBoard = useMutation(api.boards.duplicate);
	const boardData = useQuery(api.boards.get, { boardId: board._id });

	async function handleDelete() {
		if (
			confirm(
				`Supprimer définitivement le tableau "${board.name}" et toutes ses listes/cartes ?`,
			)
		) {
			await removeBoard({ boardId: board._id });
			onClose();
			void navigate({ to: "/boards" });
		}
	}

	async function handleDuplicate() {
		const newId = await duplicateBoard({ boardId: board._id });
		onClose();
		void navigate({
			to: "/boards/$boardId",
			params: { boardId: newId as string },
		});
	}

	function handleCopyUrl() {
		const url = `${window.location.origin}/boards/${board._id}`;
		void navigator.clipboard.writeText(url);
		onClose();
	}

	function handlePrint() {
		onClose();
		window.print();
	}

	function handleExport() {
		if (!boardData) return;
		const data = {
			board: {
				name: boardData.board.name,
				description: boardData.board.description,
				color: boardData.board.color,
				backgroundImage: boardData.board.backgroundImage,
				exportedAt: new Date().toISOString(),
			},
			lists: boardData.lists.map((l) => ({
				name: l.name,
				position: l.position,
				cards: boardData.cards
					.filter((c) => c.listId === l._id)
					.map((c) => ({
						title: c.title,
						description: c.description,
						completed: c.completed ?? false,
						dueDate: c.dueDate ? new Date(c.dueDate).toISOString() : null,
						position: c.position,
					})),
			})),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${board.name.replace(/[^a-z0-9]/gi, "_")}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		onClose();
	}

	function handleExportCSV() {
		if (!boardData) return;
		const rows: Array<Array<string>> = [
			["Liste", "Carte", "Description", "Terminée", "Échéance"],
		];
		for (const l of boardData.lists) {
			const listCards = boardData.cards
				.filter((c) => c.listId === l._id)
				.sort((a, b) => a.position - b.position);
			for (const c of listCards) {
				rows.push([
					l.name,
					c.title,
					c.description ?? "",
					c.completed ? "oui" : "non",
					c.dueDate
						? new Date(c.dueDate).toLocaleDateString("fr-FR")
						: "",
				]);
			}
		}
		// Échappement CSV : chaque champ entre guillemets, guillemets internes doublés.
		const csv = rows
			.map((r) =>
				r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			)
			.join("\r\n");
		// BOM UTF-8 pour qu'Excel lise correctement les accents.
		const blob = new Blob([`﻿${csv}`], {
			type: "text/csv;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${board.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		onClose();
	}

	const accentHex = board.color
		? (BOARD_GRADIENTS.find((g) => g.id === board.color)?.hex ?? "#0c66e4")
		: "#0c66e4";

	return (
		<div>
			<header className="relative border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-4 py-3">
				<div className="flex items-center gap-2.5">
					<div
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
						style={{ backgroundColor: accentHex }}
					>
						<LayoutGrid className="h-4 w-4" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold text-[#172b4d]">
							{board.name}
						</div>
						<div className="text-[11px] text-[#6b6e76]">Menu du tableau</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1.5 text-[#6b6e76] transition-colors hover:bg-[#091e4214] hover:text-[#172b4d]"
						aria-label="Fermer"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</header>

			<div className="max-h-[60vh] overflow-y-auto px-2 py-2">
				<BoardMenuItem
					icon={<Info />}
					onClick={() => setPanel("about")}
					hasSubPanel
				>
					À propos de ce tableau
				</BoardMenuItem>
				<BoardMenuItem
					icon={<History />}
					onClick={() => setPanel("activity")}
					hasSubPanel
				>
					Activité
				</BoardMenuItem>
				<BoardMenuItem
					icon={<Archive />}
					onClick={() => setPanel("archived")}
					hasSubPanel
				>
					Cartes archivées
				</BoardMenuItem>

				<MenuSectionTitle>Personnaliser</MenuSectionTitle>
				<BoardMenuItem
					icon={<ImageIcon />}
					onClick={() => setPanel("background")}
					hasSubPanel
				>
					Modifier l'arrière-plan
				</BoardMenuItem>
				<BoardMenuItem
					icon={<Tag />}
					onClick={() => setPanel("labels")}
					hasSubPanel
				>
					Étiquettes du tableau
				</BoardMenuItem>

				<MenuSectionTitle>Actions</MenuSectionTitle>
				<BoardMenuItem
					icon={<ArrowRight />}
					onClick={() => setPanel("move")}
					hasSubPanel
				>
					Déplacer dans un espace
				</BoardMenuItem>
				<BoardMenuItem icon={<Copy />} onClick={() => void handleDuplicate()}>
					Copier ce tableau
				</BoardMenuItem>
				<BoardMenuItem icon={<Link2 />} onClick={handleCopyUrl}>
					Copier le lien
				</BoardMenuItem>
				<BoardMenuItem icon={<Printer />} onClick={handlePrint}>
					Imprimer
				</BoardMenuItem>
				<BoardMenuItem icon={<Download />} onClick={handleExport}>
					Exporter en JSON
				</BoardMenuItem>
				<BoardMenuItem icon={<Download />} onClick={handleExportCSV}>
					Exporter en CSV
				</BoardMenuItem>
			</div>

			<div className="border-t border-[#091e4224] bg-[#fafbfc] px-2 py-2">
				<BoardMenuItem
					icon={<Trash2 />}
					onClick={() => void handleDelete()}
					danger
				>
					Supprimer définitivement
				</BoardMenuItem>
			</div>
		</div>
	);
}

function MenuSectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="mt-3 mb-1 flex items-center gap-2 px-2">
			<span className="text-[10px] font-bold uppercase tracking-wider text-[#6b6e76]">
				{children}
			</span>
			<div className="h-px flex-1 bg-[#091e4224]" />
		</div>
	);
}

function BoardMenuItem({
	icon,
	children,
	onClick,
	danger = false,
	hasSubPanel = false,
}: {
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick: () => void;
	danger?: boolean;
	hasSubPanel?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`group/menu-item flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-all ${
				danger
					? "text-[#ae2e24] hover:bg-[#ffeceb]"
					: "text-[#172b4d] hover:bg-[#091e420a]"
			}`}
		>
			<span
				className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors [&_svg]:h-4 [&_svg]:w-4 ${
					danger
						? "bg-[#ffeceb] text-[#c9372c] group-hover/menu-item:bg-white"
						: "bg-[#f1f2f4] text-[#44546f] group-hover/menu-item:bg-white"
				}`}
			>
				{icon}
			</span>
			<span className="flex-1 font-medium">{children}</span>
			{hasSubPanel && (
				<ChevronRight className="h-4 w-4 shrink-0 text-[#6b6e76] opacity-0 transition-all group-hover/menu-item:translate-x-0.5 group-hover/menu-item:opacity-100" />
			)}
		</button>
	);
}

function BoardAboutPanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const updateDescription = useMutation(api.boards.updateDescription);
	const [draft, setDraft] = useState(board.description ?? "");
	const [editing, setEditing] = useState(false);

	async function save() {
		await updateDescription({ boardId: board._id, description: draft });
		setEditing(false);
	}

	return (
		<div>
			<header className="flex items-center border-b border-[#091e4224] px-3 py-2">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					À propos de ce tableau
				</span>
			</header>
			<div className="space-y-3 p-3">
				<div>
					<h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6e76]">
						Description du tableau
					</h5>
					{editing ? (
						<div className="mt-1 space-y-2">
							<Textarea
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								placeholder="Ajouter une description à votre tableau..."
								rows={4}
								// biome-ignore lint/a11y/noAutofocus: focus immédiat en mode édition
								autoFocus
								className="text-sm"
							/>
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={() => void save()}
									className="bg-[#0c66e4] hover:bg-[#0055cc]"
								>
									Enregistrer
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										setDraft(board.description ?? "");
										setEditing(false);
									}}
								>
									Annuler
								</Button>
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="mt-1 block w-full rounded bg-[#091e420a] p-2 text-left text-sm text-[#172b4d] hover:bg-[#091e4214]"
						>
							{board.description || (
								<span className="text-[#6b6e76]">
									Ajouter une description à votre tableau...
								</span>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

function BoardBackgroundPanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const updateBackground = useMutation(api.boards.updateBackground);

	return (
		<div>
			<header className="flex items-center border-b border-[#091e4224] px-3 py-2">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					Modifier l'arrière-plan
				</span>
			</header>
			<div className="space-y-3 p-3">
				<div>
					<h5 className="mb-1 text-[10px] font-semibold uppercase text-[#6b6e76]">
						Photos
					</h5>
					<div className="grid grid-cols-3 gap-1.5">
						{BOARD_PHOTOS.map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() =>
									void updateBackground({
										boardId: board._id,
										backgroundImage: p.id,
										color: undefined,
									})
								}
								className={`aspect-[4/3] overflow-hidden rounded transition-transform hover:scale-105 ${board.backgroundImage === p.id ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
								aria-label={p.label}
							>
								<img
									src={p.thumbnail}
									alt={p.label}
									className="h-full w-full object-cover"
								/>
							</button>
						))}
					</div>
				</div>
				<div>
					<h5 className="mb-1 text-[10px] font-semibold uppercase text-[#6b6e76]">
						Couleurs
					</h5>
					<div className="grid grid-cols-4 gap-1.5">
						{BOARD_GRADIENTS.map((g) => (
							<button
								key={g.id}
								type="button"
								onClick={() =>
									void updateBackground({
										boardId: board._id,
										color: g.id,
										backgroundImage: undefined,
									})
								}
								className={`h-10 rounded bg-gradient-to-br ${g.gradient} transition-transform hover:scale-105 ${board.color === g.id && !board.backgroundImage ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
								aria-label={g.label}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function BoardActivityPanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const activity = useQuery(api.activity.listForBoard, { boardId: board._id });

	return (
		<div>
			<header className="flex items-center border-b border-[#091e4224] px-3 py-2">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					Activité du tableau
				</span>
			</header>
			<div className="max-h-[400px] overflow-y-auto p-3">
				{activity === undefined ? (
					<p className="text-xs text-[#6b6e76]">Chargement...</p>
				) : activity.length === 0 ? (
					<p className="text-xs text-[#6b6e76]">
						Aucune activité pour l'instant.
					</p>
				) : (
					<ul className="space-y-2">
						{activity.map((a) => {
							const initial = a.userName.charAt(0).toUpperCase();
							const date = new Date(a._creationTime).toLocaleString("fr-FR", {
								dateStyle: "short",
								timeStyle: "short",
							});
							return (
								<li key={a._id} className="flex items-start gap-2">
									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c66e4] text-[10px] font-semibold text-white">
										{initial}
									</div>
									<div className="flex-1 text-xs text-[#172b4d]">
										<span className="font-semibold">{a.userName}</span>{" "}
										<span className="text-[#6b6e76]">
											{actionLabel(a.action)}
										</span>
										{a.details && (
											<span className="text-[#172b4d]">
												{" "}
												<em>{a.details}</em>
											</span>
										)}
										<div className="text-[10px] text-[#6b6e76]">{date}</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}

function BoardLabelsPanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const labels = useQuery(api.labels.listForBoard, { boardId: board._id });
	const createLabel = useMutation(api.labels.create);
	const updateLabel = useMutation(api.labels.update);
	const removeLabel = useMutation(api.labels.remove);

	const [adding, setAdding] = useState(false);
	const [editingId, setEditingId] = useState<Id<"labels"> | null>(null);
	const [draftText, setDraftText] = useState("");
	const [draftColor, setDraftColor] = useState("green");

	const allColors = Object.keys(LABEL_COLORS);

	async function handleCreate() {
		await createLabel({
			boardId: board._id,
			color: draftColor,
			text: draftText.trim() || undefined,
		});
		setAdding(false);
		setDraftText("");
		setDraftColor("green");
	}

	async function handleUpdate(labelId: Id<"labels">) {
		await updateLabel({
			labelId,
			color: draftColor,
			text: draftText.trim() || undefined,
		});
		setEditingId(null);
		setDraftText("");
	}

	function startEdit(label: Doc<"labels">) {
		setEditingId(label._id);
		setDraftText(label.text ?? "");
		setDraftColor(label.color);
		setAdding(false);
	}

	return (
		<div>
			<header className="flex items-center gap-2 border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-3 py-3">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] transition-colors hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					Étiquettes du tableau
				</span>
			</header>
			<div className="max-h-[60vh] overflow-y-auto p-3">
				{labels === undefined ? (
					<p className="text-xs text-[#6b6e76]">Chargement...</p>
				) : labels.length === 0 ? (
					<p className="mb-2 text-xs text-[#6b6e76]">
						Aucune étiquette pour l'instant.
					</p>
				) : (
					<ul className="mb-3 space-y-1">
						{labels.map((label) => {
							const s = labelStyle(label.color);
							const isEditing = editingId === label._id;
							if (isEditing) {
								return (
									<li key={label._id} className="rounded bg-[#f7f8f9] p-2">
										<Input
											value={draftText}
											onChange={(e) => setDraftText(e.target.value)}
											placeholder="Nom (optionnel)"
											className="h-7 text-xs"
										/>
										<div className="mt-2 flex flex-wrap gap-1">
											{allColors.map((c) => {
												const cs = labelStyle(c);
												return (
													<button
														key={c}
														type="button"
														onClick={() => setDraftColor(c)}
														className={`h-6 w-6 rounded transition-transform ${cs.bg} ${draftColor === c ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
														aria-label={c}
													/>
												);
											})}
										</div>
										<div className="mt-2 flex gap-1">
											<Button
												size="sm"
												onClick={() => void handleUpdate(label._id)}
												className="h-7 bg-[#0c66e4] text-xs hover:bg-[#0055cc]"
											>
												Enregistrer
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setEditingId(null);
													setDraftText("");
												}}
												className="h-7 text-xs"
											>
												Annuler
											</Button>
										</div>
									</li>
								);
							}
							return (
								<li key={label._id} className="group flex items-center gap-1">
									<span
										data-label-color={label.color}
										className={`inline-flex h-7 flex-1 items-center truncate rounded px-3 text-xs font-medium ${s.bg} ${s.fg}`}
									>
										{label.text || label.color}
									</span>
									<button
										type="button"
										onClick={() => startEdit(label)}
										className="rounded p-1.5 text-[#6b6e76] opacity-0 transition-opacity hover:bg-[#091e4214] hover:text-[#172b4d] group-hover:opacity-100"
										aria-label="Modifier"
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										onClick={() => {
											if (
												confirm(
													`Supprimer l'étiquette "${label.text || label.color}" ? Elle sera retirée de toutes les cartes.`,
												)
											) {
												void removeLabel({ labelId: label._id });
											}
										}}
										className="rounded p-1.5 text-[#6b6e76] opacity-0 transition-opacity hover:bg-[#FFECEB] hover:text-[#C9372C] group-hover:opacity-100"
										aria-label="Supprimer"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</li>
							);
						})}
					</ul>
				)}

				{adding ? (
					<div className="rounded bg-[#f7f8f9] p-2">
						<Input
							value={draftText}
							onChange={(e) => setDraftText(e.target.value)}
							placeholder="Nom (optionnel)"
							className="h-7 text-xs"
						/>
						<div className="mt-2 flex flex-wrap gap-1">
							{allColors.map((c) => {
								const cs = labelStyle(c);
								return (
									<button
										key={c}
										type="button"
										onClick={() => setDraftColor(c)}
										className={`h-6 w-6 rounded transition-transform ${cs.bg} ${draftColor === c ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
										aria-label={c}
									/>
								);
							})}
						</div>
						<div className="mt-2 flex gap-1">
							<Button
								size="sm"
								onClick={() => void handleCreate()}
								className="h-7 bg-[#0c66e4] text-xs hover:bg-[#0055cc]"
							>
								Créer
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setAdding(false);
									setDraftText("");
								}}
								className="h-7 text-xs"
							>
								Annuler
							</Button>
						</div>
					</div>
				) : (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setAdding(true)}
						className="h-8 w-full text-xs"
					>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Créer une étiquette
					</Button>
				)}
			</div>
		</div>
	);
}

function BoardMoveToWorkspacePanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const workspaces = useQuery(api.workspaces.listMine);
	const moveBoard = useMutation(api.boards.moveToWorkspace);
	const [busy, setBusy] = useState(false);

	async function handleMove(workspaceId: Id<"workspaces"> | null) {
		setBusy(true);
		try {
			await moveBoard({ boardId: board._id, workspaceId });
			onBack();
		} finally {
			setBusy(false);
		}
	}

	return (
		<div>
			<header className="flex items-center gap-2 border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-3 py-3">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] hover:bg-[#091e420a]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<h3 className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					Déplacer le tableau
				</h3>
				<div className="w-6" />
			</header>
			<div className="max-h-[60vh] overflow-y-auto p-2">
				<p className="px-2 py-1.5 text-[11px] text-[#6b6e76]">
					Espace actuel :{" "}
					<strong>
						{board.workspaceId
							? workspaces?.find((w) => w._id === board.workspaceId)?.name ??
								"…"
							: "Sans espace"}
					</strong>
				</p>
				<div className="mt-2 space-y-1">
					<button
						type="button"
						onClick={() => void handleMove(null)}
						disabled={busy || !board.workspaceId}
						className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
							!board.workspaceId
								? "bg-[#e9f2ff] text-[#0c66e4]"
								: "text-[#172b4d] hover:bg-[#091e420a]"
						}`}
					>
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f1f2f4] text-[#44546f]">
							<Inbox className="h-3.5 w-3.5" />
						</div>
						<div className="flex-1">
							<div className="font-medium">Sans espace</div>
							<div className="text-[11px] text-[#6b6e76]">
								Tableau personnel, non rattaché
							</div>
						</div>
						{!board.workspaceId && (
							<CheckCircle2 className="h-4 w-4 text-[#0c66e4]" />
						)}
					</button>
					{(workspaces ?? []).map((w) => {
						const isCurrent = w._id === board.workspaceId;
						const colorMap: Record<string, string> = {
							sky: "#0079bf",
							emerald: "#1F845A",
							amber: "#f59e0b",
							rose: "#e11d48",
							violet: "#8b5cf6",
							slate: "#334155",
						};
						const bg = w.color ? colorMap[w.color] ?? "#1F845A" : "#1F845A";
						return (
							<button
								key={w._id}
								type="button"
								onClick={() => void handleMove(w._id)}
								disabled={busy || isCurrent}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
									isCurrent
										? "bg-[#e9f2ff] text-[#0c66e4]"
										: "text-[#172b4d] hover:bg-[#091e420a]"
								}`}
							>
								<div
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
									style={{ backgroundColor: bg }}
								>
									{w.name.charAt(0).toUpperCase()}
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium">{w.name}</div>
									{w.description && (
										<div className="truncate text-[11px] text-[#6b6e76]">
											{w.description}
										</div>
									)}
								</div>
								{isCurrent && (
									<CheckCircle2 className="h-4 w-4 text-[#0c66e4]" />
								)}
							</button>
						);
					})}
					{workspaces && workspaces.length === 0 && (
						<p className="px-2 py-3 text-center text-[12px] text-[#6b6e76]">
							Aucun espace disponible. Crée-en un depuis la sidebar.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function BoardArchivedCardsPanel({
	board,
	onBack,
}: {
	board: Doc<"boards">;
	onBack: () => void;
}) {
	const archived = useQuery(api.cards.listArchived, { boardId: board._id });
	const updateCard = useMutation(api.cards.update);
	const removeCard = useMutation(api.cards.remove);
	const boardData = useQuery(api.boards.get, { boardId: board._id });

	const listById = new Map(
		(boardData?.lists ?? []).map((l) => [l._id, l.name]),
	);

	return (
		<div>
			<header className="flex items-center gap-2 border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-3 py-3">
				<button
					type="button"
					onClick={onBack}
					className="rounded p-1 text-[#6b6e76] transition-colors hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Retour"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex-1 text-center text-sm font-semibold text-[#172b4d]">
					Cartes archivées
				</span>
			</header>
			<div className="max-h-[60vh] overflow-y-auto p-3">
				{archived === undefined ? (
					<p className="text-xs text-[#6b6e76]">Chargement...</p>
				) : archived.length === 0 ? (
					<p className="text-xs text-[#6b6e76]">Aucune carte archivée.</p>
				) : (
					<ul className="space-y-2">
						{archived.map((card) => (
							<li
								key={card._id}
								className="rounded-md border border-[#091e4224] bg-white p-2"
							>
								<div className="mb-1 text-sm font-medium text-[#172b4d]">
									{card.title}
								</div>
								<div className="mb-2 text-[10px] text-[#6b6e76]">
									Dans la liste{" "}
									<span className="font-semibold">
										{listById.get(card.listId) ?? "?"}
									</span>
								</div>
								<div className="flex gap-1">
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											void updateCard({
												cardId: card._id,
												archived: false,
											})
										}
										className="h-7 flex-1 text-xs"
									>
										Restaurer
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											if (
												confirm(`Supprimer définitivement "${card.title}" ?`)
											) {
												void removeCard({ cardId: card._id });
											}
										}}
										className="h-7 text-xs text-[#C9372C] hover:bg-[#FFECEB]"
									>
										Supprimer
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
