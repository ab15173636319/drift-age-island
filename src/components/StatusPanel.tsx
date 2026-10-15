import { useGame } from "../game/store";
import { ProgressBar, formatNumber } from "./ui";

export function StatusPanel() {
  const game = useGame((state) => state.game);
  const drink = useGame((state) => state.drink);
  const eat = useGame((state) => state.eat);
  const openModal = useGame((state) => state.openModal);

  return (
    <aside className="status-panel panel">
      <header className="panel-header">
        <h2>状态</h2>
        <span className="muted">第 {game.day} 天</span>
      </header>

      <div className="survival-grid">
        <StatusRow icon="🍖" label="饱食" value={game.player.hunger} max={100} tone="orange" />
        <StatusRow icon="💧" label="水分" value={game.player.thirst} max={100} tone="blue" />
        <StatusRow
          icon="⚡"
          label="体力"
          value={game.player.stamina}
          max={game.player.staminaMax}
          tone="green"
        />
        <StatusRow
          icon="😌"
          label="心态"
          value={game.player.mood}
          max={game.player.moodMax}
          tone="purple"
        />
        <StatusRow icon="❤️" label="生命" value={game.player.hp} max={game.player.hpMax} tone="red" />
      </div>

      <div className="survival-actions">
        <button className="primary-button small" onClick={drink}>
          💧 饮水
        </button>
        <button className="primary-button small" onClick={eat}>
          🍖 进食
        </button>
        <button className="ghost-button small" onClick={() => openModal("inventory")}>
          🎒 背包
        </button>
      </div>

      <div className="stat-mini">
        <span>淡水</span>
        <strong>{formatNumber(game.inventory.water ?? 0)}</strong>
        <span>知识点</span>
        <strong>{formatNumber(game.tech.knowledge)}</strong>
      </div>

      {game.player.ailments.length > 0 && (
        <div className="ailments">
          {game.player.ailments.map((ailment) => (
            <span key={ailment.id}>⚠️ {ailment.id}</span>
          ))}
        </div>
      )}
    </aside>
  );
}

function StatusRow({
  icon,
  label,
  value,
  max,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  max: number;
  tone: "green" | "blue" | "orange" | "red" | "purple";
}) {
  return (
    <div className="status-row">
      <div className="status-row-label">
        <span>{icon}</span>
        <span>{label}</span>
        <strong>
          {Math.round(value)}/{Math.round(max)}
        </strong>
      </div>
      <ProgressBar value={value} max={max} tone={tone} />
    </div>
  );
}
