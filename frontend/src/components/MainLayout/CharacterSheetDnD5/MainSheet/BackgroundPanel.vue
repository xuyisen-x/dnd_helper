<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue' // 1. 引入 nextTick
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const languageTextarea = ref<HTMLTextAreaElement | null>(null)
const adjustLanguageHeight = () => {
  const el = languageTextarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
watch(
  () => sheet.value.background.languages,
  async () => {
    await nextTick()
    adjustLanguageHeight()
  },
)

onMounted(async () => {
  await nextTick()
  adjustLanguageHeight()
})

const handleTab = async (e: KeyboardEvent) => {
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const value = target.value

  const indent = '    '
  sheet.value.background.story = value.substring(0, start) + indent + value.substring(end)
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
        v-model="sheet.background.story"
        class="bare-textarea"
        placeholder="在此输入角色的背景故事、个性特点、理想、纽带和缺点等信息..."
        @keydown.tab.prevent="handleTab"
      ></textarea>
      <fieldset class="input-border">
        <legend class="language-title">语言</legend>
        <textarea
          ref="languageTextarea"
          v-model="sheet.background.languages"
          class="language-textarea"
          placeholder="如：通用语、精灵语"
          rows="1"
          @input="adjustLanguageHeight"
        ></textarea>
      </fieldset>
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
  overflow-y: auto;
}

.language-textarea {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-weight: normal;
  transition: background-color 0.2s;
  resize: none;
  overflow-y: auto;

  font-size: 1rem;
  height: 1.8rem;
  line-height: 1.5;
  min-height: 1.8rem;
  max-height: 3.3rem;
}

.input-border {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 5px;
  position: relative;
}

.language-title {
  font-size: 1rem;
  padding: 0 5px;
  font-weight: bold;
  color: var(--dnd-ink-primary);
}
</style>
