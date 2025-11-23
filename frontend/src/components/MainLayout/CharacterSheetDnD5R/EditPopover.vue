<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatWithSign } from '@/composables/rules/useDnd5rLogic'

const props = defineProps<{ modelValue: number }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'close'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const localValue = ref(formatWithSign(props.modelValue))

onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value

  // 初步清洗，只保留数字和符号
  val = val.replace(/[^\d-+]/g, '')

  // 进一步处理：只允许开头有一个符号，其余位置的符号都删除
  val = val.replace(/[-+]/g, (match, offset) => (offset === 0 ? match : ''))

  // 限制数字部分位数
  // 检测是否有符号开头
  const hasSign = /^[-+]/.test(val)
  const sign = hasSign ? val[0] : '' // 分割出符号部分
  const numPart = hasSign ? val.slice(1) : val // 分割出数字部分
  val = sign + (numPart.length > 2 ? numPart.slice(0, 2) : numPart) // 限制最大两位数

  // 更新本地显示
  localValue.value = val
  target.value = val // 强制回填，防止非数字字符显示在框里
}

// 3. 关闭并提交
const commitAndClose = () => {
  let finalNum = Number(localValue.value)

  if (isNaN(finalNum)) {
    finalNum = 0
  }

  // 发送更新事件
  emit('update:modelValue', finalNum)
  // 发送关闭事件
  emit('close')
}
</script>

<template>
  <div class="popover-container">
    <div class="arrow"></div>

    <div class="input-wrapper">
      <span class="label">额外调整</span>
      <input
        ref="inputRef"
        type="text"
        inputmode="numeric"
        :value="localValue"
        @input="handleInput"
        @blur="commitAndClose"
        @keyup.enter="commitAndClose"
        class="popover-input"
      />
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
  font-size: 0.6rem;
  color: var(--dnd-ink-secondary);
  white-space: nowrap;
}

.popover-input {
  width: 50px;
  text-align: center;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  font-weight: bold;
  color: var(--dnd-ink-primary);
  outline: none;
}
.popover-input:focus {
  border-color: var(--dnd-dragon-red);
  background: white;
}
</style>
