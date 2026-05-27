import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { hexFor } from "#/lib/board-backgrounds";
import { useSidebarMode } from "#/lib/use-sidebar-mode";
import { useTheme } from "#/lib/use-theme";
import { api } from "../../../convex/_generated/api";
import { LABELS, PEOPLE } from "./demo-data";
import { Icon } from "./Icon";
import { Avatar } from "./primitives";

// Onglets de l'espace personnel — inspirés de Linear / Asana / Height.
const PERSONAL_NAV = [
	{
		id: "inbox",
		label: "Inbox",
		icon: "inbox",
		tab: "inbox",
		badge: "6",
		accent: true,
	},
	{
		id: "today",
		label: "Mon jour",
		icon: "spark",
		tab: "today",
		badge: "3",
		accent: false,
	},
	{
		id: "tasks",
		label: "Mes tâches",
		icon: "check",
		tab: "tasks",
		badge: "8",
		accent: false,
	},
	{
		id: "views",
		label: "Vues",
		icon: "eye",
		tab: "views",
		badge: "4",
		accent: false,
	},
] as const;

// Outils de gestion de projet.
const TOOL_NAV = [
	{
		id: "goals",
		label: "Objectifs",
		icon: "pin",
		to: "/goals",
		badge: "Q2",
		pro: false,
	},
	{
		id: "docs",
		label: "Docs",
		icon: "docs",
		to: "/docs",
		badge: "24",
		pro: false,
	},
	{
		id: "sprints",
		label: "Sprints",
		icon: "bolt",
		to: "/sprints",
		badge: "S-23",
		pro: false,
	},
	{
		id: "workload",
		label: "Charge équipe",
		icon: "team",
		to: "/workload",
		badge: "",
		pro: false,
	},
	{
		id: "templates",
		label: "Templates",
		icon: "table",
		to: "/templates",
		badge: "",
		pro: false,
	},
	{
		id: "automations",
		label: "Automatisations",
		icon: "spark",
		to: "/automations",
		badge: "7",
		pro: true,
	},
] as const;

const BOARD_SUBS = [
	{ id: "board", label: "Board", icon: "board", pro: false },
	{ id: "calendar", label: "Calendrier", icon: "calendar", pro: false },
	{ id: "timeline", label: "Timeline", icon: "timeline", pro: true },
	{ id: "dashboard", label: "Dashboard", icon: "dashboard", pro: true },
] as const;

export type SidebarActive = {
	route: string;
	mwTab?: string;
	boardId?: string;
	boardView?: string;
};

// Petit SVG inline pour soleil / lune — pas dans le set Icon.tsx
function SunIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Soleil"
		>
			<title>Soleil</title>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	);
}

function MoonIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Lune"
		>
			<title>Lune</title>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}

// Chevrons "<<" pour le bouton réduire/étendre la sidebar.
function ChevronsLeftIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Chevrons"
		>
			<title>Chevrons</title>
			<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
		</svg>
	);
}

function SbSection({
	title,
	k,
	collapsed,
	onToggle,
	count,
	actions,
	children,
}: {
	title: string;
	k: string;
	collapsed: boolean;
	onToggle: (k: string) => void;
	count?: number;
	actions?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="sb-sect">
			<div className="sb-sect-h" onClick={() => onToggle(k)}>
				<Icon
					name="chevdown"
					size={11}
					stroke={2}
					style={{
						transform: `rotate(${collapsed ? -90 : 0}deg)`,
						transition: "transform 0.15s",
						color: "var(--text-subtle)",
					}}
				/>
				<span>{title}</span>
				{count !== undefined && <span className="sb-sect-count">{count}</span>}
				<span className="spacer" />
				{actions}
			</div>
			{!collapsed && <div className="sb-sect-body">{children}</div>}
		</div>
	);
}

export function AppSidebar({ active }: { active: SidebarActive }) {
	const { data: session } = authClient.useSession();
	const isAuthed = !!session?.user;
	const boards = useQuery(api.boards.listMine, isAuthed ? {} : "skip") ?? [];
	const { theme, toggle: toggleTheme } = useTheme();
	const { mode: sidebarMode, toggle: toggleSidebar } = useSidebarMode();

	const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
		if (typeof window === "undefined") return {};
		try {
			return JSON.parse(localStorage.getItem("gp_sidebar_collapsed") || "{}");
		} catch {
			return {};
		}
	});
	const toggle = (k: string) => {
		const next = { ...collapsed, [k]: !collapsed[k] };
		setCollapsed(next);
		try {
			localStorage.setItem("gp_sidebar_collapsed", JSON.stringify(next));
		} catch {
			/* ignore */
		}
	};
	const isOpen = (k: string, def = true) =>
		collapsed[k] === undefined ? def : !collapsed[k];

	const isRail = sidebarMode === "rail";

	return (
		<aside className="sidebar">
			<div className="sb-scroll">
				{/* Espace personnel */}
				{PERSONAL_NAV.map((n) => (
					<Link
						key={n.id}
						to="/my-work"
						search={{ tab: n.tab }}
						className={`sidebar-item ${
							active.route === "my-work" && active.mwTab === n.tab
								? "active"
								: ""
						}`}
					>
						<Icon name={n.icon} size={15} className="sidebar-item-icon" />
						<span className="sb-label">{n.label}</span>
						<span
							className="sidebar-item-badge"
							style={
								n.accent
									? {
											background: "var(--accent)",
											color: "white",
											padding: "0 5px",
											borderRadius: 8,
											fontSize: 10,
											fontFamily: "var(--font-sans)",
											fontWeight: 600,
										}
									: undefined
							}
						>
							{n.badge}
						</span>
						<span className="sb-tooltip">{n.label}</span>
					</Link>
				))}

				{/* Outils */}
				<SbSection
					title="Outils"
					k="tools"
					collapsed={!isOpen("tools")}
					onToggle={toggle}
				>
					{TOOL_NAV.map((n) => (
						<Link
							key={n.id}
							to={n.to}
							className={`sidebar-item ${active.route === n.id ? "active" : ""}`}
						>
							<Icon name={n.icon} size={15} className="sidebar-item-icon" />
							<span className="sb-label">{n.label}</span>
							{n.badge && <span className="sidebar-item-badge">{n.badge}</span>}
							{n.pro && <span className="sidebar-pill">PRO</span>}
							<span className="sb-tooltip">{n.label}</span>
						</Link>
					))}
				</SbSection>

				{/* Boards — tableaux réels de l'utilisateur */}
				<SbSection
					title="Boards"
					k="boards"
					count={boards.length}
					collapsed={!isOpen("boards")}
					onToggle={toggle}
					actions={
						<Link
							to="/boards"
							title="Tous les tableaux"
							className="sb-icon-btn"
							onClick={(e) => e.stopPropagation()}
						>
							<Icon name="plus" size={12} stroke={1.8} />
						</Link>
					}
				>
					<Link
						to="/boards"
						className={`sidebar-item ${active.route === "workspace" ? "active" : ""}`}
					>
						<Icon name="folder" size={14} className="sidebar-item-icon" />
						<span className="sb-label">Tous les boards</span>
						<span className="sidebar-item-badge">{boards.length}</span>
						<span className="sb-tooltip">Tous les boards</span>
					</Link>
					{boards.slice(0, 8).map((b) => {
						const isActive = active.boardId === b._id;
						return (
							<div key={b._id}>
								<Link
									to="/boards/$boardId"
									params={{ boardId: b._id }}
									className={`sidebar-item sb-board ${isActive ? "active" : ""}`}
								>
									<span
										className="sb-board-mark"
										style={{ background: hexFor(b.color) }}
									>
										{b.name.charAt(0).toUpperCase()}
									</span>
									<span className="sb-board-name sb-label">{b.name}</span>
									{b.starred && (
										<Icon
											name="star"
											size={11}
											stroke={1.8}
											style={{ color: "var(--text-subtle)" }}
										/>
									)}
									<span className="sb-tooltip">{b.name}</span>
								</Link>
								{isActive && (
									<div className="sb-board-subs">
										{BOARD_SUBS.map((s) => (
											<Link
												key={s.id}
												to="/boards/$boardId"
												params={{ boardId: b._id }}
												search={{ view: s.id }}
												className={`sidebar-item ${
													(active.boardView || "board") === s.id ? "active" : ""
												}`}
												style={{ paddingLeft: 38, fontSize: 12.5 }}
											>
												<Icon
													name={s.icon}
													size={12}
													className="sidebar-item-icon"
												/>
												<span className="sb-label">{s.label}</span>
												{s.pro && <span className="sidebar-pill">PRO</span>}
												<span className="sb-tooltip">{s.label}</span>
											</Link>
										))}
									</div>
								)}
							</div>
						);
					})}
				</SbSection>

				{/* Équipe */}
				<SbSection
					title="Équipe"
					k="team"
					count={PEOPLE.length}
					collapsed={!isOpen("team", false)}
					onToggle={toggle}
				>
					{PEOPLE.slice(0, 5).map((p, i) => {
						const online = i < 3;
						return (
							<button
								key={p.id}
								className="sidebar-item sb-member"
								type="button"
							>
								<span style={{ position: "relative", flex: "none" }}>
									<Avatar user={p.id} size="sm" />
									<span
										className="sb-status"
										style={{
											background: online
												? "var(--green)"
												: "var(--text-subtle)",
										}}
									/>
								</span>
								<span className="sb-member-name sb-label">
									{p.name.split(" ")[0]}
								</span>
								<span className="text-subtle text-xs sb-label">
									{online ? "En ligne" : i === 3 ? "2h" : "hier"}
								</span>
								<span className="sb-tooltip">{p.name}</span>
							</button>
						);
					})}
				</SbSection>

				{/* Étiquettes */}
				<SbSection
					title="Étiquettes"
					k="labels"
					collapsed={!isOpen("labels", false)}
					onToggle={toggle}
				>
					{Object.entries(LABELS).map(([id, l]) => (
						<button key={id} className="sidebar-item" type="button">
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: 3,
									flex: "none",
									background: l.fg,
								}}
							/>
							<span className="sb-label">{l.name}</span>
							<span className="sb-tooltip">{l.name}</span>
						</button>
					))}
				</SbSection>
			</div>

			{/* Dock bas */}
			<div className="sb-dock">
				<div className="sb-storage">
					<div
						className="row"
						style={{ justifyContent: "space-between", marginBottom: 4 }}
					>
						<span
							style={{
								fontSize: 11,
								color: "var(--text-muted)",
								fontWeight: 500,
							}}
						>
							Stockage
						</span>
						<span
							style={{
								fontSize: 10.5,
								color: "var(--text-subtle)",
								fontFamily: "var(--font-mono)",
							}}
						>
							2.4 / 10 Go
						</span>
					</div>
					<div className="sb-storage-bar">
						<div
							style={{
								width: "24%",
								background: "var(--accent)",
								height: "100%",
								borderRadius: 2,
							}}
						/>
					</div>
				</div>

				<Link to="/pricing" className="sidebar-item">
					<span
						style={{
							width: 18,
							height: 18,
							borderRadius: "50%",
							flex: "none",
							background:
								"linear-gradient(135deg, var(--accent), oklch(0.62 0.18 295))",
							display: "grid",
							placeItems: "center",
							color: "white",
							fontSize: 9,
							fontWeight: 600,
						}}
					>
						✦
					</span>
					<span className="sb-label">Passer à Premium</span>
					<span className="sb-tooltip">Passer à Premium</span>
				</Link>

				{/* Rangée d'actions : thème, réglages, toggle rail */}
				<div className="sb-dock-actions">
					<button
						type="button"
						className="sb-dock-btn"
						onClick={toggleTheme}
						title={theme === "dark" ? "Thème clair" : "Thème sombre"}
						aria-label={
							theme === "dark"
								? "Activer le thème clair"
								: "Activer le thème sombre"
						}
					>
						{theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
					</button>
					<Link
						to="/settings"
						className={`sb-dock-btn ${active.route === "settings" ? "is-active" : ""}`}
						title="Réglages"
						aria-label="Réglages"
					>
						<Icon name="settings" size={16} />
					</Link>
					<button
						type="button"
						className="sb-dock-btn sb-dock-btn--toggle"
						onClick={toggleSidebar}
						title={isRail ? "Étendre" : "Réduire"}
						aria-label={isRail ? "Étendre la sidebar" : "Réduire la sidebar"}
					>
						<ChevronsLeftIcon size={16} />
					</button>
				</div>
			</div>
		</aside>
	);
}
