<script setup lang="ts">
import TargetSusceptibility from './DiceTools/TargetSusceptibility.vue'
import AttacksBrief from './DiceTools/AttacksBrief.vue'
import ItemList from './DiceTools/ItemList.vue'
import ResultPanel from './DiceTools/ResultPanel.vue'
import { computed, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { useDiceBox } from '@/composables/useDiceBox'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import type { ValueSummary, OutputNode } from '@/wasm_utils/oxidice/pkg/oxidice'
import { useDiceToolsResultStore } from '@/stores/rules/dnd5/dice-tool-stores'

const { foldAndCheckNumber, parseAndRoll } = useDiceBox()
const resultStore = useDiceToolsResultStore()

const isRolling = ref(false)

let resultTitles: string[] = []
let resultNodes: OutputNode[] = []
const rootValue = ref<ValueSummary | undefined>(undefined)

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const rollDamage = async () => {
  const [notation, titles] = damageExpression()
  if (notation === '') return
  isRolling.value = true
  const result = await parseAndRoll(notation)
  isRolling.value = false
  if (result !== null && result.layout.type === 'list') {
    // 记录标题和结果节点
    resultStore.clearSelectedValue()
    resultTitles = titles
    resultNodes = result.layout.children
    rootValue.value = result.value

    // 然后清空投掷次数
    for (const item of sheet.value.diceTools.items) {
      item.count = 0
      item.criticalCount = 0
    }
  }
}

const computedDamageList = () => {
  const results: Array<[string, string]> = [] // 名称，表达式
  let name_counter = 1
  for (const item of sheet.value.diceTools.items) {
    if (item.count + item.criticalCount === 0) continue // 跳过没有投掷次数的项
    // 查找抗性
    const susceptibility = sheet.value.diceTools.target_susceptibilities[item.damageType]
    let expression = item.expression
    if (susceptibility === 'resistance') {
      expression = `(${expression})//2` // 向下取整除以2
    } else if (susceptibility === 'vulnerability') {
      expression = `(${expression})*2`
    } else if (susceptibility === 'immunity') {
      expression = '0'
    }
    const [isValid, foldNotation] = foldAndCheckNumber(expression)
    if (!isValid) continue
    const name = item.name.trim() || `未命名伤害项${name_counter++}`
    // 处理普通伤害
    if (item.count === 1) {
      results.push([name, foldNotation])
    } else {
      let item_counter = 1
      for (let i = 0; i < item.count; i++) {
        results.push([`${name}#${item_counter++}`, foldNotation])
      }
    }
    // 处理暴击伤害
    if (item.criticalCount === 1) {
      results.push([`${name}（暴击）`, `rpdice(${foldNotation})`])
    } else {
      let item_counter = 1
      for (let i = 0; i < item.criticalCount; i++) {
        results.push([`${name}（暴击）#${item_counter++}`, `rpdice(${foldNotation})`])
      }
    }
  }
  return results
}

const damageExpression = (): [string, string[]] => {
  const damageList = computedDamageList()
  if (damageList.length === 0) {
    return ['', []]
  }
  const listNotation = '[' + damageList.map((tmp) => `${tmp[1]}`).join(',') + ']'
  const titleList = damageList.map((tmp) => tmp[0])
  return [listNotation, titleList]
}

const anySelected = computed(() => {
  for (const item of sheet.value.diceTools.items) {
    if (item.count > 0 || item.criticalCount > 0) {
      return true
    }
  }
  return false
})

// 复原伤害抗性
const rollBackSusceptibilities = () => {
  for (const key in sheet.value.diceTools.target_susceptibilities) {
    sheet.value.diceTools.target_susceptibilities[
      key as keyof typeof sheet.value.diceTools.target_susceptibilities
    ] = 'normal'
  }
}

// 清空结果展示
const clearResults = () => {
  resultTitles = []
  resultNodes = []
  rootValue.value = undefined
}
</script>

<template>
  <div class="dice-tools">
    <div>
      <div class="items-header">
        <div class="label">目标抗性</div>
        <button class="btn-primary" @click="rollBackSusceptibilities">复原</button>
      </div>
      <TargetSusceptibility />
      <div style="height: 16px"></div>
      <div class="label">攻击投掷</div>
      <AttacksBrief />
    </div>
    <div>
      <div v-if="resultTitles.length > 0 && resultNodes.length === resultTitles.length">
        <div class="items-header">
          <div class="label">结果展示</div>
          <button class="btn-primary" @click="clearResults">清空</button>
        </div>
        <ResultPanel :titles="resultTitles" :nodes="resultNodes" :root-value="rootValue!" />
        <div style="height: 16px"></div>
      </div>
      <div class="items-header">
        <div class="label">伤害项列表</div>
        <button
          class="btn-primary"
          :class="{ hidden: !anySelected || isRolling }"
          @click="rollDamage"
        >
          投掷
        </button>
      </div>
      <ItemList />
    </div>
  </div>
</template>

<style scoped>
.dice-tools {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  margin-top: 16px;
  align-items: start;
}

.label {
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
  font-family: Georgia, 'Songti SC', 'SimSun', serif;
  transition: background-color 0.2s;
}

body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-dragon-red-hover);
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hidden {
  visibility: hidden;
}
</style>
