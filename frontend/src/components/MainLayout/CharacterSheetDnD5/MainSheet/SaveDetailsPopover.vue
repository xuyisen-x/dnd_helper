<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { DND5R_ABILITY_FULL_NAMES } from '@/stores/rules/dnd5'
import type { Dnd5Data, SixAbilityKeysDnd5 } from '@/stores/rules/dnd5'
import { formatWithSign, useDnd5rLogic } from '@/composables/rules/useDnd5rLogic'

const props = defineProps<{
  ability: SixAbilityKeysDnd5
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { abilityModifies, proficiencyBonus, saveModifies, evalStringWithVariables } =
  useDnd5rLogic(sheet)

const totalModify = computed(() => saveModifies[props.ability])
const abilityModify = computed(() => abilityModifies[props.ability])
const isProficient = computed(() => sheet.value.abilities[props.ability].save)
const extra_modify = computed(() => sheet.value.extra_modify.save[props.ability])
</script>

<template>
  <div class="details-popover-container">
    <div class="arrow"></div>

    <h4 class="title">{{ DND5R_ABILITY_FULL_NAMES[props.ability] }} 豁免分解</h4>

    <div class="detail-row total-row">
      <span class="label">总计</span>
      <span class="value">{{ totalModify }}</span>
    </div>

    <div class="divider"></div>

    <div class="detail-row">
      <span class="label">属性调整值 ({{ DND5R_ABILITY_FULL_NAMES[props.ability] }})</span>
      <span class="value">{{ formatWithSign(abilityModify) }}</span>
    </div>

    <div class="detail-row" :class="{ inactive: !isProficient }">
      <span class="label">熟练加值</span>
      <span class="value">{{ isProficient ? formatWithSign(proficiencyBonus) : '—' }}</span>
    </div>

    <div class="detail-row" :class="{ inactive: extra_modify === '' }">
      <span class="label">额外调整</span>
      <span class="value">{{
        extra_modify !== '' ? evalStringWithVariables(extra_modify) : '—'
      }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Popover 容器的基础样式 */
.details-popover-container {
  position: absolute;
  /* 定位在父元素右侧 */
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);

  min-width: 220px;
  background-color: var(--color-background); /* 羊皮纸底色 */
  border: 1px solid var(--dnd-ink-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 200; /* 确保它在所有元素之上 */
  font-family: Arial, sans-serif;
  color: var(--dnd-ink-primary);
  font-size: 0.85rem;
}

/* 小箭头，指向左侧的父元素 */
.arrow {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 8px;
  border-style: solid;
  /* 边框颜色：指向右侧 */
  border-color: transparent var(--dnd-ink-primary) transparent transparent;
}
.arrow::after {
  content: '';
  position: absolute;
  top: -8px;
  right: -7px;
  border-width: 7px;
  border-style: solid;
  border-color: transparent var(--color-background) transparent transparent;
}

.title {
  margin: 0 0 5px 0;
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--dnd-dragon-red);
}

.divider {
  height: 1px;
  background-color: var(--dnd-ink-secondary);
  opacity: 0.3;
  margin: 5px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.5;
}

.detail-row .value {
  font-weight: bold;
  min-width: 30px;
  text-align: right;
}

.total-row .value {
  font-size: 1.1rem;
  color: var(--dnd-ink-primary);
}

/* 非激活或值为 0 的项，使用灰色显示 */
.inactive {
  color: var(--dnd-ink-secondary);
  opacity: 0.7;
}

.inactive .value {
  color: var(--dnd-ink-secondary);
}
</style>
