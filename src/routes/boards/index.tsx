import {
	createFileRoute,
	Link,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Bell,
	ChevronDown,
	Clock,
	Grid3x3,
	Home,
	LayoutGrid,
	LayoutTemplate,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { NotificationBell } from "#/features/board/shared/NotificationBell";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { authClient } from "#/lib/auth-client";
import { gradientFor, photoFor } from "#/lib/board-backgrounds";
import { useRecentBoards } from "#/lib/use-recent-boards";
import { TrelloLogoFull } from "#/features/shared/TrelloLogo";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/boards/")({ component: BoardsPage });

function BoardsPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	const boards = useQuery(api.boards.listMine);
	const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

	if (isPending || !session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-10 w-32 animate-pulse rounded bg-muted" />
			</div>
		);
	}

	const email = session.user.email ?? "";
	const name = session.user.name ?? email;
	const initial = (name || email).charAt(0).toUpperCase();
	const handleSignOut = () =>
		void authClient.signOut().then(() => navigate({ to: "/" }));

	return (
		<div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
			<TopBar
				userInitial={initial}
				onOpenCreate={() => setCreateWorkspaceOpen(true)}
				onSignOut={handleSignOut}
			/>

			<div className="flex flex-1 overflow-hidden pt-4">
				<TrelloSidebar
					boards={boards ?? []}
					userInitial={initial}
					onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
				/>
				<CreateWorkspaceDialog
					open={createWorkspaceOpen}
					onOpenChange={setCreateWorkspaceOpen}
				/>

				<main className="flex-1 overflow-y-auto bg-white pt-0 dark:bg-zinc-950">
					<MainWorkspaceContent
						onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
					/>
				</main>
			</div>
		</div>
	);
}

function TopBar({
	userInitial,
	onOpenCreate,
	onSignOut,
}: {
	userInitial: string;
	onOpenCreate: () => void;
	onSignOut: () => void;
}) {
	return (
		<header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#091e4224] bg-[var(--ds-surface)] p-2 dark:border-zinc-800 dark:bg-zinc-900">
			{/* Left section : Atlassian switcher + Trello logo */}
			<div className="flex shrink-0 items-center gap-3 px-1">
				<button
					type="button"
					className="flex h-6 w-6 items-center justify-center rounded-[3px] text-[#44546f] transition-colors hover:bg-[#091e4214]"
					aria-label="Apps"
				>
					<Grid3x3 className="h-4 w-4" />
				</button>
				<Link to="/boards" className="flex items-center">
					<TrelloLogoFull />
				</Link>
			</div>

			{/* Center section : search bar avec border 1px (style Atlassian) */}
			<div className="mx-1 hidden flex-1 justify-center md:flex">
				<div className="group relative w-full max-w-[780px]">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#626f86]" />
					<Input
						type="search"
						placeholder="Parcourir..."
						className="h-[30px] rounded-[3px] border-[#E1E4E8] bg-white pl-8 text-sm text-[#172b4d] placeholder:text-[#626f86] focus-visible:ring-2 focus-visible:ring-[#0c66e4]/30 dark:border-zinc-700 dark:bg-zinc-800"
					/>
				</div>
			</div>

			{/* Right section */}
			<div className="flex shrink-0 items-center gap-3 pr-1">
				<Button
					size="sm"
					onClick={onOpenCreate}
					className="h-8 rounded-[3px] bg-[#0c66e4] px-3 text-[13px] font-medium text-white shadow-sm hover:bg-[#0055cc]"
				>
					Créer
				</Button>
				<button
					type="button"
					className="flex h-8 w-8 items-center justify-center rounded-[3px] text-[#44546f] transition-colors hover:bg-[#091e4214] md:hidden"
					aria-label="Rechercher"
				>
					<Search className="h-4 w-4" />
				</button>
				<NotificationBell variant="light" />
				<button
					type="button"
					onClick={onSignOut}
					className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c66e4] text-xs font-semibold text-white transition-transform hover:scale-105"
					aria-label="Profil / Déconnexion"
					title="Cliquer pour se déconnecter"
				>
					{userInitial}
				</button>
			</div>
		</header>
	);
}

// Lien de la nav sidebar avec état actif (bleu prononcé Trello)
function SidebarNavLink({
	to,
	icon,
	children,
}: {
	to: "/boards" | "/";
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	const location = useLocation();
	// Match exact pour /boards (l'index workspaces) et /
	const isActive =
		(to === "/boards" && location.pathname === "/boards") ||
		(to === "/" && location.pathname === "/");
	return (
		<Link
			to={to}
			className={`flex h-8 items-center gap-3 rounded-[3px] px-2 text-left text-[14px] font-medium transition-colors ${
				isActive
					? "bg-[#e9f2ff] text-[#0c66e4]"
					: "text-[var(--ds-text)] hover:bg-[var(--ds-surface-raised-hovered)]"
			}`}
		>
			<span
				className={isActive ? "text-[#0c66e4]" : "text-[var(--ds-icon)]"}
			>
				{icon}
			</span>
			{children}
		</Link>
	);
}

function TrelloSidebar({
	boards,
	onCreateWorkspace,
}: {
	boards: Array<Doc<"boards">>;
	userInitial: string;
	onCreateWorkspace: () => void;
}) {
	const workspaces = useQuery(api.workspaces.listMine);

	return (
		<aside className="hidden h-full w-[260px] shrink-0 flex-col overflow-y-auto bg-[var(--ds-surface)] pl-4 pr-0 py-0 text-[var(--ds-text)] dark:bg-zinc-950 md:flex">
			<nav className="flex flex-col gap-px pr-2 pt-0">
				<SidebarNavLink to="/boards" icon={<LayoutGrid className="h-4 w-4" />}>
					Tableaux
				</SidebarNavLink>
				<button
					type="button"
					disabled
					className="flex h-8 w-full cursor-not-allowed items-center gap-3 rounded-[3px] px-2 text-left text-[14px] font-medium text-[var(--ds-text-subtlest)]"
				>
					<LayoutTemplate className="h-4 w-4" />
					Modèles
				</button>
				<SidebarNavLink to="/" icon={<Home className="h-4 w-4" />}>
					Accueil
				</SidebarNavLink>
			</nav>

			<div className="my-3 border-t border-[var(--ds-border)] pr-0" />

			<div className="flex flex-col pr-2">
				<div className="flex items-center justify-between px-2 pb-1.5">
					<span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-subtle)]">
						Espaces de travail
					</span>
					<button
						type="button"
						onClick={onCreateWorkspace}
						className="rounded-[3px] p-1 text-[var(--ds-icon)] transition-colors hover:bg-[var(--ds-surface-raised-hovered)]"
						aria-label="Ajouter un espace de travail"
					>
						<Plus className="h-3.5 w-3.5" />
					</button>
				</div>

				{workspaces === undefined && (
					<div className="space-y-1 px-2">
						<div className="h-7 animate-pulse rounded bg-gray-100" />
						<div className="h-7 animate-pulse rounded bg-gray-100" />
					</div>
				)}

				{workspaces && workspaces.length === 0 && (
					<p className="px-3 py-2 text-[11px] text-[#6B6E76]">
						Aucun espace. Clique sur + pour en créer un.
					</p>
				)}

				{workspaces?.map((ws) => (
					<WorkspaceSidebarItem
						key={ws._id}
						workspace={ws}
						boards={boards.filter((b) => b.workspaceId === ws._id)}
					/>
				))}
			</div>
		</aside>
	);
}

// Item d'un workspace dans la sidebar (dépliable, montre ses boards)
function WorkspaceSidebarItem({
	workspace,
	boards,
}: {
	workspace: Doc<"workspaces">;
	boards: Array<Doc<"boards">>;
}) {
	const { data: session } = authClient.useSession();
	const meId = session?.user?.id;
	const isOwner = workspace.ownerId === meId;
	const renameWorkspace = useMutation(api.workspaces.rename);
	const removeWorkspace = useMutation(api.workspaces.remove);
	const leaveWs = useMutation(api.workspaceMembers.leaveWorkspace);
	const location = useLocation();
	// Auto-déterminer si ce workspace est "actif" :
	// - URL = /workspaces/<workspace._id>
	// - URL = /boards/<boardId> où boardId appartient à ce workspace
	const isWorkspaceActive = location.pathname === `/workspaces/${workspace._id}`;
	const activeBoardId = location.pathname.startsWith("/boards/")
		? location.pathname.split("/boards/")[1]
		: null;
	const activeBoard = activeBoardId
		? boards.find((b) => b._id === activeBoardId)
		: null;
	const hasActiveBoard = Boolean(activeBoard);
	// Ouvert si workspace actif ou si un de ses boards est actif. Fermé sinon par défaut.
	const [open, setOpen] = useState(isWorkspaceActive || hasActiveBoard);
	useEffect(() => {
		if (isWorkspaceActive || hasActiveBoard) setOpen(true);
	}, [isWorkspaceActive, hasActiveBoard]);
	const [menuOpen, setMenuOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [nameDraft, setNameDraft] = useState(workspace.name);
	const [inviteOpen, setInviteOpen] = useState(false);

	const initial = workspace.name.charAt(0).toUpperCase();
	const colorMap: Record<string, string> = {
		sky: "#0079bf",
		emerald: "#1F845A",
		amber: "#f59e0b",
		rose: "#e11d48",
		violet: "#8b5cf6",
		slate: "#334155",
	};
	const bg = workspace.color ? colorMap[workspace.color] ?? "#1F845A" : "#1F845A";

	async function handleRename() {
		const t = nameDraft.trim();
		if (t && t !== workspace.name) {
			await renameWorkspace({ workspaceId: workspace._id, name: t });
		} else {
			setNameDraft(workspace.name);
		}
		setEditing(false);
	}

	async function handleDelete() {
		if (
			!confirm(
				`Supprimer "${workspace.name}" ? Les tableaux ne seront pas supprimés (ils deviendront orphelins).`,
			)
		) {
			return;
		}
		await removeWorkspace({ workspaceId: workspace._id });
	}

	async function handleLeave() {
		if (!confirm(`Quitter l'espace "${workspace.name}" ?`)) return;
		await leaveWs({ workspaceId: workspace._id });
	}

	return (
		<div className="mt-0.5">
			<div className="group relative flex items-center gap-1">
				{/* Barre verticale bleue : visible toujours si actif, sinon au hover */}
				<span
					className={`absolute -left-3 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-[#0c66e4] ${
						isWorkspaceActive ? "block" : "hidden group-hover:block"
					}`}
					aria-hidden
				/>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-expanded={open}
					className={`flex h-8 flex-1 items-center gap-2 rounded-[3px] px-2 text-left transition-colors ${
						isWorkspaceActive
							? "bg-[#e9f2ff] text-[#0c66e4]"
							: "hover:bg-[var(--ds-surface-raised-hovered)]"
					}`}
				>
					<div
						className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-bold text-white"
						style={{ backgroundColor: bg }}
					>
						{initial}
					</div>
					{editing ? (
						<input
							value={nameDraft}
							onChange={(e) => setNameDraft(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							onBlur={() => void handleRename()}
							onKeyDown={(e) => {
								if (e.key === "Enter") void handleRename();
								if (e.key === "Escape") {
									setNameDraft(workspace.name);
									setEditing(false);
								}
							}}
							autoFocus
							className="flex-1 rounded-[3px] border-2 border-[#0c66e4] bg-white px-1.5 py-0.5 text-[14px] font-medium text-[var(--ds-text)] outline-none"
						/>
					) : (
						<span
							className={`flex-1 truncate text-[14px] font-semibold ${
								isWorkspaceActive ? "text-[#0c66e4]" : "text-[var(--ds-text)]"
							}`}
						>
							{workspace.name}
						</span>
					)}
					<ChevronDown
						className={`h-3.5 w-3.5 transition-transform ${
							isWorkspaceActive ? "text-[#0c66e4]" : "text-[var(--ds-icon)]"
						} ${open ? "" : "-rotate-90"}`}
					/>
				</button>
				<Popover open={menuOpen} onOpenChange={setMenuOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="rounded p-1 text-[#6B6E76] opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
							aria-label="Menu de l'espace"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="h-4 w-4" />
						</button>
					</PopoverTrigger>
					<PopoverContent
						className="w-52 p-1"
						align="end"
						side="right"
						sideOffset={4}
					>
						{isOwner ? (
							<>
								<button
									type="button"
									onClick={() => {
										setEditing(true);
										setMenuOpen(false);
									}}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#172b4d] hover:bg-[#091e420a]"
								>
									<Pencil className="h-3.5 w-3.5" />
									Renommer
								</button>
								<button
									type="button"
									onClick={() => {
										setInviteOpen(true);
										setMenuOpen(false);
									}}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#172b4d] hover:bg-[#091e420a]"
								>
									<Users className="h-3.5 w-3.5" />
									Inviter des membres
								</button>
								<button
									type="button"
									onClick={() => {
										void handleDelete();
										setMenuOpen(false);
									}}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#ae2e24] hover:bg-[#ffeceb]"
								>
									<X className="h-3.5 w-3.5" />
									Supprimer l'espace
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => {
									void handleLeave();
									setMenuOpen(false);
								}}
								className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#ae2e24] hover:bg-[#ffeceb]"
							>
								<X className="h-3.5 w-3.5" />
								Quitter l'espace
							</button>
						)}
					</PopoverContent>
				</Popover>
			</div>

			{open && (
				<div className="mt-0.5 flex flex-col gap-px">
					<Link
						to="/workspaces/$workspaceId"
						params={{ workspaceId: workspace._id }}
						className={`flex h-8 items-center gap-3 rounded-[3px] pl-10 pr-2 text-left text-[14px] font-normal transition-colors ${
							isWorkspaceActive
								? "bg-[#e9f2ff] font-semibold text-[#0c66e4]"
								: "text-[var(--ds-text)] hover:bg-[var(--ds-surface-raised-hovered)]"
						}`}
					>
						<LayoutGrid
							className={`h-4 w-4 ${isWorkspaceActive ? "text-[#0c66e4]" : "text-[var(--ds-icon)]"}`}
						/>
						<span>Tableaux</span>
					</Link>
					{boards.map((b) => {
						const isBoardActive = activeBoardId === b._id;
						return (
							<Link
								key={b._id}
								to="/boards/$boardId"
								params={{ boardId: b._id }}
								className={`flex h-8 items-center gap-3 rounded-[3px] pl-10 pr-2 text-left text-[14px] transition-colors ${
									isBoardActive
										? "bg-[#e9f2ff] font-semibold text-[#0c66e4]"
										: "text-[var(--ds-text)] hover:bg-[var(--ds-surface-raised-hovered)]"
								}`}
							>
								<div
									className={`h-5 w-5 shrink-0 rounded-[3px] ${b.backgroundImage ? "" : `bg-gradient-to-br ${gradientFor(b.color)}`}`}
									style={
										b.backgroundImage
											? {
													backgroundImage: `url('${photoFor(b.backgroundImage)?.thumbnail}')`,
													backgroundSize: "cover",
													backgroundPosition: "center",
												}
											: undefined
									}
								/>
								<span className="truncate">{b.name}</span>
							</Link>
						);
					})}
					{boards.length === 0 && (
						<p className="pl-10 pr-2 py-1 text-[11px] text-[var(--ds-text-subtlest)]">
							Aucun tableau dans cet espace
						</p>
					)}
				</div>
			)}
			<InviteToWorkspaceDialog
				workspaceId={workspace._id}
				open={inviteOpen}
				onOpenChange={setInviteOpen}
			/>
		</div>
	);
}

// Contenu principal de /boards : workspace actif (le premier) + bannière invits
function MainWorkspaceContent({
	onCreateWorkspace,
}: {
	onCreateWorkspace: () => void;
}) {
	const workspaces = useQuery(api.workspaces.listMine);
	const boards = useQuery(api.boards.listMine);
	const recentIds = useRecentBoards();

	if (workspaces === undefined || boards === undefined) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-10 w-32 animate-pulse rounded bg-gray-100" />
			</div>
		);
	}

	if (workspaces.length === 0) {
		return (
			<div className="mx-auto max-w-[1280px] px-8 pt-6 lg:px-12">
				<PendingInvitationsBanner />
				<div className="mx-auto mt-12 max-w-md rounded-lg border-2 border-dashed border-[#091e4224] bg-[#f7f8f9] p-8 text-center">
					<h2 className="text-lg font-semibold text-[#172b4d]">
						Aucun espace de travail
					</h2>
					<p className="mt-1 text-sm text-[#6b6e76]">
						Crée ton premier espace pour organiser tes tableaux.
					</p>
					<Button
						onClick={onCreateWorkspace}
						className="mt-4 bg-[#0c66e4] hover:bg-[#0055cc]"
					>
						<Plus className="mr-1 h-4 w-4" />
						Créer un espace
					</Button>
				</div>
			</div>
		);
	}

	// Boards récemment consultés (filtre ceux qui existent toujours)
	const boardById = new Map(boards.map((b) => [b._id, b]));
	const recentBoards = recentIds
		.map((id) => boardById.get(id as Doc<"boards">["_id"]))
		.filter((b): b is Doc<"boards"> => Boolean(b))
		.slice(0, 6);

	return (
		<div className="mx-auto max-w-[1280px] px-8 pt-6 lg:px-12">
			<PendingInvitationsBanner />

			{/* Section "Récemment consultés" (toujours affichée) */}
			<section className="mb-10">
				<div className="mb-3 flex items-center gap-2">
					<Clock className="h-4 w-4 text-[#44546f]" />
					<h2 className="text-[13px] font-bold uppercase tracking-wider text-[#44546f]">
						Récemment consulté
					</h2>
				</div>
				{recentBoards.length === 0 ? (
					<div className="rounded-lg border border-dashed border-[#091e4224] bg-[#f7f8f9] p-6 text-center">
						<p className="text-sm text-[#6b6e76]">
							Ouvre un tableau pour le retrouver ici plus tard.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
						{recentBoards.map((b) => (
							<BoardThumb key={b._id} board={b} />
						))}
					</div>
				)}
			</section>

			{/* Section "Vos espaces de travail" */}
			<div className="mb-4 flex items-center gap-2">
				<Users className="h-4 w-4 text-[#44546f]" />
				<h2 className="text-[13px] font-bold uppercase tracking-wider text-[#44546f]">
					Vos espaces de travail
				</h2>
			</div>
			<div className="space-y-10">
				{workspaces.map((ws) => (
					<WorkspaceCard
						key={ws._id}
						workspace={ws}
						boards={boards.filter((b) => b.workspaceId === ws._id)}
					/>
				))}
			</div>
		</div>
	);
}

// Tuile board style Trello : ratio paysage 16:9, titre en bas, gradient bottom-up
function BoardThumb({ board }: { board: Doc<"boards"> }) {
	const photo = photoFor(board.backgroundImage);
	const style: React.CSSProperties = photo
		? {
				backgroundImage: `url('${photo.thumbnail}')`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}
		: {};
	return (
		<Link
			to="/boards/$boardId"
			params={{ boardId: board._id }}
			className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded-[3px] shadow-sm transition-all hover:shadow-lg hover:ring-2 hover:ring-[#0c66e4]/60"
		>
			{photo ? (
				<div className="absolute inset-0" style={style} />
			) : (
				<div
					className={`absolute inset-0 bg-gradient-to-br ${gradientFor(board.color)}`}
				/>
			)}
			{/* Gradient bottom-up pour lisibilité du titre en bas */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
			<div className="relative flex h-full items-end p-2.5">
				<h3 className="text-sm font-bold leading-tight text-white drop-shadow-md">
					{board.name}
				</h3>
			</div>
		</Link>
	);
}

const WS_COLOR_MAP: Record<string, string> = {
	sky: "#0079bf",
	emerald: "#1F845A",
	amber: "#f59e0b",
	rose: "#e11d48",
	violet: "#8b5cf6",
	slate: "#334155",
};

// Bloc workspace dans la vue d'ensemble : header compact + grille de ses boards
function WorkspaceCard({
	workspace,
	boards,
}: {
	workspace: Doc<"workspaces">;
	boards: Array<Doc<"boards">>;
}) {
	const accent = workspace.color
		? WS_COLOR_MAP[workspace.color] ?? "#1F845A"
		: "#1F845A";
	return (
		<section>
			<div className="mb-3 flex items-center justify-between">
				<Link
					to="/workspaces/$workspaceId"
					params={{ workspaceId: workspace._id }}
					className="group flex items-center gap-2.5"
				>
					<div
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base font-bold text-white shadow-sm"
						style={{ backgroundColor: accent }}
					>
						{workspace.name.charAt(0).toUpperCase()}
					</div>
					<span className="text-base font-semibold text-[#172b4d] group-hover:underline">
						{workspace.name}
					</span>
					<span className="rounded-full bg-[#091e4214] px-2 py-0.5 text-[11px] font-semibold text-[#44546f]">
						{boards.length}
					</span>
				</Link>
				<Link
					to="/workspaces/$workspaceId"
					params={{ workspaceId: workspace._id }}
					className="text-[12px] font-medium text-[#0c66e4] hover:underline"
				>
					Ouvrir →
				</Link>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{boards.slice(0, 4).map((b) => (
					<BoardThumb key={b._id} board={b} />
				))}
				{boards.length > 4 && (
					<Link
						to="/workspaces/$workspaceId"
						params={{ workspaceId: workspace._id }}
						className="flex aspect-[16/9] items-center justify-center rounded-md border border-dashed border-[#091e4224] bg-[#f7f8f9] text-sm font-medium text-[#44546f] transition-colors hover:bg-[#e9f2ff] hover:text-[#0c66e4]"
					>
						+ {boards.length - 4} tableau{boards.length - 4 > 1 ? "x" : ""}
					</Link>
				)}
				{boards.length === 0 && (
					<Link
						to="/workspaces/$workspaceId"
						params={{ workspaceId: workspace._id }}
						className="flex aspect-[16/9] items-center justify-center rounded-md border-2 border-dashed border-[#091e4224] bg-[#f7f8f9] text-sm font-medium text-[#44546f] transition-colors hover:bg-[#e9f2ff] hover:text-[#0c66e4]"
					>
						Aucun tableau · créer
					</Link>
				)}
			</div>
		</section>
	);
}

function PendingInvitationsBanner() {
	const boardInvitations = useQuery(api.boardMembers.listMyInvitations);
	const workspaceInvitations = useQuery(api.workspaceMembers.listMyInvitations);
	const acceptBoard = useMutation(api.boardMembers.acceptInvitation);
	const declineBoard = useMutation(api.boardMembers.declineInvitation);
	const acceptWs = useMutation(api.workspaceMembers.acceptInvitation);
	const declineWs = useMutation(api.workspaceMembers.declineInvitation);
	const navigate = useNavigate();
	const [busyId, setBusyId] = useState<string | null>(null);

	const total =
		(boardInvitations?.length ?? 0) + (workspaceInvitations?.length ?? 0);
	if (total === 0) return null;

	const wsColorMap: Record<string, string> = {
		sky: "#0079bf",
		emerald: "#1F845A",
		amber: "#f59e0b",
		rose: "#e11d48",
		violet: "#8b5cf6",
		slate: "#334155",
	};

	async function handleAcceptBoard(invId: string) {
		setBusyId(invId);
		try {
			const boardId = await acceptBoard({
				invitationId: invId as Parameters<
					typeof acceptBoard
				>[0]["invitationId"],
			});
			navigate({ to: "/boards/$boardId", params: { boardId } });
		} finally {
			setBusyId(null);
		}
	}

	async function handleDeclineBoard(invId: string) {
		setBusyId(invId);
		try {
			await declineBoard({
				invitationId: invId as Parameters<
					typeof declineBoard
				>[0]["invitationId"],
			});
		} finally {
			setBusyId(null);
		}
	}

	async function handleAcceptWs(invId: string) {
		setBusyId(invId);
		try {
			const wsId = await acceptWs({
				invitationId: invId as Parameters<typeof acceptWs>[0]["invitationId"],
			});
			navigate({
				to: "/workspaces/$workspaceId",
				params: { workspaceId: wsId },
			});
		} finally {
			setBusyId(null);
		}
	}

	async function handleDeclineWs(invId: string) {
		setBusyId(invId);
		try {
			await declineWs({
				invitationId: invId as Parameters<typeof declineWs>[0]["invitationId"],
			});
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="mt-6 space-y-2">
			<div className="flex items-center gap-2">
				<Bell className="h-4 w-4 text-[#0c66e4]" />
				<h3 className="text-sm font-semibold text-[#172b4d]">
					Invitations en attente ({total})
				</h3>
			</div>
			<ul className="space-y-2">
				{(workspaceInvitations ?? []).map((inv) => (
					<li
						key={inv._id}
						className="flex items-center gap-3 rounded-lg border border-[#091e4224] bg-[#f7f8f9] p-3"
					>
						<div
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-base font-bold text-white"
							style={{
								backgroundColor:
									wsColorMap[inv.workspaceColor ?? ""] ?? "#1F845A",
							}}
						>
							{inv.workspaceName.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-medium text-[#172b4d]">
								{inv.workspaceName}
							</div>
							<div className="text-[12px] text-[#6b6e76]">
								Espace de travail · Invité par {inv.invitedByName}
							</div>
						</div>
						<Button
							size="sm"
							onClick={() => void handleAcceptWs(inv._id)}
							disabled={busyId === inv._id}
							className="h-8 bg-[#0c66e4] text-white hover:bg-[#0055cc]"
						>
							Accepter
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => void handleDeclineWs(inv._id)}
							disabled={busyId === inv._id}
							className="h-8 text-[#6b6e76] hover:bg-[#091e420a]"
						>
							Décliner
						</Button>
					</li>
				))}
				{(boardInvitations ?? []).map((inv) => (
					<li
						key={inv._id}
						className="flex items-center gap-3 rounded-lg border border-[#091e4224] bg-[#f7f8f9] p-3"
					>
						<div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
							{inv.boardBackgroundImage ? (
								<img
									src={inv.boardBackgroundImage}
									alt=""
									className="h-full w-full object-cover"
								/>
							) : (
								<div
									className={`h-full w-full bg-gradient-to-br ${gradientFor(inv.boardColor)}`}
								/>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-medium text-[#172b4d]">
								{inv.boardName}
							</div>
							<div className="text-[12px] text-[#6b6e76]">
								Tableau · Invité par {inv.invitedByName}
							</div>
						</div>
						<Button
							size="sm"
							onClick={() => void handleAcceptBoard(inv._id)}
							disabled={busyId === inv._id}
							className="h-8 bg-[#0c66e4] text-white hover:bg-[#0055cc]"
						>
							Accepter
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => void handleDeclineBoard(inv._id)}
							disabled={busyId === inv._id}
							className="h-8 text-[#6b6e76] hover:bg-[#091e420a]"
						>
							Décliner
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}

// Modale de création d'un workspace
function CreateWorkspaceDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const createWorkspace = useMutation(api.workspaces.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("emerald");
	const [submitting, setSubmitting] = useState(false);

	const COLORS = [
		{ id: "emerald", label: "Vert", hex: "#1F845A" },
		{ id: "sky", label: "Bleu", hex: "#0079bf" },
		{ id: "amber", label: "Orange", hex: "#f59e0b" },
		{ id: "rose", label: "Rose", hex: "#e11d48" },
		{ id: "violet", label: "Violet", hex: "#8b5cf6" },
		{ id: "slate", label: "Ardoise", hex: "#334155" },
	];

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		setSubmitting(true);
		try {
			const id = await createWorkspace({
				name: trimmed,
				description: description.trim() || undefined,
				color,
			});
			onOpenChange(false);
			setName("");
			setDescription("");
			setColor("emerald");
			navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: id } });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Créer un espace de travail</DialogTitle>
					<DialogDescription>
						Un espace regroupe vos tableaux et permet d'inviter des
						collaborateurs.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="ws-name" className="mb-1.5 block">
							Nom de l'espace
						</Label>
						<Input
							id="ws-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Mon équipe, Projet X, Famille..."
							autoFocus
							disabled={submitting}
						/>
					</div>
					<div>
						<Label htmlFor="ws-desc" className="mb-1.5 block">
							Description (optionnelle)
						</Label>
						<Textarea
							id="ws-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="À quoi sert cet espace ?"
							rows={2}
							disabled={submitting}
						/>
					</div>
					<div>
						<Label className="mb-1.5 block">Couleur</Label>
						<div className="flex gap-2">
							{COLORS.map((c) => (
								<button
									key={c.id}
									type="button"
									onClick={() => setColor(c.id)}
									className={`h-8 w-8 rounded-md border-2 transition-all ${
										color === c.id
											? "border-[#0c66e4] ring-2 ring-[#0c66e4]/30"
											: "border-transparent"
									}`}
									style={{ backgroundColor: c.hex }}
									aria-label={c.label}
									title={c.label}
								/>
							))}
						</div>
					</div>
					<DialogFooter>
						<Button
							type="submit"
							disabled={submitting || !name.trim()}
							className="w-full bg-[#0c66e4] hover:bg-[#0055cc]"
						>
							{submitting ? "Création..." : "Créer l'espace"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Modale pour inviter des membres dans un workspace
function InviteToWorkspaceDialog({
	workspaceId,
	open,
	onOpenChange,
}: {
	workspaceId: Doc<"workspaces">["_id"];
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const members = useQuery(api.workspaceMembers.listMembers, { workspaceId });
	const invitations = useQuery(api.workspaceMembers.listPendingInvitations, {
		workspaceId,
	});
	const invite = useMutation(api.workspaceMembers.invite);
	const revoke = useMutation(api.workspaceMembers.revokeInvitation);
	const removeMember = useMutation(api.workspaceMembers.removeMember);
	const { data: session } = authClient.useSession();
	const meId = session?.user?.id;
	const myRole = members?.find((m) => m.userId === meId)?.role;
	const isOwner = myRole === "owner";

	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	function initials(name: string) {
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? "")
			.join("");
	}

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;
		setSubmitting(true);
		setError(null);
		setSuccessMsg(null);
		try {
			await invite({ workspaceId, email: trimmed });
			setEmail("");
			setSuccessMsg(`Invitation envoyée à ${trimmed}`);
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
				<div className="border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-5 py-4">
					<h2 className="text-base font-semibold text-[#172b4d]">
						Inviter dans l'espace
					</h2>
					<p className="mt-0.5 text-[12px] text-[#6b6e76]">
						Les membres invités auront accès à tous les tableaux de cet espace.
					</p>
				</div>
				<div className="px-5 py-4">
					{isOwner ? (
						<form onSubmit={handleInvite} className="flex gap-2">
							<Input
								type="email"
								placeholder="adresse.email@exemple.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-9"
								disabled={submitting}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={submitting || !email.trim()}
								className="h-9 bg-[#0c66e4] text-white hover:bg-[#0055cc]"
							>
								{submitting ? "..." : "Inviter"}
							</Button>
						</form>
					) : (
						<p className="text-[13px] text-[#6b6e76]">
							Seul le propriétaire peut inviter des membres.
						</p>
					)}
					{error && (
						<div className="mt-2 rounded-md bg-[#ffeceb] px-3 py-2 text-[12px] text-[#ae2e24]">
							{error}
						</div>
					)}
					{successMsg && (
						<div className="mt-2 rounded-md bg-[#dcfff1] px-3 py-2 text-[12px] text-[#216e4e]">
							{successMsg}
						</div>
					)}

					{invitations && invitations.length > 0 && (
						<div className="mt-5">
							<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b6e76]">
								Invitations en attente
							</h3>
							<ul className="space-y-1">
								{invitations.map((inv) => (
									<li
										key={inv._id}
										className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#091e420a]"
									>
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5e6c84] text-[10px] font-semibold text-white">
											{initials(inv.email) || "?"}
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate text-[13px] text-[#172b4d]">
												{inv.email}
											</div>
											<div className="text-[11px] text-[#6b6e76]">
												Invité par {inv.invitedByName}
											</div>
										</div>
										{isOwner && (
											<button
												type="button"
												onClick={() => void revoke({ invitationId: inv._id })}
												className="rounded px-2 py-1 text-[12px] text-[#6b6e76] hover:bg-[#ffeceb] hover:text-[#ae2e24]"
											>
												Révoquer
											</button>
										)}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="mt-5">
						<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b6e76]">
							Membres ({members?.length ?? 0})
						</h3>
						<ul className="space-y-1">
							{(members ?? []).map((m) => (
								<li
									key={m._id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#091e420a]"
								>
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0c66e4] text-[10px] font-semibold text-white">
										{initials(m.userName) || "?"}
									</div>
									<div className="min-w-0 flex-1">
										<div className="truncate text-[13px] font-medium text-[#172b4d]">
											{m.userName}
											{m.userId === meId && (
												<span className="ml-1 text-[11px] font-normal text-[#6b6e76]">
													(vous)
												</span>
											)}
										</div>
										<div className="truncate text-[11px] text-[#6b6e76]">
											{m.userEmail}
										</div>
									</div>
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
											m.role === "owner"
												? "bg-[#e9f2ff] text-[#0c66e4]"
												: "bg-[#091e420a] text-[#44546f]"
										}`}
									>
										{m.role === "owner" ? "Propriétaire" : "Membre"}
									</span>
									{isOwner && m.role !== "owner" && (
										<button
											type="button"
											onClick={() => void removeMember({ memberId: m._id })}
											className="rounded p-1 text-[#6b6e76] hover:bg-[#ffeceb] hover:text-[#ae2e24]"
											aria-label="Retirer"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									)}
								</li>
							))}
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
