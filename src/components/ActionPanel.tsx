import {
  availableActionsForSkill,
  computeEfficiency,
  getAction,
  hasItems,
} from "../game/core";
import { SKILL_META, label } from "../game/staticData";
import { useGame } from "../game/store";
import type { ActionDefinition, SkillId } from "../game/types";
import { ProgressBar, cn, formatDuration, formatNumber } from "./ui";

function ActionRow({
  action,
  onStart,
}: {
  action: ActionDefinition;
  onStart: (id: string) => void;
}) {
  const game = useGame((state) => state.game);
  const level = game.skills[action.skill].level;
  const unlocked = level >= action.unlockLevel;
  const canRun = unlocked && (!action.consume || hasItems(game, action.consume));
  const isRunning = game.actionSlots.some(
    (slot) => slot.actionId === action.id && !slot.paused,
  );
  const outputs = Object.entries(action.output)
    .filter(([id]) => id !== "knowledge")
    .map(([id, amount]) => `${label(id)}×${amount}`)
    .join(" + ");
  const inputs = action.consume
    ? Object.entries(action.consume)
        .map(([id, amount]) => `${label(id)}×${amount}`)
        .join(" + ")
    : "无消耗";

  return (
    <div className={cn("action-row", !canRun && "locked")}>
      <div className="action-row-top">
        <div>
          <strong>{action.name}</strong>
          <span className="action-badge">{action.tier}</span>
          {action.generated && <span className="action-badge muted">训练</span>}
        </div>
        <div className="action-numbers">
          <span>
            {Math.round(action.durationSec)} 分钟 · {formatDuration(action.durationSec)}
          </span>
          <span>+{formatNumber(action.xp)} XP</span>
          {outputs && <span>{outputs}</span>}
        </div>
      </div>
      <div className="action-row-bottom">
        <span className="muted">消耗：{inputs}</span>
        <button
          className="primary-button small"
          disabled={!canRun || isRunning}
          onClick={() => onStart(action.id)}
        >
          {isRunning ? "运行中" : unlocked ? "开始" : `Lv${action.unlockLevel} 解锁`}
        </button>
      </div>
    </div>
  );
}

export function ActionPanel({ selectedSkill }: { selectedSkill: SkillId }) {
  const game = useGame((state) => state.game);
  const now = useGame((state) => state.now);
  const startAction = useGame((state) => state.startAction);
  const stopAction = useGame((state) => state.stopAction);

  const actions = availableActionsForSkill(game, selectedSkill);
  const meta = SKILL_META[selectedSkill];

  const handleStart = (actionId: string) => {
    const slots = game.actionSlots;
    const target =
      slots.find((slot) => !slot.actionId) ??
      slots.find((slot) => slot.actionId === actionId) ??
      slots[0];
    if (target) startAction(target.id, actionId);
  };

  return (
    <section className="action-panel panel">
      <header className="panel-header">
        <h2>
          <span className="panel-icon">{meta.icon}</span>
          {meta.name}
        </h2>
        <span className="muted">
          Lv{game.skills[selectedSkill].level} · {meta.category}
        </span>
      </header>

      <div className="active-slots">
        {game.actionSlots.slice(0, game.parallelSlots).map((slot) => {
          const action = getAction(slot.actionId);
          if (!action) {
            return (
              <div className="slot-card empty" key={slot.id}>
                <span>🕳️ 空槽位 {slot.id + 1}</span>
                <span className="muted">选择一个行动开始挂机</span>
              </div>
            );
          }
          const efficiency = computeEfficiency(game, action);
          const effectiveDuration = action.durationSec / Math.max(0.001, efficiency);
          const elapsed =
            (now - Math.max(slot.lastSettledAt, slot.startedAt)) / 1000;
          const progress = (elapsed % effectiveDuration) / effectiveDuration;
          const remaining = Math.max(0, effectiveDuration - (elapsed % effectiveDuration));
          return (
            <div className={cn("slot-card", slot.paused && "paused")} key={slot.id}>
              <div className="slot-card-top">
                <strong>{action.name}</strong>
                <span className="muted">
                  {slot.paused ? slot.pauseReason ?? "已暂停" : `${formatDuration(remaining)} 后完成`}
                </span>
                <button className="danger-button small" onClick={() => stopAction(slot.id)}>
                  停止
                </button>
              </div>
              <ProgressBar
                value={slot.paused ? 0 : progress}
                tone={slot.paused ? "orange" : "blue"}
              />
              <div className="slot-meta">
                <span>效率 ×{efficiency.toFixed(2)}</span>
                <span>完成 {formatNumber(slot.completed)} 次</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-list">
        {actions.length === 0 ? (
          <p className="empty-state">这个技能暂时没有可执行行动。</p>
        ) : (
          actions.map((action) => (
            <ActionRow key={action.id} action={action} onStart={handleStart} />
          ))
        )}
      </div>
    </section>
  );
}
