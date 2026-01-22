<script setup lang="ts">
import RuleToggleButton from './Common/RuleToggleButton.vue'
</script>

<template>
  <div class="glossary-list">
    <header class="header">
      <div class="title">
        <h1>术语速查表</h1>
        <RuleToggleButton />
      </div>
    </header>

    <div>TODO</div>
  </div>
</template>

<style scoped>
.spell-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  display: flex;
  align-items: center;
  justify-items: center;
  justify-content: space-between;
}

.title h1 {
  margin: 0;
  font-size: 32px;
  color: var(--dnd-dragon-red);
}
</style>
