<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useDnd5Logic, type FeatureViewDnd5 } from '@/composables/rules/useDnd5Logic'
import DetailsWithTitle from './DetailsWithTitle.vue'
import FeatureEditor from './FeatureEditor.vue'
import EditIcon from '@/components/Icons/EditIcon.vue'
import FileTextIcon from '@/components/Icons/FileTextIcon.vue'
import AddIcon from '@/components/Icons/AddIcon.vue'
import MinusIcon from '@/components/Icons/MinusIcon.vue'

const props = defineProps<{
  featureKey: 'class_features' | 'race_features' | 'feat'
  index: number
  draggingIndex: number | null
  dragOverIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'drag-start', index: number): void
  (e: 'drag-over', index: number): void
  (e: 'drop', index: number): void
  (e: 'drag-end'): void
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})
const featureView = computed(() => {
  const view = (() => {
    switch (props.featureKey) {
      case 'class_features':
        const { classFeaturesView } = useDnd5Logic(sheet)
        return classFeaturesView
      case 'race_features':
        const { raceFeaturesView } = useDnd5Logic(sheet)
        return raceFeaturesView
      case 'feat':
        const { featFeaturesView } = useDnd5Logic(sheet)
        return featFeaturesView
    }
  })()
  return view.value[props.index] as FeatureViewDnd5
})

const isDescriptionOpen = ref(false)
const isEditOpen = ref(false)

const descriptionAnchor = ref<HTMLElement | null>(null)
const popoverPos = ref({ top: 0, left: 0 })

// 虽然正无穷不会被展示，但是还是处理一下以防万一
const usageLimitLabel = computed(() =>
  featureView.value.displayLimit === Infinity ? '∞' : String(featureView.value.displayLimit),
)
const remainingLabel = computed(() =>
  featureView.value.displayLimit === Infinity ? '∞' : String(featureView.value.displayCount),
)

const showAdd = computed(() => {
  if (featureView.value.displayLimit === Infinity) return false
  return featureView.value.displayCount < featureView.value.displayLimit
})

const showMinus = computed(() => {
  if (featureView.value.displayLimit === Infinity) return false
  return featureView.value.displayCount > 0
})

const updatePopoverPosition = () => {
  const el = descriptionAnchor.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  popoverPos.value = {
    top: rect.top - 8,
    left: rect.left + rect.width / 2,
  }
}

const popoverStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
  transform: 'translate(-50%, -100%)',
}))

const toggleDescription = (event: MouseEvent) => {
  descriptionAnchor.value = event.currentTarget as HTMLElement | null
  isDescriptionOpen.value = !isDescriptionOpen.value
  if (isDescriptionOpen.value) updatePopoverPosition()
}

const addOneUsage = () => {
  if (featureView.value.displayLimit === Infinity) return
  featureView.value.setCount(featureView.value.displayCount + 1)
}

const subtractOneUsage = () => {
  if (featureView.value.displayLimit === Infinity) return
  featureView.value.setCount(Math.max(featureView.value.displayCount - 1, 0))
}

const handlePopoverUpdate = () => updatePopoverPosition()

watch(isDescriptionOpen, (isOpen) => {
  if (isOpen) {
    window.addEventListener('scroll', handlePopoverUpdate, true)
    window.addEventListener('resize', handlePopoverUpdate)
  } else {
    window.removeEventListener('scroll', handlePopoverUpdate, true)
    window.removeEventListener('resize', handlePopoverUpdate)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handlePopoverUpdate, true)
  window.removeEventListener('resize', handlePopoverUpdate)
})
</script>

<template>
  <div
    class="feature-item"
    :class="{
      dragging: draggingIndex === index,
      'drag-target': dragOverIndex === index && draggingIndex !== null,
    }"
    draggable="true"
    @dragstart="emit('drag-start', index)"
    @dragover.prevent="emit('drag-over', index)"
    @drop.prevent="emit('drop', index)"
    @dragend="emit('drag-end')"
  >
    <div class="drag-handle" title="拖动排序">⠿</div>
    <div class="feature-main">
      <div class="feature-name">{{ featureView.name || '未命名特性' }}</div>
    </div>
    <div class="feature-meta" :class="{ 'hidden-button': featureView.displayLimit === Infinity }">
      <span> {{ remainingLabel }} / {{ usageLimitLabel }}</span>
    </div>
    <div class="feature-actions">
      <div class="btn-icon" @click="addOneUsage" :class="{ 'hidden-button': !showAdd }">
        <add-icon class="clickable" title="+1" />
      </div>
      <div class="btn-icon" @click="subtractOneUsage" :class="{ 'hidden-button': !showMinus }">
        <minus-icon class="clickable" title="-1" />
      </div>
    </div>
    <div class="feature-actions">
      <div class="btn-icon" @click="toggleDescription">
        <file-text-icon class="clickable" title="详情" />
      </div>
      <div class="btn-icon" @click="isEditOpen = true">
        <edit-icon class="clickable" title="编辑" />
      </div>

      <teleport to="body">
        <DetailsWithTitle
          v-if="isDescriptionOpen"
          :style="popoverStyle"
          :details="featureView.description"
          :title="(featureView.name || '未命名特性') + '详细信息'"
          @close="isDescriptionOpen = false"
        />
      </teleport>
    </div>

    <teleport to="body">
      <FeatureEditor
        v-if="isEditOpen"
        :index="props.index"
        :feature-key="props.featureKey"
        @close="isEditOpen = false"
      />
    </teleport>
  </div>
</template>

<style scoped>
.feature-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1); /* 淡淡的分割线 */
  padding: 4px 0;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.feature-item.dragging {
  opacity: 0.6;
}

.feature-item.drag-target {
  border-color: var(--dnd-dragon-red);
  background-color: rgba(138, 28, 28, 0.05);
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--dnd-ink-secondary);
  font-size: 1rem;
}

.feature-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-name {
  color: var(--dnd-ink-primary);
}

.feature-meta {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
}

.feature-actions {
  display: flex;
  flex-direction: row;
}

.btn-icon {
  color: var(--dnd-ink-primary);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-button {
  visibility: hidden;
}
</style>
