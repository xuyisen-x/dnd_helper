<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  title: string
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change'): void // 可选：值改变并关闭后的回调
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// 打开逻辑
const openPopover = async () => {
  isOpen.value = true
}

// 关闭逻辑
const closePopover = () => {
  if (isOpen.value) {
    isOpen.value = false
    emit('change')
  }
}

// 点击外部自动关闭
onClickOutside(containerRef, closePopover)

// 输入处理 (保留原有类型)
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val: string = target.value

  emit('update:modelValue', val)
}
</script>

<template>
  <div
    class="trigger-btn"
    @click="openPopover"
    :title="`点击编辑 ${props.title}`"
    ref="containerRef"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon clickable">
      <path
        fill="currentColor"
        d="m232.49 55.51l-32-32a12 12 0 0 0-17 0l-96 96A12 12 0 0 0 84 128v32a12 12 0 0 0 12 12h32a12 12 0 0 0 8.49-3.51l96-96a12 12 0 0 0 0-16.98M192 49l15 15l-11 11l-15-15Zm-69 99h-15v-15l56-56l15 15Zm105-7.43V208a20 20 0 0 1-20 20H48a20 20 0 0 1-20-20V48a20 20 0 0 1 20-20h67.43a12 12 0 0 1 0 24H52v152h152v-63.43a12 12 0 0 1 24 0"
      />
    </svg>
    <Transition name="fade-up">
      <div v-if="isOpen" class="edit-popover">
        <div class="popover-arrow"></div>

        <label class="popover-label">{{ props.title }}</label>

        <textarea
          ref="inputRef"
          :value="modelValue"
          @input="handleInput"
          @keyup.enter="closePopover"
          class="popover-input"
          :placeholder="placeholder"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: middle;
}

/* --- 触发器按钮样式 --- */
.trigger-btn {
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
  justify-content: center;
  display: inline-flex;
  position: relative;
}

/* --- 气泡样式 --- */
.edit-popover {
  position: absolute;
  bottom: 100%; /* 显示在上方 */
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px; /* 距离触发器的间距 */
  background-color: var(--color-background);
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  padding: 8px;
  z-index: 100;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 小三角箭头 */
.popover-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background-color: var(--dnd-parchment-card);
  border-bottom: 1px solid var(--dnd-gold);
  border-right: 1px solid var(--dnd-gold);
}

.popover-label {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  text-align: center;
}

.popover-input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
  outline: none;

  width: 200px; /* 初始宽度 */
  height: 80px; /* 初始高度 */
}

.popover-input:focus {
  border-color: var(--dnd-dragon-red);
  background-color: #fff;
}

/* --- 动画 --- */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
