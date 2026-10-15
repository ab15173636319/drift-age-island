export const SKILL_IDS = [
  "gathering",
  "woodcutting",
  "mining",
  "fishing",
  "hunting",
  "cooking",
  "toolcraft",
  "weaving",
  "pottery",
  "salvage",
  "construction",
  "medicine",
  "athletics",
  "research",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillState {
  level: number;
  xp: number;
  mastery: boolean;
}

export interface ActionDefinition {
  id: string;
  skill: SkillId;
  tier: string;
  unlockLevel: number;
  unlockRequires: string[];
  durationSec: number;
  xp: number;
  output: Record<string, number>;
  consume?: Record<string, number>;
  staminaCost: number;
  region: string;
  riskEvents: Array<{ id: string; chance: number }>;
  modifiers?: string[];
  name: string;
  description?: string;
  generated?: boolean;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  skill: SkillId;
  unlockLevel: number;
  input: Record<string, number>;
  output: Record<string, number>;
  durationSec: number;
  xp: number;
  effect?: string;
  cure?: string;
}

export interface BuildingCost {
  level: number;
  materials: Record<string, number>;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  maxLevel: number;
  unlockLevel: number;
  cost: BuildingCost[];
  effects: Record<string, unknown>;
  description: string;
}

export interface TechNode {
  id: string;
  name: string;
  cost: number;
  effect: string;
  ending?: string;
}

export interface TechLayer {
  layer: number;
  name: string;
  cost: number;
  nodes: Record<string, Omit<TechNode, "id">>;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
  region: string;
  level: number;
  drops: Record<string, number>;
  exp: number;
  description: string;
  poisonChance?: number;
}

export interface ActionSlot {
  id: number;
  actionId: string | null;
  startedAt: number;
  lastSettledAt: number;
  completed: number;
  paused: boolean;
  pauseReason: string | null;
}

export interface Ailment {
  id: string;
  remainingSec: number;
  source?: string;
}

export interface TrashItem {
  uid: string;
  id: string;
  grade: "common" | "rare" | "key";
  spawnedDay: number;
  region: string;
}

export interface RegionState {
  unlocked: boolean;
  exploration: number;
  logs: number;
}

export interface WeatherState {
  today: string;
  forecast: string[];
  stormCountdown: number;
  stormWarning: boolean;
}

export interface PlayerState {
  hunger: number;
  thirst: number;
  stamina: number;
  staminaMax: number;
  fatigue: number;
  mood: number;
  moodMax: number;
  hp: number;
  hpMax: number;
  ailments: Ailment[];
  equipment: {
    weapon: string;
    armor: string;
  };
}

export interface SleepState {
  active: boolean;
  type: "deep" | "nap" | null;
  startedAt: number;
  endsAt: number;
  lastProcessedAt: number;
  gameMinutes: number;
}

export interface DiaryEntry {
  day: number;
  title: string;
  text: string;
  createdAt: number;
}

export interface AchievementState {
  unlockedAt?: number;
  progress?: number;
}

export interface GameState {
  schemaVersion: number;
  saveId: string;
  createdAt: number;
  lastSettleAt: number;
  lastSurvivalAt: number;
  lastDayKey: string;
  gameTimeMinutes: number;
  day: number;
  chapter: number;
  prologueDone: boolean;
  skills: Record<SkillId, SkillState>;
  inventory: Record<string, number>;
  actionSlots: ActionSlot[];
  parallelSlots: number;
  buildings: Record<string, number>;
  regions: Record<string, RegionState>;
  tech: {
    knowledge: number;
    unlockedNodes: string[];
    endingChoice: null | "voyage" | "settle" | "broadcast";
  };
  trashOnGround: TrashItem[];
  keyItems: Record<string, boolean>;
  keyItemPity: number;
  rarePityNewbie: number;
  player: PlayerState;
  sleep: SleepState;
  weather: WeatherState;
  stats: {
    totalPlaySec: number;
    totalOfflineSec: number;
    trashCollected: number;
    rareCollected: number;
    battlesWon: number;
    diaryCount: number;
  };
  narrative: {
    diaryEntries: DiaryEntry[];
    memories: string[];
    bottles: string[];
    choices: Record<string, string>;
  };
  achievements: Record<string, AchievementState>;
}

export interface LogEntry {
  id: number;
  at: number;
  text: string;
  kind: "info" | "gain" | "warn" | "story" | "system";
}

export interface OfflineReport {
  elapsedSec: number;
  effectiveSec: number;
  capHours: number;
  haltedReason: string | null;
  haltedAtSec: number | null;
  perSlot: Array<{
    actionName: string;
    completed: number;
    xp: number;
    output: Record<string, number>;
  }>;
  dailyEvents: string[];
}
