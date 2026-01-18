<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useDnd5Logic, type EquipmentViewDnd5 } from '@/composables/rules/useDnd5Logic'
import EditIcon from '@/components/Icons/EditIcon.vue'
import FileTextIcon from '@/components/Icons/FileTextIcon.vue'
import AddIcon from '@/components/Icons/AddIcon.vue'
import MinusIcon from '@/components/Icons/MinusIcon.vue'
import DetailsWithTitle from './DetailsWithTitle.vue'
import EquipmentEditor from './EquipmentEditor.vue'

const props = defineProps<{
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
const equipmentView = computed(() => {
  const { equipmentView } = useDnd5Logic(sheet)
  return equipmentView.value[props.index] as EquipmentViewDnd5
})

const isDescriptionOpen = ref(false)
const isEditOpen = ref(false)

const descriptionAnchor = ref<HTMLElement | null>(null)
const popoverPos = ref({ top: 0, left: 0 })

// 虽然正无穷不会被展示，但是还是处理一下以防万一
const chargeLimitLabel = computed(() =>
  equipmentView.value.displayLimit === Infinity ? '∞' : String(equipmentView.value.displayLimit),
)
const remainingLabel = computed(() =>
  equipmentView.value.displayLimit === Infinity ? '∞' : String(equipmentView.value.displayCharges),
)

const showAdd = computed(() => {
  if (equipmentView.value.displayLimit === Infinity) return false
  return equipmentView.value.displayCharges < equipmentView.value.displayLimit
})

const showMinus = computed(() => {
  if (equipmentView.value.displayLimit === Infinity) return false
  return equipmentView.value.displayCharges > 0
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
  if (equipmentView.value.displayLimit === Infinity) return
  equipmentView.value.setCharges(equipmentView.value.displayCharges + 1)
}

const subtractOneUsage = () => {
  if (equipmentView.value.displayLimit === Infinity) return
  equipmentView.value.setCharges(Math.max(equipmentView.value.displayCharges - 1, 0))
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
    <div
      title="同调"
      class="circle-check clickable"
      :class="{ checked: equipmentView.attunement }"
      @click="equipmentView.toggleAttunement()"
    ></div>
    <div class="feature-main">
      <div class="feature-name" :class="{ empty: equipmentView.quantity === 0 }">
        {{ equipmentView.name || '未命名物品' }}
      </div>
      <span class="quantity-badge" title="调整数量">
        <span class="qty-text" v-if="equipmentView.quantity != 1"
          >×{{ equipmentView.quantity }}</span
        >

        <span class="qty-controls">
          <span
            class="qty-btn clickable"
            @click.stop="equipmentView.changeQuantity(1)"
            title="+1数量"
            >▲</span
          >
          <span
            class="qty-btn clickable"
            @click.stop="equipmentView.changeQuantity(-1)"
            title="-1数量"
            >▼</span
          >
        </span>
      </span>
    </div>
    <div class="feature-meta" :class="{ 'hidden-button': equipmentView.displayLimit === Infinity }">
      <span> {{ remainingLabel }} / {{ chargeLimitLabel }}</span>
    </div>
    <div class="feature-actions">
      <div class="btn-icon" @click="addOneUsage" :class="{ 'hidden-button': !showAdd }">
        <add-icon class="clickable" title="+1充能" />
      </div>
      <div class="btn-icon" @click="subtractOneUsage" :class="{ 'hidden-button': !showMinus }">
        <minus-icon class="clickable" title="-1充能" />
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
          :details="equipmentView.description"
          :title="(equipmentView.name || '未命名物品') + '详细信息'"
          @close="isDescriptionOpen = false"
        />
      </teleport>
    </div>

    <teleport to="body">
      <EquipmentEditor v-if="isEditOpen" :index="props.index" @close="isEditOpen = false" />
    </teleport>
  </div>
</template>

<style scoped>
.feature-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto auto;
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
  flex-direction: row;
  gap: 4px;
}

.feature-name {
  color: var(--dnd-ink-primary);
}
.feature-name.empty {
  font-style: italic;
  text-decoration: line-through;
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

.circle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 50%;
}
.circle-check.checked {
  background-color: var(--dnd-ink-primary);
}
body.has-mouse .circle-check:hover {
  border-color: var(--dnd-dragon-red);
}
body.has-mouse .circle-check.checked:hover {
  background-color: var(--dnd-dragon-red);
}

.quantity-badge {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
  color: var(--dnd-ink-secondary);
}

.qty-text {
  margin-right: 4px;
  font-weight: bold;
}

.qty-controls {
  display: flex;
  flex-direction: row;
  gap: 2px;
  line-height: 0.6;
}

.qty-btn {
  user-select: none;
}
</style>
