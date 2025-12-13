<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { check_constant_integer } from '@/wasm_utils/dice/pkg/dice_roller'
import { specificMacroReplace } from '@/composables/useDiceBox'

const props = withDefaults(defineProps<{ modelValue: string; title?: string }>(), {
  title: '额外调整',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const localValue = ref(props.modelValue)
const initValue = props.modelValue

const errorMessage = ref<string>('')
const isCurrentInputValid = ref<boolean>(true)
const shouldShowWarning = ref<boolean>(false)
let warningTimeout: number | null = null
const WARNING_DELAY_MS = 2000

const validateInput = (input: string) => {
  if (warningTimeout) {
    clearTimeout(warningTimeout)
    warningTimeout = null
  }
  shouldShowWarning.value = false

  // 延迟显示警告信息，避免输入时频繁闪烁
  warningTimeout = setTimeout(() => {
    shouldShowWarning.value = true
  }, WARNING_DELAY_MS)

  if (input.trim() === '') {
    // 允许空输入
    isCurrentInputValid.value = true
    errorMessage.value = ''
    return
  }
  try {
    // 1. 进行宏替换
    const replaced = specificMacroReplace(input)
    // 2. 检查是否为常量整数
    const evalResult = check_constant_integer(replaced)
    if (evalResult.result === 'Constant') {
      isCurrentInputValid.value = true
      errorMessage.value = ''
    } else {
      isCurrentInputValid.value = false
      errorMessage.value = evalResult.value
    }
  } catch (e) {
    isCurrentInputValid.value = false
    if (e instanceof Error) {
      errorMessage.value = e.message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ('message' in (e as any)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessage.value = (e as any).message
    } else {
      errorMessage.value = '未知错误'
    }
  }
}

onMounted(() => {
  validateInput(localValue.value)
  inputRef.value?.focus()
  inputRef.value?.select()
})

// 3. 关闭并提交
const commitAndClose = () => {
  const finalString = isCurrentInputValid.value ? localValue.value : initValue
  const clearString = finalString.replace(/\s/g, '')

  // 发送更新事件
  emit('update:modelValue', clearString)
  // 发送关闭事件
  emit('close')
}
</script>

<template>
  <div class="popover-container">
    <div class="arrow"></div>

    <div class="input-wrapper">
      <div>
        <span class="label">{{ title }}</span>
        <span class="red_label" v-show="!isCurrentInputValid">(无效)</span>
      </div>
      <input
        ref="inputRef"
        type="text"
        v-model="localValue"
        @input="validateInput(localValue)"
        @blur="commitAndClose"
        @keyup.enter="commitAndClose"
        class="popover-input"
      />
      <div class="warning-label" v-if="!isCurrentInputValid && shouldShowWarning">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
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
  min-width: 80px;
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
  align-items: center;
  gap: 2px;
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
  margin-left: 2px;
}

.popover-input {
  width: 150px;
  text-align: center;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  font-weight: bold;
  color: var(--dnd-ink-primary);
  outline: none;
  font-size: 0.8rem;
}
.popover-input:focus {
  border-color: var(--dnd-dragon-red);
  background: white;
}

.warning-label {
  font-size: 0.7rem;
  color: var(--dnd-ink-secondary);
  text-align: center;
  white-space: nowrap;
  width: 120px;
  overflow-wrap: break-word;
  white-space: normal;
  /* word-break: break-all; */
}
</style>
