// Logo Flowboard — monogramme « F » dont les barres évoquent les cartes
// d'un tableau Kanban + un accent « carte qui flotte » (le flow).

import { cn } from "#/lib/utils.ts";

export function FlowboardLogoIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="32"
			height="32"
			viewBox="0 0 32 32"
			role="img"
			aria-label="Flowboard"
		>
			<title>Flowboard</title>
			<defs>
				<linearGradient id="flowboard-mark" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#4793ff" />
					<stop offset="1" stopColor="#0c5ce0" />
				</linearGradient>
			</defs>
			<rect width="32" height="32" rx="7.5" fill="url(#flowboard-mark)" />
			{/* barre verticale — la colonne */}
			<rect x="9.4" y="8" width="4.6" height="16" rx="2.3" fill="#fff" />
			{/* barre haute — carte longue */}
			<rect x="9.4" y="8" width="13.2" height="4.6" rx="2.3" fill="#fff" />
			{/* barre médiane — carte courte */}
			<rect x="9.4" y="14.6" width="8.4" height="4.6" rx="2.3" fill="#fff" />
			{/* accent — une carte détachée qui « flotte » */}
			<rect
				x="18.4"
				y="18.4"
				width="5.6"
				height="5.6"
				rx="1.8"
				fill="#fff"
				fillOpacity="0.55"
			/>
		</svg>
	);
}

export function FlowboardLogoFull({
	className,
	iconClassName,
	textClassName,
}: {
	className?: string;
	iconClassName?: string;
	textClassName?: string;
}) {
	return (
		<span className={cn("inline-flex items-center gap-2", className)}>
			<FlowboardLogoIcon className={cn("h-7 w-7", iconClassName)} />
			<span
				className={cn(
					"text-[18px] font-bold tracking-[-0.02em] text-current",
					textClassName,
				)}
			>
				Flowboard
			</span>
		</span>
	);
}
