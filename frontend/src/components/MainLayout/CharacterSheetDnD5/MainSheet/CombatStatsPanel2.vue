<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic, formatWithSign } from '@/composables/rules/useDnd5Logic'
import EditPopover from './EditPopover.vue'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import RollConfigPopover from './RollConfigPopover.vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import { isUsingMouse } from '@/composables/useGlobalState'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { initiativeTotal, passivePerception, evalStringWithVariables } = useDnd5Logic(sheet)

// 先攻编辑状态
const isEditingInit = ref(false)
const isConfigOpen = ref(false)
const isEditingAc = ref(false)

const { parseAndRoll } = useDiceBox()

// 先攻投掷
const rollInitiative = async () => {
  // 首先得到加值
  const modify = initiativeTotal.value
  // // 构造掷骰字符串
  const rollString = `1d20${modify >= 0 ? '+' : ''}${modify}`
  const title = `先攻掷骰`
  const result = await parseAndRoll(rollString)

  if (result !== null) {
    addDiceResult(result, rollString, title)
  }
}

// 先攻配置弹窗相关
const openConfig = () => {
  isConfigOpen.value = true
}
</script>

<template>
  <div class="combat-top-container">
    <div class="stats-row row-upper">
      <div class="stat-panel">
        <div class="panel-header">
          <span class="label">速度</span>
        </div>
        <div class="panel-divider"></div>
        <div class="panel-content">
          <div class="value-unit-group">
            <input
              type="text"
              inputmode="numeric"
              v-model.number="sheet.combat.speed"
              class="bare-input medium-value"
            />
            <span class="unit">尺</span>
          </div>
        </div>
        <div class="deco-lines"></div>
      </div>

      <div class="stat-panel">
        <div class="panel-header">
          <span class="label">体型</span>
        </div>
        <div class="panel-divider"></div>
        <div class="panel-content">
          <input type="text" v-model="sheet.combat.size" class="bare-input medium-text" />
        </div>
        <div class="deco-lines"></div>
      </div>

      <div class="stat-panel">
        <div class="panel-header">
          <span class="label">被动察觉</span>
        </div>
        <div class="panel-divider"></div>
        <div class="panel-content">
          <span class="medium-value">{{ passivePerception }}</span>
        </div>
        <div class="deco-lines"></div>
      </div>
    </div>

    <div class="stats-row row-lower">
      <div class="stat-panel">
        <div class="panel-header">
          <span class="label">先攻</span>
          <div
            class="dice-container"
            @click="rollInitiative"
            @contextmenu.prevent.stop="
              () => {
                if (isUsingMouse) openConfig()
              }
            "
            v-longpress="
              () => {
                if (!isUsingMouse) openConfig()
              }
            "
          >
            <DiceIcon class="clickable" title="roll!!!" />
            <RollConfigPopover
              v-if="isConfigOpen"
              title="先攻掷骰"
              :baseModifier="initiativeTotal"
              @close="isConfigOpen = false"
            />
          </div>
        </div>
        <div class="panel-divider"></div>

        <div class="panel-content">
          <span
            class="big-value clickable"
            @click="isEditingInit = true"
            title="点击修改先攻杂项加值"
            >{{ formatWithSign(initiativeTotal) }}
          </span>

          <EditPopover
            v-if="isEditingInit"
            v-model="sheet.extra_modify.initiative"
            @close="isEditingInit = false"
            @click.stop
          />
        </div>
        <div class="deco-lines"></div>
      </div>

      <div class="stat-panel">
        <div class="panel-header">
          <span class="label">护甲等级 (AC)</span>
        </div>
        <div class="panel-divider"></div>
        <div class="panel-content">
          <span
            class="big-value clickable"
            @click="isEditingAc = true"
            title="点击修改先攻表达式"
            >{{ evalStringWithVariables(sheet.combat.ac) }}</span
          >
          <EditPopover
            v-if="isEditingAc"
            v-model="sheet.combat.ac"
            @close="isEditingAc = false"
            title="护驾等级表达式"
            @click.stop
          />
        </div>
        <div class="deco-lines"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combat-top-container {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 两行之间的间距 */
}

/* --- 行布局 --- */
.stats-row {
  display: grid;
  gap: 10px; /* 卡片之间的水平间距 */
}

/* 上排：3等分 */
.row-upper {
  grid-template-columns: 1fr 1fr 1fr;
}

/* 下排：2等分 */
.row-lower {
  grid-template-columns: 1fr 1fr;
}

/* --- 单个面板样式 (完全沿用 D&D 风格) --- */
.stat-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 65px;
}

/* --- 头部 --- */
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

.panel-divider {
  height: 2px;
  background-color: var(--dnd-ink-primary);
  width: 100%;
  opacity: 0.8;
}

/* --- 内容 --- */
.panel-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  position: relative;
  z-index: 1;
}

/* --- 字体大小 --- */
.medium-value {
  font-family: 'Georgia', serif;
  font-size: 1.4rem;
  color: var(--dnd-ink-primary);
  text-align: center;
}

.medium-text {
  font-family: inherit;
  font-size: 1.4rem;
  color: var(--dnd-ink-primary);
  text-align: center;
}

.big-value {
  font-family: 'Georgia', serif;
  font-size: 2.4rem; /* 核心数据大一点 */
  color: var(--dnd-ink-primary);
  line-height: 1;
}

/* --- 输入框基础 --- */
.bare-input {
  background: transparent;
  border: none;
  text-align: center;
  width: 100%;
  outline: none;
  padding: 0;
}

.value-unit-group {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.value-unit-group .bare-input {
  width: auto;
  max-width: 60px;
}
.unit {
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
  margin-left: 2px;
  font-weight: bold;
}

/* --- 装饰线 --- */
.deco-lines {
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.15;
}
.deco-lines::before {
  content: '';
  position: absolute;
  left: -15%;
  height: 100%;
  width: 30%;
  border-right: 2px solid currentColor;
  border-radius: 0 50% 50% 0;
}
.deco-lines::after {
  content: '';
  position: absolute;
  right: -15%;
  height: 100%;
  width: 30%;
  border-left: 2px solid currentColor;
  border-radius: 50% 0 0 50%;
}

.dice-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
