<script setup lang="ts">
import { computed, ref } from 'vue'
import SpellDetailPanel from '../SpellList/SpellDetailPanel.vue'
import SpellListPanel from './SpellListPanel.vue'
import SpellSearchBar from '../SpellList/SpellSearchBar.vue'
import { useSpellStore } from '@/stores/rules/dnd5/spells'
import { storeToRefs } from 'pinia'
import type { Klass, MagicSchool, Source, Spell } from '@/types/dnd5-spells'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const spellStore = useSpellStore()
const { spells, isLoading, error } = storeToRefs(spellStore)

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const selectedSpell = ref<Spell | null>(null)

// 用于控制过滤选项的展开和收起
const isFilterExpanded = ref(false)
const toggleFilter = () => {
  isFilterExpanded.value = !isFilterExpanded.value
}

const emit = defineEmits(['close'])

const props = defineProps<{
  listIdx: number
}>()

const currentSpellList = computed(() => {
  // 注意！这里的list最好只用于只读功能
  const spellList = sheet.value.spells.list[props.listIdx]
  return spellList ? spellList.spells : []
})

// 记录这次被选择的法术 ID们
const addingSpellIds = ref<Set<string>>(new Set())
const addededSpellIds = ref<Set<string>>(new Set())
// 从sheet中获取已经被选择的法术ID列表
for (const item of currentSpellList.value) {
  if (typeof item.spell === 'string') {
    addededSpellIds.value.add(item.spell)
  }
}

const toggleAddingSpellId = (spellId: string) => {
  if (addingSpellIds.value.has(spellId)) {
    addingSpellIds.value.delete(spellId)
  } else {
    addingSpellIds.value.add(spellId)
  }
}

// 搜索栏相关逻辑
const searchKeys = ref({
  keyword: '',
  need_concentration: false,
  is_ritual: false,
  need_verbal: false,
  need_somatic: false,
  need_material: false,
  levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  schools: [
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation',
  ] as MagicSchool[],
  classes: [
    'artificer',
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard',
  ] as Klass[],
  sources: [
    'PHB24',
    'PHB14',
    'XGE',
    'TCE',
    'FTD',
    'BMT',
    'GGR',
    'AI',
    'SCC',
    'AAG',
    'SO',
    'FR',
    'MODULE',
  ] as Source[],
})
const onlyShowSelected = ref(false)

const filteredSpells = computed(() => {
  let result = spells.value

  // 如果只显示被选择的法术，那么直接过滤掉不在 selectedSpellIds 中的法术，不进行其他过滤条件的判断
  if (onlyShowSelected.value) {
    result = result.filter((spell) => addingSpellIds.value.has(spell.id))
    return result
  }

  // Filter by keyword
  if (searchKeys.value.keyword.trim()) {
    const keyword = searchKeys.value.keyword.trim().toLowerCase()
    result = result.filter(
      (spell) =>
        spell.name.includes(keyword) ||
        spell.english_name.toLowerCase().includes(keyword.toLowerCase()),
    )
  }
  // Filter by need_concentration
  if (searchKeys.value.need_concentration) {
    result = result.filter((spell) => spell.need_concentration)
  }
  // Filter by is_ritual
  if (searchKeys.value.is_ritual) {
    result = result.filter((spell) => spell.is_ritual)
  }
  // Filter by need_verbal
  if (searchKeys.value.need_verbal) {
    result = result.filter((spell) => spell.need_verbal)
  }
  // Filter by need_somatic
  if (searchKeys.value.need_somatic) {
    result = result.filter((spell) => spell.need_somatic)
  }
  // Filter by need_material
  if (searchKeys.value.need_material) {
    result = result.filter((spell) => !!spell.material)
  }
  // Filter by levels
  result = result.filter((spell) => searchKeys.value.levels.includes(spell.level))
  // Filter by schools
  result = result.filter((spell) => searchKeys.value.schools.includes(spell.school))
  // Filter by classes
  result = result.filter((spell) =>
    spell.class_list.some((item) => searchKeys.value.classes.includes(item.class)),
  )
  // Filter by sources
  result = result.filter((spell) => searchKeys.value.sources.includes(spell.source))
  return result
})

const closeEditDialog = () => {
  addingSpellIds.value.clear() // 取消选择的法术ID列表清空
  addededSpellIds.value.clear() // 已选择的法术ID列表清空
  emit('close')
}

const saveEditDialog = () => {
  const targetSpellList = sheet.value.spells.list[props.listIdx]
  if (targetSpellList !== undefined) {
    for (const spellId of addingSpellIds.value) {
      if (addededSpellIds.value.has(spellId)) {
        continue
      }
      targetSpellList.spells.push({
        spell: spellId,
        prepared: false,
        dontCount: false,
        notes: '',
        freeUsage: '',
        containedFreeUsage: 0,
        afterLongRest: '',
        afterShortRest: '',
      })
    }
  }
  addingSpellIds.value.clear() // 取消选择的法术ID列表清空
  addededSpellIds.value.clear() // 已选择的法术ID列表清空
  emit('close')
}
</script>

<template>
  <div class="add-spell-dialog-mask" @click.self="closeEditDialog">
    <div class="add-spell-feature-dialog">
      <div class="curtain-layer">
        <div class="curtain-content" :class="{ 'is-open': isFilterExpanded }">
          <div class="curtain-inner">
            <SpellSearchBar v-model="searchKeys" />
          </div>
        </div>
        <button
          class="curtain-handle"
          :class="{ 'is-open': isFilterExpanded }"
          @click="toggleFilter"
        >
          {{ isFilterExpanded ? '收起筛选面板 ▲' : '打开筛选面板 ▼' }}
        </button>
      </div>
      <div class="main-display">
        <div v-if="isLoading" class="status">正在加载法术数据...</div>
        <div v-else-if="error" class="status error">{{ error }}</div>
        <div v-else-if="filteredSpells.length === 0" class="status">
          {{ onlyShowSelected ? '没有被选择的法术' : '没有匹配的法术' }}
        </div>
        <SpellListPanel
          v-else
          :spells="filteredSpells"
          :selected-id="selectedSpell?.id ?? null"
          :adding-spell-ids="addingSpellIds"
          :addeded-spell-ids="addededSpellIds"
          @select="selectedSpell = $event"
          @toggle-adding="toggleAddingSpellId"
        />
        <SpellDetailPanel :spell="selectedSpell"></SpellDetailPanel>
      </div>
      <div class="dialog-actions">
        <div class="conclusion-label">已选择的新增法术数量：{{ addingSpellIds.size }}</div>
        <div class="filter-chip" @click="onlyShowSelected = !onlyShowSelected">
          <div class="check-icon" :class="{ checked: onlyShowSelected }">
            <svg v-if="onlyShowSelected" viewBox="0 0 24 24" class="svg-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="conclusion-label">只显示被选择的法术</span>
        </div>
        <div style="flex: 1"></div>
        <button class="btn-ghost" @click="closeEditDialog">取消</button>
        <button class="btn-primary" @click="saveEditDialog">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-spell-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.add-spell-feature-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  width: min(520px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  height: 90vh;
  width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 16px 16px 16px;
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

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-dragon-red-hover);
}

body.has-mouse .btn-ghost:hover {
  color: var(--dnd-ink-primary);
  border-color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.04);
}

.main-display {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  font-family: Georgia, serif;
  flex: 1;
  min-height: 0;
  padding: 0 16px;
}

/* --- 窗帘内容区 (动画核心) --- */
.curtain-content {
  display: grid;
  grid-template-rows: 0fr; /* 闭合时高度为 0 */
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1); /* 平滑过渡动画 */
  background: var(--dnd-parchment-card); /* 配合您的羊皮纸主题 */
  border-radius: 12px 12px 0 0;
}

.curtain-content.is-open {
  grid-template-rows: 1fr; /* 展开到底部内容应有的高度 */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15); /* 展开时底部投射阴影 */
}

/* 配合 0fr 动画必须的内层包裹 */
.curtain-inner {
  min-height: 0;
  overflow: hidden; /* 防止内容在闭合时溢出 */
}

.curtain-layer {
  width: 100%;
  z-index: 50; /* 悬浮层级，确保盖住 main-display */
  display: flex;
  flex-direction: column;
}

.curtain-handle {
  border-radius: 12px 12px 0 0;
  border: none;
  background: var(--dnd-parchment-bg);
  /* 底部有边框和阴影，确保在 main-display 上方有明显的分隔感 */
  border-bottom: 1px solid var(--dnd-ink-secondary);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.curtain-handle.is-open {
  border-radius: 0; /* 或者写 0 0 0 0，效果一样 */
}

body.has-mouse .curtain-handle:hover {
  background: var(--dnd-parchment-card);
}

.conclusion-label {
  font-size: 1rem;
  font-weight: bold;
  font-family: Georgia, 'Songti SC', 'SimSun', serif;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
}

.check-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
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
  gap: 6px;
  cursor: pointer;
  user-select: none;
  margin-left: 10px;
}
.svg-icon {
  stroke: var(--dnd-mithral-text);
  fill: none;
  stroke-width: 4;
  width: 14px;
  height: 14px;
}

.status {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(40, 32, 24, 0.2);
  color: rgba(40, 32, 24, 0.6);
  align-self: start;
}

.status.error {
  border-color: rgba(188, 69, 69, 0.5);
  color: #a13c3c;
}
</style>
