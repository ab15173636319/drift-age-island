import { SKILL_META } from "../game/staticData";
import { skillProgress, xpNeeded } from "../game/core";
import { useGame } from "../game/store";
import type { SkillId } from "../game/types";
import { SKILL_IDS } from "../game/types";
import { ProgressBar, cn, formatNumber } from "./ui";

export function SkillsPanel({
  selectedSkill,
  onSelect,
}: {
  selectedSkill: SkillId;
  onSelect: (skill: SkillId) => void;
}) {
  const game = useGame((state) => state.game);

  return (
    <aside className="skills-panel panel">
      <header className="panel-header">
        <h2>技能</h2>
        <span className="muted">{game.parallelSlots} 槽</span>
      </header>
      <div className="skills-list">
        {SKILL_IDS.map((skillId) => {
          const skill = game.skills[skillId];
          const meta = SKILL_META[skillId];
          const progress = skillProgress(skill.level, skill.xp);
          const selected = selectedSkill === skillId;
          return (
            <button
              key={skillId}
              className={cn("skill-row", selected && "selected")}
              onClick={() => onSelect(skillId)}
            >
              <span className="skill-icon">{meta.icon}</span>
              <span className="skill-main">
                <span className="skill-name">
                  {meta.name}
                  {skill.mastery && <em className="mastery-star">★</em>}
                </span>
                <ProgressBar value={progress} tone={skill.mastery ? "purple" : "green"} />
              </span>
              <span className="skill-level">Lv{skill.level}</span>
            </button>
          );
        })}
      </div>

      <div className="quick-nav">
        <button onClick={() => useGame.getState().openModal("building")}>🏗️ 建造</button>
        <button onClick={() => useGame.getState().openModal("crafting")}>🔨 制作</button>
        <button onClick={() => useGame.getState().openModal("tech")}>🧪 科技</button>
        <button onClick={() => useGame.getState().openModal("trash")}>🧴 垃圾</button>
        <button onClick={() => useGame.getState().openModal("inventory")}>🎒 背包</button>
      </div>
    </aside>
  );
}

export function SkillDetailStrip({ skillId }: { skillId: SkillId }) {
  const game = useGame((state) => state.game);
  const skill = game.skills[skillId];
  const meta = SKILL_META[skillId];
  return (
    <div className="skill-detail-strip">
      <span>{meta.icon}</span>
      <strong>{meta.name}</strong>
      <span className="muted">
        Lv {skill.level} · 下一级 {formatNumber(xpNeeded(skill.level))} XP
      </span>
    </div>
  );
}
