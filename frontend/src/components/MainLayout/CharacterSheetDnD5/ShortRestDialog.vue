<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import type { ValueSummary } from '@/wasm_utils/oxidice/pkg/oxidice'
import { useActiveCharacterStore } from '@/stores/active-character'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import { useShortRestDialog } from '@/composables/dnd5/useShortRestDialog'
import AddIcon from '@/components/Icons/AddIcon.vue'
import MinusIcon from '@/components/Icons/MinusIcon.vue'

type HitDiceType = keyof Dnd5Data['combat']['hitDice']

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { state, close } = useShortRestDialog()
const { parseAndRoll, foldAndCheckNumber } = useDiceBox()
const { abilityModifies } = useDnd5Logic(sheet)

const isRolling = ref(false)
const availableHitDice = computed(() => {
  const types: HitDiceType[] = []
  const hitDice = sheet.value.combat.hitDice
  for (const type in hitDice) {
    const t = type as HitDiceType
    if (hitDice[t].current > 0) {
      types.push(t)
    }
  }
  return types
})

const selectedHitDice = ref<Record<HitDiceType, number>>({
  d6: 0,
  d8: 0,
  d10: 0,
  d12: 0,
})

const totalSelectedHitDice = computed(() => {
  let total = 0
  for (const type in selectedHitDice.value) {
    total += selectedHitDice.value[type as HitDiceType]
  }
  return total
})

const addOneSelected = (type: HitDiceType) => {
  const currentSelected = selectedHitDice.value[type]
  const available = sheet.value.combat.hitDice[type].current
  if (currentSelected < available) {
    selectedHitDice.value[type] = currentSelected + 1
  }
}

const addOneDisable = (type: HitDiceType): boolean => {
  const currentSelected = selectedHitDice.value[type]
  const available = sheet.value.combat.hitDice[type].current
  return currentSelected >= available
}

const removeOneSelected = (type: HitDiceType) => {
  const currentSelected = selectedHitDice.value[type]
  if (currentSelected > 0) {
    selectedHitDice.value[type] = currentSelected - 1
  }
}

const removeOneDisable = (type: HitDiceType): boolean => {
  const currentSelected = selectedHitDice.value[type]
  return currentSelected <= 0
}

const hpStatus = computed(() => ({
  current: sheet.value.combat.hp.current,
  max: sheet.value.combat.hp.max,
}))

const resolveValueNumber = (value: ValueSummary): number => {
  if (value.type === 'number') {
    return value.value
  }
  if (value.type === 'dicePool') {
    return value.value.total
  }
  if (value.type === 'successPool') {
    return value.value.count
  }
  if (value.type === 'list') {
    return value.value.reduce((sum, entry) => sum + entry, 0)
  }
  return 0
}

const rollHitDice = async () => {
  if (isRolling.value) return // 防止重复点击
  if (totalSelectedHitDice.value === 0) return // 没有选择任何生命骰

  // 组装生命骰表达式
  const rollNotations: string[] = []
  for (const type in selectedHitDice.value) {
    const count = selectedHitDice.value[type as HitDiceType]
    if (count > 0) {
      rollNotations.push(`${count}${type}`)
    }
  }
  const notation = `${rollNotations.join('+')} + (${abilityModifies.con}) * ${totalSelectedHitDice.value}`
  const [isValid, foledNotation] = foldAndCheckNumber(notation)

  if (!isValid) return

  isRolling.value = true
  const outputNode = await parseAndRoll(foledNotation)
  isRolling.value = false
  if (outputNode === null) return

  // 投掷成功

  // 从数据模型中扣除已使用的生命骰
  for (const type in selectedHitDice.value) {
    const count = selectedHitDice.value[type as HitDiceType]
    if (count > 0) {
      sheet.value.combat.hitDice[type as HitDiceType].current -= count
    }
  }
  // 重置已选择的生命骰
  for (const type in selectedHitDice.value) {
    selectedHitDice.value[type as HitDiceType] = 0
  }
  addDiceResult(outputNode, foledNotation, '短休生命骰')

  // 计算总治疗量
  const healed = resolveValueNumber(outputNode.value)
  const hp = sheet.value.combat.hp
  const nextHp = Math.min(hp.max, hp.current + Math.max(0, healed))
  hp.current = nextHp
}
</script>

<template>
  <div v-if="state.isOpen" class="short-rest-mask" @click.self="close">
    <div class="short-rest-dialog" role="dialog" aria-modal="true">
      <div class="dialog-header">短休恢复</div>
      <div class="dialog-body">
        <div class="hp-status">
          <span class="label">生命值</span>
          <span class="value">{{ hpStatus.current }} / {{ hpStatus.max }}</span>
        </div>

        <div class="hit-dice-section" v-if="availableHitDice.length > 0">
          <div class="section-title">生命骰</div>
          <div class="hit-dice-grid">
            <div v-for="type in availableHitDice" :key="type" class="hit-die-container">
              <div class="hit-die-block">
                <div class="hit-die-label">{{ type.toUpperCase() }}</div>
                <div class="hit-die-count">
                  {{ sheet.combat.hitDice[type].current }} /
                  {{ sheet.combat.hitDice[type].total }}
                </div>
              </div>
              <div class="hit-die-selector">
                <div
                  @click="removeOneSelected(type)"
                  :class="{ 'hidden-btn': removeOneDisable(type) || isRolling }"
                >
                  <minus-icon class="clickable" title="-1" />
                </div>
                <span>{{ selectedHitDice[type] }}</span>
                <div
                  @click="addOneSelected(type)"
                  :class="{ 'hidden-btn': addOneDisable(type) || isRolling }"
                >
                  <add-icon class="clickable" title="+1" />
                </div>
              </div>
            </div>
          </div>
          <button
            class="btn-primary"
            :disabled="totalSelectedHitDice === 0 || isRolling"
            :class="{
              'btn-disabled': totalSelectedHitDice === 0 || isRolling,
            }"
            @click="rollHitDice"
          >
            投掷
          </button>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.short-rest-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 350;
}

.short-rest-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  padding: 18px 20px;
  width: min(480px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Georgia', serif;
}

.dialog-header {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  font-size: 1.05rem;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--dnd-ink-secondary);
}

.hp-status {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.hp-status .label {
  font-weight: 600;
  color: var(--dnd-ink-primary);
}

.hp-status .value {
  font-weight: 700;
  color: var(--dnd-dragon-red);
}

.hit-dice-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-weight: 600;
  color: var(--dnd-ink-primary);
}

.hit-dice-grid {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.hit-die-container {
  flex: 1;
}

.hit-die-block {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.hit-die-label {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--dnd-ink-primary);
}

.hit-die-count {
  font-size: 1rem;
  color: var(--dnd-ink-secondary);
}

.hit-die-selector {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.2rem;
  color: var(--dnd-ink-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
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

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--dnd-ink-secondary);
}

body.has-mouse .btn-disabled:hover {
  background-color: var(--dnd-ink-secondary);
}

/* --- 在 ShortRestDialog.vue 的 style 底部添加 --- */

.clickable {
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    color 0.2s;
}

.hidden-btn {
  visibility: hidden;
}

/* 只要是 body 有 has-mouse 类（通常在 main.ts 或 App.vue 中全局设置），就启用 hover */
body.has-mouse .clickable:hover {
  color: var(--dnd-dragon-red);
}

body.has-mouse .clickable:active {
  transform: scale(0.95);
}
</style>
