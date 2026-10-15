import { useState } from "react";
import { deepSleepDuration, remainingSleepSec } from "../game/core";
import { useGame } from "../game/store";
import { ProgressBar, formatDuration, formatNumber } from "./ui";

export function StatusPanel() {
  const game = useGame((state) => state.game);
  const drink = useGame((state) => state.drink);
  const eat = useGame((state) => state.eat);
  const startDeepSleep = useGame((state) => state.startDeepSleep);
  const startNap = useGame((state) => state.startNap);
  const openModal = useGame((state) => state.openModal);
  const now = useGame((state) => state.now);
  const [napMinutes, setNapMinutes] = useState(30);
  const sleeping = game.sleep.active;
  const sleepRemaining = remainingSleepSec(game, now);
  const sleepProgress = sleeping
    ? 1 - sleepRemaining / Math.max(1, (game.sleep.endsAt - game.sleep.startedAt) / 1000)
    : 0;

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
          icon="😴"
          label="疲惫"
          value={game.player.fatigue}
          max={100}
          tone={game.player.fatigue < 30 ? "red" : game.player.fatigue < 60 ? "orange" : "green"}
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

      <div className="sleep-panel">
        {sleeping ? (
          <div className="sleep-active">
            <strong>{game.sleep.type === "deep" ? "😴 沉睡中" : "🪑 小憩中"}</strong>
            <ProgressBar value={sleepProgress} tone="purple" />
            <span className="muted">剩余 {formatDuration(sleepRemaining)}</span>
          </div>
        ) : (
          <>
            <div className="sleep-actions">
              <button
                className="primary-button small"
                onClick={startDeepSleep}
                disabled={game.player.fatigue >= 100}
              >
                😴 沉睡
              </button>
              <span className="muted">
                预计 {formatDuration(deepSleepDuration(game.player.fatigue))}
              </span>
            </div>
            <div className="nap-control">
              <input
                type="number"
                min={5}
                max={180}
                value={napMinutes}
                onChange={(event) => setNapMinutes(Number(event.target.value))}
                aria-label="小憩分钟"
              />
              <button className="ghost-button small" onClick={() => startNap(napMinutes)}>
                🪑 小憩
              </button>
              <span className="muted">游戏分钟</span>
            </div>
          </>
        )}
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
