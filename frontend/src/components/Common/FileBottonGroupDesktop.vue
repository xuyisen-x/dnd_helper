<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import { useFileManager } from '@/composables/useFileManager'
import { watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const activeCharacterStore = useActiveCharacterStore()

const { handleSave, handleQuickSave, handleLoad, enableAutoSave, lastSaveText, isBondedToFile } =
  useFileManager()

const newWindow = () => {
  invoke('new_window').catch(console.error)
}

watch(
  () => activeCharacterStore.$state, // 深度监听整个角色卡状态
  () => {
    if (!isBondedToFile.value) {
      // 如果当前还没有绑定本地文件（即这是一个新建的空白卡）
      invoke('mark_window_dirty').catch(console.error)
    }
  },
  {
    deep: true,
    once: true,
  },
)
</script>

<template>
  <div class="btn-group">
    <div class="last-save-text">上次保存：{{ lastSaveText }}</div>
    <div class="filter-chip" @click="enableAutoSave = !enableAutoSave">
      <div class="check-icon" :class="{ checked: enableAutoSave }">
        <svg v-if="enableAutoSave" viewBox="0 0 24 24" class="svg-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="input-label">自动保存</span>
    </div>
    <button class="dnd-btn btn-primary" @click="handleLoad">读取档案</button>
    <button class="dnd-btn btn-primary" @click="handleQuickSave" v-if="isBondedToFile">
      保存角色
    </button>
    <button class="dnd-btn btn-primary" @click="handleSave">
      {{ isBondedToFile ? '另存副本' : '保存角色' }}
    </button>
    <button class="dnd-btn btn-primary" @click="newWindow">新建窗口</button>
  </div>
</template>

<style scoped>
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

.check-icon {
  width: 18px;
  height: 18px;
  border-radius: 20%;
  border: 2px solid var(--dnd-stone-text);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.check-icon.checked {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  margin-left: 10px;
}

.svg-icon {
  stroke: var(--dnd-mithral-text);
  fill: none;
  stroke-width: 4;
  width: 14px;
  height: 14px;
}

.input-label {
  font-size: 1rem;
  font-weight: bold;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
}

.last-save-text {
  font-size: 0.9rem;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-secondary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
}
</style>
