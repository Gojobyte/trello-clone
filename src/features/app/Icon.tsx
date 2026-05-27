// Jeu d'icônes ligne minimal du design system gestion-pro.
import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
	board: "M3 4h18v4H3zM3 10h6v10H3zM11 10h4v10h-4zM17 10h4v6h-4z",
	calendar:
		"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 2v4M16 2v4",
	timeline: "M3 6h12M3 12h18M9 18h12M3 6h0M3 12h0M9 18h0",
	dashboard: "M3 12h6V3H3zM15 21h6V3h-6zM3 21h6v-6H3z",
	docs: "M5 3h10l4 4v14a0 0 0 0 1 0 0H5zM15 3v4h4M9 13h6M9 17h6M9 9h2",
	settings:
		"M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0a2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2a2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
	inbox:
		"M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
	plus: "M12 5v14M5 12h14",
	search: "M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16zM21 21l-4.35-4.35",
	filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
	chevron: "M9 18l6-6-6-6",
	chevdown: "M6 9l6 6 6-6",
	check: "M20 6L9 17l-5-5",
	x: "M18 6L6 18M6 6l18 18",
	dots: "M12 6h0M12 12h0M12 18h0",
	link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
	clock: "M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20zM12 6v6l4 2",
	flag: "M4 22V4M4 4h13l-2 4l2 4H4",
	paperclip:
		"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
	chat: "M21 11.5a8.38 8.38 0 0 1-.9 3.8a8.5 8.5 0 0 1-7.6 4.7a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8a8.5 8.5 0 0 1 4.7-7.6a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z",
	eye: "M1 12s4-8 11-8s11 8 11 8s-4 8-11 8s-11-8-11-8zM12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z",
	star: "M12 2l3.09 6.26l6.91 1l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1z",
	spark:
		"M9 2L11 8L17 10L11 12L9 18L7 12L1 10L7 8L9 2zM18 14L19 17L22 18L19 19L18 22L17 19L14 18L17 17z",
	bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0",
	arrow: "M5 12h14M12 5l7 7-7 7",
	arrowdown: "M12 5v14M19 12l-7 7-7-7",
	user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z",
	team: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
	lock: "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4",
	bolt: "M13 2L3 14h9l-1 8l10-12h-9z",
	folder:
		"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
	table: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
	pin: "M12 22s-8-7-8-13a8 8 0 1 1 16 0c0 6-8 13-8 13zM12 11a2 2 0 1 0 0-4a2 2 0 0 0 0 4z",
	home: "M3 12L12 3l9 9M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10",
	trash:
		"M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
	globe:
		"M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z",
	send: "M22 2L11 13M22 2l-7 20l-4-9l-9-4z",
	zap: "M13 2L3 14h9l-1 8l10-12h-9z",
};

export type IconName = keyof typeof PATHS;

export function Icon({
	name,
	size = 16,
	stroke = 1.5,
	className,
	style,
}: {
	name: string;
	size?: number;
	stroke?: number;
	className?: string;
	style?: CSSProperties;
}) {
	const d = PATHS[name];
	if (!d) return null;
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={stroke}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			style={style}
			aria-hidden
		>
			<path d={d} />
		</svg>
	);
}
