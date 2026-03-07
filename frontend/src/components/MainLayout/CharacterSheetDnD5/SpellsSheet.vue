<script setup lang="ts">
import SpellSlotsPanel from './SpellsSheet/SpellSlotsPanel.vue'
import SpellTablesPanel from './SpellsSheet/SpellTablesPanel.vue'
</script>

<template>
  <div class="spells-sheet">
    <SpellSlotsPanel />
    <SpellTablesPanel />
  </div>
</template>

<style scoped>
.spells-sheet {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
