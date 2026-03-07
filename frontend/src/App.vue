<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import DiceDiv from './components/Common/DiceDiv.vue'
import DiceRollerPanel from './components/Common/DiceRollerPanel.vue'
import ToastContainer from './components/Common/ToastContainer.vue'
import DiceResultContainer from './components/Common/DiceResultContainer.vue'
import ConfirmationDialog from './components/Common/ConfirmationDialog.vue'
import { isUsingMouse } from './composables/useGlobalState'

const enableHover = (e: PointerEvent) => {
  // 说明移动了鼠标
  if (!isUsingMouse.value && e.pointerType === 'mouse') {
    isUsingMouse.value = true
    document.body.classList.add('has-mouse')
  }
}

const disableHover = () => {
  // 说明使用了触控屏
  if (isUsingMouse.value) {
    isUsingMouse.value = false
    document.body.classList.remove('has-mouse')
  }
}

onMounted(() => {
  if (isUsingMouse.value) {
    document.body.classList.add('has-mouse')
  }
  // 鼠标移动 -> 认为是鼠标操作
  window.addEventListener('pointermove', enableHover, { passive: true })
  // 触摸开始 -> 认为是触屏操作
  window.addEventListener('touchstart', disableHover, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('pointermove', enableHover)
  window.removeEventListener('touchstart', disableHover)
})
</script>

<template>
  <DiceDiv />
  <DiceRollerPanel />
  <DiceResultContainer />
  <ToastContainer />
  <ConfirmationDialog />
  <router-view />
</template>

<style>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
::-webkit-scrollbar-thumb {
  background-color: var(--dnd-ink-secondary);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
body.has-mouse ::-webkit-scrollbar-thumb:hover {
  background-color: var(--dnd-dragon-red);
}
</style>
