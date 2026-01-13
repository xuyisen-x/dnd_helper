<script setup lang="ts">
import type { RollResultItem } from '@/stores/dice-result'
import type { ValueSummary } from '@/wasm_utils/oxidice/pkg/oxidice'
import OneAutoFitText from '@/components/Common/OneRowAutoFitText.vue'
import ExpressionNode from './ExpressionNode.vue'
import DiceValueDisplay from './DiceValueDisplay.vue'
import { computed } from 'vue'

const props = defineProps<{
  item: RollResultItem
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const getResultString = (value: ValueSummary): string => {
  if (value.type === 'number') {
    return value.value.toString()
  } else if (value.type === 'dicePool') {
    return value.value.total.toString()
  } else if (value.type === 'successPool') {
    return value.value.count.toString()
  } else if (value.type === 'list') {
    return '[' + value.value.map((v) => v.toString()).join(', ') + ']'
  } else {
    return ''
  }
}

const showedValue = computed<ValueSummary>(() => {
  if (props.item.showedValue) {
    return props.item.showedValue
  } else {
    return props.item.output.value
  }
})
</script>

<template>
  <div class="dice-toast" :class="{ expanded: props.isExpanded }">
    <div class="toast-header">
      <div class="header-info">
        <span class="title">{{ props.item.title }}</span>
        <span class="notation" v-if="!isExpanded">{{ props.item.notation }}</span>
      </div>
      <button class="close-btn" @click="emit('close')">×</button>
    </div>

    <div v-if="isExpanded" class="toast-details">
      <ExpressionNode :node="item.output" :id="item.id" />
    </div>
    <DiceValueDisplay v-if="isExpanded" :value="showedValue" />

    <div class="toast-footer">
      <span class="total-label">结果</span>
      <OneAutoFitText :min-size="10" :max-size="28" class="total-result-wrapper">
        <span class="total-result">{{ getResultString(item.output.value) }}</span>
      </OneAutoFitText>
    </div>
  </div>
</template>

<style scoped>
.dice-toast {
  background-color: var(--dnd-parchment-card, #e6d8b8);
  border: 2px solid var(--dnd-gold, #c5a059);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 280px;
  transition: all 0.3s ease;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 头部样式优化 */
.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 顶部对齐 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 6px;
  margin-bottom: 2px;
}

.header-info {
  display: flex;
  flex-direction: column; /* 垂直排列 标题 和 公式 */
  overflow: hidden;
}

.title {
  font-weight: 900;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  line-height: 1.2;
}

.notation {
  font-size: 0.75rem;
  color: var(--dnd-ink-secondary);
  font-family: 'Courier New', monospace;
  margin-top: 2px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 0.8;
  color: var(--dnd-ink-secondary);
  padding: 0 0 0 8px;
}

/* 详情区 */
.toast-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  font-size: 0.9rem;
  /* 增加一点背景区分详情 */
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 6px;
}

/* ... 骰子样式 die-item 等保持不变 ... */
.die-item {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 2px;
  background-color: #fff;
  border: 1px solid #ccc; /* 增加边框增加立体感 */
  border-radius: 4px;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  margin-right: 2px;
}
.die-item.invalid {
  opacity: 0.4;
  text-decoration: line-through;
  border-style: dashed;
}

.roll-group {
  display: flex;
  align-items: center;
}
.operator {
  margin: 0 4px;
  color: #666;
}

/* 底部结果 */
.toast-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 4px;
}
.total-label {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  text-transform: uppercase;
}
.total-result {
  font-weight: 900;
  color: var(--dnd-dragon-red);
  line-height: 1;
}
.total-result-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  max-height: 35px;
}
</style>
