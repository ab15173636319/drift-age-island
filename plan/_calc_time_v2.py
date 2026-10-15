# -*- coding: utf-8 -*-
"""
新时间系统数值重算
基础：1 现实分钟 = 1 游戏小时（1 游戏日 = 24 现实分钟）
"""

print("=" * 80)
print("新时间系统：操作驱动 + 1现实分钟 = 1游戏小时")
print("=" * 80)

# ============ 1. 时间换算 ============
print()
print("=== 1. 时间换算 ===")
GAME_HOUR_PER_REAL_MIN = 1   # 1 现实分钟 = 1 游戏小时
REAL_MIN_PER_GAME_DAY = 24  # 1 游戏日 = 24 现实分钟

print("1 现实分钟 = %d 游戏小时" % GAME_HOUR_PER_REAL_MIN)
print("1 游戏日（24 游戏小时）= %d 现实分钟 = %.1f 现实小时" % (REAL_MIN_PER_GAME_DAY, REAL_MIN_PER_GAME_DAY / 60))
print("1 现实日（24 现实小时）= %d 现实分钟 = %d 游戏小时 = %d 游戏日" % (
    24 * 60, 24 * 60 * GAME_HOUR_PER_REAL_MIN, 24 * 60 * GAME_HOUR_PER_REAL_MIN / 24))

# ============ 2. 玩家每日节奏 ============
print()
print("=== 2. 玩家每日（现实）游戏节奏 ===")
# 假设玩家每天现实玩 2 小时 = 120 现实分钟 = 120 游戏小时 = 5 游戏日
PLAY_HOURS_PER_DAY = 2  # 现实小时
play_real_min = PLAY_HOURS_PER_DAY * 60
play_game_hours = play_real_min * GAME_HOUR_PER_REAL_MIN
play_game_days = play_game_hours / 24
print("每日在线 %d 现实小时 = %d 现实分钟 = %d 游戏小时 = %.1f 游戏日" % (
    PLAY_HOURS_PER_DAY, play_real_min, play_game_hours, play_game_days))

# 离线 8 小时现实
OFFLINE_HOURS = 8
offline_real_min = OFFLINE_HOURS * 60
offline_game_hours = offline_real_min * GAME_HOUR_PER_REAL_MIN
offline_game_days = offline_game_hours / 24
print("每日离线 %d 现实小时 = %d 现实分钟 = %d 游戏小时 = %.1f 游戏日" % (
    OFFLINE_HOURS, offline_real_min, offline_game_hours, offline_game_days))

print("每日合计推进 %.1f 游戏日（在线 %.1f + 离线 %.1f）" % (
    play_game_days + offline_game_days, play_game_days, offline_game_days))

# ============ 3. 生存消耗折算 ============
print()
print("=== 3. 生存消耗（按游戏小时）===")
# 原来：每现实日消耗水94、食物71
# 现在：每游戏日消耗多少？
# 1 现实日 = 60 游戏日
# 所以每游戏日消耗 = 原来的 1/60
OLD_WATER_PER_REAL_DAY = 94
OLD_FOOD_PER_REAL_DAY = 71
NEW_WATER_PER_GAME_DAY = OLD_WATER_PER_REAL_DAY / 60
NEW_FOOD_PER_GAME_DAY = OLD_FOOD_PER_REAL_DAY / 60
print("原设定：每现实日水消耗 %d、食物 %d" % (OLD_WATER_PER_REAL_DAY, OLD_FOOD_PER_REAL_DAY))
print("新设定：每游戏日水消耗 %.1f、食物 %.1f" % (NEW_WATER_PER_GAME_DAY, NEW_FOOD_PER_GAME_DAY))
print("        每游戏小时水消耗 %.3f、食物 %.3f" % (NEW_WATER_PER_GAME_DAY / 24, NEW_FOOD_PER_GAME_DAY / 24))

# 但这样数值太小了，不好用。调整为：每游戏日消耗水10、食物8（更合理）
print()
print("=> 调整为更合理的数值：每游戏日水消耗 10、食物 8")
print("  每游戏小时水消耗 0.42、食物 0.33")
print("  睡 8 小时消耗水 3.3、食物 2.7")

# ============ 4. 漂流垃圾刷新 ============
print()
print("=== 4. 漂流垃圾刷新周期 ===")
# 原来：每现实日刷新 3-8 件
# 现在：每多少游戏日刷新一次？
# 目标：玩家现实每天能捡到 5-10 件垃圾
# 玩家现实每天推进 20 游戏日（在线5 + 离线15）
# 如果每 4 游戏日刷新一次，一天现实刷新 5 次 = 每次 1-2 件 = 每天 5-10 件
TRASH_REFRESH_GAME_DAYS = 4
TRASH_PER_REFRESH_MIN = 1
TRASH_PER_REFRESH_MAX = 2
print("刷新周期：每 %d 游戏日一次" % TRASH_REFRESH_GAME_DAYS)
print("每次刷新：%d-%d 件" % (TRASH_PER_REFRESH_MIN, TRASH_PER_REFRESH_MAX))
daily_trash = (play_game_days + offline_game_days) / TRASH_REFRESH_GAME_DAYS * 1.5
print("每日现实推进 %.1f 游戏日 -> 刷新 %.1f 次 -> 每日现实捡 %.1f 件垃圾" % (
    play_game_days + offline_game_days,
    (play_game_days + offline_game_days) / TRASH_REFRESH_GAME_DAYS,
    (play_game_days + offline_game_days) / TRASH_REFRESH_GAME_DAYS * 1.5))

# ============ 5. 飓风周期 ============
print()
print("=== 5. 飓风周期 ===")
# 目标：现实每 2 周刮一次飓风
# 现实 14 天 = 14 × 60 × 24 现实分钟 = 20160 现实分钟 = 20160 游戏小时 = 840 游戏日
HURRICANE_GAME_DAYS = 840
hurricane_real_days = HURRICANE_GAME_DAYS * REAL_MIN_PER_GAME_DAY / 60 / 24
print("飓风周期：每 %d 游戏日一次" % HURRICANE_GAME_DAYS)
print("折合现实：%.1f 天 = %.1f 周" % (hurricane_real_days, hurricane_real_days / 7))

# ============ 6. 技能经验曲线 ============
print()
print("=== 6. 技能经验曲线（按游戏内时间）===")
# 原来：Lv1->Lv50 需要 6.38 等效挂机小时（现实时间）
# 现在：改成按游戏内小时算
# 6.38 现实小时 = 382.8 现实分钟 = 382.8 游戏小时 = 16 游戏日
OLD_LV50_REAL_HOURS = 6.38
NEW_LV50_GAME_HOURS = OLD_LV50_REAL_HOURS * 60 * GAME_HOUR_PER_REAL_MIN
NEW_LV50_GAME_DAYS = NEW_LV50_GAME_HOURS / 24
print("原设定：Lv1->Lv50 需 %.1f 现实小时" % OLD_LV50_REAL_HOURS)
print("新设定：Lv1->Lv50 需 %.0f 游戏小时 = %.1f 游戏日" % (NEW_LV50_GAME_HOURS, NEW_LV50_GAME_DAYS))
print("  折合现实：%.1f 小时（因为 1 现实分钟 = 1 游戏小时）" % (NEW_LV50_GAME_HOURS / 60))

# ============ 7. 里程碑节奏重算 ============
print()
print("=== 7. 里程碑节奏（现实时间）===")
milestones = [
    ("生火/喝水/搭遮蔽", 0.2),
    ("石斧（采集/伐木 Lv10）", 1),
    ("打通荆棘带/首次战斗", 3),
    ("雨水棚+储物棚，离线 6h", 7),
    ("内林/种植/心态首次危机", 14),
    ("沉船带/科技线/金属工具", 30),
    ("瞭望塔/船坞/结局", 90),
]
print("里程碑 -> 现实天数")
for name, days in milestones:
    print("  %-30s -> %3d 现实天 = %.1f 游戏日" % (name, days, days * 60))

# ============ 8. 睡觉机制 ============
print()
print("=== 8. 睡觉机制 ===")
print("睡觉 8 游戏小时 = 8 现实分钟")
print("效果：体力回满 + 跳过夜晚 + 不消耗生存资源（被窝里省）")
print("限制：只能在遮蔽/建筑里睡，室外睡觉有风险")
print("不睡觉的惩罚：")
print("  - 每缺 1 小时睡眠，次日效率 -5%")
print("  - 连续 3 天不睡觉，触发'崩溃事件'（心态 -20）")

print()
print("=" * 80)
print("总结：新时间系统下，玩家现实每天 2 小时在线 = 推进 5 游戏日")
print("      离线 8 小时 = 推进 20 游戏日（打折后）")
print("      现实 30 天 = 推进约 600 游戏日 = 10 个飓风周期")
print("=" * 80)
