import { useGame } from "../game/store";
import { baseLevel, offlineCapHours, weatherName } from "../game/core";
import { formatGameMinutes, getGameTimeOfDayInfo } from "../game/time";

export function TopBar() {
  const game = useGame((state) => state.game);
  const openModal = useGame((state) => state.openModal);
  const resetGame = useGame((state) => state.resetGame);
  const clockUnlocked = game.tech.unlockedNodes.includes("clock");
  const time = getGameTimeOfDayInfo(game.gameTimeMinutes);

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">🛶</span>
        <span>漂流纪元：孤岛</span>
      </div>

      <div className="topbar-stats">
        <span className="topbar-chip">第 {game.day} 天</span>
        <span className="topbar-chip">
          {clockUnlocked ? (
            <>
              🕐 {formatGameMinutes(game.gameTimeMinutes)} · {time.icon} {time.label}
            </>
          ) : (
            <>
              {time.icon} {time.label}
            </>
          )}
        </span>
        <span className="topbar-chip">☁️ {weatherName(game.weather.today)}</span>
        <span className="topbar-chip">📖 第 {game.chapter} 章</span>
        <span className="topbar-chip">😌 {Math.round(game.player.mood)}%</span>
        <span className="topbar-chip">🏕️ 营地 Lv{baseLevel(game)}</span>
        <span className="topbar-chip">💤 离线 {offlineCapHours(game)}h</span>
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" onClick={() => openModal("achievements")}>
          🏆
        </button>
        <button className="ghost-button" onClick={() => openModal("diary")}>
          📓
        </button>
        <button
          className="ghost-button"
          onClick={() => {
            if (window.confirm("确定要开始新的漂流吗？当前存档会被覆盖。")) resetGame();
          }}
        >
          ↺
        </button>
      </div>
    </header>
  );
}
