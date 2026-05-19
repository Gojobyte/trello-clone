import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	LayoutGrid,
	Lock,
	Pencil,
	Plus,
	Star,
	Users,
	X,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import {
	BOARD_GRADIENTS,
	BOARD_PHOTOS,
	gradientFor,
	photoFor,
} from "#/lib/board-backgrounds";
import { withToast } from "#/lib/toast-helpers";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const WS_COLOR_MAP: Record<string, string> = {
	sky: "#0079bf",
	emerald: "#1F845A",
	amber: "#f59e0b",
	rose: "#e11d48",
	violet: "#8b5cf6",
	slate: "#334155",
};

// Vue d'un workspace : header coloré + avatars membres + grille des boards
// du workspace. Utilisée dans /boards (workspace par défaut) et /workspaces/$id.
export function WorkspaceView({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
	// IMPORTANT : tous les hooks doivent être appelés AVANT tout return conditionnel
	// (Rules of Hooks). Sinon l'ordre des hooks change entre les renders et React crash.
	const data = useQuery(api.workspaces.get, { workspaceId });
	const members = useQuery(api.workspaceMembers.listMembers, { workspaceId });
	const { data: session } = authClient.useSession();
	const [createBoardOpen, setCreateBoardOpen] = useState(false);
	const [inviteOpen, setInviteOpen] = useState(false);

	if (data === undefined) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-10 w-32 animate-pulse rounded bg-gray-100" />
			</div>
		);
	}

	if (data === null) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<p className="text-base font-semibold text-[#172b4d]">
					Espace introuvable ou accès refusé
				</p>
				<Link to="/boards" className="text-sm text-[#0c66e4] hover:underline">
					Retour
				</Link>
			</div>
		);
	}

	const { workspace, boards } = data;
	const meId = session?.user?.id;
	const myMembership = members?.find((m) => m.userId === meId);
	const isOwner = workspace.ownerId === meId;
	const accent = workspace.color
		? WS_COLOR_MAP[workspace.color] ?? "#1F845A"
		: "#1F845A";

	const starredBoards = boards.filter((b) => b.starred);
	const otherBoards = boards.filter((b) => !b.starred);

	return (
		<div className="pb-16">
			{/* Header épuré style Trello — fond blanc, titre noir, logo coloré 48px */}
			<header className="flex items-start justify-between gap-4 pb-6">
				<div className="flex items-center gap-3 min-w-0">
					<button
						type="button"
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-2xl font-bold text-white shadow-sm transition-opacity hover:opacity-90"
						style={{ backgroundColor: accent }}
						aria-label="Changer le logo"
					>
						{workspace.name.charAt(0).toUpperCase()}
					</button>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5">
							<h1 className="truncate text-xl font-bold text-[#172b4d] dark:text-gray-100">
								{workspace.name}
							</h1>
							{isOwner && (
								<button
									type="button"
									className="rounded p-1 text-[#6b6e76] transition-colors hover:bg-black/5 hover:text-[#172b4d]"
									aria-label="Modifier l'espace de travail"
								>
									<Pencil className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
						<div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#6b6e76]">
							<Lock className="h-3 w-3" />
							<span>Privé</span>
							{!isOwner && myMembership && (
								<>
									<span className="mx-1">·</span>
									<span>
										{myMembership.role === "owner"
											? "Propriétaire"
											: "Membre"}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Actions à droite */}
				<div className="flex shrink-0 items-center gap-3">
					<div className="hidden items-center -space-x-2 sm:flex">
						{(members ?? []).slice(0, 5).map((m) => {
							const initials = m.userName
								.split(/\s+/)
								.filter(Boolean)
								.slice(0, 2)
								.map((p) => p[0]?.toUpperCase() ?? "")
								.join("");
							return (
								<div
									key={m._id}
									title={m.userName}
									className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0c66e4] text-[11px] font-semibold text-white shadow-sm"
								>
									{initials || "?"}
								</div>
							);
						})}
						{(members?.length ?? 0) > 5 && (
							<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#172b4d] text-[10px] font-semibold text-white shadow-sm">
								+{members!.length - 5}
							</div>
						)}
					</div>
					{isOwner && (
						<Button
							size="sm"
							onClick={() => setInviteOpen(true)}
							className="h-9 gap-1.5 bg-[#0c66e4] px-4 text-[13px] font-medium text-white shadow-sm hover:bg-[#0055cc]"
						>
							<Users className="h-3.5 w-3.5" />
							Inviter les membres
						</Button>
					)}
				</div>
			</header>

			{workspace.description && (
				<p className="-mt-3 mb-4 max-w-2xl text-sm text-[#6b6e76]">
					{workspace.description}
				</p>
			)}

			{/* Trait de séparation sous le header */}
			<div className="border-t border-[#091e4224]" />

			{/* Grille des tableaux */}
			<main className="pt-8">
				{starredBoards.length > 0 && (
					<section className="mb-8">
						<div className="mb-3 flex items-center gap-2">
							<Star className="h-4 w-4 fill-[#E2B203] text-[#E2B203]" />
							<h2 className="text-[13px] font-bold uppercase tracking-wider text-[#44546f] dark:text-gray-300">
								Favoris
							</h2>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{starredBoards.map((b) => (
								<WorkspaceBoardTile key={b._id} board={b} />
							))}
						</div>
					</section>
				)}

				<section>
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<LayoutGrid className="h-4 w-4 text-[#44546f]" />
							<h2 className="text-[13px] font-bold uppercase tracking-wider text-[#44546f] dark:text-gray-300">
								{starredBoards.length > 0 ? "Tous vos tableaux" : "Vos tableaux"}
							</h2>
							<span className="rounded-full bg-[#091e4214] px-2 py-0.5 text-[11px] font-semibold text-[#44546f]">
								{otherBoards.length}
							</span>
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{otherBoards.map((b) => (
							<WorkspaceBoardTile key={b._id} board={b} />
						))}
						<button
							type="button"
							onClick={() => setCreateBoardOpen(true)}
							className="group/create relative flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-[#091e4224] bg-gradient-to-br from-[#f7f8f9] to-white text-[#44546f] transition-all hover:border-[#0c66e4]/40 hover:from-[#e9f2ff] hover:to-white hover:text-[#0c66e4]"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover/create:scale-110">
								<Plus className="h-5 w-5" />
							</div>
							<span className="text-sm font-semibold">Créer un tableau</span>
						</button>
					</div>
				</section>
			</main>

			<CreateBoardInWorkspaceDialog
				workspaceId={workspace._id}
				open={createBoardOpen}
				onOpenChange={setCreateBoardOpen}
			/>
			<WorkspaceInviteDialog
				workspaceId={workspace._id}
				open={inviteOpen}
				onOpenChange={setInviteOpen}
			/>
		</div>
	);
}

function WorkspaceBoardTile({ board }: { board: Doc<"boards"> }) {
	const toggleStar = useMutation(api.boards.toggleStar);
	const starred = board.starred ?? false;
	const photo = photoFor(board.backgroundImage);
	const tileStyle: React.CSSProperties = photo
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
			className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded-[3px] shadow-sm transition-all duration-200 ease-in-out hover:shadow-xl hover:ring-2 hover:ring-[#0c66e4]/60"
		>
			{photo ? (
				<div className="absolute inset-0" style={tileStyle} />
			) : (
				<div
					className={`absolute inset-0 bg-gradient-to-br ${gradientFor(board.color)}`}
				/>
			)}
			{/* Gradient bottom-up pour lisibilité du titre en bas */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
			<div className="relative flex h-full items-end p-3">
				<h3 className="text-sm font-bold leading-tight text-white drop-shadow-md">
					{board.name}
				</h3>
			</div>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void toggleStar({ boardId: board._id });
				}}
				className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-white transition-all duration-200 hover:scale-110 ${
					starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
				}`}
				aria-label={starred ? "Retirer des favoris" : "Ajouter aux favoris"}
			>
				<Star
					className={`h-4 w-4 drop-shadow ${starred ? "fill-[#E2B203] text-[#E2B203]" : "fill-transparent"}`}
				/>
			</button>
		</Link>
	);
}

function CreateBoardInWorkspaceDialog({
	workspaceId,
	open,
	onOpenChange,
}: {
	workspaceId: Id<"workspaces">;
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const createBoard = useMutation(api.boards.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [color, setColor] = useState<string | undefined>("sky");
	const [bgImage, setBgImage] = useState<string | undefined>(undefined);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		setSubmitting(true);
		const id = await createBoard({
			name: trimmed,
			color: bgImage ? undefined : color,
			backgroundImage: bgImage,
			workspaceId,
		});
		setSubmitting(false);
		onOpenChange(false);
		setName("");
		navigate({ to: "/boards/$boardId", params: { boardId: id } });
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Créer un tableau</DialogTitle>
					<DialogDescription>
						Ce tableau sera ajouté à l'espace de travail.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label className="mb-1.5 block">Arrière-plan</Label>
						<div className="grid grid-cols-4 gap-2">
							{BOARD_PHOTOS.slice(0, 4).map((p) => (
								<button
									key={p.id}
									type="button"
									onClick={() => setBgImage(p.id)}
									className={`relative aspect-video overflow-hidden rounded transition-all ${bgImage === p.id ? "ring-2 ring-[#0c66e4]" : ""}`}
									style={{
										backgroundImage: `url('${p.thumbnail}')`,
										backgroundSize: "cover",
									}}
									aria-label={p.label}
								/>
							))}
							{BOARD_GRADIENTS.slice(0, 4).map((g) => (
								<button
									key={g.id}
									type="button"
									onClick={() => {
										setColor(g.id);
										setBgImage(undefined);
									}}
									className={`aspect-video rounded bg-gradient-to-br transition-all ${g.gradient} ${color === g.id && !bgImage ? "ring-2 ring-[#0c66e4]" : ""}`}
									aria-label={g.label}
								/>
							))}
						</div>
					</div>
					<div>
						<Label htmlFor="b-name" className="mb-1.5 block">
							Titre du tableau
						</Label>
						<Input
							id="b-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Mon projet, Roadmap, Recrutement..."
							autoFocus
							disabled={submitting}
						/>
					</div>
					<DialogFooter>
						<Button
							type="submit"
							disabled={submitting || !name.trim()}
							className="w-full bg-[#0c66e4] hover:bg-[#0055cc]"
						>
							{submitting ? "Création..." : "Créer le tableau"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function WorkspaceInviteDialog({
	workspaceId,
	open,
	onOpenChange,
}: {
	workspaceId: Id<"workspaces">;
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
		const result = await withToast(
			() => invite({ workspaceId, email: trimmed }),
			{ success: `Invitation envoyée à ${trimmed}` },
		);
		if (result !== undefined) setEmail("");
		setSubmitting(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
				<div className="border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-5 py-4">
					<h2 className="text-base font-semibold text-[#172b4d]">
						Inviter dans l'espace
					</h2>
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
										<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5e6c84] text-[10px] font-semibold text-white">
											{initials(inv.email) || "?"}
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate text-[13px] text-[#172b4d]">
												{inv.email}
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
									<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c66e4] text-[10px] font-semibold text-white">
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
										className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${m.role === "owner" ? "bg-[#e9f2ff] text-[#0c66e4]" : "bg-[#091e420a] text-[#44546f]"}`}
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
