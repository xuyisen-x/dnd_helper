<script setup lang="ts">
import AbilityShield from './MainSheet/AbilityShield.vue'
import ProficiencyShield from './MainSheet/ProficiencyShield.vue'
import InspirationShield from './MainSheet/InspirationShield.vue'
import CombatStatsPanel from './MainSheet/CombatStatsPanel.vue'
import CombatStatsPanel2 from './MainSheet/CombatStatsPanel2.vue'
import PortraitContainer from './MainSheet/PortraitContainer.vue'
import AttacksPanel from './MainSheet/AttacksPanel.vue'
import DamageSusceptibility from './MainSheet/DamageSusceptibility.vue'
import ProficiencyPanel from './MainSheet/ProficiencyPanel.vue'
import BackgroundPanel from './MainSheet/BackgroundPanel.vue'
import ClassFeaturesPanel from './MainSheet/ClassFeaturesPanel.vue'
import RaceFeaturesPanel from './MainSheet/RaceFeaturesPanel.vue'
import FeatPanel from './MainSheet/FeatPanel.vue'
import EquipmentPanel from './MainSheet/EquipmentPanel.vue'
import CoinPanel from './MainSheet/CoinPanel.vue'
</script>

<template>
  <div class="page-layout">
    <div class="block-one">
      <div class="left-panel">
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
      </div>

      <div class="right-panel">
        <div class="two-panel">
          <PortraitContainer />
          <BackgroundPanel />
        </div>
        <div class="combat-info-panel">
          <ProficiencyPanel />
          <div class="hp-and-more">
            <CombatStatsPanel />
            <CombatStatsPanel2 />
          </div>
          <DamageSusceptibility />
        </div>
        <AttacksPanel />
      </div>
    </div>
    <div class="block-two">
      <div class="two-row1">
        <RaceFeaturesPanel />
        <FeatPanel />
      </div>
      <ClassFeaturesPanel />
      <div class="two-row2">
        <EquipmentPanel />
        <CoinPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 整体布局：两栏 */
.block-one {
  display: grid;
  grid-template-columns: auto 1fr; /* 左侧宽度由内容决定，右侧自动占据剩余宽度 */
  gap: 10px; /* 左右大栏之间的间距 */
  width: 100%;
  align-items: start; /* 顶部对齐 */
}

/* 整体布局：三栏 */
.block-two {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px; /* 三栏之间的间距 */
  width: 100%;
  align-items: start; /* 顶部对齐 */
  height: 600px;
}

/* 左大栏内部布局：两列 */
.left-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.right-panel {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 10px;
}

/* 每一列属性的垂直排布 */
.ability-column {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 每个盾牌之间的垂直间距 */
}

/* 右侧区域样式 (示例) */
.two-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.content-placeholder {
  color: var(--color-text-soft);
  font-weight: bold;
}

.combat-info-panel {
  display: grid;
  grid-template-columns: 1fr 445px auto;
  gap: 10px;
}

.one-panel-left {
  display: flex;
  flex-direction: column;
}

.hp-and-more {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 10px;
}

.two-row1 {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  height: 100%;
}

.two-row2 {
  display: grid;
  grid-template-rows: 3fr 1fr;
  gap: 10px;
  height: 100%;
}
</style>
