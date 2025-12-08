<script setup lang="ts">
import { computed, nextTick } from 'vue' // 1. 引入 nextTick
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const handleTab = async (e: KeyboardEvent) => {
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const value = target.value

  const indent = '    '
  sheet.value.background = value.substring(0, start) + indent + value.substring(end)
  await nextTick()
  target.setSelectionRange(start + indent.length, start + indent.length)
}
</script>

<template>
  <div class="background-panel">
    <div class="panel-header">
      <span class="label">背景故事 & 个性特点</span>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-body">
      <textarea
        v-model="sheet.background"
        class="bare-textarea"
        placeholder="在此输入角色的背景故事、个性特点、理想、纽带和缺点等信息..."
        @keydown.tab.prevent="handleTab"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
/* 保持你之前的样式不变，我已经帮你修正了布局问题 */
.background-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
  flex-shrink: 0; /* 防止标题被压缩 */
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
  flex-shrink: 0;
}

.panel-body {
  flex: 1;
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bare-textarea {
  flex: 1;
  background: transparent;
  border: none;
  width: 100%;
  height: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  transition: background-color 0.2s;
  resize: none;
  border-bottom: 1px dashed var(--dnd-ink-secondary);
  overflow-y: auto;
}
</style>
