<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'

const { foldAndCheckConstantsInteger } = useDiceBox()

const props = withDefaults(defineProps<{ modelValue: [string, string][]; title?: string }>(), {
  title: '额外调整',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: [string, string][]): void
  (e: 'close'): void
}>()

const localItems = ref(
  props.modelValue.map(([label, expr]) => ({
    label,
    expr,
  })),
)

const inputRef = ref<HTMLInputElement | null>(null)
const errorMessages = ref<string[]>(localItems.value.map(() => ''))
const isValid = ref<boolean[]>(localItems.value.map(() => true))
const shouldShowWarning = ref<boolean[]>(localItems.value.map(() => false))
const warningTimeouts = new Map<number, number>()
const WARNING_DELAY_MS = 1000

const hasInvalid = computed(() => isValid.value.some((value) => !value))

const setExprRef = (el: HTMLInputElement | null, index: number) => {
  if (index === 0) {
    inputRef.value = el
  }
}

const clearWarningTimeout = (index: number) => {
  const timeout = warningTimeouts.get(index)
  if (timeout) {
    clearTimeout(timeout)
    warningTimeouts.delete(index)
  }
}

const validateExpr = (index: number, expr: string) => {
  clearWarningTimeout(index)
  shouldShowWarning.value[index] = false

  warningTimeouts.set(
    index,
    window.setTimeout(() => {
      shouldShowWarning.value[index] = true
    }, WARNING_DELAY_MS),
  )

  if (expr.trim() === '') {
    isValid.value[index] = true
    errorMessages.value[index] = ''
    return
  }

  const [result, message] = foldAndCheckConstantsInteger(expr)
  if (result) {
    isValid.value[index] = true
    errorMessages.value[index] = ''
  } else {
    isValid.value[index] = false
    errorMessages.value[index] = message
  }
}

const validateAllImmediate = () => {
  let allValid = true
  localItems.value.forEach((item, index) => {
    clearWarningTimeout(index)
    shouldShowWarning.value[index] = true
    if (item.expr.trim() === '') {
      isValid.value[index] = true
      errorMessages.value[index] = ''
      return
    }
    const [result, message] = foldAndCheckConstantsInteger(item.expr)
    if (result) {
      isValid.value[index] = true
      errorMessages.value[index] = ''
    } else {
      isValid.value[index] = false
      errorMessages.value[index] = message
      allValid = false
    }
  })
  return allValid
}

const addItem = () => {
  localItems.value.push({ label: '', expr: '' })
  errorMessages.value.push('')
  isValid.value.push(true)
  shouldShowWarning.value.push(false)
}

const removeItem = (index: number) => {
  clearWarningTimeout(index)
  localItems.value.splice(index, 1)
  errorMessages.value.splice(index, 1)
  isValid.value.splice(index, 1)
  shouldShowWarning.value.splice(index, 1)
}

const commitAndClose = () => {
  if (!validateAllImmediate()) {
    return
  }

  const payload: [string, string][] = localItems.value.map((item) => [item.label.trim(), item.expr])

  // 清楚payload中空的条目
  for (let i = payload.length - 1; i >= 0; i--) {
    if (payload[i]![0] === '' && payload[i]![1] === '') {
      payload.splice(i, 1)
    }
  }

  emit('update:modelValue', payload)
  emit('close')
}

const popoverRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  // 如果 popoverRef 存在，且点击的目标不在 popover 内部
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
  setTimeout(() => {
    window.addEventListener('click', handleClickOutside)
  }, 0)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="popover-container" ref="popoverRef">
    <div class="arrow"></div>

    <div class="input-wrapper">
      <div class="header">
        <span class="label">{{ title }}</span>
        <span class="red_label" v-show="hasInvalid">(无效)</span>
      </div>

      <div class="rows">
        <div class="row" v-for="(item, index) in localItems" :key="index">
          <input
            type="text"
            v-model="item.label"
            placeholder="标签"
            class="popover-input label-input"
          />
          <div class="expr-wrapper">
            <input
              type="text"
              v-model="item.expr"
              placeholder="表达式"
              class="popover-input expr-input"
              :ref="(el) => setExprRef(el as HTMLInputElement | null, index)"
              @input="validateExpr(index, item.expr)"
              @keyup.enter="commitAndClose"
            />
            <div class="warning-label" v-if="!isValid[index] && shouldShowWarning[index]">
              {{ errorMessages[index] }}
            </div>
          </div>
          <button class="btn-delete" @click="removeItem(index)">×</button>
        </div>
        <div v-if="localItems.length === 0">
          <span class="label">当前没有任何条目，点击“新增”添加。</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn-ghost add-button" @click="addItem">新增</button>
        <button class="btn-primary" @click="commitAndClose">保存</button>
        <button class="btn-ghost" @click="emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popover-container {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);

  background-color: var(--color-background);
  border: 1px solid var(--dnd-ink-primary);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  padding: 6px;
  border-radius: 6px;
  z-index: 100;
  min-width: 240px;
}

.arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--dnd-ink-primary) transparent transparent transparent;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.header {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.label {
  font-size: 0.75rem;
  color: var(--dnd-ink-secondary);
  white-space: nowrap;
}

.red_label {
  font-size: 0.75rem;
  color: var(--dnd-dragon-red);
  font-weight: bold;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.expr-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-input {
  text-align: center;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  background: whitesmoke;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  outline: none;
  font-size: 0.8rem;
  padding: 2px 4px;
}

.popover-input:focus {
  border-color: var(--dnd-dragon-red);
  background: white;
}

.label-input {
  width: 100px;
}

.expr-input {
  width: 120px;
}

.icon-button {
  border: 1px solid var(--dnd-ink-secondary);
  background: rgba(0, 0, 0, 0.05);
  color: var(--dnd-ink-primary);
  border-radius: 4px;
  font-size: 0.8rem;
  width: 24px;
  height: 24px;
  line-height: 22px;
  cursor: pointer;
}

.icon-button:hover {
  border-color: var(--dnd-dragon-red);
  color: var(--dnd-dragon-red);
}

.warning-label {
  font-size: 0.7rem;
  color: var(--dnd-ink-secondary);
  text-align: center;
  width: 120px;
  overflow-wrap: break-word;
  white-space: normal;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.btn-primary {
  flex: 1;
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-ghost {
  flex: 1;
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
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

.add-button {
  font-weight: bold;
}

.btn-delete {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 21px;
  height: 21px;
  padding: 0;
  line-height: 1;
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.5;
  text-align: center;
  transition: all 0.2s;
}
body.has-mouse .btn-delete:hover {
  color: var(--dnd-dragon-red);
  opacity: 1;
}
</style>
