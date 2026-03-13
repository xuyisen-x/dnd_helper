<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data, SpellTypeDnd5 } from '@/stores/rules/dnd5'
import { storeToRefs } from 'pinia'
import { useSpellStore } from '@/stores/rules/dnd5/spells'
import { getLevelLabel, getSchoolLabel } from '@/utils/dnd5/spellDisplay.ts'
import EditIcon from '@/components/Icons/EditIcon.vue'
import GearIcon from '@/components/Icons/GearIcon.vue'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const spellStore = useSpellStore()
const { spellsMap, isLoading, error } = storeToRefs(spellStore)

const props = defineProps<{
  id: string
  selectedSpellId: string | undefined
}>()

const isValidSpell = (spellDnD5: SpellTypeDnd5): boolean => {
  if (typeof spellDnD5 === 'string') {
    return spellsMap.value[spellDnD5] !== undefined
  }
  return true
}

const getSpells = (spellDnD5: SpellTypeDnd5): [Spell, boolean] => {
  if (typeof spellDnD5 === 'string') {
    return [spellsMap.value[spellDnD5]!, false]
  } else {
    return [spellDnD5, true]
  }
}

const selectedTab = ref<number>(-1)

const currentSpells = computed(() => {
  let filteredSpells = sheet.value.spells.list
    .find((s) => s.id === props.id)!
    .spells.map((item, idx) => ({
      item: item,
      index: idx,
    }))
  filteredSpells = filteredSpells.filter((s) => isValidSpell(s.item.spell))
  let result = filteredSpells.map((s) => {
    const [spellData, isCustom] = getSpells(s.item.spell)
    return {
      index: s.index,
      id: spellData.id,
      spell: spellData,
      isCustom: isCustom,
      get prepared() {
        return s.item.prepared
      },
      set prepared(val: boolean) {
        s.item.prepared = val
      },
      get dontCount() {
        return s.item.dontCount
      },
      set dontCount(val: boolean) {
        s.item.dontCount = val
      },
      get notes() {
        return s.item.notes
      },
      set notes(val: string) {
        s.item.notes = val
      },
      other: {
        get freeUsage() {
          return s.item.freeUsage
        },
        set freeUsage(val: string) {
          s.item.freeUsage = val
        },
        get containedFreeUsage() {
          return s.item.containedFreeUsage
        },
        set containedFreeUsage(val: number) {
          s.item.containedFreeUsage = val
        },
      },
    }
  })
  if (selectedTab.value >= 0) {
    result = result.filter((s) => s.spell.level === selectedTab.value)
  }
  return result
})

const emit = defineEmits<{
  (e: 'select', spell: Spell): void
}>()

// 拖拽相关
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
  const spellList = sheet.value.spells.list.find((s) => s.id === props.id)!.spells
  const [moved] = spellList.splice(from, 1)
  if (moved) {
    spellList.splice(index, 0, moved)
  }
  handleDragEnd()
}
</script>

<template>
  <div class="spell-lists-panel">
    <div class="sheet-tabs">
      <div class="tab-item" :class="{ active: selectedTab === -1 }" @click="selectedTab = -1">
        <div>{{ selectedTab === -1 ? '全部' : '全' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 0 }" @click="selectedTab = 0">
        <div>{{ selectedTab === 0 ? '戏法' : '戏' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 1 }" @click="selectedTab = 1">
        <div>{{ selectedTab === 1 ? '一环' : '一' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 2 }" @click="selectedTab = 2">
        <div>{{ selectedTab === 2 ? '二环' : '二' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 3 }" @click="selectedTab = 3">
        <div>{{ selectedTab === 3 ? '三环' : '三' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 4 }" @click="selectedTab = 4">
        <div>{{ selectedTab === 4 ? '四环' : '四' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 5 }" @click="selectedTab = 5">
        <div>{{ selectedTab === 5 ? '五环' : '五' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 6 }" @click="selectedTab = 6">
        <div>{{ selectedTab === 6 ? '六环' : '六' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 7 }" @click="selectedTab = 7">
        <div>{{ selectedTab === 7 ? '七环' : '七' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 8 }" @click="selectedTab = 8">
        <div>{{ selectedTab === 8 ? '八环' : '八' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 9 }" @click="selectedTab = 9">
        <div>{{ selectedTab === 9 ? '九环' : '九' }}</div>
      </div>
    </div>
    <div class="main-content">
      <div v-if="isLoading" class="status">正在加载法术数据...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-else-if="currentSpells.length === 0" class="status">没有相关的法术</div>
      <div v-else class="spell-list">
        <div class="table-header grid-layout">
          <div></div>
          <div class="col-header center">准备</div>
          <div class="col-header">法术名</div>
          <div class="col-header center">环阶</div>
          <div class="col-header center">学派</div>
          <div class="col-header center">成分</div>
          <div class="col-header center">仪式</div>
          <div class="col-header center">专注</div>
          <div class="col-header">备注</div>
          <div></div>
        </div>
        <div
          class="spell-item grid-layout"
          v-for="spell in currentSpells"
          :key="spell.id"
          @click="emit('select', spell.spell)"
          :class="{
            dragging: draggingIndex === spell.index,
            'drag-target': dragOverIndex === spell.index && draggingIndex !== null,
            active: props.selectedSpellId === spell.id,
          }"
          draggable="true"
          @dragstart="handleDragStart(spell.index)"
          @dragend="handleDragEnd"
          @dragover.prevent="handleDragOver(spell.index)"
          @drop.prevent="handleDrop(spell.index)"
        >
          <div class="col-drag">
            <div class="drag-handle" title="拖动排序">⠿</div>
          </div>
          <div class="filter-chip" @click.stop="spell.prepared = !spell.prepared">
            <div class="check-icon" :class="{ checked: spell.prepared }">
              <svg v-if="spell.prepared" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div class="col name">
            <span class="cn-name">{{ spell.spell.name }}</span>
            <span class="en-name">{{ spell.spell.english_name }}</span>
          </div>
          <div class="col center">{{ getLevelLabel(spell.spell.level) }}</div>
          <div class="col center">{{ getSchoolLabel(spell.spell.school) }}</div>
          <div class="col components">
            <span :class="{ enabled: spell.spell.need_verbal }">V</span>
            <span :class="{ enabled: spell.spell.need_somatic }">S</span>
            <span :class="{ enabled: !!spell.spell.material }">M</span>
          </div>
          <div class="col center">{{ spell.spell.is_ritual ? '√' : '×' }}</div>
          <div class="col center">{{ spell.spell.need_concentration ? '√' : '×' }}</div>
          <div class="col" @click.stop>
            <input type="text" v-model="spell.notes" class="bare-input" placeholder="请输入备注" />
          </div>
          <div class="col btn-group">
            <div class="btn-icon" @click.stop v-if="spell.isCustom">
              <gear-icon class="clickable" title="编辑法术内容本身" />
            </div>
            <div class="btn-icon" @click.stop>
              <edit-icon class="clickable" title="编辑其他法术特性" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spell-lists-panel {
  max-height: 700px;
  display: flex;
  flex-direction: column;
}
.sheet-tabs {
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  overflow-x: auto;
  flex: 0 0 auto;
}
.tab-item {
  text-decoration: none;
  color: var(--dnd-ink-secondary); /* 未选中：浅墨色 */
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; /* 标签高度 */
  padding: 0 1rem;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--dnd-ink-primary);
  border-bottom: 1px solid var(--dnd-parchment-bg);
  background-color: var(--dnd-gold-dim);
  position: relative;
  opacity: 0.7;
  gap: 8px;
  flex-shrink: 0; /* 禁止子元素在 flex 容器中被压缩 */
  white-space: nowrap; /* 确保里面的文字绝对不会换行 */
  user-select: none;
}
body.has-mouse .tab-item:hover {
  color: var(--dnd-dragon-red); /* 悬停变红 */
  background-color: rgba(255, 255, 255, 0.3);
  opacity: 1;
}
.tab-item.active {
  color: var(--dnd-dragon-red); /* 选中文字变红 */
  background-color: var(--dnd-parchment-bg); /* 背景变亮（羊皮纸色） */

  /* 边框处理：让它看起来像连着下面的内容 */
  border-bottom: 1px solid var(--dnd-parchment-bg); /* 底部颜色与内容区一致，造成无缝效果 */

  font-weight: bold;
  opacity: 1;
}

.main-content {
  background-color: var(--dnd-parchment-bg);
  overflow-y: auto;
  flex: 0 1 auto;
  min-height: 0;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  padding: 10px;
}

.status {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(40, 32, 24, 0.2);
  color: rgba(40, 32, 24, 0.6);
}

.status.error {
  border-color: rgba(188, 69, 69, 0.5);
  color: #a13c3c;
}

.grid-layout {
  display: grid;
  grid-template-columns: 15px 40px 1fr 80px 32px 47px 33px 33px 1fr 50px;
  gap: 10px;
}

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

.table-header {
  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 1px solid var(--dnd-ink-secondary);
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
</style>
