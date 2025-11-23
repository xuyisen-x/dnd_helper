<template>
  <div class="auto-fit-wrapper">
    <span ref="textEl" class="auto-fit-text">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated, onBeforeUnmount } from 'vue'
import fitty from 'fitty'
import type { FittyInstance } from 'fitty'

interface Props {
  minSize?: number
  maxSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  minSize: 10,
  maxSize: 36,
})

const textEl = ref<HTMLElement | null>(null)
let fitIns: FittyInstance | null = null

const applyFit = () => {
  if (!textEl.value) return
  if (!fitIns) {
    // 首次初始化
    fitIns = fitty(textEl.value, {
      minSize: props.minSize,
      maxSize: props.maxSize,
    })
  } else {
    // 内容或尺寸变化时重新计算
    fitIns.fit()
  }
}

onMounted(() => {
  applyFit()
  window.addEventListener('resize', applyFit)
})

onUpdated(() => {
  applyFit()
})

onBeforeUnmount(() => {
  fitIns?.unsubscribe()
  fitIns = null
  window.removeEventListener('resize', applyFit)
})
</script>

<style scoped>
.auto-fit-wrapper {
  width: 100%;
  height: 100%;
}

.auto-fit-text {
  white-space: nowrap;
}
</style>
