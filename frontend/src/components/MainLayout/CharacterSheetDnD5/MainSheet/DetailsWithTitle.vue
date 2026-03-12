<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
interface Props {
  details: string
  title: string
}
const props = defineProps<Props>()
const emit = defineEmits(['close'])
const popoverRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="feature-description-popover" ref="popoverRef">
    <div class="arrow"></div>
    <div class="popover-title">{{ props.title }}</div>
    <div class="popover-body" v-html="props.details || '<p>暂无描述。</p>'"></div>
  </div>
</template>

<style scoped>
.feature-description-popover {
  min-width: 220px;
  max-width: 320px;
  background-color: var(--color-background);
  border: 1px solid var(--dnd-ink-primary);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  padding: 6px;
  border-radius: 6px;
  z-index: 100;
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

.popover-title {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  margin-bottom: 6px;
}

.popover-body {
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
  line-height: 1.4;
  white-space: pre-wrap;
}
</style>
