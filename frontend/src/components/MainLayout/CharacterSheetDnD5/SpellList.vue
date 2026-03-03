<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import SpellSearchBar from './SpellList/SpellSearchBar.vue'
import SpellResultsTable from './SpellList/SpellResultsTable.vue'
import SpellDetailPanel from './SpellList/SpellDetailPanel.vue'
import RuleToggleButton from './Common/RuleToggleButton.vue'
import { useSpellStore } from '@/stores/rules/dnd5/spells'
import type { Klass, MagicSchool, Source, Spell } from '@/types/dnd5-spells'

const spellStore = useSpellStore()
const { spells, isLoading, error } = storeToRefs(spellStore)

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
const selectedSpell = ref<Spell | null>(null)

const filteredSpells = computed(() => {
  let result = spells.value
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
</script>

<template>
  <div class="spell-list">
    <header class="header">
      <div class="title">
        <h1>万法大全速查表</h1>
        <RuleToggleButton />
      </div>
      <SpellSearchBar v-model="searchKeys" />
    </header>

    <div class="content">
      <section class="list-panel">
        <div v-if="isLoading" class="status">正在加载法术数据...</div>
        <div v-else-if="error" class="status error">{{ error }}</div>
        <div v-else-if="filteredSpells.length === 0" class="status">没有匹配的法术</div>
        <SpellResultsTable
          v-else
          :spells="filteredSpells"
          :selected-id="selectedSpell?.id ?? null"
          @select="selectedSpell = $event"
        />
      </section>
      <aside class="detail-panel">
        <SpellDetailPanel :spell="selectedSpell" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.spell-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  display: flex;
  align-items: center;
  justify-items: center;
  justify-content: space-between;
}

.title h1 {
  margin: 0;
  font-size: 32px;
  color: var(--dnd-dragon-red);
}

.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}

.list-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.detail-panel {
  position: sticky;
  top: 20px;
  min-width: 0;
}
</style>
