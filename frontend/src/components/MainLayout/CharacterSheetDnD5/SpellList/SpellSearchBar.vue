<script setup lang="ts">
import type { Klass, MagicSchool, Source } from '@/types/dnd5-spells'
import {
  getLevelLabel,
  getSchoolLabel,
  getClassLabel,
  getSourceLabel,
} from '@/utils/dnd5/spellDisplay.ts'

export interface FilterState {
  keyword: string
  need_concentration: boolean
  is_ritual: boolean
  need_verbal: boolean
  need_somatic: boolean
  need_material: boolean
  levels: number[]
  schools: MagicSchool[]
  classes: Klass[]
  sources: Source[]
}

const SPECIAL_OPTS = [
  { label: '专注', key: 'need_concentration' },
  { label: '仪式', key: 'is_ritual' },
  { label: '言语成分', key: 'need_verbal' },
  { label: '姿势成分', key: 'need_somatic' },
  { label: '材料成分', key: 'need_material' },
] as const

const LEVEL_OPTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const SCHOOL_OPTS: MagicSchool[] = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
]

const CLASS_OPTS: Klass[] = [
  'artificer',
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
]

const SOURCE_OPTS: Source[] = [
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
]

const props = defineProps<{
  modelValue: FilterState
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterState): void
}>()

const updateKeyword = (val: string) => {
  emit('update:modelValue', { ...props.modelValue, keyword: val })
}

const toggleBoolean = (
  key: keyof Pick<
    FilterState,
    'need_concentration' | 'is_ritual' | 'need_verbal' | 'need_somatic' | 'need_material'
  >,
) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: !props.modelValue[key],
  })
}

function toggleArrayItem<T>(key: 'levels' | 'schools' | 'classes' | 'sources', item: T) {
  const list = props.modelValue[key] as T[]
  const newList = [...list]
  const index = newList.indexOf(item)

  if (index > -1) {
    newList.splice(index, 1)
  } else {
    newList.push(item)
  }

  emit('update:modelValue', { ...props.modelValue, [key]: newList })
}

// 全选/反选逻辑
function toggleAll<T>(key: 'levels' | 'schools' | 'classes' | 'sources', allOptions: T[]) {
  const currentList = props.modelValue[key] as T[]

  // 如果当前数量等于总选项数量，说明已全选 -> 清空
  if (currentList.length === allOptions.length) {
    emit('update:modelValue', { ...props.modelValue, [key]: [] })
  } else {
    // 否则 -> 全选
    emit('update:modelValue', { ...props.modelValue, [key]: [...allOptions] })
  }
}

// 辅助判断是否选中
const isSelected = <T,>(key: 'levels' | 'schools' | 'classes' | 'sources', item: T) => {
  return (props.modelValue[key] as T[]).includes(item)
}

const isAllSelected = <T,>(key: 'levels' | 'schools' | 'classes' | 'sources', allOptions: T[]) => {
  return (props.modelValue[key] as T[]).length === allOptions.length
}
</script>

<template>
  <div class="filter-panel">
    <div class="filter-rows">
      <div class="filter-row">
        <div class="row-label">特殊:</div>
        <div class="row-content">
          <div
            v-for="opt in SPECIAL_OPTS"
            :key="opt.key"
            class="filter-chip"
            @click="toggleBoolean(opt.key)"
          >
            <div class="check-icon" :class="{ checked: modelValue[opt.key] }">
              <svg v-if="modelValue[opt.key]" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="chip-text">{{ opt.label }}</span>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <div class="row-label">来源:</div>
        <div class="row-content">
          <button
            class="select-all-btn"
            :class="{ active: isAllSelected('sources', SOURCE_OPTS) }"
            @click="toggleAll('sources', SOURCE_OPTS)"
          >
            全选
          </button>
          <div
            v-for="src in SOURCE_OPTS"
            :key="src"
            class="filter-chip"
            @click="toggleArrayItem('sources', src)"
          >
            <div class="check-icon" :class="{ checked: isSelected('sources', src) }">
              <svg v-if="isSelected('sources', src)" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="chip-text">{{ getSourceLabel(src) }}</span>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <div class="row-label">学派:</div>
        <div class="row-content">
          <button
            class="select-all-btn"
            :class="{ active: isAllSelected('schools', SCHOOL_OPTS) }"
            @click="toggleAll('schools', SCHOOL_OPTS)"
          >
            全选
          </button>
          <div
            v-for="sc in SCHOOL_OPTS"
            :key="sc"
            class="filter-chip"
            @click="toggleArrayItem('schools', sc)"
          >
            <div class="check-icon" :class="{ checked: isSelected('schools', sc) }">
              <svg v-if="isSelected('schools', sc)" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="chip-text">{{ getSchoolLabel(sc) }}</span>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <div class="row-label">环阶:</div>
        <div class="row-content">
          <button
            class="select-all-btn"
            :class="{ active: isAllSelected('levels', LEVEL_OPTS) }"
            @click="toggleAll('levels', LEVEL_OPTS)"
          >
            全选
          </button>
          <div
            v-for="lv in LEVEL_OPTS"
            :key="lv"
            class="filter-chip"
            @click="toggleArrayItem('levels', lv)"
          >
            <div class="check-icon" :class="{ checked: isSelected('levels', lv) }">
              <svg v-if="isSelected('levels', lv)" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="chip-text">{{ getLevelLabel(lv) }}</span>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <div class="row-label">职业:</div>
        <div class="row-content">
          <button
            class="select-all-btn"
            :class="{ active: isAllSelected('classes', CLASS_OPTS) }"
            @click="toggleAll('classes', CLASS_OPTS)"
          >
            全选
          </button>
          <div
            v-for="cls in CLASS_OPTS"
            :key="cls"
            class="filter-chip"
            @click="toggleArrayItem('classes', cls)"
          >
            <div class="check-icon" :class="{ checked: isSelected('classes', cls) }">
              <svg v-if="isSelected('classes', cls)" viewBox="0 0 24 24" class="svg-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="chip-text">{{ getClassLabel(cls) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="search-bar">
      <input
        class="search-input"
        type="text"
        :value="modelValue.keyword"
        placeholder="搜索法术名称"
        @input="updateKeyword(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
/* 容器 */
.filter-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-card);
  border-radius: 10px;
  gap: 16px;
  padding: 10px;
  font-family: Georgia, 'Songti SC', 'SimSun', serif;
  color: var(--dnd-ink-primary);
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-input {
  flex: 1;
  min-width: 240px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(40, 32, 24, 0.2);
  background: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

/* 分割线 */
.divider {
  height: 1px;
  background-color: var(--dnd-ink-secondary);
  margin: 0 4px;
}

/* 筛选行布局 */
.filter-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.filter-row {
  display: flex;
  align-items: center;
  justify-items: center;
}
.row-label {
  font-weight: 900; /* 加粗 */
  font-size: 16px;
  width: 55px; /* 固定宽度 */
  padding-top: 5px;
  flex-shrink: 0;
  text-align: right;
  margin-right: 12px;
}
.row-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px; /* 行间距8px，列间距12px */
  align-items: center;
}

/* 全选按钮 */
.select-all-btn {
  border: none;
  background-color: var(--dnd-mithral-text); /* 浅灰底 */
  color: var(--dnd-ink-primary);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  height: 28px;
  display: flex;
  align-items: center;
}
body.has-mouse .select-all-btn:hover {
  background-color: var(--dnd-stone-text);
}

/* 标签 Chip 样式 */
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
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
.chip-text {
  font-size: 16px;
  color: var(--dnd-ink-primary);
}
.svg-icon {
  stroke: var(--dnd-mithral-text);
  fill: none;
  stroke-width: 4;
  width: 14px;
  height: 14px;
}
</style>
