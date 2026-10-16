import actionsRaw from "../../plan/design/data/actions.json";
import recipesRaw from "../../plan/design/data/recipes.json";
import buildingsRaw from "../../plan/design/data/buildings.json";
import techRaw from "../../plan/design/data/techTree.json";
import enemiesRaw from "../../plan/design/data/enemies.json";
import achievementsRaw from "../../plan/design/data/achievements.json";
import type {
  ActionDefinition,
  BuildingDefinition,
  EnemyDefinition,
  RecipeDefinition,
  SkillId,
  TechLayer,
} from "./types";
import { SKILL_IDS } from "./types";

type ActionsJson = Record<string, Record<string, Omit<ActionDefinition, "id" | "name">>>;
type RecipesJson = Record<string, Record<string, Omit<RecipeDefinition, "id" | "skill">>>;
type BuildingsJson = Record<string, Omit<BuildingDefinition, "id">>;

const actionNames: Record<string, string> = {
  pick_berries: "采集浆果",
  gather_nuts: "采集坚果",
  dig_root: "挖掘根茎",
  collect_seed_soil: "收集种子与土壤",
  outer_forest_gather: "外林采集",
  rare_herb_search: "寻找稀有草药",
  deep_mushroom: "采集深林蘑菇",
  master_gather: "精通采集",
  pickup_branch: "捡拾树枝",
  collect_leaves: "收集树叶",
  chop_softwood: "砍伐软木",
  gather_vine: "采集藤条",
  chop_bamboo: "砍伐竹子",
  chop_hardwood: "砍伐硬木",
  deep_hardwood: "深林伐木",
  master_woodcut: "精通伐木",
  start_fire: "钻木取火",
  cook_berry: "烤浆果",
  make_charcoal: "烧制木炭",
  build_shelter: "建造简易遮蔽",
  build_firepit: "建造火塘",
  study_manual_page: "研读手册残页",
  study_instruction: "研读说明书",
  study_book: "精读整本书",
  study_blueprint: "解析纸质图纸",
  record_finding: "记录发现",
  decipher_notebook: "破译笔记本",
  cook_meal: "烹饪一餐",
  eat_meal: "吃一顿饭",
  sleep_8h: "睡觉",
  // 采集扩充
  gather_banana: "采集香蕉",
  gather_coconut: "采集椰子",
  // 伐木补充
  ironbark_log: "深林铁木",
  // 采矿
  gather_stone: "捡拾石头",
  collect_flint: "采集燧石",
  dig_clay: "挖掘黏土",
  mine_guano_bed: "采集蝙蝠粪",
  mine_iron: "开采铁矿砂",
  deep_ore_vein: "深层矿脉",
  mine_sulfur: "硫磺采集",
  master_mining: "精通采矿",
  // 捕鱼
  catch_crab_hands: "岸边徒手摸蟹",
  pick_shells: "拾取贝壳",
  dry_salt: "晒盐",
  spear_fishing: "鱼叉捕鱼",
  collect_urchin: "采集海胆",
  net_fishing: "渔网作业",
  deep_dive_fishing: "深水潜捕",
  master_fishing: "精通捕鱼",
  // 狩猎
  catch_insects: "采集昆虫",
  set_small_trap: "布置小型陷阱",
  set_bird_snare: "设置鸟套",
  set_mid_trap: "布置中型陷阱",
  set_large_trap: "布置大型陷阱",
  deep_hunt_trail: "深层猎径",
  master_trap: "精通陷阱网",
  // 体能与游泳
  wade_shallows: "浅滩涉水",
  shore_swim: "近岸游泳",
  bay_crossing: "横渡海湾",
  reef_dive: "礁区潜水",
  deep_water_dive: "深水潜水",
  night_swim_drill: "夜泳特训",
  master_swim: "精通泳技",
};

const actionDurationMinutes: Record<string, number> = {
  pick_berries: 30,
  gather_nuts: 35,
  dig_root: 40,
  collect_seed_soil: 45,
  outer_forest_gather: 50,
  rare_herb_search: 60,
  deep_mushroom: 70,
  master_gather: 90,
  pickup_branch: 20,
  collect_leaves: 20,
  chop_softwood: 45,
  gather_vine: 40,
  chop_bamboo: 45,
  chop_hardwood: 60,
  deep_hardwood: 75,
  master_woodcut: 90,
  start_fire: 20,
  cook_berry: 10,
  make_charcoal: 30,
  build_shelter: 120,
  build_firepit: 120,
  study_manual_page: 60,
  study_instruction: 60,
  study_book: 90,
  study_blueprint: 120,
  record_finding: 30,
  decipher_notebook: 60,
  cook_meal: 10,
  eat_meal: 10,
  sleep_8h: 480,
  gather_banana: 32,
  gather_coconut: 45,
  ironbark_log: 120,
  gather_stone: 30,
  collect_flint: 40,
  dig_clay: 50,
  mine_guano_bed: 50,
  mine_iron: 60,
  deep_ore_vein: 75,
  mine_sulfur: 90,
  master_mining: 120,
  catch_crab_hands: 30,
  pick_shells: 30,
  dry_salt: 40,
  spear_fishing: 50,
  collect_urchin: 50,
  net_fishing: 75,
  deep_dive_fishing: 90,
  master_fishing: 120,
  catch_insects: 30,
  set_small_trap: 40,
  set_bird_snare: 50,
  set_mid_trap: 50,
  set_large_trap: 60,
  deep_hunt_trail: 75,
  master_trap: 120,
  wade_shallows: 30,
  shore_swim: 40,
  bay_crossing: 50,
  reef_dive: 60,
  deep_water_dive: 75,
  night_swim_drill: 90,
  master_swim: 120,
};

export const ACTIONS: Record<string, ActionDefinition> = {};
export const ACTIONS_BY_SKILL: Record<SkillId, ActionDefinition[]> = Object.fromEntries(
  SKILL_IDS.map((id) => [id, []]),
) as unknown as Record<SkillId, ActionDefinition[]>;

const actionGroups = actionsRaw as unknown as ActionsJson;
for (const [skillId, actions] of Object.entries(actionGroups)) {
  if (typeof actions !== "object" || actions === null || Array.isArray(actions)) continue;
  const normalizedSkill = skillId as SkillId;
  for (const [actionId, raw] of Object.entries(actions)) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const action: ActionDefinition = {
      id: actionId,
      name: actionNames[actionId] ?? prettifyId(actionId),
      ...(raw as Omit<ActionDefinition, "id" | "name">),
      skill: normalizedSkill,
      durationSec: actionDurationMinutes[actionId] ?? raw.durationSec,
    };
    ACTIONS[actionId] = action;
    ACTIONS_BY_SKILL[normalizedSkill]?.push(action);
  }
}

export const RECIPES: Record<string, RecipeDefinition> = {};
export const RECIPES_BY_SKILL: Record<SkillId, RecipeDefinition[]> = Object.fromEntries(
  SKILL_IDS.map((id) => [id, []]),
) as unknown as Record<SkillId, RecipeDefinition[]>;

const recipeGroups = recipesRaw as unknown as RecipesJson;
for (const [skillId, recipes] of Object.entries(recipeGroups)) {
  if (typeof recipes !== "object" || recipes === null || Array.isArray(recipes)) continue;
  const normalizedSkill = skillId as SkillId;
  for (const [recipeId, raw] of Object.entries(recipes)) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const recipe: RecipeDefinition = {
      id: recipeId,
      skill: normalizedSkill,
      ...(raw as Omit<RecipeDefinition, "id" | "skill">),
    };
    RECIPES[recipeId] = recipe;
    RECIPES_BY_SKILL[normalizedSkill]?.push(recipe);
  }
}

export const BUILDINGS: Record<string, BuildingDefinition> = {};
for (const [buildingId, raw] of Object.entries(buildingsRaw as unknown as BuildingsJson)) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
  BUILDINGS[buildingId] = {
    id: buildingId,
    ...(raw as Omit<BuildingDefinition, "id">),
  };
}

export const TECH_LAYERS = (techRaw as unknown as { layers: TechLayer[] }).layers;

export const ENEMIES: Record<string, EnemyDefinition> = {};
for (const [enemyId, raw] of Object.entries(
  (enemiesRaw as unknown as { enemies: Record<string, Omit<EnemyDefinition, "id">> }).enemies,
)) {
  ENEMIES[enemyId] = { id: enemyId, ...raw };
}

export const ACHIEVEMENT_CATALOG = achievementsRaw as Record<string, unknown>;

export const SKILL_META: Record<SkillId, { name: string; icon: string; category: string }> = {
  gathering: { name: "采集", icon: "🍓", category: "采集" },
  woodcutting: { name: "伐木", icon: "🪵", category: "采集" },
  mining: { name: "采矿", icon: "⛏️", category: "采集" },
  fishing: { name: "捕鱼", icon: "🎣", category: "采集" },
  hunting: { name: "狩猎/陷阱", icon: "🪤", category: "采集" },
  cooking: { name: "生火与烹饪", icon: "🔥", category: "制作" },
  toolcraft: { name: "石器与工具", icon: "🔨", category: "制作" },
  weaving: { name: "编织与绳索", icon: "🧶", category: "制作" },
  pottery: { name: "陶器与容器", icon: "🏺", category: "制作" },
  salvage: { name: "废料改造", icon: "♻️", category: "制作" },
  construction: { name: "建造", icon: "🏗️", category: "生存" },
  medicine: { name: "医药与草药", icon: "🌿", category: "生存" },
  athletics: { name: "体能与游泳", icon: "🏊", category: "生存" },
  research: { name: "记录与研究", icon: "📖", category: "知识" },
};

export const REGION_META: Record<string, { name: string; icon: string }> = {
  north_beach: { name: "北沙滩", icon: "🏖️" },
  east_reef: { name: "东礁石区", icon: "🪸" },
  thorn_belt: { name: "荆棘带", icon: "🌵" },
  outer_forest: { name: "外林", icon: "🌴" },
  shipwreck: { name: "南沉船带", icon: "🚢" },
  deep_forest: { name: "内林深处", icon: "🌲" },
  cave: { name: "山洞", icon: "🕳️" },
  highland: { name: "高地/火山口", icon: "⛰️" },
};

export const RESOURCE_LABELS: Record<string, string> = {
  berry: "浆果",
  nut: "坚果",
  root: "根茎",
  herb: "草药",
  mushroom: "蘑菇",
  seed: "种子",
  soil: "土壤",
  branch: "树枝",
  leaves: "树叶",
  wood: "木材",
  vine: "藤条",
  hardwood: "硬木",
  bamboo: "竹竿",
  stone: "石头",
  flint: "燧石",
  clay: "黏土",
  iron_ore: "铁矿砂",
  sulfur: "硫磺",
  fertilizer: "肥料",
  fish: "鱼",
  crab_meat: "蟹肉",
  sea_urchin: "海胆",
  shell: "贝壳",
  salt: "盐",
  raw_meat: "兽肉",
  poultry: "禽肉",
  leather: "皮革",
  bone: "骨",
  insect_protein: "昆虫蛋白",
  feather: "羽毛",
  fire: "火种",
  charcoal: "木炭",
  ash: "灰烬",
  cooked_food: "熟食",
  dried_meat: "肉干",
  feast: "大餐",
  stone_axe: "石斧",
  stone_knife: "石刀",
  bone_spear: "骨矛",
  metal_axe: "金属斧",
  vine_armor: "藤甲",
  metal_plate_armor: "金属片甲",
  rope: "绳索",
  basket: "筐",
  fishing_net: "渔网",
  raft_part: "筏材",
  sail: "船帆",
  clay_pot: "陶罐",
  water_container: "储水器",
  glazed_pot: "釉面陶罐",
  plastic_granule: "塑料颗粒",
  metal: "金属",
  metal_scrap: "金属片",
  copper_wire: "铜线",
  glass: "玻璃片",
  mastery_token_wood: "专精凭证（木质）",
  mastery_token_metal: "专精凭证（金属）",
  knowledge: "知识点",
  water: "淡水",
  bandage: "止血绷带",
  antidote: "解毒剂",
  fever_potion: "退烧药",
  insect_repellent: "驱虫药",
  plastic_bottle: "塑料瓶",
  plastic_bag: "塑料袋",
  can: "易拉罐",
  rope_fragment: "绳索碎片",
  wood_plank: "木板",
  cable: "电缆",
  glass_fragment: "玻璃碎片",
  manual_page: "手册残页",
  instruction_label: "说明书/标签",
  glass_bottle: "玻璃瓶",
  lighter_fragment: "打火机残件",
  waterproof_cloth: "防水布",
  fishing_line: "渔线",
  medicine_packaging: "药品包装",
  whole_book: "整本书",
  paper_blueprint: "纸质图纸",
  solar_panel_shard: "太阳能板碎片",
  radio_module: "无线电模块",
  paper_notebook: "纸质图纸笔记本",
  first_aid_kit: "急救包",
  compass: "指南针",
  folding_knife: "折叠刀具",
  battery: "蓄电池",
  copper_coil: "铜线圈",
  signal_transmitter: "信号发射器",
  solar_charger: "太阳能充电板",
  fire_lens: "取火透镜",
  smoked_meat: "熏肉",
  snake_meat: "蛇肉",
  snake_skin: "蛇皮",
  honey: "蜂蜜",
  venom_sac: "毒囊",
  shark_meat: "鲨鱼肉",
  shark_teeth: "鲨鱼牙",
  tusk: "獠牙",
  guano: "蝙蝠粪",
  // 新增资源
  banana: "香蕉",
  coconut: "椰子",
  stone_blade: "石片",
  torch: "火把",
  harpoon: "鱼叉",
  metal_knife_set: "金属刀具组",
  cable_rope: "缆绳",
  clay_body: "陶坯",
  coconut_bowl: "椰壳碗",
  big_vat: "陶缸",
  cistern: "蓄水池",
  steel_pipe: "改造钢管",
  field_kit: "高级急救包",
  calibrated_compass: "校准指南针",
  composite_armor: "复合护甲",
  radio_repair: "无线电修复件",
  herb_salve: "草药敷料",
  panacea: "万能药",
};

export function prettifyId(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function label(itemId: string): string {
  return RESOURCE_LABELS[itemId] ?? prettifyId(itemId);
}
