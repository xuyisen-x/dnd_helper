<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import {
  getClassNamesO,
  getLevelLabel,
  getSchoolLabel,
  getSourceLabel,
} from '@/utils/dnd5/spellDisplay.ts'
import { useActiveCharacterStore } from '@/stores/active-character'
import { storeToRefs } from 'pinia'
import { computed, type ComputedRef } from 'vue'

const store = useActiveCharacterStore()
const { rule } = storeToRefs(store)

const props = defineProps<{
  spells: Spell[]
  selectedId: string | null
  addingSpellIds: Set<string>
  addededSpellIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', spell: Spell): void
  (e: 'toggle-adding', spellId: string): void
}>()

const postProcessedSpells: ComputedRef<[Spell, boolean][]> = computed(() => {
  let list: [Spell, boolean][] = props.spells.map((spell) => {
    // 如果当前规则为5E，将所有的PHB24法术，标记为false
    if (rule.value === 'dnd5e') {
      if (spell.source === 'PHB24' || spell.source === 'FR') {
        return [spell, false]
      } else {
        return [spell, true]
      }
    } else {
      if (spell.source === 'PHB14' || spell.is_legacy) {
        return [spell, false]
      } else {
        return [spell, true]
      }
    }
  })

  // 把标记为false的法术，排在后面
  list = list.sort((a, b) => {
    if (a[1] === b[1]) {
      return 0
    } else if (a[1] && !b[1]) {
      return -1
    } else {
      return 1
    }
  })

  return list
})

const toggleAdd = (id: string) => {
  if (!props.addededSpellIds.has(id)) {
    emit('toggle-adding', id)
  }
}
</script>

<template>
  <div class="results-table">
    <div class="wrapper">
      <div></div>
      <div class="table-header">
        <div class="col-header name">法术名</div>
        <div class="col-header level">环阶</div>
        <div class="col-header school">学派</div>
        <div class="col-header classes">职业</div>
        <div class="col-header components-header">成分</div>
        <div class="col-header ritual">仪式</div>
        <div class="col-header concentration">专注</div>
        <div class="col-header source">来源</div>
      </div>
    </div>
    <div class="wrapper" v-for="[spell, valid] in postProcessedSpells" :key="spell.id">
      <div class="filter-chip" @click="toggleAdd(spell.id)">
        <div
          class="check-icon"
          :class="{
            disabled: props.addededSpellIds.has(spell.id),
            checked: !props.addededSpellIds.has(spell.id) && props.addingSpellIds.has(spell.id),
          }"
        >
          <svg
            v-if="props.addingSpellIds.has(spell.id) || props.addededSpellIds.has(spell.id)"
            viewBox="0 0 24 24"
            class="svg-icon"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <button
        class="table-row"
        :class="{ active: spell.id === selectedId }"
        @click="$emit('select', spell)"
      >
        <div class="col name">
          <span class="cn-name" :class="{ invalid: !valid }">{{ spell.name }}</span>
          <span class="en-name">{{ spell.english_name }}</span>
        </div>
        <div class="col level">{{ getLevelLabel(spell.level) }}</div>
        <div class="col school">{{ getSchoolLabel(spell.school) }}</div>
        <div class="col classes">{{ getClassNamesO(spell) }}</div>
        <div class="col components">
          <span :class="{ enabled: spell.need_verbal }">V</span>
          <span :class="{ enabled: spell.need_somatic }">S</span>
          <span :class="{ enabled: !!spell.material }">M</span>
        </div>
        <div class="col ritual">{{ spell.is_ritual ? '√' : '×' }}</div>
        <div class="col concentration">{{ spell.need_concentration ? '√' : '×' }}</div>
        <div class="col source">{{ getSourceLabel(spell.source) }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.col {
  font-size: 1rem;
  color: var(--dnd-ink-primary);
}

.col-header {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
}

.results-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-self: start;
  max-height: 100%;
  overflow-y: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 80px 32px 1.2fr 47px 33px 33px 50px;
  align-items: center;
  gap: 20px;
  padding: 10px 12px;
  text-align: left;
}

.table-header {
  font-weight: 700;
  border-bottom: 1px solid var(--dnd-ink-secondary);
}

.table-row {
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1); /* 淡淡的分割线 */
}

body.has-mouse .table-row:hover {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 10px;
}

.table-row.active {
  border-color: var(--dnd-dragon-red);
  background: var(--dnd-parchment-card);
}

.name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cn-name {
  font-weight: 700;
  color: var(--dnd-dragon-red);
}

.invalid.cn-name {
  font-weight: 700;
  color: var(--dnd-stone-text);
  text-decoration: line-through;
}

.en-name {
  font-style: italic;
  font-size: 13px;
  color: rgba(32, 24, 18, 0.7);
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

.level,
.school,
.classes,
.components,
.components-header,
.ritual,
.concentration,
.source {
  text-align: center;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 40px 1fr;
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
}
</style>
