# 漂流纪元：孤岛

基于 Bun + React + TypeScript + Tauri 的放置生存游戏实现，数据与机制对齐 `plan/design/` 下的设计文档。

## 当前已实装

- 14 项技能等级、经验曲线、技能训练与主要采集/研究行动
- 时间戳行动队列与并行槽位（1 槽初始，成就可扩到 3 槽）
- 在线收益、离线收益、营地离线上限、离线 0.6 折
- 生存数值：饱食、水分、体力、心态、生命，自动进食/饮水
- 疲惫与睡眠：长时间行动会降低疲惫；支持沉睡和自定时长的小憩，疲惫过低可能昏迷
- 建筑系统：14 座建筑、营地等级、储水/仓库/自动生产等效果
- 制作系统：工具、编织、陶器、废料改造、医药、烹饪配方
- 垃圾系统：普通/稀有/关键三级，每日刷新、3 日滞留、新手与关键保底
- 科技树 7 层、知识点研究、结局节点互斥
- 日记、成就、背包、离线结算弹窗
- Tauri 2 桌面应用骨架与 Vite 前端构建

## 开发命令

```bash
bun install
bun run dev
bun run build
bun run tauri dev
bun run tauri build
```

`bun run dev` 会在 `http://127.0.0.1:5173` 启动网页版。Tauri 桌面运行还需要本机安装：

- Rust（rustup + stable toolchain）
- Visual Studio Build Tools，勾选“使用 C++ 的桌面开发”和 Windows SDK
- WebView2 Runtime（Windows 10/11 通常已内置）

## 存档

存档保存在浏览器 `localStorage`，键名为 `drift-age-island-save-v1`，每 5 秒自动保存，页面关闭时也会保存。Tauri 壳内使用同一套 Web 存储。
