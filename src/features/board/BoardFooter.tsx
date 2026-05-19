import {
	Calendar as CalendarIcon,
	Inbox,
	LayoutGrid,
	Sparkles,
	Table as TableIcon,
} from "lucide-react";

export type BoardViewMode = "kanban" | "table" | "calendar";

export function BoardFooter({
	view,
	setView,
}: {
	view: BoardViewMode;
	setView: (v: BoardViewMode) => void;
}) {
	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
			<div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#1d2125]/95 px-1.5 py-1.5 shadow-2xl backdrop-blur-md">
				<FooterButton
					icon={<Inbox className="h-4 w-4" />}
					label="Boîte de réception"
					onClick={() => {}}
				/>
				<div className="mx-1 h-5 w-px bg-white/15" />
				<FooterButton
					icon={<LayoutGrid className="h-4 w-4" />}
					label="Kanban"
					active={view === "kanban"}
					onClick={() => setView("kanban")}
				/>
				<FooterButton
					icon={<TableIcon className="h-4 w-4" />}
					label="Tableau"
					active={view === "table"}
					onClick={() => setView("table")}
				/>
				<FooterButton
					icon={<CalendarIcon className="h-4 w-4" />}
					label="Calendrier"
					active={view === "calendar"}
					onClick={() => setView("calendar")}
				/>
				<div className="mx-1 h-5 w-px bg-white/15" />
				<FooterButton
					icon={<Sparkles className="h-4 w-4" />}
					label="Changer de tableau"
					onClick={() => {}}
				/>
			</div>
		</div>
	);
}

function FooterButton({
	icon,
	label,
	active = false,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	active?: boolean;
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
				active
					? "bg-white text-[#172b4d]"
					: "text-white/80 hover:bg-white/10 hover:text-white"
			}`}
		>
			{icon}
			<span className="hidden sm:inline">{label}</span>
		</button>
	);
}
