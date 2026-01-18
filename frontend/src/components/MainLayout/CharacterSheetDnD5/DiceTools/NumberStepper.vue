<script setup lang="ts">
const props = defineProps<{
  modelValue: number // 绑定的数值
}>()

const emit = defineEmits(['update:modelValue'])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let val = target.value
  val = val.replace(/[^\d]/g, '')
  const numericValue = val === '' ? 0 : parseInt(val, 10)
  if (target.value !== val) {
    target.value = val
  }
  emit('update:modelValue', numericValue)
}

const handleBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value === '') {
    target.value = '0'
    emit('update:modelValue', 0)
  }
}

const increment = () => {
  emit('update:modelValue', props.modelValue + 1)
}

const decrement = () => {
  if (props.modelValue > 0) {
    emit('update:modelValue', props.modelValue - 1)
  }
}
</script>

<template>
  <div class="number-spinner">
    <input
      type="text"
      class="spinner-input"
      :value="modelValue"
      @input="handleInput"
      @blur="handleBlur"
      inputmode="numeric"
    />

    <div class="spinner-controls">
      <button class="spin-btn up" @click.prevent="increment" tabindex="-1">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" fill="currentColor" />
        </svg>
      </button>

      <button class="spin-btn down" @click.prevent="decrement" tabindex="-1">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.number-spinner {
  display: inline-flex;
  align-items: center;
  overflow: hidden; /* 保证圆角 */
  height: 100%;
  width: 80%;
}

.spinner-input {
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  text-align: center;
  font-family: inherit;
  font-weight: bold;
  font-size: 1rem;
  color: var(--dnd-ink-primary, #000);
  outline: none;
  padding: 0 4px;
}

/* 按钮容器：垂直排列 */
.spinner-controls {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--dnd-ink-secondary, #5c4033);
  width: 24px;
  height: 100%;
  flex-shrink: 0;
}

.spin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1; /* 平分高度 */
  border: none;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  color: var(--dnd-ink-primary, #000);
  padding: 0;
  transition: background 0.2s;
  height: 45%;
}

.spin-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.spin-btn:active {
  background: rgba(0, 0, 0, 0.2);
}

.spin-btn.up {
  border-bottom: 1px solid var(--dnd-ink-secondary, #5c4033);
}
</style>
