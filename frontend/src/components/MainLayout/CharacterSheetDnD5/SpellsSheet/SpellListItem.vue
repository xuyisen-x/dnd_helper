<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useSpellStore } from '@/stores/rules/dnd5/spells'
import { getLevelLabel, getSchoolLabel } from '@/utils/dnd5/spellDisplay.ts'
import EditIcon from '@/components/Icons/EditIcon.vue'
import GearIcon from '@/components/Icons/GearIcon.vue'
import OtherInfoDialog from './OtherInfoDialog.vue'
import BinIcon from '@/components/Icons/BinIcon.vue'
import AddIcon from '@/components/Icons/AddIcon.vue'
import MinusIcon from '@/components/Icons/MinusIcon.vue'
import { confirmationBox } from '@/composables/useConfirmationBox'
import { useDiceBox } from '@/composables/useDiceBox'

const { foldAndCheckConstantsInteger } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { getSpell } = useSpellStore()

const props = defineProps<{
  listId: string
  index: number
  draggingIndex: number | null
  dragOverIndex: number | null
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', spell: Spell): void
  (e: 'drag-start'): void
  (e: 'drag-over'): void
  (e: 'drag-end'): void
  (e: 'drop'): void
}>()

// 1. 直接获取当前这一行法术的【响应式引用】
const spellItem = computed(() => {
  return sheet.value.spells.list.find((s) => s.id === props.listId)!.spells[props.index]!
})

// 2. 将基础数据拆分为纯净的小 computed
const spellData = computed(() => getSpell(spellItem.value.spell)[0])
const isCustom = computed(() => getSpell(spellItem.value.spell)[1])

// 3. 剥离极其耗时的计算
const freeUsageNumber = computed(() => {
  const folded = foldAndCheckConstantsInteger(spellItem.value.freeUsage)
  return folded[0] ? folded[1] : null
})

const containedFreeUsageNumberView = computed(() => {
  if (freeUsageNumber.value === null) return 0
  if (!spellItem.value.containedFreeUsage) return 0
  if (spellItem.value.containedFreeUsage < 0) return 0
  if (spellItem.value.containedFreeUsage > freeUsageNumber.value) return freeUsageNumber.value
  return spellItem.value.containedFreeUsage
})

// 4. 方法直接修改原始数据，Vue 会自动追踪
const addOne = () => {
  if (freeUsageNumber.value === null) return
  if (containedFreeUsageNumberView.value < freeUsageNumber.value) {
    spellItem.value.containedFreeUsage = containedFreeUsageNumberView.value + 1
  }
}

const minusOne = () => {
  if (containedFreeUsageNumberView.value > 0) {
    spellItem.value.containedFreeUsage = containedFreeUsageNumberView.value - 1
  }
}

const showAdd = computed(() => {
  return (
    freeUsageNumber.value !== null && containedFreeUsageNumberView.value < freeUsageNumber.value
  )
})

const showMinus = computed(() => {
  return freeUsageNumber.value !== null && containedFreeUsageNumberView.value > 0
})

const isEditing = ref<boolean>(false)

const deleteSpell = async () => {
  isEditing.value = false
  const spellList = sheet.value.spells.list.find((s) => s.id === props.listId)!.spells
  const spell = getSpell(spellList[props.index]!.spell)[0]
  const confirmed = await confirmationBox(
    '删除法术',
    `确定要删除法术「${spell.name}」吗？此操作不可撤销。`,
  )
  if (!confirmed) return
  spellList.splice(props.index, 1)
}

const saveSpellOtherInfo = (data: {
  freeUsage: string
  containedFreeUsage: number
  afterLongRest: string
  afterShortRest: string
  dontCount: boolean
}) => {
  isEditing.value = false
  const spellList = sheet.value.spells.list.find((s) => s.id === props.listId)!.spells
  const spellItem = spellList[props.index]!
  spellItem.freeUsage = data.freeUsage
  spellItem.containedFreeUsage = data.containedFreeUsage
  spellItem.afterLongRest = data.afterLongRest
  spellItem.afterShortRest = data.afterShortRest
  spellItem.dontCount = data.dontCount
}

const isNullorLessThanZero = (val: number | null): boolean => {
  return val === null || val <= 0
}
</script>

<template>
  <div
    class="spell-item grid-layout"
    @click="emit('select', spellData)"
    :class="{
      dragging: props.draggingIndex === props.index,
      'drag-target': props.dragOverIndex === props.index && draggingIndex !== null,
      active: props.selected,
    }"
    draggable="true"
    @dragstart="emit('drag-start')"
    @dragend="emit('drag-end')"
    @dragover.prevent="emit('drag-over')"
    @drop.prevent="emit('drop')"
  >
    <div class="col-drag">
      <div class="drag-handle" title="拖动排序">⠿</div>
    </div>
    <div
      class="filter-chip"
      @click.stop="
        () => {
          if (spellData.level === 0) return
          if (spellItem.dontCount) return
          spellItem.prepared = !spellItem.prepared
        }
      "
    >
      <div
        class="check-icon"
        :class="{
          disabled: spellData.level === 0,
          'dont-count': spellData.level !== 0 && spellItem.dontCount,
          checked: spellData.level !== 0 && !spellItem.dontCount && spellItem.prepared,
        }"
      >
        <svg
          v-if="spellData.level === 0 || spellItem.prepared || spellItem.dontCount"
          viewBox="0 0 24 24"
          class="svg-icon"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    <div class="col name">
      <span class="cn-name">{{ spellData.name }}</span>
      <span class="en-name">{{ spellData.english_name }}</span>
    </div>
    <div class="col center">{{ getLevelLabel(spellData.level) }}</div>
    <div class="col center">{{ getSchoolLabel(spellData.school) }}</div>
    <div class="col components">
      <span :class="{ enabled: spellData.need_verbal }">V</span>
      <span :class="{ enabled: spellData.need_somatic }">S</span>
      <span :class="{ enabled: !!spellData.material }">M</span>
    </div>
    <div class="col center">{{ spellData.is_ritual ? '√' : '×' }}</div>
    <div class="col center">{{ spellData.need_concentration ? '√' : '×' }}</div>
    <div v-if="isNullorLessThanZero(freeUsageNumber)"></div>
    <div class="col center" v-else>
      <div class="usage-meta">
        <span> {{ containedFreeUsageNumberView }} / {{ freeUsageNumber }}</span>
      </div>
      <div class="usage-actions">
        <div
          class="btn-icon"
          @click.stop="addOne()"
          :class="{
            'disable-button': !showAdd,
          }"
        >
          <add-icon class="clickable" title="+1" />
        </div>
        <div class="btn-icon" @click.stop="minusOne()" :class="{ 'disable-button': !showMinus }">
          <minus-icon class="clickable" title="-1" />
        </div>
      </div>
    </div>
    <div class="col" @click.stop>
      <input type="text" v-model="spellItem.notes" class="bare-input" placeholder="请输入备注" />
    </div>
    <div class="col btn-group">
      <div class="btn-icon" @click.stop v-if="isCustom">
        <gear-icon class="clickable" title="编辑法术内容本身" />
      </div>
      <div class="btn-icon" @click.stop="isEditing = true" v-if="spellData.level !== 0">
        <edit-icon class="clickable" title="编辑其他法术特性" />
      </div>
      <div class="btn-icon" @click.stop="deleteSpell()" v-else>
        <bin-icon class="clickable" title="删除法术" />
      </div>
    </div>
    <teleport to="body">
      <OtherInfoDialog
        v-if="isEditing"
        :after-long-rest="spellItem.afterLongRest"
        :after-short-rest="spellItem.afterShortRest"
        :free-usage="spellItem.freeUsage"
        :contained-free-usage="spellItem.containedFreeUsage"
        :dont-count="spellItem.dontCount"
        :name="spellData.name"
        @close="isEditing = false"
        @delete="deleteSpell()"
        @save="saveSpellOtherInfo"
      />
    </teleport>
  </div>
</template>

<style scoped>
.spell-item {
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  align-items: center;
  padding: 10px 12px;
  text-align: left;
}
.spell-item.active {
  border-color: var(--dnd-dragon-red);
  background: var(--dnd-parchment-card);
}
body.has-mouse .spell-item:hover {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 10px;
}
.check-icon {
  width: 18px;
  height: 18px;
  border-radius: 20%;
  border: 2px solid var(--dnd-stone-text);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.check-icon.checked {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
}
.check-icon.disabled {
  background-color: var(--dnd-stone-text);
  border-color: var(--dnd-stone-text);
  cursor: not-allowed;
}
.check-icon.dont-count {
  background-color: var(--dnd-magic-blue);
  border-color: var(--dnd-magic-blue);
  cursor: not-allowed;
}
.filter-chip {
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  user-select: none;
}

.svg-icon {
  stroke: var(--dnd-mithral-text);
  fill: none;
  stroke-width: 4;
}

.col {
  font-size: 1rem;
  color: var(--dnd-ink-primary);
}

.name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cn-name {
  font-weight: 700;
  color: var(--dnd-dragon-red);
  margin: 0;
  line-height: normal;
}
.en-name {
  font-style: italic;
  font-size: 13px;
  color: rgba(32, 24, 18, 0.7);
  margin: 0;
  line-height: normal;
}

.col-drag {
  display: flex;
  justify-content: center;
  align-items: center;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--dnd-ink-secondary);
  font-size: 1rem;
}

.spell-item.dragging {
  opacity: 0.6;
}

.spell-item.drag-target {
  border-color: var(--dnd-dragon-red);
  background-color: rgba(138, 28, 28, 0.05);
}

.col-header {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
}

.center {
  display: flex;
  justify-content: center;
  text-align: center;
}

.components {
  display: flex;
  gap: 6px;
  font-weight: 600;
  justify-content: center;
}

.components span {
  opacity: 0.3;
}

.components span.enabled {
  opacity: 1;
}

.bare-input {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.bare-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
  font-weight: normal;
  font-size: 0.85rem;
}

.btn-icon {
  color: var(--dnd-ink-primary);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-group {
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: flex-end;
}

.hidden-button {
  visibility: hidden;
}

.usage-actions {
  display: flex;
  flex-direction: column;
}

.usage-meta {
  display: flex;
  align-items: center;
  margin-right: 2px;
}

.disable-button {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
