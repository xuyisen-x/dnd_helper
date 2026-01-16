<script setup lang="ts">
import FeatureList from './FeatureList.vue'
</script>

<template>
  <div class="class-features-panel">
    <div class="panel-header">
      <span class="label">职业特性</span>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-body">
      <FeatureList featureKey="class_features" />
    </div>
  </div>
</template>

<style scoped>
.class-features-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  height: 100%;
  box-sizing: border-box;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.label {
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  letter-spacing: 1px;
}

.panel-divider {
  height: 2px;
  background-color: var(--dnd-ink-primary);
  width: 100%;
  opacity: 0.8;
  flex-shrink: 0;
}

.panel-body {
  flex: 1;
  padding: 2px 2px;
  min-height: 0;
  overflow: auto;
}
</style>
