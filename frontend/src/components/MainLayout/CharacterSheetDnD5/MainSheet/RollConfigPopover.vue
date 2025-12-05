<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'

const props = withDefaults(
  defineProps<{
    title: string
    baseModifier: number | string
    disableDiceGrid?: boolean
    disableCustomBonus?: boolean
    enableElvenAccuracy?: boolean
    callbackAfterRoll?: (result: number) => void
  }>(),
  {
    disableDiceGrid: false,
    disableCustomBonus: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { parseAndRoll } = useDiceBox()

const rollMode = ref<'normal' | 'adv' | 'dis'>('normal')

interface BonusDiceState {
  '1d4': boolean
  '1d6': boolean
  '1d8': boolean
  '1d10': boolean
  '1d12': boolean
}

const bonusDice = ref<BonusDiceState>({
  '1d4': false,
  '1d6': false,
  '1d8': false,
  '1d10': false,
  '1d12': false,
})

const comstomBonus = ref<string>('')
const elvenAccuracyActive = ref<boolean>(false)

// 点击外部关闭
const targetRef: Ref<null | HTMLElement> = ref(null)
// 特殊处理，避免两个弹窗都被弹出的尴尬情况
useEventListener(window, 'pointerdown', (e) => {
  const target = e.target as Node
  // 如果点击的目标不在弹窗内部，就关闭
  if (targetRef.value && !targetRef.value.contains(target)) {
    emit('close')
  }
})

// --- 核心：构建最终公式 ---
const constructFormula = () => {
  let formula = ''

  // 处理优劣势
  if (rollMode.value === 'adv') {
    if (props.enableElvenAccuracy && elvenAccuracyActive.value) {
      formula = '3d20kh1'
    } else {
      formula = '2d20kh1'
    }
  } else if (rollMode.value === 'dis') formula = '2d20kl1'
  else formula = '1d20'

  // 加上基础调整值
  const modifyString = String(props.baseModifier)
  formula +=
    modifyString.startsWith('+') || modifyString.startsWith('-')
      ? ` ${modifyString}`
      : ` + ${modifyString}`

  // 加上额外骰子 (神导术/诗人激励)
  for (const [die, isActive] of Object.entries(bonusDice.value)) {
    if (isActive) {
      formula += `+${die}`
    }
  }

  // 加上额外自定义加值
  if (comstomBonus.value.startsWith('+') || comstomBonus.value.startsWith('-')) {
    formula += comstomBonus.value
  } else if (comstomBonus.value.length > 0) {
    formula += `+${comstomBonus.value}`
  }

  return formula
}

// 执行投掷
const handleRoll = async () => {
  const formula = constructFormula()
  const title = props.title // 标题用于结果记录，固定
  emit('close') // 先关闭弹窗
  const result = await parseAndRoll(formula)
  if (result !== null) {
    addDiceResult(result, formula, title)
    if (props.callbackAfterRoll) {
      props.callbackAfterRoll(result.result)
    }
  }
}

// 切换额外骰子
const toggleBonusDice = (die: keyof BonusDiceState) => {
  bonusDice.value[die] = !bonusDice.value[die]
}
</script>

<template>
  <div class="roll-config-popover" ref="targetRef" @click.stop>
    <div class="arrow"></div>
    <div class="popover-header">{{ title }}</div>

    <div class="mode-selector">
      <button
        class="mode-btn dis"
        :class="{ active: rollMode === 'dis' }"
        @click="rollMode = 'dis'"
      >
        劣势
      </button>
      <button
        class="mode-btn norm"
        :class="{ active: rollMode === 'normal' }"
        @click="rollMode = 'normal'"
      >
        正常
      </button>
      <button
        class="mode-btn adv"
        :class="{ active: rollMode === 'adv' }"
        @click="rollMode = 'adv'"
      >
        优势
      </button>
    </div>

    <!-- 攻击鉴定可能涉及精灵之准的问题 -->
    <div v-if="props.enableElvenAccuracy && rollMode === 'adv'" class="elven-accuracy-container">
      <div
        title="专精"
        class="circle-check clickable"
        :class="{ checked: elvenAccuracyActive }"
        @click="elvenAccuracyActive = !elvenAccuracyActive"
      ></div>
      <div>精灵之准</div>
    </div>

    <div class="divider"></div>

    <div class="bonus-section" v-if="!(disableCustomBonus && disableDiceGrid)">
      <div class="section-label">额外加值</div>

      <div class="dice-grid" v-if="!disableDiceGrid">
        <button
          v-for="d in ['1d4', '1d6', '1d8', '1d10', '1d12']"
          :key="d"
          class="bonus-die-btn"
          :class="{
            active: bonusDice[d as keyof BonusDiceState],
          }"
          @click="toggleBonusDice(d as keyof BonusDiceState)"
        >
          {{ d.replace('1', '') }}
        </button>
      </div>

      <div class="flat-input-row" v-if="!disableCustomBonus">
        <span>自定义</span>
        <input v-model="comstomBonus" placeholder="0" type="text" @keyup.enter="handleRoll" />
      </div>
    </div>

    <button class="do-roll-btn" @click="handleRoll">ROLL</button>
  </div>
</template>

<style scoped>
.arrow {
  position: absolute;
  top: 50%;
  right: 100%;
  transform: rotate(90deg) translateX(-75%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--dnd-ink-primary) transparent transparent transparent;
}

.roll-config-popover {
  position: absolute;
  /* 默认显示在左侧或上方，视具体布局而定 */
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  margin-right: 10px;

  width: 200px;
  background-color: var(--color-background); /* 羊皮纸底色 */
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  padding: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-header {
  margin: 0 0 5px 0;
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-dragon-red);
  font-family: Arial, sans-serif;
  text-align: center;
}

/* 优劣势 */
.mode-selector {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--dnd-ink-secondary);
}
.mode-btn {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 0;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--dnd-ink-secondary);
}
body.has-mouse .mode-btn.dis:hover,
.mode-btn.dis.active {
  background: #ffcccc;
  color: #8a1c1c;
}
body.has-mouse .mode-btn.norm:hover,
.mode-btn.norm.active {
  background: #eee;
  color: #333;
}
body.has-mouse .mode-btn.adv:hover,
.mode-btn.adv.active {
  background: #ccffcc;
  color: #155724;
}
/* 激活状态要有深色背景区分 */
.mode-btn.active {
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}

.divider {
  height: 1px;
  background: var(--dnd-ink-secondary);
  opacity: 0.2;
}

/* 额外骰子 */
.section-label {
  font-size: 0.9rem;
  color: var(--dnd-ink-secondary);
  margin-bottom: 4px;
}
.dice-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.bonus-die-btn {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 3px;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 2px 0;
  color: var(--dnd-ink-primary);
}
body.has-mouse .bonus-die-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
.bonus-die-btn.active {
  background: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
  border-color: var(--dnd-ink-primary);
}
body.has-mouse .bonus-die-btn.active:hover {
  background: var(--dnd-dragon-red-hover);
}

/* 固定值输入 */
.flat-input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
}
.flat-input-row input {
  width: 120px;
  text-align: center;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  background: transparent;
  padding: 2px;
  font-size: 0.9rem;
  outline: none;
}

/* 投掷按钮 */
.do-roll-btn {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 4px;
  font-size: 0.9rem;
}
body.has-mouse .do-roll-btn:hover {
  background-color: var(--dnd-dragon-red-hover);
}

.circle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 50%;
  margin-right: 6px;
}
.circle-check.checked {
  background-color: var(--dnd-ink-primary);
}
body.has-mouse .circle-check:hover {
  border-color: var(--dnd-dragon-red);
}
body.has-mouse .circle-check.checked:hover {
  background-color: var(--dnd-dragon-red);
}

.elven-accuracy-container {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
}
</style>
