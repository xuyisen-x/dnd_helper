<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'
import DiceIcon from '../Icons/DiceIcon.vue'
import MutiDiceIcon from '../Icons/MutiDiceIcon.vue'
import { onClickOutside } from '@vueuse/core'
import { addDiceResult } from '@/stores/dice-result'

const { parseAndRoll, showAnimation } = useDiceBox()

type DiceType = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'

interface DiceConfig {
  type: DiceType
  icon: string
}

const isPanelOpen = ref(false) // 控制面板展开与否
const customFormula = ref('') // 自定义骰子表达式
const rollHistory = ref<string[]>([]) // 投掷历史记录
const MAX_HISTORY_LENGTH = 8

// 记录每种骰子的数量
const selection = ref<Record<DiceType, number>>({
  d100: 0,
  d20: 0,
  d12: 0,
  d10: 0,
  d8: 0,
  d6: 0,
  d4: 0,
})

// 骰子配置列表
const diceTypes: DiceConfig[] = [
  { type: 'd20', icon: 'dice-d20' },
  { type: 'd12', icon: 'dice-d12' },
  { type: 'd100', icon: 'dice-d100' },
  { type: 'd10', icon: 'dice-d10' },
  { type: 'd8', icon: 'dice-d8' },
  { type: 'd6', icon: 'dice-d6' },
  { type: 'd4', icon: 'dice-d4' },
]

const totalSelected = computed(() => {
  return Object.values(selection.value).reduce((sum, count) => sum + count, 0)
})

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
  if (!isPanelOpen.value) clearState() // 关闭时清空选择
}

const addDice = (type: DiceType) => {
  selection.value[type]++
}

const removeDice = (type: DiceType) => {
  if (selection.value[type] > 0) {
    selection.value[type]--
  }
}

const clearState = () => {
  // 清空选择
  ;(Object.keys(selection.value) as DiceType[]).forEach((key) => {
    selection.value[key] = 0
  })
  // 清空自定义输入
  customFormula.value = ''
}

const removeHistoryItem = (index: number) => {
  rollHistory.value.splice(index, 1)
}

const rollDiceText = async (diceExpression: string) => {
  const promisedResult = parseAndRoll(diceExpression)

  // 投掷后的清理工作
  clearState()
  isPanelOpen.value = false

  const result = await promisedResult

  // 如果投掷成功，记录历史
  if (result !== null) {
    const existingIndex = rollHistory.value.indexOf(diceExpression)
    if (existingIndex !== -1) {
      rollHistory.value.splice(existingIndex, 1)
    }
    rollHistory.value.unshift(diceExpression)
    if (rollHistory.value.length > MAX_HISTORY_LENGTH) {
      rollHistory.value.pop()
    }
  }

  // 添加到骰子结果通知
  if (result !== null) {
    addDiceResult(result, diceExpression, '自定义')
  }
}

const rollDice = async () => {
  if (totalSelected.value === 0 && customFormula.value === '') return

  // 构建骰子表达式
  const temp = Object.entries(selection.value)
    .map(([type, count]) => {
      return count > 0 ? `${count}${type}` : ''
    })
    .filter((expr) => expr !== '')
    .join('+')
    .trim()

  const diceExpression = (() => {
    // 如果骰子表达式为空，使用自定义输入，去除头尾空格后，去除头部多余的加号
    const trimmedCustomFormula = customFormula.value.replace(/\s+/g, '')
    if (temp === '') {
      return trimmedCustomFormula.replace(/^\+/, '')
    } else if (trimmedCustomFormula === '') {
      return temp
    } else if (trimmedCustomFormula.startsWith('+') || trimmedCustomFormula.startsWith('-')) {
      return `${temp}${trimmedCustomFormula}`
    } else {
      return `${temp}+${trimmedCustomFormula}`
    }
  })()

  await rollDiceText(diceExpression)
}

const containnerRef = ref(null)
onClickOutside(containnerRef, () => {
  if (isPanelOpen.value) {
    isPanelOpen.value = false
    clearState()
  }
})
</script>

<template>
  <div class="dice-roller-container" :class="{ 'is-open': isPanelOpen }" ref="containnerRef">
    <div class="control-top">
      <div v-if="isPanelOpen" class="dice-selection-panel">
        <div v-for="dice in diceTypes" :key="dice.type" class="btn-pair">
          <div class="dice-btn" @click="addDice(dice.type)" @contextmenu.prevent>
            <MutiDiceIcon :type="dice.type" fill="#fff">{{ dice.type }}</MutiDiceIcon>
            <Transition name="pop">
              <div v-if="selection[dice.type] > 0" class="badge">
                {{ selection[dice.type] }}
              </div>
            </Transition>
          </div>
          <div class="remove-dice-btn-wrapper">
            <Transition name="pop">
              <div
                v-if="selection[dice.type] > 0"
                class="remove-dice-btn"
                @click="removeDice(dice.type)"
              >
                -1
              </div>
            </Transition>
          </div>
        </div>
      </div>
      <div class="history-list" v-if="isPanelOpen && rollHistory.length > 0">
        <div class="history-title">最近投掷</div>
        <div v-for="(record, index) in rollHistory" :key="index" class="history-entry">
          <span class="history-item" @click="rollDiceText(record)">{{ record }}</span>

          <span class="delete-record-btn" @click.stop="removeHistoryItem(index)" title="删除此记录">
            ×
          </span>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-bottom">
      <div class="control-bar">
        <!-- 关闭按钮 -->
        <button v-if="isPanelOpen" class="icon-btn close-btn" @click="togglePanel" title="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
            />
          </svg>
        </button>

        <button
          class="roll-action-btn"
          :class="{ 'mode-roll': isPanelOpen }"
          @click="isPanelOpen ? rollDice() : togglePanel()"
          :disabled="isPanelOpen && totalSelected === 0 && customFormula.trim() === ''"
        >
          <DiceIcon v-if="!isPanelOpen" class="roll-btn-icon" />
          <span v-else class="roll-text">ROLL</span>
        </button>
      </div>

      <div v-if="isPanelOpen" class="input-wrapper">
        <input v-model="customFormula" placeholder="自定义 (如 2d6+5)" @keyup.enter="rollDice" />
      </div>

      <!-- 控制动画开关的按钮 -->
      <button
        v-if="isPanelOpen"
        class="icon-btn toggle-anim-btn"
        :class="{ 'anim-off': !showAnimation }"
        @click="showAnimation = !showAnimation"
        :title="showAnimation ? '动画: 开' : '动画: 关'"
      >
        <svg
          v-if="showAnimation"
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
          />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M2 5.27L3.28 4L20 20.72L18.73 22l-3.08-3.08c-1.15.38-2.37.58-3.65.58c-5 0-9.27-3.11-11-7.5c.69-1.76 1.79-3.31 3.19-4.54zM12 9a3 3 0 0 1 3 3a3 3 0 0 1-.17 1L11 9.17A3 3 0 0 1 12 9m0-4.5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-4 5.19l-1.42-1.43A9.86 9.86 0 0 0 20.82 12A9.82 9.82 0 0 0 12 6.5c-1.09 0-2.16.18-3.16.5L7.3 5.47c1.44-.62 3.03-.97 4.7-.97M3.18 12A9.82 9.82 0 0 0 12 17.5c.69 0 1.37-.07 2-.21L11.72 15A3.064 3.064 0 0 1 9 12.28L5.6 8.87c-.99.85-1.82 1.91-2.42 3.13"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dice-roller-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10000; /* 比骰子盒子高 */
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 左对齐，为了动画好看 */
  gap: 10px;
}

.btn-pair {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* --- 面板区域 --- */
.dice-selection-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 5px; /* 稍微对齐下面的按钮中心 */
}

.dice-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--dnd-ink-primary, #2b2118);
  color: var(--dnd-parchment-bg, #f0e6d2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  user-select: none; /* 防止狂点时选中文字 */

  font-size: large;
  color: var(--dnd-mithral-text);
}
body.has-mouse .dice-btn:hover {
  background-color: var(--dnd-dragon-red, #8a1c1c);
  transform: scale(1.1);
}

.remove-dice-btn-wrapper {
  width: 35px;
  height: 35px;
}

.remove-dice-btn {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: var(--dnd-ink-primary);
  color: var(--dnd-parchment-bg, #f0e6d2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  user-select: none; /* 防止狂点时选中文字 */
}
body.has-mouse .remove-dice-btn:hover {
  background-color: var(--dnd-dragon-red);
  transform: scale(1.1);
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: var(--dnd-dragon-red, #8a1c1c);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;

  /* --- 尺寸 --- */
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  line-height: 1;
}

/* --- 底部控制栏 --- */
.control-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-top {
  display: flex;
  align-items: top;
  gap: 10px;
}

.control-bar {
  display: flex;
  align-items: center;
  background-color: var(--dnd-dragon-red, #8a1c1c);
  border-radius: 30px;
  padding: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  height: 60px;
  min-width: 60px;
  max-width: 250px;
  transition: width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 弹性动画 */
  overflow: hidden; /* 防止内容溢出 */
}

/* 展开状态：变宽 */
.is-open .control-bar {
  width: 140px;
}

/* 关闭按钮 */
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  margin-right: 8px;
  margin-left: 4px;
}
body.has-mouse .close-btn:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

/* ROLL 按钮 */
.roll-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0;
  flex: 1; /* 占满剩余空间 */
  border-radius: 25px;
}

.roll-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ROLL 按钮悬停效果 (仅在展开且可用时) */
body.has-mouse .mode-roll:not(:disabled):hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.roll-text {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.roll-btn-icon {
  font-size: 40px;
  transition: transform 0.2s;
}

body.has-mouse .roll-btn-icon:hover {
  transform: rotate(360deg) scale(1.1);
}

/* 3. 输入框容器 */
.input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  width: 200px;
  border-radius: 30px;
  background-color: var(--dnd-parchment-card);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.input-wrapper input {
  background-color: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  padding: 6px 8px;
  width: 150px; /* 固定宽度，或者根据需要调整 */
  font-size: 1rem;
  outline: none;
  transition: background-color 0.2s;
  text-align: center;
}
.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}
.input-wrapper input:focus {
  background-color: rgba(0, 0, 0, 0.2);
}

.toggle-anim-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}
.toggle-anim-btn.anim-off {
  background-color: var(--dnd-mithral-text);
  color: var(--dnd-dragon-red);
}

/* --- 历史记录容器 --- */
.history-list {
  /* 布局与尺寸 */
  width: 300px;
  /* 限制高度，超过则滚动，防止占满屏幕 */
  min-height: 100%;
  max-height: 380px;
  overflow-y: auto;

  /* 间距 */
  margin-bottom: 10px; /* 与下方骰子面板的距离 */
  padding: 8px;

  /* 视觉风格：羊皮纸卡片 */
  background-color: var(--dnd-parchment-card, #e6d8b8);
  border: 1px solid var(--dnd-gold, #c5a059);
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

  /* 内部布局 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* --- 标题 --- */
.history-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  border-bottom: 1px solid var(--dnd-ink-secondary);
  opacity: 0.7;
  padding-bottom: 4px;
  margin-bottom: 4px;
}

/* --- 单条记录 --- */
.history-item {
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Courier New', Courier, monospace;
  color: var(--dnd-ink-primary);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;

  /* 交互过渡 */
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.3);

  text-align: center;

  width: 100%;
  display: block;
}

.delete-record-btn {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary); /* 默认淡色，不抢眼 */
  font-weight: bold;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 4px;
  margin-left: 8px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
}

body.has-mouse .delete-record-btn:hover {
  color: var(--dnd-dragon-red);
  opacity: 0.6;
}

.history-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  justify-content: center;
}

/* --- 悬停效果 --- */
body.has-mouse .history-item:hover {
  /* 悬停时变成主题红，文字变白 */
  background-color: var(--dnd-dragon-red, #8a1c1c);
  color: white;

  /* 稍微右移，增加点击欲望 */
  transform: translateX(4px);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

/* --- 点击反馈 --- */
.history-item:active {
  transform: scale(0.98);
}

/* 角标弹出动画 */
.pop-enter-active {
  animation: pop-in 0.2s;
}
@keyframes pop-in {
  0% {
    transform: scale(0);
  }
  80% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
