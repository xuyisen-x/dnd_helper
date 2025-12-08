<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})
</script>

<template>
  <div class="prof-panel">
    <div class="panel-header">
      <span class="label">装备训练 & 熟练项</span>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-body">
      <div class="armor-row">
        <span class="row-label">护甲受训</span>
        <div class="checkbox-group">
          <div class="custom-check">
            <div
              title="熟练"
              class="diamond-check clickable"
              :class="{ checked: sheet.proficiencies.armor.light }"
              @click="sheet.proficiencies.armor.light = !sheet.proficiencies.armor.light"
            ></div>
            <span class="check-text">轻甲</span>
          </div>

          <div class="custom-check">
            <div
              title="熟练"
              class="diamond-check clickable"
              :class="{ checked: sheet.proficiencies.armor.medium }"
              @click="sheet.proficiencies.armor.medium = !sheet.proficiencies.armor.medium"
            ></div>
            <span class="check-text">中甲</span>
          </div>

          <div class="custom-check">
            <div
              title="熟练"
              class="diamond-check clickable"
              :class="{ checked: sheet.proficiencies.armor.heavy }"
              @click="sheet.proficiencies.armor.heavy = !sheet.proficiencies.armor.heavy"
            ></div>
            <span class="check-text">重甲</span>
          </div>

          <div class="custom-check">
            <div
              title="熟练"
              class="diamond-check clickable"
              :class="{ checked: sheet.proficiencies.armor.shield }"
              @click="sheet.proficiencies.armor.shield = !sheet.proficiencies.armor.shield"
            ></div>
            <span class="check-text">盾牌</span>
          </div>
        </div>
      </div>

      <div class="text-section">
        <span class="row-label">武器</span>
        <textarea
          v-model="sheet.proficiencies.weapons"
          class="bare-textarea"
          placeholder="例如: 简易武器, 军用武器, 长剑..."
          rows="4"
        ></textarea>
      </div>

      <div class="text-section">
        <span class="row-label">工具</span>
        <textarea
          v-model="sheet.proficiencies.tools"
          class="bare-textarea"
          placeholder="例如: 盗贼工具, 石匠工具..."
          rows="4"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 容器风格 (复用 AttacksPanel 的边框风格) --- */
.prof-panel {
  display: grid;
  grid-template-rows: auto auto 1fr;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

/* 标题栏 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
}
.label {
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  letter-spacing: 1px;
}
.panel-divider {
  height: 2px;
  background-color: var(--dnd-ink-primary);
  width: 100%;
  opacity: 0.8;
}

/* --- 内容布局 --- */
.panel-body {
  padding: 10px 15px;
  display: grid;
  grid-template-rows: auto 1fr 1fr;
  gap: 8px;
}

.row-label {
  text-align: center;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  margin-bottom: 4px;
  display: block;
}

.inner-divider {
  height: 1px;
  background-color: var(--dnd-ink-secondary);
  opacity: 0.3;
  margin: 4px 0;
}

/* --- 1. 护甲行样式 --- */
.armor-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-wrap: wrap;
}
.armor-row .row-label {
  margin-bottom: 0; /* 横向排列时去掉下边距 */
  margin-right: 10px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: auto auto auto auto;
}

.check-text {
  font-size: 1rem;
  color: var(--dnd-ink-primary);
}

/* --- 2. 文本区域样式 --- */
.text-section {
  display: flex;
  flex-direction: column;
}

.bare-textarea {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  transition: background-color 0.2s;
  resize: none; /* 禁止调整大小 */
  border-bottom: 1px dashed var(--dnd-ink-secondary); /* 虚线下划线 */
  overflow-y: auto;
}

/* 占位符颜色 */
.bare-textarea::placeholder {
  color: var(--dnd-ink-secondary);
  opacity: 0.5;
  font-style: italic;
}

.diamond-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 50%;
  margin-right: 6px;
}
.diamond-check.checked {
  background-color: var(--dnd-ink-primary);
}
body.has-mouse .diamond-check:hover {
  border-color: var(--dnd-dragon-red);
}
body.has-mouse .diamond-check.checked:hover {
  background-color: var(--dnd-dragon-red);
}

.custom-check {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
</style>
