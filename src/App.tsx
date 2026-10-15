import { useEffect, useState } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { LogPanel } from "./components/LogPanel";
import {
  AchievementsModal,
  BuildingModal,
  CraftingModal,
  DiaryModal,
  InventoryModal,
  OfflineModal,
  TechModal,
  TrashModal,
} from "./components/Modals";
import { SkillsPanel } from "./components/SkillsPanel";
import { StatusPanel } from "./components/StatusPanel";
import { TopBar } from "./components/TopBar";
import { saveGame, useGame } from "./game/store";
import type { SkillId } from "./game/types";

export default function App() {
  const [selectedSkill, setSelectedSkill] = useState<SkillId>("gathering");
  const game = useGame((state) => state.game);
  const modal = useGame((state) => state.modal);
  const closeModal = useGame((state) => state.closeModal);
  const tick = useGame((state) => state.tick);

  useEffect(() => {
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    const saveInterval = window.setInterval(() => saveGame(useGame.getState().game), 5000);
    const onUnload = () => saveGame(useGame.getState().game);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.clearInterval(saveInterval);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  useEffect(() => {
    saveGame(game);
  }, [game]);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <SkillsPanel selectedSkill={selectedSkill} onSelect={setSelectedSkill} />
        <ActionPanel selectedSkill={selectedSkill} />
        <div className="right-column">
          <StatusPanel />
          <LogPanel />
        </div>
      </main>

      {modal === "offline" && <OfflineModal onClose={closeModal} />}
      {modal === "inventory" && <InventoryModal onClose={closeModal} />}
      {modal === "crafting" && <CraftingModal onClose={closeModal} />}
      {modal === "building" && <BuildingModal onClose={closeModal} />}
      {modal === "tech" && <TechModal onClose={closeModal} />}
      {modal === "trash" && <TrashModal onClose={closeModal} />}
      {modal === "diary" && <DiaryModal onClose={closeModal} />}
      {modal === "achievements" && <AchievementsModal onClose={closeModal} />}
    </div>
  );
}
