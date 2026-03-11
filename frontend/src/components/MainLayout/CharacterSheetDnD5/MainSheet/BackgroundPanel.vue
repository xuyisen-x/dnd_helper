<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, defineAsyncComponent } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const TipTapEditor = defineAsyncComponent(() => import('@/components/Common/TipTapEditor.vue'))

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
</script>

<template>
  <div class="background-panel">
    <div class="panel-header">
      <span class="label">背景故事 & 个性特点</span>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-body">
      <div class="editor-wrapper">
        <TipTapEditor
          v-model="sheet.background.story"
          placeholder="在此输入角色的背景故事、个性特点、理想、纽带和缺点等信息"
        />
      </div>
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
  min-height: 0;
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
  min-height: 0;
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.editor-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
