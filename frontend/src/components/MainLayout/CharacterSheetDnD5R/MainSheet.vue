<script setup lang="ts">
import AbilityShield from './MainSheet/AbilityShield.vue'
import ProficiencyShield from './MainSheet/ProficiencyShield.vue'
import InspirationShield from './MainSheet/InspirationShield.vue'
import CombatStatsPanel from './MainSheet/CombatStatsPanel.vue'
import CombatStatsPanel2 from './MainSheet/CombatStatsPanel2.vue'
import PortraitContainer from './MainSheet/PortraitContainer.vue'
</script>

<template>
  <div class="page-layout">
    <aside class="left-panel">
      <div class="ability-column">
        <ProficiencyShield />
        <AbilityShield ability-key="str" />
        <AbilityShield ability-key="dex" />
        <AbilityShield ability-key="con" />
        <InspirationShield />
      </div>
      <div class="ability-column">
        <AbilityShield ability-key="int" />
        <AbilityShield ability-key="wis" />
        <AbilityShield ability-key="cha" />
      </div>
    </aside>

    <main class="right-panel">
      <div class="one-panel">
        <PortraitContainer />
      </div>
      <div class="one-panel">
        <CombatStatsPanel />
        <CombatStatsPanel2 />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 整体布局：两栏 */
.page-layout {
  display: grid;
  grid-template-columns: auto 1fr; /* 左侧宽度由内容决定，右侧自动占据剩余宽度 */
  gap: 10px; /* 左右大栏之间的间距 */
  width: 100%;
  align-items: start; /* 顶部对齐 */
}

/* 左大栏内部布局：两列 */
.left-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* 每一列属性的垂直排布 */
.ability-column {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 每个盾牌之间的垂直间距 */
}

/* 右侧区域样式 (示例) */
.right-panel {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.content-placeholder {
  color: var(--color-text-soft);
  font-weight: bold;
}

.one-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
