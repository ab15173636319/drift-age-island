import { useGame } from "../game/store";
import { formatClock } from "./ui";

export function LogPanel() {
  const logs = useGame((state) => state.logs);

  return (
    <section className="log-panel panel">
      <header className="panel-header">
        <h2>日志</h2>
        <span className="muted">{logs.length}</span>
      </header>
      <div className="log-list">
        {logs.length === 0 ? (
          <p className="empty-state">海风很安静。</p>
        ) : (
          [...logs].reverse().map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.kind}`}>
              <span className="log-time">{formatClock(entry.at)}</span>
              <span>{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
