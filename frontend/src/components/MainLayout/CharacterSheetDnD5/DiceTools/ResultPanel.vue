<script setup lang="ts">
import type { OutputNode, ValueSummary } from '@/wasm_utils/oxidice/pkg/oxidice'
import { computed } from 'vue'
import DiceValueDisplay from '@/components/Common/DiceResultToast/DiceValueDisplay.vue'
import ExpressionNodeT from './ExpressionNodeT.vue'
import { useDiceToolsResultStore } from '@/stores/rules/dnd5/dice-tool-stores'

const store = useDiceToolsResultStore()

interface Props {
  titles: string[]
  nodes: OutputNode[]
  rootValue: ValueSummary
}

const props = defineProps<Props>()

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

const totalDamage = computed(() => {
  return props.nodes.reduce((sum, node) => sum + resolveValueNumber(node.value), 0)
})

const combinedList = computed(() => {
  const list: Array<{ title: string; node: OutputNode }> = []
  for (let i = 0; i < props.titles.length; i++) {
    list.push({ title: props.titles[i]!, node: props.nodes[i]! })
  }
  return list
})

const valueToDisplay = computed(() => {
  if (store.selectedValue !== undefined) {
    return store.selectedValue
  } else {
    return props.rootValue
  }
})
</script>

<template>
  <div class="result-panel">
    <div class="column1">
      <div class="column-container-1">
        <div class="result-total">
          <div class="result-total-label">总伤害</div>
          <div class="result-total-value">{{ totalDamage }}</div>
        </div>
        <DiceValueDisplay :value="valueToDisplay" />
      </div>
    </div>
    <div class="result-list">
      <div v-for="(item, index) in combinedList" :key="index" class="result-item">
        <div class="result-title">{{ item.title }}</div>
        <div class="result-expression"><ExpressionNodeT :node="item.node" /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.column1 {
  display: flex;
  align-items: center;
}

.column-container-1 {
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
  width: 100%;
  height: auto;
}

.result-panel {
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: 255px 1fr;
  gap: 10px;
}

.result-total {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  height: 97px;
}

.result-total-label {
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
  margin-bottom: 4px;
}

.result-total-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dnd-dragon-red);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 10px;
}

.result-title {
  display: flex; /* 启用 Flexbox */
  align-items: center; /* 垂直方向居中 */
  justify-content: flex-start; /* 水平方向靠左 (默认值，可省略) */
  font-weight: 700;
  color: var(--dnd-ink-primary);
  border-radius: 8px;
  padding: 4px 4px;
  background-color: var(--dnd-parchment-card);
}

.result-expression {
  display: flex;
  align-items: center;
}
</style>
