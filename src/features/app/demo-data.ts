// Données de démonstration pour les écrans de gestion de projet (design gestion-pro).
// Ces écrans sont des vues riches non encore branchées sur Convex — ils utilisent
// ce jeu de données réaliste partagé.

export type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
};

export const PEOPLE: Person[] = [
  { id: "u1", name: "Léa Marchand", initials: "LM", color: "#7C5CC4", role: "Head of Product" },
  { id: "u2", name: "Adrien Roux", initials: "AR", color: "#3E8E72", role: "Lead Engineer" },
  { id: "u3", name: "Claire Dubois", initials: "CD", color: "#C45C8E", role: "Designer" },
  { id: "u4", name: "Mehdi Saidi", initials: "MS", color: "#C4895C", role: "Backend Engineer" },
  { id: "u5", name: "Iris Tanaka", initials: "IT", color: "#5C8EC4", role: "UX Researcher" },
  { id: "u6", name: "Tom Allard", initials: "TA", color: "#A38B3F", role: "Growth" },
];

export type LabelDef = { name: string; bg: string; fg: string };

export const LABELS: Record<string, LabelDef> = {
  design: { name: "Design", bg: "oklch(0.93 0.06 280)", fg: "oklch(0.32 0.14 280)" },
  research: { name: "Research", bg: "oklch(0.93 0.05 160)", fg: "oklch(0.32 0.13 160)" },
  bug: { name: "Bug", bg: "oklch(0.93 0.05 25)", fg: "oklch(0.40 0.16 25)" },
  copy: { name: "Copy", bg: "oklch(0.93 0.05 75)", fg: "oklch(0.36 0.13 75)" },
  growth: { name: "Growth", bg: "oklch(0.93 0.05 220)", fg: "oklch(0.34 0.13 220)" },
  infra: { name: "Infra", bg: "oklch(0.93 0.02 270)", fg: "oklch(0.36 0.04 270)" },
};

export type PriorityDef = { name: string; icon: string; color: string };

export const PRIORITY: Record<string, PriorityDef> = {
  urgent: { name: "Urgent", icon: "●", color: "var(--red)" },
  high: { name: "High", icon: "●", color: "var(--amber)" },
  med: { name: "Medium", icon: "●", color: "var(--blue)" },
  low: { name: "Low", icon: "○", color: "var(--text-subtle)" },
};

export const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "À faire" },
  { id: "doing", title: "En cours" },
  { id: "review", title: "En revue" },
  { id: "done", title: "Terminé" },
];

export type DemoCard = {
  id: string;
  col: string;
  title: string;
  labels: string[];
  assignees: string[];
  priority: string;
  due: string | null;
  checklist: [number, number];
  comments: number;
  attachments: number;
};

export const CARDS: DemoCard[] = [
  { id: "c1", col: "backlog", title: "Audit UX des écrans onboarding mobile", labels: ["research"], assignees: ["u2", "u5"], priority: "med", due: "2026-06-12", checklist: [2, 5], comments: 3, attachments: 0 },
  { id: "c2", col: "backlog", title: "Préparer le RFC sur l’archive des workspaces", labels: ["infra"], assignees: ["u4"], priority: "low", due: null, checklist: [0, 4], comments: 1, attachments: 0 },
  { id: "c3", col: "backlog", title: "Story map du module Docs collaboratif", labels: ["design", "research"], assignees: ["u1", "u3"], priority: "med", due: "2026-06-20", checklist: [1, 8], comments: 6, attachments: 2 },
  { id: "c4", col: "todo", title: "Refonte du Command palette (⌘K)", labels: ["design"], assignees: ["u1"], priority: "high", due: "2026-05-30", checklist: [3, 7], comments: 4, attachments: 1 },
  { id: "c5", col: "todo", title: "Crash au drag-and-drop sur Safari 17", labels: ["bug"], assignees: ["u4", "u6"], priority: "urgent", due: "2026-05-25", checklist: [0, 3], comments: 8, attachments: 3 },
  { id: "c6", col: "todo", title: "Rédiger les guidelines de tone of voice", labels: ["copy"], assignees: ["u3"], priority: "med", due: "2026-06-05", checklist: [2, 4], comments: 2, attachments: 0 },
  { id: "c7", col: "todo", title: "Schéma des permissions sur les boards privés", labels: ["infra"], assignees: ["u4"], priority: "med", due: "2026-06-02", checklist: [1, 5], comments: 0, attachments: 1 },
  { id: "c8", col: "doing", title: "Animation des transitions entre vues", labels: ["design"], assignees: ["u1", "u5"], priority: "high", due: "2026-05-28", checklist: [4, 6], comments: 5, attachments: 2 },
  { id: "c9", col: "doing", title: "Page pricing — Free vs Premium", labels: ["copy", "design"], assignees: ["u3", "u1"], priority: "high", due: "2026-05-26", checklist: [5, 6], comments: 7, attachments: 1 },
  { id: "c10", col: "doing", title: "Synchronisation temps-réel des cartes", labels: ["infra"], assignees: ["u4", "u2"], priority: "urgent", due: "2026-05-24", checklist: [3, 8], comments: 11, attachments: 4 },
  { id: "c11", col: "review", title: "Webhooks Slack & Linear", labels: ["growth"], assignees: ["u6"], priority: "med", due: "2026-05-23", checklist: [6, 6], comments: 2, attachments: 0 },
  { id: "c12", col: "review", title: "Onboarding email sequence", labels: ["copy", "growth"], assignees: ["u3", "u6"], priority: "med", due: "2026-05-22", checklist: [4, 4], comments: 3, attachments: 0 },
  { id: "c13", col: "done", title: "Migration de la base PostgreSQL 16", labels: ["infra"], assignees: ["u4"], priority: "high", due: "2026-05-15", checklist: [5, 5], comments: 9, attachments: 2 },
  { id: "c14", col: "done", title: "Logo & wordmark v2", labels: ["design"], assignees: ["u1"], priority: "med", due: "2026-05-10", checklist: [3, 3], comments: 14, attachments: 6 },
  { id: "c15", col: "done", title: "Étude concurrentielle Q2", labels: ["research"], assignees: ["u5"], priority: "low", due: "2026-05-08", checklist: [6, 6], comments: 4, attachments: 3 },
];

export type DemoBoard = {
  id: string;
  name: string;
  emoji: string;
  members: number;
  cards: number;
  updated: string;
  accent: string;
  starred: boolean;
};

export const BOARDS: DemoBoard[] = [
  { id: "b1", name: "Produit · Roadmap 2026", emoji: "◆", members: 8, cards: 47, updated: "il y a 2h", accent: "#5B53C7", starred: true },
  { id: "b2", name: "Design System", emoji: "◇", members: 4, cards: 23, updated: "hier", accent: "#7C5CC4", starred: true },
  { id: "b3", name: "Marketing — lancement", emoji: "◈", members: 6, cards: 31, updated: "il y a 3j", accent: "#3E8E72", starred: false },
  { id: "b4", name: "Recherche utilisateurs", emoji: "◉", members: 3, cards: 18, updated: "la semaine dernière", accent: "#C45C8E", starred: false },
  { id: "b5", name: "Infrastructure", emoji: "◊", members: 5, cards: 29, updated: "hier", accent: "#5C8EC4", starred: false },
  { id: "b6", name: "Brouillon — V3", emoji: "◌", members: 2, cards: 7, updated: "il y a 10j", accent: "#A38B3F", starred: false },
];

export type Activity = {
  who: string;
  action: string;
  card: string;
  detail: string | null;
  when: string;
};

export const ACTIVITIES: Activity[] = [
  { who: "u1", action: "a déplacé", card: "Animation des transitions entre vues", detail: "À faire → En cours", when: "il y a 8 min" },
  { who: "u4", action: "a commenté", card: "Crash au drag-and-drop sur Safari 17", detail: "« reproduit aussi sur iPad Pro »", when: "il y a 22 min" },
  { who: "u3", action: "a terminé", card: "Logo & wordmark v2", detail: null, when: "il y a 2h" },
  { who: "u5", action: "a ajouté un fichier sur", card: "Étude concurrentielle Q2", detail: "benchmark.pdf", when: "il y a 3h" },
  { who: "u2", action: "a assigné", card: "Audit UX des écrans onboarding", detail: "à Iris Tanaka", when: "hier" },
  { who: "u6", action: "a créé", card: "Webhooks Slack & Linear", detail: null, when: "hier" },
];

export function personById(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}
