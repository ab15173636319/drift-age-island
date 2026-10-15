import {
  BUILDINGS,
  RECIPES,
  REGION_META,
  SKILL_META,
  TECH_LAYERS,
  label,
} from "../game/staticData";
import { baseLevel, getBuildingLevel, hasItems, achievementName } from "../game/core";
import { useGame } from "../game/store";
import type { GameState } from "../game/types";
import { ItemIcon, ModalShell, ProgressBar, cn, formatDuration, formatNumber } from "./ui";

export function InventoryModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const items = Object.entries(game.inventory)
    .filter(([, amount]) => amount > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const capacity = Object.entries(game.inventory).reduce((sum, [, amount]) => sum + amount, 0);
  const max = inventoryCapacityFromGame(game);

  return (
    <ModalShell title="背包与仓库" icon="🎒" onClose={onClose} wide>
      <div className="inventory-summary">
        <span>
          已用 {formatNumber(capacity)} / {formatNumber(max)}
        </span>
        <ProgressBar value={capacity} max={max} tone="blue" />
      </div>
      <div className="item-grid">
        {items.length === 0 ? (
          <p className="empty-state">背包还是空的。</p>
        ) : (
          items.map(([id, amount]) => (
            <div className="item-cell" key={id}>
              <ItemIcon id={id} />
              <span className="item-name">{label(id)}</span>
              <strong>{formatNumber(amount)}</strong>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}

function inventoryCapacityFromGame(game: GameState): number {
  let cap = 500;
  const storageLevel = getBuildingLevel(game, "storage");
  const effect = BUILDINGS.storage?.effects?.inventoryCapacity as number[] | undefined;
  if (effect && storageLevel > 0) cap += effect[Math.min(storageLevel, effect.length) - 1] ?? 0;
  if (getBuildingLevel(game, "workbench") > 0) cap += 5000;
  cap += Math.min(10, game.inventory.basket ?? 0) * 200;
  return cap;
}

export function CraftingModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const craft = useGame((state) => state.craft);
  const allRecipes = Object.values(RECIPES).sort(
    (a, b) => a.skill.localeCompare(b.skill) || a.unlockLevel - b.unlockLevel,
  );

  return (
    <ModalShell title="制作台" icon="🔨" onClose={onClose} wide>
      <div className="recipe-list">
        {allRecipes.length === 0 ? (
          <p className="empty-state">暂时没有可制作配方。</p>
        ) : (
          allRecipes.map((recipe) => {
            const unlocked =
              game.skills[recipe.skill as keyof GameState["skills"]].level >= recipe.unlockLevel;
            const missing = !unlocked;
            return (
              <div className={cn("recipe-row", missing && "locked")} key={recipe.id}>
                <div>
                  <strong>{recipe.name}</strong>
                  <span className="muted">
                    {SKILL_META[recipe.skill as keyof typeof SKILL_META].name} · Lv{recipe.unlockLevel}
                  </span>
                </div>
                <div className="recipe-io">
                  <span>{recipeInputText(recipe.id)}</span>
                  <span className="recipe-arrow">→</span>
                  <span>{recipeOutputText(recipe.id)}</span>
                </div>
                <button
                  className="primary-button small"
                  disabled={missing}
                  onClick={() => craft(recipe.id)}
                >
                  制作
                </button>
              </div>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}

function recipeInputText(recipeId: string): string {
  const recipe = RECIPES[recipeId];
  return recipe
    ? Object.entries(recipe.input)
        .map(([id, amount]) => `${label(id)}×${amount}`)
        .join(" + ")
    : "";
}

function recipeOutputText(recipeId: string): string {
  const recipe = RECIPES[recipeId];
  return recipe
    ? Object.entries(recipe.output)
        .map(([id, amount]) => `${label(id)}×${amount}`)
        .join(" + ")
    : "";
}

export function BuildingModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const build = useGame((state) => state.build);
  const buildings = Object.entries(BUILDINGS);

  return (
    <ModalShell title="建造营地" icon="🏗️" onClose={onClose} wide>
      <div className="modal-banner">
        营地等级 <strong>Lv{baseLevel(game)}</strong> · 已建成 {buildings.filter(([, b]) => getBuildingLevel(game, b.id) > 0).length}/
        {buildings.length}
      </div>
      <div className="building-grid">
        {buildings.map(([id, building]) => {
          const level = getBuildingLevel(game, id);
          const maxed = level >= building.maxLevel;
          const cost = maxed ? null : building.cost[level];
          const affordable = cost ? hasItems(game, cost.materials) : false;
          return (
            <div className="building-card" key={id}>
              <div className="building-card-head">
                <div>
                  <strong>{building.name}</strong>
                  <span className="muted">
                    Lv{level}/{building.maxLevel}
                  </span>
                </div>
                <ProgressBar
                  value={level}
                  max={building.maxLevel}
                  tone={level === building.maxLevel ? "purple" : "green"}
                />
              </div>
              <p>{building.description}</p>
              <div className="building-cost">
                {maxed ? (
                  <span className="muted">已满级</span>
                ) : (
                  Object.entries(cost?.materials ?? {}).map(([itemId, amount]) => (
                    <span
                      key={itemId}
                      className={cn(
                        "material-chip",
                        (game.inventory[itemId] ?? 0) < amount && "missing",
                      )}
                    >
                      {label(itemId)} {formatNumber(game.inventory[itemId] ?? 0)}/{formatNumber(amount)}
                    </span>
                  ))
                )}
              </div>
              <button
                className="primary-button small"
                disabled={maxed || !affordable}
                onClick={() => build(id)}
              >
                {maxed ? "已完成" : "建造/升级"}
              </button>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

export function TechModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const unlockTech = useGame((state) => state.unlockTech);

  return (
    <ModalShell title="垃圾科技树" icon="🧪" onClose={onClose} wide>
      <div className="modal-banner">
        知识点 <strong>{formatNumber(game.tech.knowledge)}</strong>
      </div>
      <div className="tech-layers">
        {TECH_LAYERS.map((layer, index) => {
          const previousUnlocked =
            index === 0 ||
            Object.keys(TECH_LAYERS[index - 1].nodes).every((id) =>
              game.tech.unlockedNodes.includes(id),
            );
          const layerUnlocked = previousUnlocked;
          return (
            <section className={cn("tech-layer", !layerUnlocked && "locked")} key={layer.layer}>
              <header>
                <strong>
                  第 {layer.layer} 层 · {layer.name}
                </strong>
                <span className="muted">{layer.cost} 知识点 / 层</span>
              </header>
              <div className="tech-nodes">
                {Object.entries(layer.nodes).map(([nodeId, node]) => {
                  const unlocked = game.tech.unlockedNodes.includes(nodeId);
                  const canUnlock =
                    !unlocked && layerUnlocked && game.tech.knowledge >= node.cost;
                  return (
                    <div className={cn("tech-node", unlocked && "unlocked")} key={nodeId}>
                      <strong>{node.name}</strong>
                      <span className="muted">
                        {node.cost} 知识点
                      </span>
                      <p>{node.effect}</p>
                      {node.ending && <span className="ending-tag">结局</span>}
                      <button
                        className="primary-button small"
                        disabled={!canUnlock}
                        onClick={() => unlockTech(nodeId)}
                      >
                        {unlocked ? "已解锁" : "研究"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </ModalShell>
  );
}

export function TrashModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const collectTrash = useGame((state) => state.collectTrash);
  const collectAllTrash = useGame((state) => state.collectAllTrash);

  return (
    <ModalShell title="海滩漂流物" icon="🧴" onClose={onClose} wide>
      <div className="modal-actions">
        <button className="primary-button small" onClick={collectAllTrash}>
          全部拾取
        </button>
        <span className="muted">未拾取的垃圾最多保留 3 天</span>
      </div>
      <div className="trash-grid">
        {game.trashOnGround.length === 0 ? (
          <p className="empty-state">今天还没有新的漂流物。</p>
        ) : (
          game.trashOnGround.map((trash) => (
            <div className={cn("trash-card", `grade-${trash.grade}`)} key={trash.uid}>
              <div className="trash-grade">{gradeName(trash.grade)}</div>
              <ItemIcon id={trash.id} />
              <strong>{label(trash.id)}</strong>
              <span className="muted">
                {REGION_META[trash.region]?.name ?? trash.region} · 第 {trash.spawnedDay} 天
              </span>
              <button className="primary-button small" onClick={() => collectTrash(trash.uid)}>
                拾取
              </button>
            </div>
          ))
        )}
      </div>
      <div className="key-items">
        <h3>关键件</h3>
        <div className="item-grid">
          {Object.entries(game.keyItems).map(([id, owned]) => (
            <div className={cn("item-cell", !owned && "locked")} key={id}>
              <ItemIcon id={id} />
              <span className="item-name">{label(id)}</span>
              <strong>{owned ? "✓" : "未发现"}</strong>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function gradeName(grade: string): string {
  return grade === "common" ? "普通" : grade === "rare" ? "稀有" : "关键";
}

export function DiaryModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const writeDiary = useGame((state) => state.writeDiary);

  return (
    <ModalShell title="日记本" icon="📓" onClose={onClose} wide>
      <div className="modal-actions">
        <button className="primary-button small" onClick={writeDiary}>
          写一篇日记
        </button>
        <span className="muted">每次撰写心态 +4，也会推进研究与叙事。</span>
      </div>
      <div className="diary-list">
        {game.narrative.diaryEntries.length === 0 ? (
          <p className="empty-state">笔记本第一页还空着。</p>
        ) : (
          [...game.narrative.diaryEntries].reverse().map((entry, index) => (
            <article className="diary-entry" key={`${entry.day}-${index}`}>
              <h3>{entry.title}</h3>
              <p>{entry.text}</p>
            </article>
          ))
        )}
      </div>
    </ModalShell>
  );
}

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const game = useGame((state) => state.game);
  const unlocked = Object.keys(game.achievements);

  return (
    <ModalShell title="成就" icon="🏆" onClose={onClose}>
      <div className="achievement-list">
        {unlocked.length === 0 ? (
          <p className="empty-state">还没有成就。去做点什么吧。</p>
        ) : (
          unlocked.map((id) => (
            <div className="achievement-row" key={id}>
              <span>🏆</span>
              <div>
                <strong>{achievementName(id)}</strong>
                <span className="muted">
                  {new Date(game.achievements[id].unlockedAt ?? Date.now()).toLocaleDateString("zh-CN")} 解锁
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}

export function OfflineModal({ onClose }: { onClose: () => void }) {
  const report = useGame((state) => state.offlineReport);
  if (!report) return null;
  return (
    <ModalShell title="你不在的时候" icon="🌙" onClose={onClose}>
      <div className="offline-report">
        <p>
          离线时长 {formatDuration(report.elapsedSec)}，营地上限 {report.capHours}h。
        </p>
        {report.haltedReason ? (
          <p className="warn-text">
            {report.haltedReason === "thirst" ? "淡水耗尽" : "食物耗尽"}，结算在第{" "}
            {Math.floor((report.haltedAtSec ?? 0) / 3600)} 小时中断。
          </p>
        ) : (
          <p className="success-text">完整结算，共 {formatDuration(report.effectiveSec)}。</p>
        )}
        <div className="offline-slot-list">
          {report.perSlot.map((slot, index) => (
            <div key={index}>
              <strong>{slot.actionName}</strong>
              <span>完成 {formatNumber(slot.completed)} 次</span>
              <span>+{formatNumber(slot.xp)} XP/次</span>
            </div>
          ))}
        </div>
        {report.dailyEvents.length > 0 && (
          <div className="offline-events">
            {report.dailyEvents.map((event) => (
              <p key={event}>{event}</p>
            ))}
          </div>
        )}
        <button className="primary-button" onClick={onClose}>
          收下并继续
        </button>
      </div>
    </ModalShell>
  );
}
