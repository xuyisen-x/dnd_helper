<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDnd5rLogic } from '@/composables/rules/useDnd5rLogic'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const props = defineProps<{ modelValue: string }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { isValidStringWithVariables } = useDnd5rLogic(sheet)

const inputRef = ref<HTMLInputElement | null>(null)

const localValue = ref(props.modelValue)
const initValue = props.modelValue

const isCurrentInputValid = computed(() => isValidStringWithVariables(localValue.value))

onMounted(() => {
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
        <span class="label">额外调整</span>
        <span class="red_label" v-show="!isCurrentInputValid">(无效)</span>
      </div>
      <input
        ref="inputRef"
        type="text"
        v-model="localValue"
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
</style>
