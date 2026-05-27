// ============ WORKSPACE DETAIL · Lume Éclat (Phase 3d) ============
// Hero coloré (logo + nom italic serif + avatars + invite) +
// onglets Tableaux / Membres / Réglages.

import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
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
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { BOARD_GRADIENTS, BOARD_PHOTOS, hexFor } from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/workspaces/$workspaceId")({
	component: WorkspaceDetailPage,
});

const WS_COLORS: { id: string; label: string }[] = [
	{ id: "sky", label: "Ciel" },
	{ id: "emerald", label: "Émeraude" },
	{ id: "amber", label: "Ambre" },
	{ id: "rose", label: "Rose" },
	{ id: "violet", label: "Violet" },
	{ id: "slate", label: "Ardoise" },
];

type WsTab = "boards" | "members" | "settings";

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
	const [tab, setTab] = useState<WsTab>("boards");
	const [createBoardOpen, setCreateBoardOpen] = useState(false);

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	if (isPending || !session?.user || data === undefined) {
		return (
			<AppShell active={{ route: "workspace" }} title="Espace">
				<div className="tools-page">
					<div style={{ padding: 48, display: "grid", placeItems: "center" }}>
						<div
							style={{
								height: 4,
								width: 128,
								overflow: "hidden",
								borderRadius: 999,
								background: "var(--border-c)",
							}}
						>
							<div
								style={{
									height: "100%",
									width: "33%",
									borderRadius: 999,
									background: "var(--accent)",
									animation: "pulse 1.5s ease-in-out infinite",
								}}
							/>
						</div>
					</div>
				</div>
			</AppShell>
		);
	}

	if (data === null) {
		return (
			<AppShell active={{ route: "workspace" }} title="Introuvable">
				<div className="tools-page">
					<div
						style={{
							padding: 64,
							display: "flex",
							flexDirection: "column",
							gap: 12,
							alignItems: "center",
						}}
					>
						<p
							style={{
								fontFamily: "var(--font-serif)",
								fontStyle: "italic",
								fontSize: 22,
								margin: 0,
								color: "var(--text)",
							}}
						>
							Espace introuvable.
						</p>
						<Link to="/boards" className="btn btn--outline">
							<Icon name="arrow" size={13} />
							Retour à mes tableaux
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	const { workspace, boards } = data;
	const meId = session.user.id;
	const isOwner = workspace.ownerId === meId;
	const accent = hexFor(workspace.color ?? "emerald");

	return (
		<AppShell
			active={{ route: "workspace" }}
			title={workspace.name}
			crumbs={["Espaces", workspace.name]}
		>
			<div className="tools-page">
				<WorkspaceHero
					workspace={workspace}
					accent={accent}
					members={members ?? []}
					meId={meId}
					isOwner={isOwner}
				/>

				<div className="workspace-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={tab === "boards"}
						onClick={() => setTab("boards")}
						className={`workspace-tab${tab === "boards" ? " is-active" : ""}`}
					>
						<Icon name="board" size={13} />
						Tableaux
						<span className="workspace-tab-count">{boards.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === "members"}
						onClick={() => setTab("members")}
						className={`workspace-tab${tab === "members" ? " is-active" : ""}`}
					>
						<Icon name="team" size={13} />
						Membres
						<span className="workspace-tab-count">{members?.length ?? 0}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === "settings"}
						onClick={() => setTab("settings")}
						className={`workspace-tab${tab === "settings" ? " is-active" : ""}`}
					>
						<Icon name="settings" size={13} />
						Réglages
					</button>
				</div>

				<section className="tools-body">
					{tab === "boards" && (
						<BoardsTab
							workspace={workspace}
							boards={boards}
							onCreate={() => setCreateBoardOpen(true)}
						/>
					)}
					{tab === "members" && (
						<MembersTab
							workspaceId={workspace._id}
							meId={meId}
							isOwner={isOwner}
						/>
					)}
					{tab === "settings" && (
						<SettingsTab workspace={workspace} isOwner={isOwner} />
					)}
				</section>
			</div>

			<CreateBoardInWorkspaceDialog
				workspaceId={workspace._id}
				open={createBoardOpen}
				onOpenChange={setCreateBoardOpen}
			/>
		</AppShell>
	);
}

// ─── HERO ───────────────────────────────────────────────────────────────────

function WorkspaceHero({
	workspace,
	accent,
	members,
	meId,
	isOwner,
}: {
	workspace: Doc<"workspaces">;
	accent: string;
	members: Array<{
		_id: string;
		userId: string;
		userName: string;
		role: string;
	}>;
	meId: string;
	isOwner: boolean;
}) {
	const myMembership = members.find((m) => m.userId === meId);
	return (
		<header
			className="workspace-hero"
			style={
				{
					"--ws-color": accent,
					"--ws-color-soft": `${accent}1f`,
					"--ws-color-tint": `${accent}0a`,
					"--ws-color-glow": `${accent}55`,
				} as React.CSSProperties
			}
		>
			<div className="workspace-hero-bg" aria-hidden />
			<div className="workspace-hero-grain" aria-hidden />

			<div className="workspace-hero-row">
				<div className="workspace-hero-id">
					<div className="workspace-hero-logo">
						{workspace.name.charAt(0).toUpperCase()}
					</div>
					<div style={{ minWidth: 0 }}>
						<h1 className="workspace-hero-name">{workspace.name}</h1>
						<div className="workspace-hero-sub">
							<span
								style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
							>
								<Icon name="lock" size={11} stroke={1.8} />
								Privé
							</span>
							<span>·</span>
							<span>{members.length} membres</span>
							{myMembership && (
								<>
									<span>·</span>
									<span>
										{myMembership.role === "owner" ? "Propriétaire" : "Membre"}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="workspace-hero-actions">
					<div className="workspace-hero-avatars">
						{members.slice(0, 5).map((m) => (
							<div
								key={m._id}
								title={m.userName}
								className="ws-av"
								style={{ background: accent }}
							>
								{initialsOf(m.userName)}
							</div>
						))}
						{members.length > 5 && (
							<div className="ws-av ws-av--more">+{members.length - 5}</div>
						)}
					</div>
					{isOwner && (
						<button type="button" className="btn btn--accent">
							<Icon name="team" size={13} />
							Inviter
						</button>
					)}
				</div>
			</div>

			{workspace.description && (
				<p className="workspace-hero-desc">{workspace.description}</p>
			)}
		</header>
	);
}

function initialsOf(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? "")
			.join("") || "?"
	);
}

// ─── BOARDS TAB ─────────────────────────────────────────────────────────────

function BoardsTab({
	workspace,
	boards,
	onCreate,
}: {
	workspace: Doc<"workspaces">;
	boards: Doc<"boards">[];
	onCreate: () => void;
}) {
	const starred = boards.filter((b) => b.starred);
	const others = boards.filter((b) => !b.starred);

	if (boards.length === 0) {
		return (
			<div className="boards-empty">
				<p className="boards-empty-title">Pas encore de tableaux.</p>
				<p className="boards-empty-desc">
					Crée ton premier tableau dans « {workspace.name} ».
				</p>
				<button
					type="button"
					className="btn btn--accent"
					style={{ marginTop: 14 }}
					onClick={onCreate}
				>
					<Icon name="plus" size={13} /> Nouveau tableau
				</button>
			</div>
		);
	}

	return (
		<>
			{starred.length > 0 && (
				<div className="boards-section">
					<div className="boards-section-head">
						<span className="boards-section-eyebrow">
							<Icon name="star" size={11} stroke={2} />
							Favoris
							<span className="boards-section-count">{starred.length}</span>
						</span>
					</div>
					<div className="board-grid">
						{starred.map((b) => (
							<WsBoardCard key={b._id} board={b} wsName={workspace.name} />
						))}
					</div>
				</div>
			)}

			<div className="boards-section">
				<div className="boards-section-head">
					<span className="boards-section-eyebrow">
						<Icon name="board" size={11} stroke={2} />
						Tous les tableaux
						<span className="boards-section-count">{others.length}</span>
					</span>
				</div>
				<div className="board-grid">
					{others.map((b) => (
						<WsBoardCard key={b._id} board={b} wsName={workspace.name} />
					))}
					<button type="button" onClick={onCreate} className="board-card-new">
						<div className="board-card-new-icon">
							<Icon name="plus" size={16} stroke={1.8} />
						</div>
						<span style={{ fontSize: 13, fontWeight: 500 }}>
							Nouveau tableau
						</span>
					</button>
				</div>
			</div>
		</>
	);
}

function WsBoardCard({
	board,
	wsName,
}: {
	board: Doc<"boards">;
	wsName: string;
}) {
	const toggleStar = useMutation(api.boards.toggleStar);
	const stripColor = hexFor(board.color);
	const emoji = board.name.charAt(0).toUpperCase();
	const starred = board.starred ?? false;

	return (
		<Link
			to="/boards/$boardId"
			params={{ boardId: board._id }}
			className="board-card-lume"
		>
			<div
				className="board-card-strip"
				style={{
					background: `linear-gradient(135deg, ${stripColor}, ${stripColor}cc)`,
				}}
			>
				<div className="board-card-emoji">{emoji}</div>
				<button
					type="button"
					className={`board-card-star${starred ? " is-on" : ""}`}
					aria-label={starred ? "Retirer des favoris" : "Ajouter aux favoris"}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void toggleStar({ boardId: board._id });
					}}
				>
					<Icon name="star" size={13} stroke={2} />
				</button>
			</div>

			<div className="board-card-body">
				<div className="board-card-name">{board.name}</div>
				<div className="board-card-meta">{wsName}</div>
			</div>

			<div className="board-card-foot">
				<span className="board-card-stat">
					<Icon name="board" size={11} stroke={1.6} />
					Tableau
				</span>
				<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
					{formatDistanceToNow(board._creationTime, {
						addSuffix: true,
						locale: fr,
					})}
				</span>
			</div>
		</Link>
	);
}

// ─── MEMBERS TAB ────────────────────────────────────────────────────────────

function MembersTab({
	workspaceId,
	meId,
	isOwner,
}: {
	workspaceId: Id<"workspaces">;
	meId: string;
	isOwner: boolean;
}) {
	const members = useQuery(api.workspaceMembers.listMembers, { workspaceId });
	const invitations = useQuery(api.workspaceMembers.listPendingInvitations, {
		workspaceId,
	});
	const invite = useMutation(api.workspaceMembers.invite);
	const revoke = useMutation(api.workspaceMembers.revokeInvitation);
	const removeMember = useMutation(api.workspaceMembers.removeMember);

	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		try {
			await invite({ workspaceId, email: trimmed });
			setEmail("");
			setSuccess(`Invitation envoyée à ${trimmed}`);
			setTimeout(() => setSuccess(null), 3000);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Erreur lors de l'invitation.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			{isOwner && (
				<form className="member-invite" onSubmit={handleInvite}>
					<Icon
						name="send"
						size={14}
						stroke={1.6}
						style={{ color: "var(--text-subtle)" }}
					/>
					<input
						type="email"
						placeholder="adresse.email@exemple.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={submitting}
					/>
					<button
						type="submit"
						className="btn btn--accent"
						disabled={submitting || !email.trim()}
					>
						{submitting ? "Envoi…" : "Inviter"}
					</button>
				</form>
			)}

			{error && (
				<div className="settings-feedback settings-feedback--err">{error}</div>
			)}
			{success && (
				<div className="settings-feedback settings-feedback--ok">{success}</div>
			)}

			{invitations && invitations.length > 0 && (
				<div className="boards-section" style={{ marginBottom: 8 }}>
					<div className="boards-section-head">
						<span className="boards-section-eyebrow">
							<Icon name="clock" size={11} stroke={2} />
							Invitations en attente
							<span className="boards-section-count">{invitations.length}</span>
						</span>
					</div>
					<div className="member-list">
						{invitations.map((inv) => (
							<div key={inv._id} className="member-row">
								<div
									className="member-av"
									style={{ background: "var(--text-muted)" }}
								>
									{initialsOf(inv.email)}
								</div>
								<div>
									<div className="member-name">{inv.email}</div>
									<div className="member-email">Invitation pending</div>
								</div>
								<span className="member-role-badge">Invité</span>
								{isOwner ? (
									<button
										type="button"
										className="member-action"
										onClick={() => void revoke({ invitationId: inv._id })}
										aria-label="Révoquer l'invitation"
									>
										<Icon name="x" size={13} stroke={1.8} />
									</button>
								) : (
									<span />
								)}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="boards-section">
				<div className="boards-section-head">
					<span className="boards-section-eyebrow">
						<Icon name="team" size={11} stroke={2} />
						Membres
						<span className="boards-section-count">{members?.length ?? 0}</span>
					</span>
				</div>
				<div className="member-list">
					{(members ?? []).map((m) => (
						<div key={m._id} className="member-row">
							<div className="member-av">{initialsOf(m.userName)}</div>
							<div>
								<div className="member-name">
									{m.userName}
									{m.userId === meId && (
										<span
											style={{
												marginLeft: 6,
												fontSize: 11,
												fontWeight: 400,
												color: "var(--text-subtle)",
											}}
										>
											(vous)
										</span>
									)}
								</div>
								<div className="member-email">{m.userEmail}</div>
							</div>
							<span
								className={`member-role-badge${m.role === "owner" ? " is-owner" : ""}`}
							>
								{m.role === "owner" ? "Propriétaire" : "Membre"}
							</span>
							{isOwner && m.role !== "owner" ? (
								<button
									type="button"
									className="member-action"
									onClick={() => void removeMember({ memberId: m._id })}
									aria-label="Retirer le membre"
								>
									<Icon name="x" size={13} stroke={1.8} />
								</button>
							) : (
								<span />
							)}
						</div>
					))}
				</div>
			</div>
		</>
	);
}

// ─── SETTINGS TAB ───────────────────────────────────────────────────────────

function SettingsTab({
	workspace,
	isOwner,
}: {
	workspace: Doc<"workspaces">;
	isOwner: boolean;
}) {
	const rename = useMutation(api.workspaces.rename);
	const updateDescription = useMutation(api.workspaces.updateDescription);

	const [name, setName] = useState(workspace.name);
	const [description, setDescription] = useState(workspace.description ?? "");
	const [color, setColor] = useState(workspace.color ?? "emerald");
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);

	const dirty =
		name.trim() !== workspace.name ||
		description !== (workspace.description ?? "") ||
		color !== (workspace.color ?? "emerald");

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!dirty || saving) return;
		setSaving(true);
		try {
			if (name.trim() !== workspace.name) {
				await rename({ workspaceId: workspace._id, name: name.trim() });
			}
			if (description !== (workspace.description ?? "")) {
				await updateDescription({
					workspaceId: workspace._id,
					description,
				});
			}
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} finally {
			setSaving(false);
		}
	}

	return (
		<form className="settings-panel" onSubmit={handleSave}>
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Réglages de l'espace</h2>
				<p className="settings-panel-desc">
					{isOwner
						? "Personnalise le nom, la description et la couleur de l'espace."
						: "Seul le propriétaire peut modifier ces réglages."}
				</p>
			</div>

			<div className="settings-panel-body">
				<div className="settings-field-row">
					<div className="settings-field-label">Nom de l'espace</div>
					<input
						className="input"
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={!isOwner}
					/>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">
						Description
						<div className="settings-field-hint">
							Visible par les membres de l'espace.
						</div>
					</div>
					<textarea
						className="input textarea"
						rows={3}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="À quoi sert cet espace ?"
						disabled={!isOwner}
					/>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">
						Couleur
						<div className="settings-field-hint">
							Utilisée pour le hero et la pastille de navigation.
						</div>
					</div>
					<div className="ws-color-grid">
						{WS_COLORS.map((c) => (
							<button
								key={c.id}
								type="button"
								className={`ws-color-swatch${color === c.id ? " is-active" : ""}`}
								style={{ background: hexFor(c.id) }}
								onClick={() => isOwner && setColor(c.id)}
								disabled={!isOwner}
								aria-label={c.label}
								title={c.label}
							/>
						))}
					</div>
				</div>

				{success && (
					<div className="settings-feedback settings-feedback--ok">
						Réglages mis à jour.
					</div>
				)}
			</div>

			{isOwner && (
				<div className="settings-panel-foot">
					<button
						type="submit"
						className="btn btn--accent"
						disabled={!dirty || saving}
					>
						{saving ? "Enregistrement…" : "Enregistrer"}
					</button>
				</div>
			)}
		</form>
	);
}

// ─── DIALOG · Créer un tableau ──────────────────────────────────────────────

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
									onClick={() => setBgImage(p.id)}
									className={`relative aspect-video overflow-hidden rounded transition-all ${bgImage === p.id ? "ring-2 ring-[color:var(--accent)]" : ""}`}
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
									className={`aspect-video rounded bg-gradient-to-br transition-all ${g.gradient} ${color === g.id && !bgImage ? "ring-2 ring-[color:var(--accent)]" : ""}`}
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
						<button
							type="submit"
							className="btn btn--accent"
							disabled={submitting || !name.trim()}
							style={{ width: "100%", justifyContent: "center" }}
						>
							{submitting ? "Création..." : "Créer le tableau"}
						</button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
