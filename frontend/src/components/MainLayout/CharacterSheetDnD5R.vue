<script setup lang="ts">
import { ref, computed } from 'vue'
import SheetHeader from './CharacterSheetDnD5R/MainSheet/SheetHeader.vue'
import MainSheet from './CharacterSheetDnD5R/MainSheet.vue'
import SpellsSheet from './CharacterSheetDnD5R/SpellsSheet.vue'

const currentTab = ref<'main' | 'spells'>('main') // 用于切换页面
// 建立一个映射表
const tabs = {
  main: MainSheet,
  spells: SpellsSheet,
}
const currentComponent = computed(() => tabs[currentTab.value]) // 计算当前应该显示的组件
</script>

<template>
  <div class="sheet-tabs">
    <button :class="{ active: currentTab === 'main' }" @click="currentTab = 'main'">
      主要属性
    </button>
    <button :class="{ active: currentTab === 'spells' }" @click="currentTab = 'spells'">
      法术
    </button>
  </div>
  <div class="dnd-sheet">
    <SheetHeader />
    <KeepAlive> <component :is="currentComponent" /> </KeepAlive>
  </div>
</template>

<style scoped>
.dnd-sheet {
  width: 1300px;
  background-color: var(--dnd-parchment-bg, #f0e6d2);
  color: var(--dnd-ink-primary, #2b2118);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  padding: 30px;
  border-radius: 4px;
  font-family: 'Georgia', serif; /* 衬线体更有味道 */
}

/* 输入框通用重置 */
:deep(input),
:deep(textarea) {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dnd-ink-secondary, #75604e);
  color: var(--dnd-ink-primary, #2b2118);
  font-family: inherit;
  outline: none;
  width: 100%;
}
:deep(input:focus),
:deep(textarea:focus) {
  border-bottom-color: var(--dnd-dragon-red, #8a1c1c);
  background-color: rgba(255, 255, 255, 0.2);
}

/* 可以点击的东西 */
:deep(.clickable) {
  cursor: pointer;
  transition:
    opacity 0.2s,
    color 0.2s;
}
:deep(.clickable:hover) {
  color: var(--dnd-dragon-red);
}
:deep(.clickable:active) {
  transform: scale(0.95);
}

/* --- Tabs --- */
.sheet-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  width: 100%;
  /* max-width: 1000px; */
}
.sheet-tabs button {
  padding: 10px 20px;
  border: none;
  background: var(--color-background-mute);
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
  color: var(--color-text-soft);
}
.sheet-tabs button.active {
  background: var(--dnd-parchment-bg);
  color: var(--dnd-dragon-red);
}
</style>
