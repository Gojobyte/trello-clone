// Primitives visuelles du design system gestion-pro :
// avatars, étiquettes, priorités, placeholders.
import type { CSSProperties } from "react";
import { LABELS, PEOPLE, PRIORITY, type Person } from "./demo-data";

export function Avatar({
  user,
  size,
  title,
}: {
  user: string | Person;
  size?: "sm" | "lg" | "xl";
  title?: string;
}) {
  const u = typeof user === "string" ? PEOPLE.find((p) => p.id === user) : user;
  if (!u) return null;
  const cls = `avatar${size ? ` avatar--${size}` : ""}`;
  return (
    <span className={cls} style={{ background: u.color }} title={title || u.name}>
      {u.initials}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size,
}: {
  users: string[];
  max?: number;
  size?: "sm" | "lg" | "xl";
}) {
  const list = users.slice(0, max);
  const extra = users.length - max;
  return (
    <span className="avatar-stack">
      {list.map((u) => (
        <Avatar key={u} user={u} size={size} />
      ))}
      {extra > 0 && (
        <span
          className={`avatar${size === "sm" ? " avatar--sm" : ""}`}
          style={{ background: "var(--bg-sunken)", color: "var(--text-muted)" }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

export function LabelChip({ id }: { id: string }) {
  const l = LABELS[id];
  if (!l) return null;
  return (
    <span className="label-chip" style={{ background: l.bg, color: l.fg }}>
      {l.name}
    </span>
  );
}

export function PriorityDot({
  id,
  withLabel,
}: {
  id: string;
  withLabel?: boolean;
}) {
  const p = PRIORITY[id];
  if (!p) return null;
  return (
    <span className="row" style={{ gap: 4, color: p.color, fontSize: 12 }}>
      <span style={{ fontSize: 12 }}>{p.icon}</span>
      {withLabel && <span style={{ color: "var(--text-muted)" }}>{p.name}</span>}
    </span>
  );
}

// Référence "aujourd'hui" alignée sur le jeu de données démo.
const DEMO_TODAY = new Date("2026-05-21");

export function fmtDue(iso: string | null): {
  label: string;
  tone: string;
  diff: number;
} | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - DEMO_TODAY.getTime()) / 86400000);
  const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  let tone = "var(--text-muted)";
  if (diff < 0) tone = "var(--red)";
  else if (diff <= 3) tone = "var(--amber)";
  return { label, tone, diff };
}

export function Placeholder({
  label,
  height = 160,
}: {
  label: string;
  height?: number;
}) {
  const style: CSSProperties = {
    height,
    borderRadius: "var(--r-md)",
    background:
      "repeating-linear-gradient(45deg, #F5F5F3, #F5F5F3 6px, #EEEEEC 6px, #EEEEEC 12px)",
    border: "1px solid var(--border-c)",
    display: "grid",
    placeItems: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-subtle)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
  return <div style={style}>{label}</div>;
}
