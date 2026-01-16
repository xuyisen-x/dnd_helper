<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { FeatureDnd5 } from '@/stores/rules/dnd5'

const props = defineProps<{
  feature: FeatureDnd5
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

const isDescriptionOpen = ref(false)
const isEditOpen = ref(false)
const editDraft = ref<FeatureDnd5>({
  name: '',
  description: '',
  usageLimit: '',
  usageCount: 0,
  afterShortRest: '',
  afterLongRest: '',
})

const descriptionAnchor = ref<HTMLElement | null>(null)
const popoverPos = ref({ top: 0, left: 0 })

const usageLimitLabel = computed(() =>
  props.feature.usageLimit?.trim() ? props.feature.usageLimit : '无限制',
)
const remainingLabel = computed(() =>
  props.feature.usageLimit?.trim() ? String(props.feature.usageCount) : '∞',
)

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
  position: 'fixed',
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
  transform: 'translate(-50%, -100%)',
}))

const toggleDescription = (event: MouseEvent) => {
  descriptionAnchor.value = event.currentTarget as HTMLElement | null
  isDescriptionOpen.value = !isDescriptionOpen.value
  if (isDescriptionOpen.value) updatePopoverPosition()
}

const openEditDialog = () => {
  editDraft.value = { ...props.feature }
  isEditOpen.value = true
}

const closeEditDialog = () => {
  isEditOpen.value = false
}

const saveEditDialog = () => {
  Object.assign(props.feature, editDraft.value)
  isEditOpen.value = false
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
      <div class="feature-name">{{ feature.name || '未命名特性' }}</div>
      <div class="feature-meta">
        <span>使用限制：{{ usageLimitLabel }}</span>
        <span>剩余：{{ remainingLabel }}</span>
      </div>
    </div>
    <div class="feature-actions">
      <button class="btn-ghost" @click="toggleDescription">详情</button>
      <button class="btn-ghost" @click="openEditDialog">编辑</button>
      <teleport to="body">
        <div
          v-if="isDescriptionOpen"
          class="feature-description-popover"
          :style="popoverStyle"
          @click.stop
        >
          <div class="popover-title">特性描述</div>
          <div class="popover-body">
            {{ feature.description || '暂无描述。' }}
          </div>
        </div>
      </teleport>
    </div>

    <teleport to="body">
      <div v-if="isEditOpen" class="feature-dialog-mask" @click.self="closeEditDialog">
        <div class="feature-dialog">
          <div class="dialog-header">编辑特性</div>
          <div class="dialog-body">
            <label class="dialog-field">
              <span>名称</span>
              <input v-model="editDraft.name" type="text" placeholder="特性名称" />
            </label>
            <label class="dialog-field">
              <span>使用限制</span>
              <input v-model="editDraft.usageLimit" type="text" placeholder="例如：每短休 1 次" />
            </label>
            <label class="dialog-field">
              <span>剩余使用次数</span>
              <input v-model.number="editDraft.usageCount" type="number" min="0" />
            </label>
            <label class="dialog-field">
              <span>短休恢复</span>
              <input v-model="editDraft.afterShortRest" type="text" placeholder="例如：恢复 1" />
            </label>
            <label class="dialog-field">
              <span>长休恢复</span>
              <input v-model="editDraft.afterLongRest" type="text" placeholder="例如：恢复全部" />
            </label>
            <label class="dialog-field">
              <span>特性描述</span>
              <textarea v-model="editDraft.description" rows="4" placeholder="填写特性描述"></textarea>
            </label>
          </div>
          <div class="dialog-actions">
            <button class="btn-ghost" @click="closeEditDialog">取消</button>
            <button class="btn-primary" @click="saveEditDialog">保存</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.feature-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.5);
  transition: background-color 0.2s, border-color 0.2s;
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
  font-weight: 700;
  color: var(--dnd-ink-primary);
}

.feature-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
}

.feature-actions {
  display: flex;
  gap: 6px;
  position: relative;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.75rem;
  color: var(--dnd-ink-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

body.has-mouse .btn-ghost:hover {
  color: var(--dnd-ink-primary);
  border-color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.04);
}

.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-dragon-red-hover);
}

.feature-description-popover {
  min-width: 220px;
  max-width: 320px;
  background: var(--dnd-parchment-bg);
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  padding: 10px;
  z-index: 3000;
}

.popover-title {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  margin-bottom: 6px;
}

.popover-body {
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
  line-height: 1.4;
  white-space: pre-wrap;
}

.feature-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
}

.feature-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  padding: 16px 20px;
  width: min(520px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  margin-bottom: 12px;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
}

.dialog-field input,
.dialog-field textarea {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--dnd-ink-primary);
}

.dialog-field input:focus,
.dialog-field textarea:focus {
  outline: none;
  border-color: var(--dnd-dragon-red);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
