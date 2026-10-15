import { create } from "zustand";
import {
  advanceGameOnline,
  buildBuilding,
  cloneState,
  collectTrashItem,
  craftRecipe,
  createLog,
  drinkWater,
  eatBestFood,
  getAction,
  newGame,
  settleOffline,
  spawnDailyTrash,
  unlockTechNode,
  writeDiary,
} from "./core";
import type { GameState, LogEntry, OfflineReport } from "./types";

export type ModalId =
  | null
  | "offline"
  | "inventory"
  | "crafting"
  | "building"
  | "tech"
  | "trash"
  | "diary"
  | "achievements"
  | "prologue";

interface GameStore {
  game: GameState;
  logs: LogEntry[];
  now: number;
  modal: ModalId;
  offlineReport: OfflineReport | null;
  tick: () => void;
  openModal: (modal: ModalId) => void;
  closeModal: () => void;
  startAction: (slotId: number, actionId: string) => void;
  stopAction: (slotId: number) => void;
  collectTrash: (trashId: string) => void;
  collectAllTrash: () => void;
  drink: () => void;
  eat: () => void;
  craft: (recipeId: string) => void;
  build: (buildingId: string) => void;
  unlockTech: (nodeId: string) => void;
  writeDiary: () => void;
  collectOffline: () => void;
  resetGame: () => void;
}

const SAVE_KEY = "drift-age-island-save-v1";

function withLogs(current: LogEntry[], incoming: LogEntry[]): LogEntry[] {
  return [...current, ...incoming].slice(-120);
}

function loadInitial(): {
  game: GameState;
  logs: LogEntry[];
  offlineReport: OfflineReport | null;
} {
  const now = Date.now();
  let game = newGame();
  let isNewSave = true;
  let logs: LogEntry[] = [];
  let offlineReport: OfflineReport | null = null;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.schemaVersion === 1 && parsed.skills && parsed.actionSlots) {
        game = parsed;
        isNewSave = false;
      }
    }
  } catch {
    game = newGame();
  }

  if (isNewSave && (!game.trashOnGround || game.trashOnGround.length === 0)) {
    spawnDailyTrash(game, logs);
  }

  const settled = settleOffline(game, now);
  game = settled.state;
  logs = withLogs(logs, settled.logs);
  offlineReport = settled.report;

  if (logs.length === 0) {
    logs = [createLog("潮水退去。你醒在北沙滩上。", "story")];
  }

  return { game, logs, offlineReport };
}

const initial = loadInitial();

export const useGame = create<GameStore>((set, get) => ({
  game: initial.game,
  logs: initial.logs,
  now: Date.now(),
  modal: initial.offlineReport ? "offline" : null,
  offlineReport: initial.offlineReport,

  tick: () => {
    const now = Date.now();
    const result = advanceGameOnline(get().game, now);
    if (result.state === get().game && result.logs.length === 0) {
      set({ now });
      return;
    }
    set({
      game: result.state,
      now,
      logs: withLogs(get().logs, result.logs),
    });
  },

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  startAction: (slotId, actionId) => {
    const now = Date.now();
    const flushed = advanceGameOnline(get().game, now);
    const next = cloneState(flushed.state);
    const slot = next.actionSlots[slotId];
    if (!slot) return;
    const logs: LogEntry[] = [...flushed.logs];
    const action = getAction(actionId);
    if (!action) return;
    if (slot.actionId === actionId) {
      slot.paused = false;
      slot.pauseReason = null;
      logs.push(createLog(`恢复挂机：${action.name}`, "info"));
    } else {
      slot.actionId = actionId;
      slot.startedAt = now;
      slot.lastSettledAt = now;
      slot.completed = 0;
      slot.paused = false;
      slot.pauseReason = null;
      logs.push(createLog(`开始挂机：${action.name}`, "info"));
    }
    set({
      game: next,
      now,
      logs: withLogs(get().logs, logs),
    });
  },

  stopAction: (slotId) => {
    const now = Date.now();
    const flushed = advanceGameOnline(get().game, now);
    const next = cloneState(flushed.state);
    const slot = next.actionSlots[slotId];
    const logs: LogEntry[] = [...flushed.logs];
    if (slot) {
      const action = getAction(slot.actionId);
      if (action) logs.push(createLog(`停止挂机：${action.name}`, "info"));
      slot.actionId = null;
      slot.paused = false;
      slot.pauseReason = null;
    }
    set({
      game: next,
      now,
      logs: withLogs(get().logs, logs),
    });
  },

  collectTrash: (trashId) => {
    const next = cloneState(get().game);
    const trash = next.trashOnGround.find((item) => item.uid === trashId);
    if (!trash) return;
    const logs: LogEntry[] = [];
    if (collectTrashItem(next, trash, logs)) {
      next.trashOnGround = next.trashOnGround.filter((item) => item.uid !== trashId);
    }
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  collectAllTrash: () => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    const collectedIds: string[] = [];
    for (const trash of next.trashOnGround) {
      if (collectTrashItem(next, trash, logs)) collectedIds.push(trash.uid);
    }
    next.trashOnGround = next.trashOnGround.filter((item) => !collectedIds.includes(item.uid));
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  drink: () => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    drinkWater(next, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  eat: () => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    eatBestFood(next, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  craft: (recipeId) => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    craftRecipe(next, recipeId, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  build: (buildingId) => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    buildBuilding(next, buildingId, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  unlockTech: (nodeId) => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    unlockTechNode(next, nodeId, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  writeDiary: () => {
    const next = cloneState(get().game);
    const logs: LogEntry[] = [];
    writeDiary(next, logs);
    set({ game: next, logs: withLogs(get().logs, logs) });
  },

  collectOffline: () => set({ modal: null, offlineReport: null }),

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    const fresh = newGame();
    const logs = [createLog("潮水退去。你醒在北沙滩上。", "story")];
    spawnDailyTrash(fresh, logs);
    set({
      game: fresh,
      logs,
      modal: null,
      offlineReport: null,
      now: Date.now(),
    });
  },
}));

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable; the game continues in memory.
  }
}
