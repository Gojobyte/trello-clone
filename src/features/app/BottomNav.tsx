// Barre de navigation fixe en bas, visible uniquement sur mobile (<768px).
// Cinq raccourcis : Accueil, Boards, Recherche, Inbox, Menu.
import { Link } from "@tanstack/react-router";
import type { SidebarActive } from "./AppSidebar";
import { Icon } from "./Icon";

// Compteur de notifications non lues — à brancher plus tard sur une query Convex.
const INBOX_UNREAD = 6;

export function BottomNav({
	active,
	onSearchClick,
}: {
	active: SidebarActive;
	onSearchClick: () => void;
}) {
	// Route active : on regarde `active.route` et le tab pour Inbox.
	const isBoards =
		active.route === "workspace" ||
		active.route === "boards" ||
		!!active.boardId;
	const isHome = active.route === "home";
	const isInbox = active.route === "my-work" && active.mwTab === "inbox";

	return (
		<nav className="bottom-nav" aria-label="Navigation mobile">
			<Link
				to="/boards"
				className={`bnav-item ${isHome ? "is-active" : ""}`}
				aria-label="Accueil"
			>
				<Icon name="home" size={22} className="bnav-icon" />
				<span className="bnav-label">Accueil</span>
			</Link>

			<Link
				to="/boards"
				className={`bnav-item ${isBoards ? "is-active" : ""}`}
				aria-label="Boards"
			>
				<Icon name="board" size={22} className="bnav-icon" />
				<span className="bnav-label">Boards</span>
			</Link>

			<button
				type="button"
				className="bnav-item"
				onClick={onSearchClick}
				aria-label="Recherche"
			>
				<Icon name="search" size={22} className="bnav-icon" />
				<span className="bnav-label">Recherche</span>
			</button>

			<Link
				to="/my-work"
				search={{ tab: "inbox" }}
				className={`bnav-item ${isInbox ? "is-active" : ""}`}
				aria-label="Inbox"
			>
				<span className="bnav-icon-wrap">
					<Icon name="inbox" size={22} className="bnav-icon" />
					{INBOX_UNREAD > 0 && (
						<span className="bnav-badge">{INBOX_UNREAD}</span>
					)}
				</span>
				<span className="bnav-label">Inbox</span>
			</Link>

			<button
				type="button"
				className="bnav-item"
				// TODO: brancher sur l'ouverture du drawer mobile (sidebar/menu).
				onClick={() => {
					/* no-op pour l'instant */
				}}
				aria-label="Menu"
			>
				<Icon name="dots" size={22} className="bnav-icon" />
				<span className="bnav-label">Menu</span>
			</button>
		</nav>
	);
}
