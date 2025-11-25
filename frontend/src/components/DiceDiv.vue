<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'

const { initDiceBox, canvasOpacity } = useDiceBox()
onMounted(async () => {
  await initDiceBox('#dice-box-container')
  console.log('DiceBox initialized')
})
</script>
<template>
  <div
    id="dice-box-container"
    :style="{
      opacity: canvasOpacity,
      transition: 'opacity 0.5s ease-out',
    }"
  ></div>
</template>

<style>
#dice-box-container {
  /* 永远固定铺满全屏 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;

  /* 层级最高，不被阻挡 */
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
