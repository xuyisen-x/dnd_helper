<script setup lang="ts">
import { useDiceResultStore } from '@/stores/dice-result'
import { storeToRefs } from 'pinia'
import DiceResultToast from './DiceResultToast.vue'

const store = useDiceResultStore()
const { results } = storeToRefs(store)
const { removeResult } = store
</script>

<template>
  <div class="dice-result-container">
    <TransitionGroup name="slide-right">
      <DiceResultToast
        v-for="(item, index) in results"
        :key="item.id"
        :item="item"
        :is-expanded="index === 0"
        @close="removeResult(item.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.dice-result-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9990;

  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  pointer-events: none;
}

/* 让子元素恢复点击 */
.dice-result-container > * {
  pointer-events: auto;
}

/* 动画效果：右边进出 */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-right-move {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 进入前 / 离开后 */
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%); /* 向右飞出 */
}

/* 离开时脱离文档流，保证平滑补位 */
.slide-right-leave-active {
  position: absolute;
}
</style>
