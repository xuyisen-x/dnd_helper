<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'

const { initDiceBox, canvasOpacity } = useDiceBox()
const isReady = ref(false)
onMounted(async () => {
  try {
    await initDiceBox('#dice-box-container')
    isReady.value = true
  } catch (error) {
    alert(error)
  }
})
</script>
<template>
  <div v-if="!isReady" class="loading-overlay">
    <div class="loading-content">
      <p>正在初始化……</p>
    </div>
  </div>
  <div
    id="dice-box-container"
    :style="{
      opacity: canvasOpacity,
      transition: 'opacity 0.5s ease-out',
    }"
  ></div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--dnd-parchment-bg);
  z-index: 20000; /* 高于骰子容器 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.loading-content {
  text-align: center;
  font-size: 3rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  font-family: 'Georgia', serif;
}
</style>

<style>
#dice-box-container {
  /* 永远固定铺满全屏 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;

  /* 层级高，不被阻挡，但是低于DiceRollerPanel */
  z-index: 9999;

  pointer-events: none;
  background-color: transparent;
}

#dice-box-container canvas {
  pointer-events: none;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
