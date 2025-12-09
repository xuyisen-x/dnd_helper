<script setup lang="ts">
// import { computed } from 'vue'
// import { useActiveCharacterStore } from '@/stores/active-character'
// import type { Dnd5Data } from '@/stores/rules/dnd5'

// const store = useActiveCharacterStore()
// const sheet = computed({
//   get: () => store.data as Dnd5Data,
//   set: (val) => (store.data = val),
// })
</script>

<template>
  <div class="coin-panel">
    <div class="panel-body">TODO</div>
  </div>
</template>

<style scoped>
.coin-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}
</style>
