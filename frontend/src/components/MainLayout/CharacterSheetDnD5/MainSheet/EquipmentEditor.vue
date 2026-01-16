<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data, EquipmentDnd5 } from '@/stores/rules/dnd5'
import { computed, ref } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'

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

const deleteEquipment = () => {
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
        <label class="dialog-field">
          <span>物品名称</span>
          <input v-model="editDraft.name" type="text" placeholder="长剑" />
        </label>

        <div class="dialog-row">
          <label class="dialog-field flex-1">
            <span>数量</span>
            <input
              :value="editDraft.quantity"
              @input="onQuantityInput"
              type="text"
              min="0"
              placeholder="1"
            />
          </label>

          <label class="dialog-field flex-none checkbox-field">
            <span>同调</span>
            <input v-model="editDraft.attunement" type="checkbox" class="checkbox-input" />
          </label>
        </div>

        <label class="dialog-field">
          <span>充能上限 / 使用限制</span>
          <input v-model="editDraft.chargesLimit" type="text" placeholder="@pb" />
          <div class="extra-info-container">
            <div>{{ limitInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !limitInfo[0] }">
              {{ limitInfo[1] }}
            </div>
          </div>
        </label>

        <label class="dialog-field">
          <span>当前充能 / 剩余次数</span>
          <input :value="editDraft.chargesCurrent" @input="onChargesInput" type="text" min="0" />
        </label>

        <label class="dialog-field">
          <span>短休恢复</span>
          <input v-model="editDraft.afterShortRest" type="text" placeholder="1d6+1" />
          <div class="extra-info-container">
            <div>{{ shortRestInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !shortRestInfo[0] }">
              {{ shortRestInfo[1] }}
            </div>
          </div>
        </label>

        <label class="dialog-field">
          <span>长休恢复</span>
          <input v-model="editDraft.afterLongRest" type="text" placeholder="1d4" />
          <div class="extra-info-container">
            <div>{{ longRestInfo[0] ? '折叠结果：' : '错误信息：' }}</div>
            <div class="extra-info" :class="{ warning: !longRestInfo[0] }">
              {{ longRestInfo[1] }}
            </div>
          </div>
        </label>

        <label class="dialog-field">
          <span>物品描述</span>
          <textarea
            class="detail-area"
            v-model="editDraft.description"
            rows="5"
            placeholder="填写物品的功能、外貌或背景故事..."
          ></textarea>
        </label>
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
/* 按钮样式 */
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

body.has-mouse .btn-danger:hover {
  background-color: var(--dnd-dragon-red);
  color: white;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--dnd-ink-secondary);
}

body.has-mouse .btn-disabled:hover {
  background-color: var(--dnd-ink-secondary);
}

/* 弹窗布局 */
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
  width: min(520px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  /* Flexbox 布局实现固定头部底部，中间滚动 */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* 滚动逻辑 */
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 4px; /* 避免滚动条紧贴 */
}

/* 字段样式 */
.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
  font-family: 'Georgia', serif;
}

.dialog-row {
  display: flex;
  gap: 12px;
  align-items: flex-end; /* 底部对齐 */
}

.flex-1 {
  flex: 1;
}
.flex-none {
  flex: none;
}

.dialog-field input,
.dialog-field textarea {
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.6);
  font-family: sans-serif;
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
}

.dialog-field input:focus,
.dialog-field textarea:focus {
  outline: none;
  border-color: var(--dnd-dragon-red);
}

.detail-area {
  resize: vertical;
}

/* Checkbox 特殊样式 */
.checkbox-field {
  align-items: center;
  justify-content: center;
  padding-bottom: 8px; /* 稍微调整对齐 */
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--dnd-dragon-red);
}

/* 额外信息/报错样式 */
.extra-info-container {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
}

.extra-info-container > div:first-child {
  white-space: nowrap;
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

.dialog-actions {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  margin-top: 12px;
  flex-shrink: 0;
}
</style>
