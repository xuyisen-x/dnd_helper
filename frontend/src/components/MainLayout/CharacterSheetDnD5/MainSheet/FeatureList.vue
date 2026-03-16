<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import FeatureItem from './FeatureItem.vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { nanoid } from 'nanoid'
import { VueDraggable } from 'vue-draggable-plus'

interface Props {
  featureKey: 'class_features' | 'race_features' | 'feat'
}

const props = defineProps<Props>()
const store = useActiveCharacterStore()

const targetFeatures = computed({
  // 读取时触发
  get: () => {
    const data = store.data as Dnd5Data
    return data.features[props.featureKey]
  },
  // 赋值时触发（例如 v-model 修改了值）
  set: (newValue) => {
    const data = store.data as Dnd5Data
    // 将新值写回 store
    data.features[props.featureKey] = newValue
  },
})

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
    <VueDraggable
      v-model="targetFeatures"
      :animation="150"
      handle=".drag-handle"
      ghost-class="ghost-item"
      class="feature-items"
    >
      <FeatureItem
        v-for="(feature, index) in targetFeatures"
        :key="feature.id"
        :featureKey="props.featureKey"
        :index="index"
      />
    </VueDraggable>
    <div v-if="targetFeatures.length === 0" class="empty-tip">点击下方按钮添加</div>
    <div class="feature-footer">
      <button class="btn-add" @click="addFeature">+ 添加特性</button>
    </div>
  </div>
</template>

<style scoped>
.feature-list {
  margin: 0 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: auto;
}

.feature-items {
  display: flex;
  flex-direction: column;
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

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
