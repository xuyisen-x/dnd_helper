<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data, EquipmentDnd5 } from '@/stores/rules/dnd5'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { confirmationBox } from '@/composables/useConfirmationBox'
const TipTapEditor = defineAsyncComponent(() => import('@/components/Common/TipTapEditor.vue'))

interface Props {
  index: number
}
const props = defineProps<Props>()
const emit = defineEmits(['close'])

const store = useActiveCharacterStore()
// 获取当前编辑的装备对象引用
const equipmentItem = (() => {
  const data = store.data as Dnd5Data
  return data.equipment[props.index] as EquipmentDnd5
})()

const { foldAndCheckNumber, foldAndCheckConstantsInteger } = useDiceBox()

// 创建编辑草稿
const editDraft = ref<EquipmentDnd5>({
  ...equipmentItem,
})

const closeEditDialog = () => {
  emit('close')
}

// 校验逻辑：只要有一个公式解析失败，就视为有错误
const hasError = computed(() => {
  return !limitInfo.value[0] || !shortRestInfo.value[0] || !longRestInfo.value[0]
})

const saveEditDialog = () => {
  if (hasError.value) return
  const data = store.data as Dnd5Data
  if (data.equipment[props.index]) {
    data.equipment[props.index] = {
      ...editDraft.value,
    }
  }
  emit('close')
}

const deleteEquipment = async () => {
  const confirmed = await confirmationBox(
    '删除物品',
    `确定要删除物品「${equipmentItem.name}」吗？此操作不可撤销。`,
  )
  if (!confirmed) return
  const data = store.data as Dnd5Data
  data.equipment.splice(props.index, 1)
  emit('close')
}

// 处理当前充能输入
const onChargesInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // 充能一般保持为整数，依然使用 parseInteger
  const sanitized = input.value.replace(/[^\d]/g, '')
  const newVal = sanitized === '' ? 0 : parseInt(sanitized, 10)

  editDraft.value.chargesCurrent = newVal

  // 整数输入可以直接强制回写，体验影响不大
  if (input.value !== String(newVal)) {
    input.value = String(newVal)
  }
}

// 处理数量输入
const onQuantityInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const rawValue = input.value

  let sanitized = rawValue.replace(/[^\d.]/g, '')

  const dotIndex = sanitized.indexOf('.')
  if (dotIndex !== -1) {
    const before = sanitized.slice(0, dotIndex + 1)
    const after = sanitized.slice(dotIndex + 1).replace(/\./g, '')
    sanitized = before + after
  }

  const numericValue = parseFloat(sanitized)
  editDraft.value.quantity = isNaN(numericValue) ? 0 : numericValue

  if (rawValue !== sanitized) {
    input.value = sanitized
  }
}

// 充能上限校验
const limitInfo = computed(() => {
  if (editDraft.value.chargesLimit.trim() === '') {
    return [true, '无充能']
  } else {
    return foldAndCheckConstantsInteger(editDraft.value.chargesLimit)
  }
})

// 短休恢复校验
const shortRestInfo = computed(() => {
  if (editDraft.value.afterShortRest.trim() === '') {
    return [true, '无']
  } else {
    return foldAndCheckNumber(editDraft.value.afterShortRest)
  }
})

// 长休恢复校验
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
      <div class="dialog-header">编辑物品</div>

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
            <div class="input-label">数量：</div>
            <input
              class="text-input"
              :value="editDraft.quantity"
              @input="onQuantityInput"
              type="text"
              min="0"
              placeholder="1"
            />
          </div>

          <!-- <div class="dialog-row">
            <label class="dialog-field flex-none checkbox-field">
              <span>同调</span>
              <input v-model="editDraft.attunement" type="checkbox" class="checkbox-input" />
            </label>
          </div> -->

          <div class="filter-chip" @click="editDraft.attunement = !editDraft.attunement">
            <div class="check-icon" :class="{ checked: editDraft.attunement }">
              <svg v-if="editDraft.attunement" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="input-label">同调</span>
          </div>

          <div class="labeled-input">
            <div class="input-label">充能上限 / 使用限制：</div>
            <input
              class="text-input"
              v-model="editDraft.chargesLimit"
              type="text"
              placeholder="请输入充能上限或使用限制公式"
            />
          </div>

          <div class="extra-info-container">
            <div>{{ limitInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !limitInfo[0] }">
              {{ limitInfo[1] }}
            </div>
          </div>

          <div class="labeled-input">
            <div class="input-label">当前充能 / 剩余次数：</div>
            <input
              class="text-input"
              :value="editDraft.chargesCurrent"
              @input="onChargesInput"
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
              placeholder="请输入短休恢复公式"
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
              placeholder="请输入长休恢复公式"
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
        <button class="btn-primary" @click="deleteEquipment">删除</button>
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
  font-family: 'Georgia', serif;
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
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
  min-width: 80px;
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
}
</style>
