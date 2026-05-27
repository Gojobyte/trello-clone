import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

type CmdItem = {
  kind: "page" | "action";
  label: string;
  icon: string;
  hint?: string;
  pro?: boolean;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const all = useMemo<CmdItem[]>(() => {
    const nav = (to: string, search?: Record<string, string>) => () => {
      navigate({ to, search } as never);
      onClose();
    };
    return [
      { kind: "page", label: "Aller aux tableaux", icon: "folder", run: nav("/boards") },
      { kind: "page", label: "Aller à l'inbox", icon: "inbox", run: nav("/my-work", { tab: "inbox" }) },
      { kind: "page", label: "Mon jour", icon: "spark", run: nav("/my-work", { tab: "today" }) },
      { kind: "page", label: "Mes tâches", icon: "check", run: nav("/my-work", { tab: "tasks" }) },
      { kind: "page", label: "Objectifs (OKR)", icon: "pin", run: nav("/goals") },
      { kind: "page", label: "Docs", icon: "docs", run: nav("/docs") },
      { kind: "page", label: "Sprints", icon: "bolt", run: nav("/sprints") },
      { kind: "page", label: "Charge équipe", icon: "team", run: nav("/workload") },
      { kind: "page", label: "Templates", icon: "table", run: nav("/templates") },
      { kind: "page", label: "Automatisations", icon: "spark", pro: true, run: nav("/automations") },
      { kind: "page", label: "Réglages", icon: "settings", hint: "⌘,", run: nav("/settings") },
      { kind: "page", label: "Voir les tarifs", icon: "spark", run: nav("/pricing") },
      { kind: "action", label: "Créer un tableau", icon: "plus", hint: "C", run: nav("/boards") },
      { kind: "action", label: "Inviter un membre", icon: "user", run: nav("/settings") },
    ];
  }, [navigate, onClose]);

  const items = useMemo(() => {
    if (!q) return all;
    return all.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  }, [all, q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(items.length - 1, s + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        items[sel]?.run();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, items, sel, onClose]);

  if (!open) return null;

  const groups: Array<[string, CmdItem[]]> = [
    ["Navigation", items.filter((i) => i.kind === "page")],
    ["Actions", items.filter((i) => i.kind === "action")],
  ];
  let idx = -1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <Icon name="search" size={16} stroke={1.6} style={{ color: "var(--text-subtle)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Rechercher partout, ou taper une action…"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-body">
          {groups.map(([group, list]) =>
            list.length === 0 ? null : (
              <div key={group}>
                <div className="cmdk-group">{group}</div>
                {list.map((it) => {
                  idx++;
                  const myIdx = idx;
                  return (
                    <button
                      key={it.label}
                      type="button"
                      className={`cmdk-item ${myIdx === sel ? "selected" : ""}`}
                      onMouseEnter={() => setSel(myIdx)}
                      onClick={() => it.run()}
                    >
                      <Icon name={it.icon} size={14} className="cmdk-item-icon" />
                      <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
                      {it.pro && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--accent-soft)",
                            color: "var(--accent-text)",
                            borderColor: "transparent",
                            fontSize: 10,
                          }}
                        >
                          PRO
                        </span>
                      )}
                      {it.hint && <span className="kbd">{it.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ),
          )}
          {items.length === 0 && (
            <div className="text-subtle text-sm" style={{ padding: 24, textAlign: "center" }}>
              Aucun résultat pour «&nbsp;{q}&nbsp;»
            </div>
          )}
        </div>
        <div className="cmdk-footer">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> naviguer
          </span>
          <span>
            <span className="kbd">↵</span> ouvrir
          </span>
          <span>
            <span className="kbd">Esc</span> fermer
          </span>
        </div>
      </div>
    </div>
  );
}
