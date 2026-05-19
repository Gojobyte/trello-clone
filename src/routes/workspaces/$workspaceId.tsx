import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	LayoutGrid,
	Pencil,
	Plus,
	Star,
	Users,
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
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import {
	BOARD_GRADIENTS,
	BOARD_PHOTOS,
	gradientFor,
	photoFor,
} from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/workspaces/$workspaceId")({
	component: WorkspaceDetailPage,
});

const WS_COLOR_MAP: Record<string, string> = {
	sky: "#0079bf",
	emerald: "#1F845A",
	amber: "#f59e0b",
	rose: "#e11d48",
	violet: "#8b5cf6",
	slate: "#334155",
};

function WorkspaceDetailPage() {
	const { workspaceId } = useParams({ from: "/workspaces/$workspaceId" });
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const data = useQuery(api.workspaces.get, {
		workspaceId: workspaceId as Id<"workspaces">,
	});
	const members = useQuery(api.workspaceMembers.listMembers, {
		workspaceId: workspaceId as Id<"workspaces">,
	});
	const [createBoardOpen, setCreateBoardOpen] = useState(false);
	const [inviteOpen, setInviteOpen] = useState(false);

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	if (isPending || !session?.user || data === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white">
				<div className="h-10 w-32 animate-pulse rounded bg-gray-100" />
			</div>
		);
	}

	if (data === null) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-white gap-3">
				<p className="text-base font-semibold text-[#172b4d]">
					Espace introuvable ou accès refusé
				</p>
				<Link
					to="/boards"
					className="text-sm text-[#0c66e4] hover:underline"
				>
					Retour à mes tableaux
				</Link>
			</div>
		);
	}

	const { workspace, boards } = data;
	const meId = session.user.id;
	const myMembership = members?.find((m) => m.userId === meId);
	const isOwner = workspace.ownerId === meId;
	const accent = workspace.color
		? WS_COLOR_MAP[workspace.color] ?? "#1F845A"
		: "#1F845A";

	return (
		<div className="min-h-screen bg-white pb-16 dark:bg-zinc-950">
			{/* Header coloré */}
			<header
				className="px-12 py-8"
				style={{ backgroundColor: `${accent}15` }}
			>
				<div className="flex items-start gap-4">
					<div
						className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl font-bold text-white shadow-sm"
						style={{ backgroundColor: accent }}
					>
						{workspace.name.charAt(0).toUpperCase()}
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold text-[#172b4d] dark:text-gray-100">
								{workspace.name}
							</h1>
							{isOwner && (
								<button
									type="button"
									onClick={() =>
										navigate({
											to: "/workspaces/$workspaceId",
											params: { workspaceId: workspace._id },
										})
									}
									className="rounded p-1 text-[#6b6e76] hover:bg-black/5"
									aria-label="Modifier"
								>
									<Pencil className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
						{workspace.description && (
							<p className="mt-1 text-sm text-[#6b6e76]">
								{workspace.description}
							</p>
						)}
						<div className="mt-3 flex items-center gap-3">
							<div className="flex items-center -space-x-2">
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
											className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0c66e4] text-[11px] font-semibold text-white"
										>
											{initials || "?"}
										</div>
									);
								})}
								{(members?.length ?? 0) > 5 && (
									<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#172b4d] text-[10px] font-semibold text-white">
										+{members!.length - 5}
									</div>
								)}
							</div>
							{isOwner && (
								<Button
									size="sm"
									onClick={() => setInviteOpen(true)}
									className="h-8 gap-1.5 bg-[#0c66e4] px-3 text-sm font-medium text-white hover:bg-[#0055cc]"
								>
									<Users className="h-3.5 w-3.5" />
									Inviter
								</Button>
							)}
							{!isOwner && myMembership && (
								<span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#44546f]">
									{myMembership.role === "owner" ? "Propriétaire" : "Membre"}
								</span>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Grille de boards */}
			<main className="px-12 pt-8">
				<div className="mb-4 flex items-center gap-2">
					<LayoutGrid className="h-5 w-5 text-[#6b6e76]" />
					<h2 className="text-base font-semibold text-[#292A2E] dark:text-gray-100">
						Tableaux ({boards.length})
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{boards.map((b) => (
						<WorkspaceBoardTile key={b._id} board={b} />
					))}
					<button
						type="button"
						onClick={() => setCreateBoardOpen(true)}
						className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#091e4224] bg-[#f7f8f9] text-[#172b4d] transition-colors hover:bg-[#e9f2ff] hover:text-[#0c66e4]"
					>
						<Plus className="h-5 w-5" />
						<span className="text-sm font-medium">Créer un tableau</span>
					</button>
				</div>
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
			className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:shadow-xl hover:ring-2 hover:ring-[#0c66e4]/60"
		>
			{photo ? (
				<div className="absolute inset-0" style={tileStyle} />
			) : (
				<div
					className={`absolute inset-0 bg-gradient-to-br ${gradientFor(board.color)}`}
				/>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
			<div className="relative flex h-full items-start p-3">
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
		try {
			const id = await createBoard({
				name: trimmed,
				color: bgImage ? undefined : color,
				backgroundImage: bgImage,
				workspaceId,
			});
			onOpenChange(false);
			setName("");
			navigate({ to: "/boards/$boardId", params: { boardId: id } });
		} finally {
			setSubmitting(false);
		}
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
									onClick={() => {
										setBgImage(p.id);
									}}
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
											<svg
												className="h-3.5 w-3.5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
											>
												<title>Retirer</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
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
