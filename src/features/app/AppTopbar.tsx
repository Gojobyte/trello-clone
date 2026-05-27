import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GlobalSearch } from "#/features/shared/GlobalSearch";
import { authClient } from "#/lib/auth-client";
import { Icon } from "./Icon";
import { BrandMark } from "./MarketingShell";

export type BoardViewId = "board" | "calendar" | "timeline" | "dashboard";

const BOARD_VIEWS: Array<{ id: BoardViewId; icon: string; label: string }> = [
	{ id: "board", icon: "board", label: "Board" },
	{ id: "calendar", icon: "calendar", label: "Calendrier" },
	{ id: "timeline", icon: "timeline", label: "Timeline" },
	{ id: "dashboard", icon: "dashboard", label: "Dashboard" },
];

// Stub workspaces — à remplacer quand le backend exposera la liste des workspaces.
const MOCK_WORKSPACES = [
	{ id: "ws-1", name: "Mon espace", plan: "Premium", current: true },
];

// Stub notifications — à remplacer par une vraie query Convex sur les inbox events.
const MOCK_NOTIFICATIONS = [
	{
		id: "n1",
		initials: "MS",
		color: "#6E56CF",
		actor: "Marie Sow",
		text: "vous a mentionné sur",
		target: "Refonte onboarding",
		time: "il y a 4 min",
		unread: true,
	},
	{
		id: "n2",
		initials: "AB",
		color: "#0EA5E9",
		actor: "Adam Ben",
		text: "a assigné la carte",
		target: "Audit accessibilité",
		time: "il y a 1 h",
		unread: true,
	},
	{
		id: "n3",
		initials: "LK",
		color: "#10B981",
		actor: "Lina Koffi",
		text: "a commenté",
		target: "Sprint S22 — plan",
		time: "hier",
		unread: true,
	},
	{
		id: "n4",
		initials: "TD",
		color: "#F59E0B",
		actor: "Théo Dupont",
		text: "a terminé",
		target: "Migration tokens v3",
		time: "hier",
		unread: false,
	},
];

export function AppTopbar({
	title,
	crumbs = [],
	boardView,
	onSwitchView,
	onBack,
	boardEmoji,
	boardAccent,
	actions,
	noSidebar = false,
}: {
	title: string;
	crumbs?: string[];
	boardView?: BoardViewId;
	onSwitchView?: (v: BoardViewId) => void;
	onBack?: () => void;
	boardEmoji?: string;
	boardAccent?: string;
	actions?: React.ReactNode;
	noSidebar?: boolean;
}) {
	const { data: session } = authClient.useSession();
	const userName = session?.user?.name || session?.user?.email || "Invité";
	const userEmail = session?.user?.email || "";
	const initial = userName.charAt(0).toUpperCase();
	const workspaceName = MOCK_WORKSPACES[0]?.name || "Mon espace";
	const workspaceInitial = workspaceName.charAt(0).toUpperCase();

	// Stub sync state — branchera plus tard l'état de connexion Convex (online/syncing).
	const syncState: "synced" | "syncing" = "synced";
	const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

	const [wsOpen, setWsOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [avatarOpen, setAvatarOpen] = useState(false);
	const wsRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);
	const avatarRef = useRef<HTMLDivElement>(null);

	// Close popovers on outside click
	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			const target = e.target as Node;
			if (wsOpen && wsRef.current && !wsRef.current.contains(target)) {
				setWsOpen(false);
			}
			if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
				setNotifOpen(false);
			}
			if (
				avatarOpen &&
				avatarRef.current &&
				!avatarRef.current.contains(target)
			) {
				setAvatarOpen(false);
			}
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [wsOpen, notifOpen, avatarOpen]);

	// Close popovers with Escape
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setWsOpen(false);
				setNotifOpen(false);
				setAvatarOpen(false);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const handleSignOut = async () => {
		setAvatarOpen(false);
		try {
			await authClient.signOut();
		} catch (err) {
			console.error("signOut failed", err);
		}
	};

	return (
		<header className="topbar">
			{/* Marque, à gauche — alignée sur la sidebar */}
			<Link
				to="/boards"
				className={`topbar-brand${noSidebar ? " topbar-brand--full" : ""}`}
			>
				<BrandMark />
				<span>Flowboard</span>
			</Link>

			<div className="topbar-main">
				{/* Workspace switcher juste après la marque */}
				<div className="topbar-ws-wrap" ref={wsRef}>
					<button
						type="button"
						className="topbar-ws"
						onClick={() => setWsOpen((v) => !v)}
						aria-haspopup="menu"
						aria-expanded={wsOpen}
						title="Changer de workspace"
					>
						<span className="topbar-ws-avatar">{workspaceInitial}</span>
						<span className="topbar-ws-name">{workspaceName}</span>
						<Icon name="chevdown" size={10} className="topbar-ws-chev" />
					</button>
					<div className={`topbar-ws-pop${wsOpen ? " is-open" : ""}`}>
						{MOCK_WORKSPACES.map((ws) => (
							<button
								key={ws.id}
								type="button"
								className={`topbar-ws-item${ws.current ? " is-current" : ""}`}
								onClick={() => setWsOpen(false)}
							>
								<span className="topbar-ws-avatar topbar-ws-avatar--sm">
									{ws.name.charAt(0).toUpperCase()}
								</span>
								<span className="topbar-ws-item-meta">
									<span className="topbar-ws-name">{ws.name}</span>
									<span className="topbar-ws-plan">{ws.plan}</span>
								</span>
								{ws.current && (
									<Icon
										name="check"
										size={12}
										style={{ color: "var(--accent)" }}
									/>
								)}
							</button>
						))}
						<div className="topbar-ws-sep" />
						<button
							type="button"
							className="topbar-ws-action"
							onClick={() => setWsOpen(false)}
						>
							<Icon name="plus" size={14} />
							<span>Créer un workspace</span>
						</button>
					</div>
				</div>

				{/* Zone gauche : retour, titre, switcher de vues */}
				<div className="row" style={{ gap: 8, flex: "none", minWidth: 0 }}>
					{onBack && (
						<button
							type="button"
							className="btn btn--ghost"
							onClick={onBack}
							style={{ padding: "4px 6px" }}
							title="Retour aux tableaux"
						>
							<Icon
								name="chevron"
								size={14}
								style={{ transform: "rotate(180deg)" }}
							/>
						</button>
					)}
					{boardEmoji && (
						<span
							style={{
								width: 18,
								height: 18,
								borderRadius: 4,
								flex: "none",
								background: boardAccent || "var(--text)",
								display: "grid",
								placeItems: "center",
								color: "white",
								fontSize: 10,
							}}
						>
							{boardEmoji}
						</span>
					)}
					<div className="topbar-title" style={{ minWidth: 0 }}>
						{crumbs.map((c) => (
							<span key={c} className="row" style={{ gap: 8 }}>
								<span className="topbar-crumb">{c}</span>
								<span className="topbar-crumb" style={{ opacity: 0.5 }}>
									/
								</span>
							</span>
						))}
						<span
							style={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{title}
						</span>
					</div>

					{boardView && onSwitchView && (
						<div
							className="row"
							style={{
								marginLeft: 4,
								padding: 2,
								background: "var(--bg-soft)",
								borderRadius: 6,
								gap: 0,
							}}
						>
							{BOARD_VIEWS.map((v) => (
								<button
									key={v.id}
									type="button"
									onClick={() => onSwitchView(v.id)}
									className="row"
									style={{
										gap: 5,
										padding: "3px 8px",
										border: "none",
										borderRadius: 4,
										background:
											boardView === v.id ? "var(--surface)" : "transparent",
										boxShadow: boardView === v.id ? "var(--shadow-xs)" : "none",
										fontSize: 12.5,
										fontWeight: 500,
										color:
											boardView === v.id ? "var(--text)" : "var(--text-muted)",
										cursor: "pointer",
										transition: "all 0.12s",
									}}
								>
									<Icon name={v.icon} size={13} />
									{v.label}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Zone centrale : vraie barre de recherche live */}
				<div
					style={{
						flex: 1,
						display: "flex",
						justifyContent: "center",
						minWidth: 0,
						padding: "0 12px",
					}}
				>
					<div style={{ width: "100%", maxWidth: 560 }}>
						<GlobalSearch variant="light" />
					</div>
				</div>

				{/* Zone droite : sync, notifications, actions, avatar */}
				<div className="row" style={{ gap: 6, flex: "none" }}>
					<div
						className="topbar-sync"
						data-state={syncState}
						title={
							syncState === "synced"
								? "Données synchronisées"
								: "Synchronisation en cours…"
						}
					>
						<span className="ping" aria-hidden />
						<span className="topbar-sync-text">
							{syncState === "synced" ? "Synced" : "Syncing"}
						</span>
					</div>

					{/* Notifications popover */}
					<div className="topbar-notif-wrap" ref={notifRef}>
						<button
							type="button"
							className="btn btn--ghost btn--icon topbar-notif-btn"
							title="Notifications"
							onClick={() => setNotifOpen((v) => !v)}
							aria-haspopup="menu"
							aria-expanded={notifOpen}
						>
							<Icon name="bell" size={15} />
							{unreadCount > 0 && (
								<output
									className="topbar-notif-badge"
									aria-label={`${unreadCount} notifications non lues`}
								>
									{unreadCount}
								</output>
							)}
						</button>
						<div className={`topbar-notif-pop${notifOpen ? " is-open" : ""}`}>
							<div className="topbar-notif-head">
								<span className="topbar-notif-title">Notifications</span>
								{unreadCount > 0 && (
									<span className="topbar-notif-count">
										{unreadCount} non lues
									</span>
								)}
							</div>
							<div className="topbar-notif-list">
								{MOCK_NOTIFICATIONS.map((n) => (
									<button
										key={n.id}
										type="button"
										className={`topbar-notif-item${n.unread ? " is-unread" : ""}`}
									>
										<span
											className="topbar-notif-avatar"
											style={{ background: n.color }}
										>
											{n.initials}
										</span>
										<span className="topbar-notif-body">
											<span className="topbar-notif-text">
												<b>{n.actor}</b> {n.text} <b>{n.target}</b>
											</span>
											<span className="topbar-notif-meta">{n.time}</span>
										</span>
									</button>
								))}
							</div>
							<div className="topbar-notif-foot">
								<Link
									to="/my-work"
									search={{ tab: "inbox" }}
									onClick={() => setNotifOpen(false)}
									className="topbar-notif-all"
								>
									Voir tout
								</Link>
							</div>
						</div>
					</div>

					{actions}
					<span
						style={{
							width: 1,
							height: 20,
							background: "var(--border-c)",
							margin: "0 4px",
						}}
					/>

					{/* Avatar popover */}
					<div className="topbar-avatar-wrap" ref={avatarRef}>
						<button
							type="button"
							className="avatar avatar--lg topbar-avatar-btn"
							style={{ background: "var(--accent)" }}
							title="Compte"
							onClick={() => setAvatarOpen((v) => !v)}
							aria-haspopup="menu"
							aria-expanded={avatarOpen}
						>
							{initial}
						</button>
						<div className={`topbar-avatar-pop${avatarOpen ? " is-open" : ""}`}>
							<div className="topbar-avatar-id">
								<div className="topbar-avatar-name">{userName}</div>
								{userEmail && (
									<div className="topbar-avatar-email">{userEmail}</div>
								)}
							</div>
							<div className="topbar-avatar-sep" />
							<Link
								to="/settings"
								className="topbar-avatar-item"
								onClick={() => setAvatarOpen(false)}
							>
								<Icon name="settings" size={14} />
								<span>Réglages</span>
							</Link>
							<Link
								to="/pricing"
								className="topbar-avatar-item"
								onClick={() => setAvatarOpen(false)}
							>
								<Icon name="spark" size={14} />
								<span>Passer Premium</span>
							</Link>
							<div className="topbar-avatar-sep" />
							<button
								type="button"
								className="topbar-avatar-item topbar-avatar-item--danger"
								onClick={handleSignOut}
							>
								<Icon name="arrow" size={14} />
								<span>Déconnexion</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
