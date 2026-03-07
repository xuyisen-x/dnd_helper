<script setup lang="ts">
import { computed, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import { getLevelLabel } from '@/utils/dnd5/spellDisplay'
import SpellSlotItem from './SpellSlotItem.vue'
import EditPopover from '../Common/EditPopover.vue'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const logic = useDnd5Logic(sheet)
const slotsView = logic.spellSlotsView
const pactSlotsView = logic.pactSpellSlotsView
const evalCostomFamula = logic.evalCostomFamula

const pactSlot = computed(() => {
  const slots = pactSlotsView.value

  for (let i = 1; i <= 9; i++) {
    const level = i as SpellLevel
    const slot = slots[level]
    if (slot && slot.total > 0) {
      return [slot, level] as const
    }
  }
  return [slots[1 as SpellLevel], 1 as SpellLevel] as const
})

type SpellLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const toggleSpellSlotUsed = (level: SpellLevel, index: number) => {
  const slot = slotsView.value[level]
  if (!slot || slot.total === 0) return
  const currentVal = slot.used
  const nextVal = currentVal === index ? index + 1 : index
  slot.setUsed(nextVal)
}

const togglePactSpellSlotUsed = (index: number) => {
  const slot = pactSlot.value[0]
  if (!slot || slot.total === 0) return
  const currentVal = slot.used
  const nextVal = currentVal === index ? index + 1 : index
  slot.setUsed(nextVal)
}

const isEditingLevel = ref(false)
const isEditingPactLevel = ref(false)
</script>

<template>
  <div class="container">
    <div class="stat-panel">
      <div class="panel-header">
        <span class="label">法术位总览</span>
      </div>
      <div class="panel-divider"></div>
      <div class="slots-grid">
        <SpellSlotItem
          v-for="(slot, level) in slotsView"
          :key="level"
          :label="getLevelLabel(level as unknown as number)"
          :total="slot.total"
          :used="slot.used"
          @click-marker="(i) => toggleSpellSlotUsed(level as unknown as SpellLevel, i)"
        />
        <SpellSlotItem
          :label="`${getLevelLabel(pactSlot[1] as unknown as number)}(契)`"
          :total="pactSlot[0].total"
          :used="pactSlot[0].used"
          @click-marker="togglePactSpellSlotUsed"
        />
      </div>
    </div>
    <div class="stat-panel">
      <div class="panel-header">
        <span class="label">施法者等级</span>
      </div>
      <div class="panel-divider"></div>
      <div class="panel-content">
        <span
          class="big-value clickable"
          @click="isEditingLevel = true"
          title="点击修改施法者等级"
          >{{ evalCostomFamula(sheet.spells.level) }}</span
        >
        <EditPopover
          v-if="isEditingLevel"
          v-model="sheet.spells.level"
          @close="isEditingLevel = false"
          title="施法者等级"
          @click.stop
        />
      </div>
    </div>
    <div class="stat-panel">
      <div class="panel-header">
        <span class="label">契约魔法等级</span>
      </div>
      <div class="panel-divider"></div>
      <div class="panel-content">
        <span
          class="big-value clickable"
          @click="isEditingPactLevel = true"
          title="点击修改契约魔法等级"
          >{{ evalCostomFamula(sheet.spells.pact_level) }}</span
        >
        <EditPopover
          v-if="isEditingPactLevel"
          v-model="sheet.spells.pact_level"
          @close="isEditingPactLevel = false"
          title="契约魔法等级"
          @click.stop
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 1fr 120px 120px;
  gap: 10px;
}

.stat-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 65px;
}

.panel-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  position: relative;
  z-index: 1;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 4px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
}

.label {
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  letter-spacing: 1px;
}

.big-value {
  font-family: 'Georgia', serif;
  font-size: 2.4rem; /* 核心数据大一点 */
  color: var(--dnd-ink-primary);
  line-height: 1;
}

.panel-divider {
  height: 2px;
  background-color: var(--dnd-ink-primary);
  width: 100%;
  opacity: 0.8;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
  padding: 10px;
}
</style>
