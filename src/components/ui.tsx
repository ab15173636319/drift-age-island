import type { ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}

export function ProgressBar({
  value,
  max = 1,
  tone = "green",
  height = 8,
}: {
  value: number;
  max?: number;
  tone?: "green" | "blue" | "orange" | "red" | "purple";
  height?: number;
}) {
  const percent = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-track" style={{ height }}>
      <div
        className={`progress-fill progress-${tone}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Card({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || action) && (
        <header className="panel-header">
          <h2>
            {icon && <span className="panel-icon">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function ModalShell({
  title,
  icon,
  onClose,
  children,
  wide,
}: {
  title: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={cn("modal", wide && "modal-wide")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>
            {icon && <span>{icon}</span>} {title}
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export function ItemIcon({ id }: { id: string }) {
  const icons: Record<string, string> = {
    water: "💧",
    berry: "🍓",
    cooked_food: "🍲",
    wood: "🪵",
    branch: "🌿",
    leaves: "🍃",
    stone: "🪨",
    vine: "🌱",
    knowledge: "📚",
    metal: "⚙️",
    metal_scrap: "🔩",
    glass: "🪟",
    clay: "🟤",
    plastic_bottle: "🧴",
    plastic_bag: "🛍️",
    manual_page: "📄",
    whole_book: "📕",
    paper_blueprint: "📐",
    radio_module: "📻",
    battery: "🔋",
    copper_coil: "🧲",
    solar_panel_shard: "☀️",
    compass: "🧭",
    first_aid_kit: "🩹",
    folding_knife: "🔪",
    paper_notebook: "📓",
  };
  return <span className="item-icon">{icons[id] ?? "📦"}</span>;
}
