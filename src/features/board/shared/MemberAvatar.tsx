// Avatar circulaire avec initiales — couleur dérivée du nom (hash stable)
export function MemberAvatar({
	name,
	size = 32,
	ring = false,
	title,
}: {
	name: string;
	size?: number;
	ring?: boolean;
	title?: string;
}) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? "")
		.join("");
	const palette = [
		"#0c66e4",
		"#5e4db2",
		"#1f845a",
		"#ae2e24",
		"#b65c02",
		"#5e6c84",
	];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	}
	const color = palette[hash % palette.length];
	const fontSize = Math.max(10, Math.floor(size * 0.4));
	return (
		<div
			title={title ?? name}
			className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
				ring ? "ring-2 ring-white" : ""
			}`}
			style={{
				width: size,
				height: size,
				backgroundColor: color,
				fontSize,
				lineHeight: 1,
			}}
		>
			{initials || "?"}
		</div>
	);
}
