<script setup lang="ts">
import { ref } from 'vue'
import type { FeatureDnd5 } from '@/stores/rules/dnd5'
import FeatureItem from './FeatureItem.vue'

const props = defineProps<{
  features: FeatureDnd5[]
}>()

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleDragStart = (index: number) => {
  draggingIndex.value = index
}

const handleDragOver = (index: number) => {
  if (draggingIndex.value === null || draggingIndex.value === index) return
  dragOverIndex.value = index
}

const handleDragEnd = () => {
  draggingIndex.value = null
  dragOverIndex.value = null
}

const handleDrop = (index: number) => {
  if (draggingIndex.value === null) return
  const from = draggingIndex.value
  if (from === index) return handleDragEnd()
  const [moved] = props.features.splice(from, 1)
  props.features.splice(index, 0, moved)
  handleDragEnd()
}

const addFeature = () => {
  props.features.push({
    name: '',
    description: '',
    usageLimit: '',
    usageCount: 0,
    afterShortRest: '',
    afterLongRest: '',
  })
}
</script>

<template>
  <div class="feature-list">
    <div class="feature-items">
      <FeatureItem
        v-for="(feature, index) in features"
        :key="index"
        :feature="feature"
        :index="index"
        :dragging-index="draggingIndex"
        :drag-over-index="dragOverIndex"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drag-end="handleDragEnd"
        @drop="handleDrop"
      />
    </div>
    <div v-if="features.length === 0" class="empty-tip">暂无特性，点击下方按钮添加。</div>
    <div class="feature-footer">
      <button class="btn-add" @click="addFeature">+ 新增特性</button>
    </div>
  </div>
</template>

<style scoped>
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.feature-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.feature-footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.btn-add {
  background: transparent;
  border: 1px dashed var(--dnd-ink-secondary);
  color: var(--dnd-ink-secondary);
  padding: 6px 15px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s;
}

body.has-mouse .btn-add:hover {
  border-style: solid;
  color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.05);
}

.empty-tip {
  text-align: center;
  color: var(--dnd-ink-secondary);
  font-style: italic;
  padding: 8px 0 4px;
  opacity: 0.7;
}
</style>
