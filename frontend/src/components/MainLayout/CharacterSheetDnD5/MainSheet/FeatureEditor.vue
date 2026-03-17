<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data, FeatureDnd5 } from '@/stores/rules/dnd5'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { confirmationBox } from '@/composables/useConfirmationBox'
const TipTapEditor = defineAsyncComponent(() => import('@/components/Common/TipTapEditor.vue'))

interface Props {
  featureKey: 'class_features' | 'race_features' | 'feat'
  index: number
}
const props = defineProps<Props>()
const emit = defineEmits(['close'])

const store = useActiveCharacterStore()
const feature = (() => {
  const data = store.data as Dnd5Data
  return data.features[props.featureKey][props.index] as FeatureDnd5
})()

const { foldAndCheckNumber, foldAndCheckConstantsInteger } = useDiceBox()

const editDraft = ref<FeatureDnd5>({
  ...feature,
})

const closeEditDialog = () => {
  emit('close')
}

const hasError = computed(() => {
  return !limitInfo.value[0] || !shortRestInfo.value[0] || !longRestInfo.value[0]
})

const saveEditDialog = () => {
  if (hasError.value) return
  const data = store.data as Dnd5Data
  if (data.features[props.featureKey][props.index]) {
    data.features[props.featureKey][props.index] = {
      ...editDraft.value,
    }
  }
  emit('close')
}

const deleteFeature = async () => {
  const confirmed = await confirmationBox(
    '删除特性',
    `确定要删除特性「${feature.name}」吗？此操作不可撤销。`,
  )
  if (!confirmed) return
  const data = store.data as Dnd5Data
  data.features[props.featureKey].splice(props.index, 1)
  emit('close')
}

const onCountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const sanitizedValue = input.value.replace(/[^\d]/g, '')
  editDraft.value.usageCount = sanitizedValue === '' ? 0 : parseInt(sanitizedValue, 10)
  const finalDisplayValue = String(editDraft.value.usageCount)
  if (input.value !== finalDisplayValue) {
    input.value = finalDisplayValue
  }
}

const limitInfo = computed(() => {
  if (editDraft.value.usageLimit.trim() === '') {
    return [true, '无限制']
  } else {
    return foldAndCheckConstantsInteger(editDraft.value.usageLimit)
  }
})

const shortRestInfo = computed(() => {
  if (editDraft.value.afterShortRest.trim() === '') {
    return [true, '无']
  } else {
    return foldAndCheckNumber(editDraft.value.afterShortRest)
  }
})

const longRestInfo = computed(() => {
  if (editDraft.value.afterLongRest.trim() === '') {
    return [true, '无']
  } else {
    return foldAndCheckNumber(editDraft.value.afterLongRest)
  }
})
</script>

<template>
  <div class="feature-dialog-mask" @click.self="closeEditDialog">
    <div class="feature-dialog">
      <div class="dialog-header">编辑特性</div>
      <div class="dialog-body">
        <div class="feature-dialog-left">
          <div class="labeled-input">
            <div class="input-label">名称：</div>
            <input
              class="text-input"
              type="text"
              v-model="editDraft.name"
              placeholder="请输入名称"
            />
          </div>
          <div class="labeled-input">
            <div class="input-label">使用限制：</div>
            <input
              class="text-input"
              type="text"
              v-model="editDraft.usageLimit"
              placeholder="请输入使用限制"
            />
          </div>
          <div class="extra-info-container">
            <div>{{ limitInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !limitInfo[0] }">
              {{ limitInfo[1] }}
            </div>
          </div>
          <div class="labeled-input">
            <div class="input-label">剩余使用次数：</div>
            <input
              class="text-input"
              :value="editDraft.usageCount"
              @input="onCountInput"
              type="text"
              min="0"
            />
          </div>
          <div class="labeled-input">
            <div class="input-label">短休恢复：</div>
            <input
              class="text-input"
              v-model="editDraft.afterShortRest"
              type="text"
              placeholder="请输入短休恢复表达式"
            />
          </div>
          <div class="extra-info-container">
            <div>{{ shortRestInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !shortRestInfo[0] }">
              {{ shortRestInfo[1] }}
            </div>
          </div>
          <div class="labeled-input">
            <div class="input-label">长休恢复：</div>
            <input
              class="text-input"
              v-model="editDraft.afterLongRest"
              type="text"
              placeholder="请输入长休恢复表达式"
            />
          </div>
          <div class="extra-info-container">
            <div>{{ longRestInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !longRestInfo[0] }">
              {{ longRestInfo[1] }}
            </div>
          </div>
        </div>
        <div class="feature-dialog-right">
          <div class="input-label">详细描述：</div>
          <div class="editor-wrapper">
            <TipTapEditor v-model="editDraft.description" placeholder="请输入特性描述" />
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-primary" @click="deleteFeature">删除</button>
        <div />
        <button class="btn-ghost" @click="closeEditDialog">取消</button>
        <button
          class="btn-primary"
          @click="saveEditDialog"
          :class="{ 'btn-disabled': hasError }"
          :disabled="hasError"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-dragon-red-hover);
}

body.has-mouse .btn-ghost:hover {
  color: var(--dnd-ink-primary);
  border-color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.04);
}

.feature-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.feature-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  padding: 16px 20px;
  width: min(1000px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  max-height: 90vh; /* 限制最大高度为视口高度的 90% */
  display: flex; /* 启用 Flex 布局 */
  flex-direction: column; /* 垂直排列子元素 */
  font-family: Georgia, 'Songti SC', 'SimSun', serif;
}

.dialog-header {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  font-size: 1.2rem;
  margin-bottom: 12px;
}

.dialog-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.feature-dialog-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.feature-dialog-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.dialog-actions {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  margin-top: 12px;
}

.extra-info-container {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
}

.extra-info {
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
  border: 1px solid var(--dnd-magic-blue);
  border-radius: 6px;
  padding: 2px 8px;
  flex: 1;
}

.warning.extra-info {
  border-color: var(--dnd-dragon-red);
  color: var(--dnd-dragon-red);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--dnd-ink-secondary); /* 变成灰色 */
}

body.has-mouse .btn-disabled:hover {
  background-color: var(--dnd-ink-secondary);
}

.labeled-input {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

.input-label {
  font-size: 1rem;
  font-weight: bold;
  font-family: Georgia, 'Songti SC', 'SimSun', serif;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
  width: 120px;
}

.text-input {
  color: var(--dnd-ink-secondary);
  background: transparent;
  border: none;
  font-family: inherit;
  outline: none;
  width: 100%;
  font-size: 1rem;
}

.text-input:focus {
  border-bottom: 1px solid var(--dnd-dragon-red);
  background-color: rgba(255, 255, 255, 0.2);
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  padding: 10px;
  overflow-y: auto;
}
</style>
