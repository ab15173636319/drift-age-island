import {
  ACTIONS,
  ACTIONS_BY_SKILL,
  BUILDINGS,
  ENEMIES,
  RECIPES,
  REGION_META,
  RESOURCE_LABELS,
  SKILL_META,
  TECH_LAYERS,
  label,
} from "./staticData";
import { getGameTimeOfDayInfo } from "./time";
import type {
  ActionDefinition,
  ActionSlot,
  GameState,
  LogEntry,
  OfflineReport,
  SkillId,
  TrashItem,
} from "./types";
import { SKILL_IDS } from "./types";

export const TIERS: Record<
  string,
  { unlockLevel: number; durationSec: number; xp: number; outputScale: number }
> = {
  T1: { unlockLevel: 1, durationSec: 3.5, xp: 10, outputScale: 1 },
  T2: { unlockLevel: 5, durationSec: 4.0, xp: 26, outputScale: 2 },
  T3: { unlockLevel: 12, durationSec: 4.5, xp: 62, outputScale: 3 },
  T4: { unlockLevel: 22, durationSec: 5.0, xp: 145, outputScale: 5 },
  T5: { unlockLevel: 35, durationSec: 5.5, xp: 320, outputScale: 8 },
  T6: { unlockLevel: 55, durationSec: 6.0, xp: 700, outputScale: 12 },
  T7: { unlockLevel: 75, durationSec: 6.5, xp: 1500, outputScale: 18 },
};

const COMMON_TRASH = [
  "plastic_bottle",
  "plastic_bag",
  "can",
  "rope_fragment",
  "wood_plank",
  "cable",
  "glass_fragment",
  "manual_page",
  "instruction_label",
];

const RARE_TRASH = [
  "glass_bottle",
  "metal_scrap",
  "lighter_fragment",
  "waterproof_cloth",
  "fishing_line",
  "medicine_packaging",
  "whole_book",
  "paper_blueprint",
];

const KEY_TRASH = [
  "solar_panel_shard",
  "radio_module",
  "paper_notebook",
  "first_aid_kit",
  "compass",
  "folding_knife",
  "battery",
  "copper_coil",
];

const WEATHER_POOL = [
  { id: "sunny", weight: 40, name: "晴" },
  { id: "cloudy", weight: 25, name: "多云" },
  { id: "rain", weight: 20, name: "雨" },
  { id: "storm", weight: 10, name: "雷暴" },
  { id: "monsoon", weight: 5, name: "季风" },
];

const FOOD_PRIORITY = [
  "cooked_food",
  "feast",
  "smoked_meat",
  "dried_meat",
  "berry",
  "nut",
  "root",
  "fish",
  "crab_meat",
  "raw_meat",
  "poultry",
  "snake_meat",
  "shark_meat",
  "insect_protein",
];

const FOOD_VALUES: Record<string, number> = {
  cooked_food: 14,
  feast: 40,
  smoked_meat: 22,
  dried_meat: 18,
  berry: 8,
  nut: 8,
  root: 9,
  fish: 10,
  crab_meat: 8,
  raw_meat: 12,
  poultry: 10,
  snake_meat: 10,
  shark_meat: 15,
  insect_protein: 5,
};

let logId = 1;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createLog(text: string, kind: LogEntry["kind"] = "info"): LogEntry {
  return { id: logId++, at: Date.now(), text, kind };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function xpNeeded(level: number): number {
  if (level >= 99) return 0;
  return Math.round(40 * Math.pow(level, 1.8));
}

export function skillProgress(level: number, xp: number): number {
  const needed = xpNeeded(level);
  return needed <= 0 ? 1 : Math.min(1, xp / needed);
}

export function tierForLevel(level: number): keyof typeof TIERS {
  if (level >= 75) return "T7";
  if (level >= 55) return "T6";
  if (level >= 35) return "T5";
  if (level >= 22) return "T4";
  if (level >= 12) return "T3";
  if (level >= 5) return "T2";
  return "T1";
}

export function getAction(actionId: string | null): ActionDefinition | null {
  if (!actionId) return null;
  const real = ACTIONS[actionId];
  if (real) return real;
  if (actionId.startsWith("train_")) {
    const skill = actionId.slice("train_".length) as SkillId;
    return makeTrainingAction(skill);
  }
  return null;
}

export function makeTrainingAction(skill: SkillId): ActionDefinition {
  const tier = tierForLevel(1);
  const base = TIERS[tier];
  return {
    id: `train_${skill}`,
    name: `${SKILL_META[skill].name}基础训练`,
    skill,
    tier,
    unlockLevel: 1,
    unlockRequires: [],
    durationSec: 30,
    xp: base.xp,
    output: {},
    staminaCost: 0,
    region: "north_beach",
    riskEvents: [],
    generated: true,
  };
}

export function getAllActions(skill: SkillId): ActionDefinition[] {
  const real = [...(ACTIONS_BY_SKILL[skill] ?? [])];
  const training = makeTrainingAction(skill);
  return [training, ...real];
}

export function allActions(): ActionDefinition[] {
  return SKILL_IDS.flatMap((skill) => getAllActions(skill));
}

export function getBuildingLevel(state: GameState, id: string): number {
  return state.buildings[id] ?? 0;
}

export function baseLevel(state: GameState): number {
  return Object.values(state.buildings).reduce((sum, level) => sum + level, 0);
}

export function survivalReduction(state: GameState): number {
  return Math.min(baseLevel(state) * 0.02, 0.4);
}

export function offlineCapHours(state: GameState): number {
  return Math.max(8, Math.min(24, baseLevel(state) + 1));
}

export const GAME_MINUTES_PER_DAY = 24 * 60;

export function applySurvivalForGameMinutes(
  state: GameState,
  gameMinutes: number,
  logs: LogEntry[],
): void {
  if (gameMinutes <= 0) return;
  const hours = gameMinutes / 60;
  const reduction = survivalReduction(state);
  const waterLoss = 4 * (1 - reduction) * hours;
  const foodLoss = 3 * (1 - reduction) * hours;
  state.player.thirst = clamp(state.player.thirst - waterLoss, 0, 100);
  state.player.hunger = clamp(state.player.hunger - foodLoss, 0, 100);
  void logs;
}

export function startNewGameDay(state: GameState, logs: LogEntry[]): void {
  state.weather.today = rollWeather();
  state.weather.forecast = rollNextForecast();
  state.weather.stormCountdown = Math.max(0, state.weather.stormCountdown - 1);
  state.weather.stormWarning = state.weather.stormCountdown <= 1;
  cleanOldTrash(state);
  applyDailyAutomaticProduction(state, logs);
  if (state.day % 4 === 0) {
    spawnDailyTrash(state, logs);
  }
  unlockRegions(state);
  logs.push(createLog(`—— 第 ${state.day} 天 · ${weatherName(state.weather.today)} ——`, "system"));
}

export function advanceGameTime(
  state: GameState,
  gameMinutes: number,
  logs: LogEntry[],
): void {
  if (!Number.isFinite(gameMinutes) || gameMinutes <= 0) return;
  const beforeDay = Math.floor(state.gameTimeMinutes / GAME_MINUTES_PER_DAY) + 1;
  state.gameTimeMinutes += gameMinutes;
  const afterDay = Math.floor(state.gameTimeMinutes / GAME_MINUTES_PER_DAY) + 1;
  applySurvivalForGameMinutes(state, gameMinutes, logs);
  for (let day = beforeDay + 1; day <= afterDay; day += 1) {
    state.day = day;
    startNewGameDay(state, logs);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function deepSleepDuration(fatigue: number): number {
  void fatigue;
  return 8 * 60;
}

export function fatigueRecoveryPerSec(type: "deep" | "nap"): number {
  return type === "deep" ? 0.2 : 0.15;
}

export function startSleep(
  state: GameState,
  type: "deep" | "nap",
  durationSec: number,
  now: number,
  logs: LogEntry[],
): void {
  if (durationSec <= 0) return;
  state.sleep = {
    active: true,
    type,
    startedAt: now,
    endsAt: now + durationSec * 1000,
    lastProcessedAt: now,
    gameMinutes: durationSec,
  };
  const reason = type === "deep" ? "沉睡中" : "小憩中";
  for (const slot of state.actionSlots) {
    if (slot.actionId && !slot.paused) {
      slot.paused = true;
      slot.pauseReason = reason;
    }
  }
  logs.push(createLog(type === "deep" ? "你陷入沉睡。" : "你坐下小憩。", "info"));
}

export function wakeFromSleep(state: GameState, wakeAt: number, logs: LogEntry[]): void {
  const type = state.sleep.type;
  const gameMinutes = state.sleep.gameMinutes ?? 0;
  state.sleep = {
    active: false,
    type: null,
    startedAt: wakeAt,
    endsAt: wakeAt,
    lastProcessedAt: wakeAt,
    gameMinutes: 0,
  };
  advanceGameTime(state, gameMinutes, logs);
  for (const slot of state.actionSlots) {
    if (slot.pauseReason === "沉睡中" || slot.pauseReason === "小憩中") {
      slot.paused = true;
      slot.pauseReason = "睡眠结束，点击恢复";
      slot.lastSettledAt = wakeAt;
    }
  }
  logs.push(createLog(type === "deep" ? "你从沉睡中醒来。" : "小憩结束，精神恢复了一些。", "info"));
  if (type === "deep") {
    state.player.fatigue = 100;
    state.player.stamina = state.player.staminaMax;
  }
}

export function processSleep(
  state: GameState,
  from: number,
  to: number,
  logs: LogEntry[],
): void {
  const sleep = state.sleep;
  if (!sleep.active) return;
  const end = Math.min(to, sleep.endsAt);
  const elapsed = Math.max(0, (end - sleep.lastProcessedAt) / 1000);
  if (elapsed > 0 && sleep.type) {
    const recovery = fatigueRecoveryPerSec(sleep.type);
    state.player.fatigue = clamp(
      state.player.fatigue + elapsed * recovery,
      0,
      100,
    );
    state.player.stamina = clamp(
      state.player.stamina + elapsed * 0.15,
      0,
      state.player.staminaMax,
    );
    sleep.lastProcessedAt = end;
  }
  if (to >= sleep.endsAt) {
    wakeFromSleep(state, sleep.endsAt, logs);
  }
}

export function remainingSleepSec(state: GameState, now: number): number {
  if (!state.sleep.active) return 0;
  return Math.max(0, (state.sleep.endsAt - now) / 1000);
}

export function reduceFatigueForAction(state: GameState, action: ActionDefinition): void {
  const fatiguePerSec = 0.015 + action.staminaCost * 0.004;
  state.player.fatigue = clamp(
    state.player.fatigue - action.durationSec * fatiguePerSec,
    0,
    100,
  );
}

export function maybeFaintFromFatigue(state: GameState, logs: LogEntry[]): boolean {
  if (state.player.fatigue >= 30 || state.sleep.active) return false;
  const chance = ((30 - state.player.fatigue) / 30) * 0.04;
  if (Math.random() >= chance) return false;
  const durationSec = deepSleepDuration(state.player.fatigue);
  startSleep(state, "deep", durationSec, Date.now(), logs);
  logs.push(createLog("过度疲惫让你失去意识，你陷入了沉睡。", "warn"));
  return true;
}

export function inventoryCapacity(state: GameState): number {
  let cap = 500;
  const storageLevel = getBuildingLevel(state, "storage");
  const storageEffect = BUILDINGS.storage?.effects?.inventoryCapacity as number[] | undefined;
  if (storageEffect && storageLevel > 0) {
    cap += storageEffect[Math.min(storageLevel, storageEffect.length) - 1] ?? 0;
  }
  if (getBuildingLevel(state, "workbench") > 0) cap += 5000;
  cap += Math.min(10, state.inventory.basket ?? 0) * 200;
  return cap;
}

export function totalItems(state: GameState): number {
  return Object.values(state.inventory).reduce((sum, value) => sum + Math.max(0, value), 0);
}

export function canAdd(state: GameState, amounts: Record<string, number>): boolean {
  const current = totalItems(state);
  const incoming = Object.values(amounts).reduce((sum, value) => sum + Math.max(0, value), 0);
  return current + incoming <= inventoryCapacity(state);
}

export function addItems(
  state: GameState,
  amounts: Record<string, number>,
): Record<string, number> {
  const added: Record<string, number> = {};
  const capacity = inventoryCapacity(state);
  for (const [id, amount] of Object.entries(amounts)) {
    if (!Number.isFinite(amount) || amount <= 0) continue;
    let remaining = Math.floor(amount);
    while (remaining > 0 && totalItems(state) < capacity) {
      const canFit = capacity - totalItems(state);
      const put = Math.min(remaining, canFit);
      state.inventory[id] = (state.inventory[id] ?? 0) + put;
      remaining -= put;
    }
    const actual = Math.floor(amount) - remaining;
    if (actual > 0) added[id] = (added[id] ?? 0) + actual;
  }
  return added;
}

export function hasItems(state: GameState, required: Record<string, number>): boolean {
  return Object.entries(required).every(([id, amount]) => (state.inventory[id] ?? 0) >= amount);
}

export function removeItems(state: GameState, required: Record<string, number>): boolean {
  if (!hasItems(state, required)) return false;
  for (const [id, amount] of Object.entries(required)) {
    state.inventory[id] = (state.inventory[id] ?? 0) - amount;
    if (state.inventory[id] <= 0) delete state.inventory[id];
  }
  return true;
}

export function isRegionUnlocked(state: GameState, region: string): boolean {
  if (region === "north_beach") return true;
  const stateRegion = state.regions[region];
  if (stateRegion?.unlocked) return true;
  switch (region) {
    case "east_reef":
      return state.skills.athletics.level >= 5;
    case "thorn_belt":
      return state.skills.toolcraft.level >= 5;
    case "outer_forest":
      return state.skills.toolcraft.level >= 5 && (state.regions.thorn_belt?.exploration ?? 0) >= 20;
    case "deep_forest":
      return state.skills.athletics.level >= 15 && state.skills.toolcraft.level >= 15;
    case "shipwreck":
      return state.chapter >= 4 && state.skills.athletics.level >= 10;
    case "cave":
      return state.skills.athletics.level >= 15 && (state.regions.deep_forest?.exploration ?? 0) >= 60;
    case "highland":
      return getBuildingLevel(state, "watchtower") > 0;
    default:
      return false;
  }
}

export function unlockRegions(state: GameState): void {
  for (const regionId of Object.keys(REGION_META)) {
    if (isRegionUnlocked(state, regionId)) {
      state.regions[regionId] = {
        ...(state.regions[regionId] ?? { unlocked: false, exploration: 0, logs: 0 }),
        unlocked: true,
      };
    }
  }
}

export function actionRequirementsMet(state: GameState, action: ActionDefinition): boolean {
  if (state.skills[action.skill].level < action.unlockLevel) return false;
  if (!isRegionUnlocked(state, action.region)) return false;
  for (const req of action.unlockRequires) {
    const [kind, ...rest] = req.split(":");
    const value = rest.join(":");
    if (kind === "item") {
      if ((state.inventory[value] ?? 0) <= 0 && state.player.equipment.weapon !== value && state.player.equipment.armor !== value) {
        return false;
      }
    } else if (kind === "building") {
      if (getBuildingLevel(state, value) <= 0) return false;
    } else if (kind === "region") {
      if (!isRegionUnlocked(state, value)) return false;
    } else if (kind === "exploration") {
      const [region, threshold] = value.split(":");
      if ((state.regions[region]?.exploration ?? 0) < Number(threshold)) return false;
    }
  }
  return true;
}

export function availableActionsForSkill(state: GameState, skill: SkillId): ActionDefinition[] {
  return getAllActions(skill)
    .filter((action) => actionRequirementsMet(state, action))
    .sort((a, b) => a.unlockLevel - b.unlockLevel || a.xp - b.xp);
}

export function computeEfficiency(state: GameState, action: ActionDefinition): number {
  let efficiency = 1;
  const time = getGameTimeOfDayInfo(state.gameTimeMinutes);
  const isNight = time.period === "night";
  const isNoon = time.period === "noon";

  if (isNight && (action.skill === "woodcutting" || action.skill === "mining")) efficiency *= 0.6;
  if (isNight && action.skill === "hunting") efficiency *= 1.2;
  if (isNoon && action.skill === "gathering") efficiency *= 0.85;
  if (state.weather.today === "rain" && ["gathering", "woodcutting"].includes(action.skill)) {
    efficiency *= 0.8;
  }
  if (state.weather.today === "rain" && action.skill === "cooking") efficiency *= 0.5;
  if (state.player.mood > 80) efficiency *= 1.1;
  if (state.player.hunger <= 0) efficiency *= 0.5;
  if (state.skills[action.skill].mastery) efficiency *= 1.25;
  if (action.skill === "cooking" && getBuildingLevel(state, "firepit") > 0) efficiency *= 1.2;
  return efficiency;
}

export function addXp(state: GameState, skill: SkillId, amount: number, logs: LogEntry[]): void {
  const current = state.skills[skill];
  if (!current || current.level >= 99) return;
  current.xp += amount;
  let leveled = 0;
  while (current.level < 99 && current.xp >= xpNeeded(current.level)) {
    current.xp -= xpNeeded(current.level);
    current.level += 1;
    leveled += 1;
  }
  if (current.level >= 99) {
    current.xp = 0;
    current.mastery = true;
    logs.push(createLog(`${SKILL_META[skill].name}达到 99 级，解锁精通`, "gain"));
  } else if (leveled > 0) {
    logs.push(createLog(`${SKILL_META[skill].name}提升到 ${current.level} 级`, "gain"));
  }
}

export function collectTrashItem(state: GameState, trash: TrashItem, logs: LogEntry[]): boolean {
  const keyItem = trash.grade === "key";
  const knowledgeCarriers: Record<string, number> = {
    manual_page: 8,
    instruction_label: 12,
    whole_book: 30,
    paper_blueprint: 50,
    paper_notebook: 80,
  };
  if (keyItem) {
    state.keyItems[trash.id] = true;
    state.keyItemPity = 0;
  } else {
    const added = addItems(state, { [trash.id]: 1 });
    if ((added[trash.id] ?? 0) <= 0) {
      logs.push(createLog("背包已满，无法拾取漂流物", "warn"));
      return false;
    }
  }

  if (knowledgeCarriers[trash.id]) {
    const knowledge = knowledgeCarriers[trash.id] * researchMultiplier(state);
    state.tech.knowledge += knowledge;
    logs.push(createLog(`从${label(trash.id)}获得 ${Math.round(knowledge)} 知识点`, "gain"));
  } else if (!keyItem) {
    logs.push(createLog(`拾取 ${label(trash.id)}`, "gain"));
  } else {
    logs.push(createLog(`发现关键件：${label(trash.id)}`, "story"));
  }

  if (trash.grade === "rare") {
    state.rarePityNewbie = 0;
    state.stats.rareCollected += 1;
  }
  state.stats.trashCollected += 1;
  return true;
}

export function researchMultiplier(state: GameState): number {
  const level = state.skills.research.level;
  return (1 + level * 0.015) * (state.skills.research.mastery ? 2 : 1);
}

export function rollWeather(): string {
  const total = WEATHER_POOL.reduce((sum, weather) => sum + weather.weight, 0);
  let roll = Math.random() * total;
  for (const weather of WEATHER_POOL) {
    roll -= weather.weight;
    if (roll <= 0) return weather.id;
  }
  return "sunny";
}

export function weatherName(id: string): string {
  return WEATHER_POOL.find((weather) => weather.id === id)?.name ?? id;
}

export function rollTrashGrade(): "common" | "rare" | "key" {
  const roll = Math.random();
  if (roll < 0.8) return "common";
  if (roll < 0.97) return "rare";
  return "key";
}

export function pickTrashId(grade: "common" | "rare" | "key"): string {
  const pool = grade === "common" ? COMMON_TRASH : grade === "rare" ? RARE_TRASH : KEY_TRASH;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function trashSpawnMultiplier(state: GameState): number {
  let multiplier = 1;
  if (getBuildingLevel(state, "watchtower") > 0) multiplier *= 1.2;
  const explored = Object.values(state.regions).filter((region) => region.exploration >= 100).length;
  multiplier *= 1 + explored * 0.15;
  if (state.weather.today === "monsoon") multiplier *= 2;
  return multiplier;
}

export function spawnDailyTrash(state: GameState, logs: LogEntry[]): void {
  const baseCount = 1 + Math.floor(Math.random() * 2);
  const count = Math.max(1, Math.round(baseCount * trashSpawnMultiplier(state)));
  const regions = Object.entries(state.regions)
    .filter(([, region]) => region.unlocked)
    .map(([id]) => id);
  const spawnRegion = () => regions[Math.floor(Math.random() * regions.length)] ?? "north_beach";

  let spawnedRare = false;
  for (let i = 0; i < count; i += 1) {
    let grade = rollTrashGrade();
    if (state.day <= 3 && !spawnedRare && state.rarePityNewbie >= 0) {
      grade = "rare";
    }
    if (state.keyItemPity >= 7) {
      grade = "key";
    }
    if (grade === "key") {
      const unowned = KEY_TRASH.filter((id) => !state.keyItems[id]);
      if (unowned.length === 0) grade = "rare";
    }

    let itemId = pickTrashId(grade);
    if (grade === "key") {
      const unowned = KEY_TRASH.filter((id) => !state.keyItems[id]);
      if (unowned.length > 0) {
        itemId = unowned[Math.floor(Math.random() * unowned.length)];
      }
    }
    state.trashOnGround.push({
      uid: uid(),
      id: itemId,
      grade,
      spawnedDay: state.day,
      region: spawnRegion(),
    });
    if (grade === "rare") spawnedRare = true;
  }

  if (state.keyItemPity >= 7) state.keyItemPity = 0;
  else state.keyItemPity += 1;
  state.rarePityNewbie += 1;
  logs.push(createLog(`今天的漂流物出现了，共 ${count} 件`, "system"));
}

export function cleanOldTrash(state: GameState): void {
  state.trashOnGround = state.trashOnGround.filter((item) => state.day - item.spawnedDay < 3);
}

export function applyDailyAutomaticProduction(state: GameState, logs: LogEntry[]): void {
  const rainwater = getBuildingLevel(state, "rainwater_shelter");
  const rainwaterEffect = BUILDINGS.rainwater_shelter?.effects?.waterPerDay as number[] | undefined;
  if (rainwater > 0 && rainwaterEffect) {
    const water = rainwaterEffect[Math.min(rainwater, rainwaterEffect.length) - 1] ?? 0;
    state.inventory.water = (state.inventory.water ?? 0) + water;
    logs.push(createLog(`雨水收集棚补充 ${water} 淡水`, "gain"));
  }

  const herbGarden = getBuildingLevel(state, "herb_garden");
  const herbEffect = BUILDINGS.herb_garden?.effects?.herbPerDay as number[] | undefined;
  if (herbGarden > 0 && herbEffect) {
    const herbs = herbEffect[Math.min(herbGarden, herbEffect.length) - 1] ?? 0;
    addItems(state, { herb: herbs });
    logs.push(createLog(`药圃产出 ${herbs} 草药`, "gain"));
  }

  if (getBuildingLevel(state, "firepit") > 0) {
    state.player.mood = Math.min(state.player.moodMax, state.player.mood + 2);
  }
}

export function rollNextForecast(): string[] {
  return [rollWeather(), rollWeather(), rollWeather()];
}

export function settleActionSlot(
  state: GameState,
  slot: ActionSlot,
  durationSec: number,
  actionFactor: number,
  logs: LogEntry[],
  allowFaint = true,
): void {
  if (!slot.actionId || slot.paused) return;
  const action = getAction(slot.actionId);
  if (!action) return;
  const efficiency = computeEfficiency(state, action);
  if (efficiency <= 0) return;
  const effectiveActionDuration = action.durationSec / efficiency;
  const billableSec = Math.max(0, durationSec) * actionFactor;
  const possible = Math.floor(billableSec / effectiveActionDuration);
  let completed = 0;
  const aggregatedOutput: Record<string, number> = {};
  let knowledgeGain = 0;

  for (let i = 0; i < possible; i += 1) {
    if (action.consume && !hasItems(state, action.consume)) {
      slot.paused = true;
      slot.pauseReason = "缺少材料";
      logs.push(createLog(`${action.name}缺少材料，已暂停`, "warn"));
      break;
    }
    if (Object.keys(action.output).length > 0 && !canAdd(state, action.output)) {
      slot.paused = true;
      slot.pauseReason = "背包已满";
      logs.push(createLog("背包已满，行动自动暂停", "warn"));
      break;
    }
    if (action.consume) removeItems(state, action.consume);
    if (action.skill === "research" && action.output.knowledge) {
      const gained = (action.output.knowledge ?? 0) * researchMultiplier(state);
      state.tech.knowledge += gained;
      knowledgeGain += gained;
    } else if (Object.keys(action.output).length > 0) {
      const added = addItems(state, action.output);
      for (const [id, amount] of Object.entries(added)) {
        aggregatedOutput[id] = (aggregatedOutput[id] ?? 0) + amount;
      }
    }
    addXp(state, action.skill, action.xp, logs);
    advanceGameTime(state, action.durationSec, logs);
    reduceFatigueForAction(state, action);
    if (state.player.thirst <= 0) {
      slot.paused = true;
      slot.pauseReason = "缺水";
      completed += 1;
      break;
    }
    if (state.player.hunger <= 0) {
      slot.paused = true;
      slot.pauseReason = "饥饿";
      completed += 1;
      break;
    }
    if (allowFaint && maybeFaintFromFatigue(state, logs)) {
      slot.paused = true;
      slot.pauseReason = "沉睡中";
      completed += 1;
      break;
    }
    completed += 1;
  }

  if (completed > 0) {
    slot.completed += completed;
    slot.lastSettledAt += completed * effectiveActionDuration * 1000;
    const resultParts = Object.entries(aggregatedOutput).map(
      ([id, amount]) => `${label(id)}×${Math.floor(amount)}`,
    );
    if (knowledgeGain > 0) {
      resultParts.push(`知识点×${Math.round(knowledgeGain)}`);
    }
    const parts = resultParts.join("，");
    const xpGain = completed * action.xp;
    const text = parts
      ? `${action.name} ×${completed}：${parts}，+${Math.round(xpGain)} XP`
      : `${action.name}：完成 ${completed} 次，+${Math.round(xpGain)} XP`;
    logs.push(createLog(text, "gain"));
  }
}

export function settleSlotsOnline(state: GameState, now: number, logs: LogEntry[]): void {
  for (const slot of state.actionSlots) {
    if (!slot.actionId || slot.paused) continue;
    const elapsed = Math.max(0, (now - Math.max(slot.lastSettledAt, slot.startedAt)) / 1000);
    settleActionSlot(state, slot, elapsed, 1, logs);
  }
}

export function settleSlotsForDuration(
  state: GameState,
  durationSec: number,
  factor: number,
  logs: LogEntry[],
  allowFaint = false,
): void {
  for (const slot of state.actionSlots) {
    if (!slot.actionId || slot.paused) continue;
    settleActionSlot(state, slot, durationSec, factor, logs, allowFaint);
  }
}

export function findFood(state: GameState): string | null {
  for (const id of FOOD_PRIORITY) {
    if ((state.inventory[id] ?? 0) > 0) return id;
  }
  return null;
}

export function eatBestFood(state: GameState, logs: LogEntry[]): boolean {
  const id = findFood(state);
  if (!id) {
    logs.push(createLog("没有可吃的食物", "warn"));
    return false;
  }
  state.inventory[id] = (state.inventory[id] ?? 0) - 1;
  if (state.inventory[id] <= 0) delete state.inventory[id];
  const value = FOOD_VALUES[id] ?? 8;
  advanceGameTime(state, 10, logs);
  state.player.hunger = Math.min(100, state.player.hunger + value);
  logs.push(createLog(`吃下 ${label(id)}，花费 10 分钟，饱食 +${value}`, "info"));
  return true;
}

export function drinkWater(state: GameState, logs: LogEntry[]): boolean {
  if ((state.inventory.water ?? 0) <= 0) {
    logs.push(createLog("没有淡水可喝", "warn"));
    return false;
  }
  state.inventory.water -= 1;
  if (state.inventory.water <= 0) delete state.inventory.water;
  advanceGameTime(state, 5, logs);
  state.player.thirst = Math.min(100, state.player.thirst + 10);
  logs.push(createLog("饮水，花费 5 分钟，水分 +10", "info"));
  return true;
}

export function applySurvivalOnline(
  state: GameState,
  elapsedSec: number,
  logs: LogEntry[],
): void {
  const hours = elapsedSec / 3600;
  const reduction = survivalReduction(state);
  const waterLoss = 4 * (1 - reduction) * hours;
  const foodLoss = 3 * (1 - reduction) * hours;
  state.player.thirst = Math.max(0, state.player.thirst - waterLoss);
  state.player.hunger = Math.max(0, state.player.hunger - foodLoss);

  if (state.player.thirst < 35) drinkWater(state, logs);
  if (state.player.hunger < 35) eatBestFood(state, logs);

  if (state.player.thirst <= 0) {
    state.player.mood = Math.max(0, state.player.mood - elapsedSec * (8 / 3600));
  }
  if (state.player.hunger <= 0) {
    state.player.mood = Math.max(0, state.player.mood - elapsedSec * (5 / 3600));
  }
}

export function simulateOfflineSurvival(
  state: GameState,
  offlineSec: number,
): { effectiveSec: number; reason: string | null; haltedAtSec: number | null } {
  const hours = Math.floor(offlineSec / 3600);
  if (hours <= 0) return { effectiveSec: offlineSec, reason: null, haltedAtSec: null };
  const reduction = survivalReduction(state);
  const waterPerHour = 4 * (1 - reduction);
  const foodPerHour = 3 * (1 - reduction);
  let waterReserve = state.inventory.water ?? 0;
  let foodReserve = totalFoodUnits(state);
  let haltedHour: number | null = null;

  for (let hour = 0; hour < hours; hour += 1) {
    if (waterReserve < waterPerHour) {
      haltedHour = hour;
      break;
    }
    if (foodReserve < foodPerHour) {
      haltedHour = hour;
      break;
    }
    waterReserve -= waterPerHour;
    foodReserve -= foodPerHour;
  }

  const effectiveHours = haltedHour === null ? hours : haltedHour;
  const effectiveSec = effectiveHours * 3600;

  const waterConsumed = Math.min(waterReserve, waterPerHour * effectiveHours);
  const foodConsumed = Math.min(foodReserve, foodPerHour * effectiveHours);
  state.inventory.water = Math.max(0, (state.inventory.water ?? 0) - waterConsumed);
  if (state.inventory.water <= 0) delete state.inventory.water;
  consumeFoodUnits(state, foodConsumed);

  return {
    effectiveSec,
    reason: haltedHour === null ? null : waterReserve < waterPerHour ? "thirst" : "hunger",
    haltedAtSec: haltedHour === null ? null : haltedHour * 3600,
  };
}

export function totalFoodUnits(state: GameState): number {
  return FOOD_PRIORITY.reduce((sum, id) => sum + (state.inventory[id] ?? 0), 0);
}

export function consumeFoodUnits(state: GameState, units: number): void {
  let remaining = Math.floor(units);
  for (const id of FOOD_PRIORITY) {
    if (remaining <= 0) break;
    const available = state.inventory[id] ?? 0;
    const take = Math.min(available, remaining);
    state.inventory[id] = available - take;
    if (state.inventory[id] <= 0) delete state.inventory[id];
    remaining -= take;
  }
}

export function advanceDays(state: GameState, days: number, logs: LogEntry[]): void {
  advanceGameTime(state, days * GAME_MINUTES_PER_DAY, logs);
}

export function advanceGameOnline(state: GameState, now: number): { state: GameState; logs: LogEntry[] } {
  if (now <= state.lastSettleAt) return { state, logs: [] };
  const next = cloneState(state);
  const logs: LogEntry[] = [];

  if (next.sleep.active) {
    processSleep(next, next.sleep.lastProcessedAt, now, logs);
  } else {
    settleSlotsOnline(next, now, logs);
  }

  next.lastSettleAt = now;
  next.lastSurvivalAt = now;
  next.stats.totalPlaySec += Math.max(0, (now - state.lastSettleAt) / 1000);
  checkAchievements(next, logs);
  return { state: next, logs };
}

export function settleOffline(
  state: GameState,
  now: number,
): { state: GameState; report: OfflineReport | null; logs: LogEntry[] } {
  if (now <= state.lastSettleAt) return { state, report: null, logs: [] };
  const elapsedSec = (now - state.lastSettleAt) / 1000;
  if (elapsedSec < 60) {
    const next = cloneState(state);
    const logs: LogEntry[] = [];
    checkAchievements(next, logs);
    return { state: next, report: null, logs };
  }

  const next = cloneState(state);
  const logs: LogEntry[] = [];
  const capHours = offlineCapHours(next);
  const cappedSec = Math.min(elapsedSec, capHours * 3600);
  const settleTo = next.lastSettleAt + cappedSec * 1000;
  let remainingTaskSec = cappedSec;
  if (next.sleep.active) {
    const processEnd = Math.min(settleTo, next.sleep.endsAt);
    processSleep(next, next.sleep.lastProcessedAt, processEnd, logs);
    remainingTaskSec = Math.max(0, (settleTo - processEnd) / 1000);
  }
  const actionFactor = 0.6;
  settleSlotsForDuration(next, remainingTaskSec, actionFactor, logs);

  next.lastSettleAt = now;
  next.lastSurvivalAt = now;
  next.stats.totalOfflineSec += cappedSec;
  checkAchievements(next, logs);

  const report: OfflineReport = {
    elapsedSec,
    effectiveSec: remainingTaskSec,
    capHours,
    haltedReason: null,
    haltedAtSec: null,
    perSlot: next.actionSlots
      .filter((slot) => slot.actionId)
      .map((slot) => {
        const action = getAction(slot.actionId);
        return {
          actionName: action?.name ?? "未知行动",
          completed: slot.completed,
          xp: action?.xp ?? 0,
          output: action?.output ?? {},
        };
      }),
    dailyEvents: logs.filter((entry) => entry.kind === "system" || entry.kind === "story").map((entry) => entry.text),
  };

  return { state: next, report, logs };
}

export function checkAchievements(state: GameState, logs: LogEntry[]): void {
  const unlock = (id: string, rewardText?: string) => {
    if (state.achievements[id]?.unlockedAt) return;
    state.achievements[id] = { unlockedAt: Date.now() };
    logs.push(createLog(`🏆 成就：${achievementName(id)}${rewardText ? `（${rewardText}）` : ""}`, "story"));
  };

  if (getBuildingLevel(state, "shelter") > 0) unlock("first_shelter");
  if (getBuildingLevel(state, "firepit") > 0) unlock("first_fire");
  if (getBuildingLevel(state, "rainwater_shelter") > 0) unlock("rainwater_done");
  if (getBuildingLevel(state, "storage") > 0) unlock("storage_done");
  if (getBuildingLevel(state, "watchtower") > 0) unlock("watchtower_done");
  if (getBuildingLevel(state, "shipyard") > 0) unlock("shipyard_done");
  if (getBuildingLevel(state, "solar_panel") > 0) unlock("solar_done");
  if (getBuildingLevel(state, "radio_tower") > 0) unlock("radio_done");
  if (state.stats.trashCollected > 0) unlock("first_trash");
  if (state.stats.rareCollected >= 10) unlock("rare_10");
  if (Object.values(state.keyItems).filter(Boolean).length >= 8) unlock("key_all");
  if (state.stats.diaryCount > 0) unlock("diary_10", "+心态");

  const level20Skills = Object.values(state.skills).filter((skill) => skill.level >= 20).length;
  if (level20Skills >= 3) {
    if (!state.achievements.diligent?.unlockedAt) {
      state.parallelSlots = Math.max(state.parallelSlots, 2);
      unlock("diligent", "并行槽位 +1");
    }
  }
  const level40Skills = Object.values(state.skills).filter((skill) => skill.level >= 40).length;
  if (level40Skills >= 6) {
    if (!state.achievements.army_of_one?.unlockedAt) {
      state.parallelSlots = Math.max(state.parallelSlots, 3);
      unlock("army_of_one", "并行槽位 +1");
    }
  }
}

export function achievementName(id: string): string {
  const names: Record<string, string> = {
    first_shelter: "第一间屋",
    first_fire: "第一堆火",
    rainwater_done: "水源",
    storage_done: "仓库",
    watchtower_done: "瞭望",
    shipyard_done: "船坞",
    solar_done: "电力",
    radio_done: "电波",
    first_trash: "第一件垃圾",
    rare_10: "稀有发现",
    key_all: "瓶中信",
    diary_10: "日记新手",
    diligent: "勤勉",
    army_of_one: "一人成军",
  };
  return names[id] ?? id;
}

export function craftRecipe(
  state: GameState,
  recipeId: string,
  logs: LogEntry[],
): boolean {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  if (state.skills[recipe.skill].level < recipe.unlockLevel) {
    logs.push(createLog(`${recipe.name}需要${SKILL_META[recipe.skill].name} Lv${recipe.unlockLevel}`, "warn"));
    return false;
  }
  if (!hasItems(state, recipe.input)) {
    logs.push(createLog(`材料不足，无法制作${recipe.name}`, "warn"));
    return false;
  }
  if (!canAdd(state, recipe.output)) {
    logs.push(createLog("背包空间不足", "warn"));
    return false;
  }
  removeItems(state, recipe.input);
  addItems(state, recipe.output);
  addXp(state, recipe.skill, recipe.xp, logs);
  advanceGameTime(state, recipe.durationSec, logs);
  logs.push(createLog(`制作完成：${recipe.name}，花费 ${recipe.durationSec} 分钟`, "gain"));
  checkAchievements(state, logs);
  return true;
}

export function buildBuilding(
  state: GameState,
  buildingId: string,
  logs: LogEntry[],
): boolean {
  const building = BUILDINGS[buildingId];
  if (!building) return false;
  const currentLevel = getBuildingLevel(state, buildingId);
  if (currentLevel >= building.maxLevel) {
    logs.push(createLog(`${building.name}已经满级`, "warn"));
    return false;
  }
  const cost = building.cost[currentLevel];
  if (!cost) return false;
  if (!hasItems(state, cost.materials)) {
    logs.push(createLog(`${building.name}材料不足`, "warn"));
    return false;
  }
  removeItems(state, cost.materials);
  state.buildings[buildingId] = currentLevel + 1;
  state.player.mood = Math.min(state.player.moodMax, state.player.mood + 8);
  addXp(state, "construction", 40 + currentLevel * 30, logs);
  advanceGameTime(state, 120, logs);
  logs.push(createLog(`建造完成：${building.name} Lv${currentLevel + 1}`, "gain"));
  unlockRegions(state);
  checkAchievements(state, logs);
  return true;
}

export function unlockTechNode(
  state: GameState,
  nodeId: string,
  logs: LogEntry[],
): boolean {
  if (state.tech.unlockedNodes.includes(nodeId)) return false;
  let layerIndex = -1;
  for (let i = 0; i < TECH_LAYERS.length; i += 1) {
    if (TECH_LAYERS[i].nodes[nodeId]) {
      layerIndex = i;
      break;
    }
  }
  if (layerIndex < 0) return false;
  if (layerIndex > 0) {
    const previous = TECH_LAYERS[layerIndex - 1];
    const allPreviousUnlocked = Object.keys(previous.nodes).every((id) =>
      state.tech.unlockedNodes.includes(id),
    );
    if (!allPreviousUnlocked) {
      logs.push(createLog(`需要先完成上一层「${previous.name}」`, "warn"));
      return false;
    }
  }
  const node = TECH_LAYERS[layerIndex].nodes[nodeId];
  if (state.tech.knowledge < node.cost) {
    logs.push(createLog(`知识点不足，${node.name}需要 ${node.cost} 点`, "warn"));
    return false;
  }
  state.tech.knowledge -= node.cost;
  state.tech.unlockedNodes.push(nodeId);
  if (node.ending && (node.ending === "voyage" || node.ending === "settle" || node.ending === "broadcast")) {
    state.tech.endingChoice = node.ending;
  }
  logs.push(createLog(`科技解锁：${node.name}`, "story"));
  return true;
}

export function writeDiary(state: GameState, logs: LogEntry[]): void {
  state.stats.diaryCount += 1;
  state.player.mood = Math.min(state.player.moodMax, state.player.mood + 4);
  state.narrative.diaryEntries.push({
    day: state.day,
    title: `第 ${state.day} 天`,
    text: `第 ${state.day} 天。我还活着。`,
    createdAt: Date.now(),
  });
  addXp(state, "research", 26, logs);
  logs.push(createLog("写下一篇日记，心态 +4", "story"));
  checkAchievements(state, logs);
}

export function initialRegionState(): Record<string, { unlocked: boolean; exploration: number; logs: number }> {
  return {
    north_beach: { unlocked: true, exploration: 0, logs: 0 },
    east_reef: { unlocked: false, exploration: 0, logs: 0 },
    thorn_belt: { unlocked: false, exploration: 0, logs: 0 },
    outer_forest: { unlocked: false, exploration: 0, logs: 0 },
    shipwreck: { unlocked: false, exploration: 0, logs: 0 },
    deep_forest: { unlocked: false, exploration: 0, logs: 0 },
    cave: { unlocked: false, exploration: 0, logs: 0 },
    highland: { unlocked: false, exploration: 0, logs: 0 },
  };
}

export function newGame(): GameState {
  const now = Date.now();
  const skills = Object.fromEntries(
    SKILL_IDS.map((id) => [id, { level: 1, xp: 0, mastery: false }]),
  ) as Record<SkillId, { level: number; xp: number; mastery: boolean }>;

  return {
    schemaVersion: 1,
    saveId: uid(),
    createdAt: now,
    lastSettleAt: now,
    lastSurvivalAt: now,
    lastDayKey: dayKey(now),
    gameTimeMinutes: 6 * 60,
    day: 1,
    chapter: 1,
    prologueDone: true,
    skills,
    inventory: {
      berry: 12,
      branch: 35,
      leaves: 35,
      stone: 25,
      wood: 30,
      water: 10,
      vine: 8,
    },
    actionSlots: [
      {
        id: 0,
        actionId: null,
        startedAt: now,
        lastSettledAt: now,
        completed: 0,
        paused: false,
        pauseReason: null,
      },
      {
        id: 1,
        actionId: null,
        startedAt: now,
        lastSettledAt: now,
        completed: 0,
        paused: false,
        pauseReason: null,
      },
      {
        id: 2,
        actionId: null,
        startedAt: now,
        lastSettledAt: now,
        completed: 0,
        paused: false,
        pauseReason: null,
      },
    ],
    parallelSlots: 1,
    buildings: {},
    regions: initialRegionState(),
    tech: {
      knowledge: 0,
      unlockedNodes: [],
      endingChoice: null,
    },
    trashOnGround: [],
    keyItems: {
      solar_panel_shard: false,
      radio_module: false,
      paper_notebook: false,
      first_aid_kit: false,
      compass: false,
      folding_knife: false,
      battery: false,
      copper_coil: false,
    },
    keyItemPity: 0,
    rarePityNewbie: 0,
    player: {
      hunger: 70,
      thirst: 65,
      stamina: 100,
      staminaMax: 100,
      fatigue: 80,
      mood: 60,
      moodMax: 100,
      hp: 100,
      hpMax: 100,
      ailments: [],
      equipment: {
        weapon: "",
        armor: "",
      },
    },
    sleep: {
      active: false,
      type: null,
      startedAt: now,
      endsAt: now,
      lastProcessedAt: now,
      gameMinutes: 0,
    },
    weather: {
      today: "sunny",
      forecast: rollNextForecast(),
      stormCountdown: 840,
      stormWarning: false,
    },
    stats: {
      totalPlaySec: 0,
      totalOfflineSec: 0,
      trashCollected: 0,
      rareCollected: 0,
      battlesWon: 0,
      diaryCount: 0,
    },
    narrative: {
      diaryEntries: [],
      memories: [],
      bottles: [],
      choices: {},
    },
    achievements: {},
  };
}
