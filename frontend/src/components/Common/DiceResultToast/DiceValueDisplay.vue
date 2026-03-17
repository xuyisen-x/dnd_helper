<script setup lang="ts">
import { computed } from 'vue'
import type { ValueSummary, DieDetailSummary } from '@/wasm_utils/oxidice/pkg/oxidice'

const props = defineProps<{
  value: ValueSummary
}>()

const poolData = computed(() => {
  if (props.value.type === 'dicePool') {
    return {
      isPool: true,
      label: '总和',
      mainValue: props.value.value.total,
      details: props.value.value.details,
    }
  } else if (props.value.type === 'successPool') {
    return {
      isPool: true,
      label: '成功数',
      mainValue: props.value.value.count,
      details: props.value.value.details,
    }
  }
  return { isPool: false }
})

const getDieClass = (die: DieDetailSummary) => {
  const classes = []

  // 状态颜色
  if (!die.isKept) {
    classes.push('die-dropped')
  } else {
    if (die.outcome === 'success') classes.push('die-success')
    if (die.outcome === 'failure') classes.push('die-failure')
  }

  return classes.join(' ')
}

const getDieTitle = (die: DieDetailSummary) => {
  let text = `结果: ${die.result}`
  if (!die.isKept) text += ' (被丢弃)'
  if (die.isRerolled) text += '\n[已重投]'
  if (die.explodedTimes > 0) text += `\n[爆炸 ${die.explodedTimes} 次]`
  if (die.rollHistory.length > 1) {
    text += `\n过程: ${die.rollHistory.join(' + ')}`
  }
  return text
}
</script>

<template>
  <div class="value-display-container">
    <div v-if="value.type === 'number'" class="scroll-wrapper simple-value">
      <span class="value-number">{{ value.value }}</span>
    </div>

    <div v-else-if="value.type === 'list'" class="scroll-wrapper list-value">
      <span class="symbol">[</span>
      <span v-for="(num, idx) in value.value" :key="idx" class="list-item">
        {{ num }}<span v-if="idx < value.value.length - 1" class="comma">,</span>
      </span>
      <span class="symbol">]</span>
    </div>

    <div v-else-if="poolData.isPool" class="pool-container">
      <div class="pool-summary">
        <div class="pool-label">{{ poolData.label }}</div>
        <div class="pool-total">{{ poolData.mainValue }}</div>
      </div>

      <div class="pool-dice-grid">
        <div
          v-for="(die, idx) in poolData.details"
          :key="idx"
          class="die-wrapper"
          :title="getDieTitle(die)"
        >
          <div class="die-item" :class="getDieClass(die)">
            {{ die.result }}
          </div>

          <div v-if="die.isRerolled" class="die-badge badge-reroll" title="触发了重投">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6c0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6c0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4l-4-4v3z"
              />
            </svg>
          </div>

          <div
            v-if="die.explodedTimes > 0"
            class="die-badge badge-explode"
            :title="`爆炸了 ${die.explodedTimes} 次`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512">
              <path
                fill="currentColor"
                d="M454.547 16.027C406.8 37.25 381.052 75.064 369.135 123.303c42.096-24.196 72.15-58.61 85.412-107.276zM95.56 19.03c15.534 34.478 41.673 62.266 76.506 84.683 1.576-31.216-1.92-59.57-11.097-84.682H95.56zm223.674 9.507c-27.494 57.123-49.87 115.225-67.9 174.162-13.04-40.243-29.32-79.83-49.25-118.68.247 36.447 3.52 71.91 9.445 106.51-38.943-35.318-79.96-68.894-123.292-100.52 29.922 43.868 62.24 84.967 96.64 123.656-26.502-8.224-56.91-10.145-88.08-5.97 19.645 14.96 42.703 28.156 67.192 36-48.423 2.757-97.046 7.823-145.888 15.45 41.51 7.845 82.85 13.375 124.043 16.842a797.165 797.165 0 0 0-65.536 29.946c40.608-.275 79.997-4.3 118.33-11.577-16.74 21.736-31.644 45.162-44.99 70.028 25.735-15.12 49.978-31.88 72.554-50.477-12.504 58.248-21.31 117.203-27.092 176.738 21.65-50.587 41.044-101.993 57.877-154.328 11.282 28.076 24.197 55.62 38.556 82.696-2.48-37.338-7-74.264-13.793-110.73 46.832 43.08 96.5 82.882 148.472 120.017-38.845-51.87-80.238-101.596-124.584-148.84 65.17-2.498 130.007-9.56 194.576-20.314-47.5-6.818-95.158-11.807-142.99-14.775 19.607-8.637 38.96-18.06 58.078-28.198-36.566 2.427-72.737 6.804-108.467 13.363a476.647 476.647 0 0 0 33.715-52.05 397.556 397.556 0 0 0-47.317 27.36c13.228-57.563 23.26-116.284 29.7-176.308zm175.05 29.625c-48.748 27.205-89.195 69.08-119.934 128.35 46.33-.998 85.935-12.905 119.933-33.666V58.162zM25.36 124.676c-1.285-.01-2.578-.004-3.878.015 24.13 35.622 56.432 55.136 101.748 49.035-24.56-34.196-57.994-48.75-97.87-49.05zm374.08 179.517c-10.527-.03-21.428 1.062-32.66 3.15 34.93 36.464 77.04 54.27 129.158 46.053-26.086-34.646-58.903-49.093-96.5-49.203zM113.774 326.62c-8.008.004-15.842.556-23.472 1.32-25.435 2.57-48.993 9.59-70.666 21.062v70.666c38.192-19.716 72.544-49.83 102.203-92.86-2.708-.13-5.395-.19-8.065-.19zm57.727 49.855c-50.455 23.15-70.933 64.14-72.57 116.345 43.08-26.34 69.47-63.673 72.57-116.345zm157.664 15.744c.832 38.58 10.744 71.555 28.033 99.866h78.843c-22.654-40.592-57.522-74.27-106.877-99.867z"
              />
            </svg>
            <span v-if="die.explodedTimes > 1" class="badge-count">{{ die.explodedTimes }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-computed">...</div>
  </div>
</template>

<style scoped>
.value-display-container {
  width: 100%;
  height: 60px;
  font-family: 'Courier New', Courier, monospace;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* --- 统一容器样式 --- */
.simple-value,
.list-value,
.pool-container {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

/* --- 简单数值 --- */
.simple-value {
  justify-content: center;
  overflow-x: auto;
}
.value-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
}

/* --- 列表 --- */
.list-value {
  color: var(--dnd-ink-secondary);
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 10px;
}
.list-item {
  color: var(--dnd-ink-primary);
  font-weight: bold;
  display: inline-block;
}
.symbol,
.comma {
  color: var(--dnd-ink-secondary);
  font-weight: normal;
  margin-right: 2px;
}

/* --- 骰子池 --- */
.pool-container {
  gap: 0;
  overflow: hidden;
}
.pool-summary {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 60px;
  border-right: 2px solid var(--dnd-gold-dim);
  padding: 0 8px;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 2;
  height: 100%;
}
.pool-label {
  font-size: 0.7rem;
  color: var(--dnd-ink-secondary);
  text-transform: uppercase;
  margin-bottom: 2px;
}
.pool-total {
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 900;
  color: var(--dnd-dragon-red);
}

.pool-dice-grid {
  flex: 1;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
}

/* --- 骰子样式 --- */
.die-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.die-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;

  /* 统一为圆角正方形 */
  border-radius: 6px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border: 2px solid var(--dnd-ink-secondary);
  box-shadow:
    2px 2px 5px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);

  font-size: 1rem;
  font-weight: 900;
  color: var(--dnd-ink-primary);

  cursor: help;
  user-select: none;
  transition: all 0.1s ease-out;
}

.die-wrapper:hover .die-item {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.2);
  border-color: var(--dnd-gold);
  z-index: 10;
}

/* 状态颜色 */
.die-dropped {
  opacity: 0.5;
  background: #d0d0d0;
  border-color: #a0a0a0;
  color: #707070;
  text-decoration: line-through;
  box-shadow: none;
}

.die-success {
  border-color: #2e7d32;
  background: linear-gradient(145deg, #e8f5e9, #c8e6c9);
  color: #1b5e20;
}

.die-failure {
  border-color: #c62828;
  background: linear-gradient(145deg, #ffebee, #ffcdd2);
  color: #b71c1c;
}

/* --- 角标样式 --- */
.die-badge {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 0.6rem;
  font-weight: bold;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  z-index: 5;
}
.die-badge svg {
  width: 10px;
  height: 10px;
}

.badge-reroll {
  top: -3px;
  left: -3px;
  background-color: var(--dnd-magic-blue, #5b8bd1);
}

.badge-explode {
  top: -3px;
  right: -3px;
  background-color: var(--dnd-dragon-red);
  padding: 0 3px;
  min-width: 14px;
  width: auto;
}
.badge-count {
  margin-left: 1px;
  line-height: 1;
}
</style>
