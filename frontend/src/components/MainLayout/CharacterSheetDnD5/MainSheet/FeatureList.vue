<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import FeatureItem from './FeatureItem.vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { nanoid } from 'nanoid'

interface Props {
  featureKey: 'class_features' | 'race_features' | 'feat'
}

const props = defineProps<Props>()
const store = useActiveCharacterStore()

const targetFeatures = computed(() => {
  const data = store.data as Dnd5Data
  return data.features[props.featureKey]
})

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
  const [moved] = targetFeatures.value.splice(from, 1)
  if (moved) {
    targetFeatures.value.splice(index, 0, moved)
  }
  handleDragEnd()
}

const addFeature = () => {
  targetFeatures.value.push({
    id: nanoid(),
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
        v-for="(feature, index) in targetFeatures"
        :key="feature.id"
        :featureKey="props.featureKey"
        :index="index"
        :dragging-index="draggingIndex"
        :drag-over-index="dragOverIndex"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drag-end="handleDragEnd"
        @drop="handleDrop"
      />
    </div>
    <div v-if="targetFeatures.length === 0" class="empty-tip">点击下方按钮添加</div>
    <div class="feature-footer">
      <button class="btn-add" @click="addFeature">+ 添加特性</button>
    </div>
  </div>
</template>

<style scoped>
.feature-list {
  margin: 5px 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: auto;
}

.feature-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
