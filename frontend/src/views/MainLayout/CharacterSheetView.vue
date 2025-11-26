<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'

const CharacterSheetDnD5R = defineAsyncComponent(
  () => import('@/components/MainLayout/CharacterSheetDnD5R.vue'),
)

const activeCharacterStore = useActiveCharacterStore()

// 这里是后续连接后端逻辑的入口
const handleSave = () => {
  console.log('正在保存角色卡数据...')
  // TODO: 调用 Pinia 或 API 保存数据
}

const handleLoad = () => {
  console.log('正在读取角色卡数据...')
  // TODO: 从后端获取 JSON 并填充到 Store 中
}
</script>

<template>
  <div class="page-container">
    <div class="sheet-wrapper">
      <div class="btn-group">
        <button class="dnd-btn btn-primary" @click="handleLoad">读取档案</button>
        <button class="dnd-btn btn-primary" @click="handleSave">保存角色</button>
      </div>
      <CharacterSheetDnD5R v-if="activeCharacterStore.rule === 'dnd5r'" />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  overflow-y: auto;
  padding: 1rem 0 1rem 0;
}

.sheet-wrapper {
  width: fit-content;
  margin: 0 auto;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--color-background-mute);
  padding: 20px;
}

.btn-group {
  width: 100%;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-bottom: 10px;
}

/* --- D&D 风格按钮 --- */
.dnd-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 按钮：羊皮纸深色 / 墨水色 */
.btn-primary {
  background-color: var(--dnd-parchment-card);
  color: var(--dnd-ink-primary);
  border: 1px solid var(--dnd-gold);
}
body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-gold); /* 悬停变金色 */
  color: #fff;
}
</style>
