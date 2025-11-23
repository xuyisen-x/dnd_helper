<script setup lang="ts">
import AbilityShield from './AbilityShield.vue'
import ProficiencyShield from './ProficiencyShield.vue'
import InspirationShield from './InspirationShield.vue'
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
      <div class="content-placeholder">右侧区域 (HP, AC, 攻击等)</div>
    </main>
  </div>
</template>

<style scoped>
/* 整体布局：两栏 */
.page-layout {
  display: grid;
  grid-template-columns: auto 1fr; /* 左侧宽度由内容决定，右侧自动占据剩余宽度 */
  gap: 20px; /* 左右大栏之间的间距 */
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
  gap: 15px; /* 每个盾牌之间的垂直间距 */
}

/* 右侧区域样式 (示例) */
.right-panel {
  background-color: rgba(0, 0, 0, 0.03);
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-placeholder {
  color: var(--color-text-soft);
  font-weight: bold;
}
</style>
