<script setup lang="ts">
defineProps<{
  label: string
  total: number
  used: number
}>()

const emit = defineEmits<{
  (e: 'click-marker', index: number): void
}>()
</script>

<template>
  <div class="slot-item">
    <div class="slot-level">{{ label }}</div>

    <div class="slot-markers">
      <div
        v-for="i in total"
        :key="i"
        class="slot-marker"
        :class="{
          active: used < i,
          shadow: used >= i,
        }"
        @click="emit('click-marker', i - 1)"
      ></div>
      <div v-if="total === 0" class="slot-empty">—</div>
    </div>
  </div>
</template>

<style scoped>
.slot-item {
  display: flex;
  flex-direction: row;
  gap: 16px;
  position: relative;
}

.slot-level {
  font-size: 1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.slot-markers {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row-reverse;
  gap: 6px;
  align-items: center;
}

.slot-marker {
  width: 12px;
  height: 12px;
  border: 2px solid var(--dnd-stone-text);
  transform: rotate(45deg);
  background: var(--dnd-mithral-text);
  transition:
    background-color 0.2s,
    border-color 0.2s,
    transform 0.2s;
  cursor: pointer;
}

.slot-marker.active {
  background: var(--dnd-dragon-red-hover);
  border-color: var(--dnd-dragon-red);
}

.slot-marker.shadow {
  background: rgba(202, 210, 255, 0.35);
  opacity: 0.5;
}

body.has-mouse .slot-marker:hover {
  transform: none;
}

.slot-empty {
  color: var(--dnd-ink-secondary);
  font-size: 0.9rem;
}
</style>
