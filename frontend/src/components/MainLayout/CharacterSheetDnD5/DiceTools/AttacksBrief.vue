<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import RollConfigPopover from '../Common/RollConfigPopover.vue'
import { isUsingMouse } from '@/composables/useGlobalState'
import { nanoid } from 'nanoid'

const showAttackRollConfig = ref<string | null>(null)

const { parseAndRoll, foldAndCheckNumber } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const attacksView = computed(() => {
  const results = []
  results.push({
    id: nanoid(),
    name: '无加值',
    bonus: '0',
    formula: '1d20',
  })
  let counter = 1
  for (const attack of sheet.value.attacks) {
    if (!attack.bonus) continue
    const [valid, foldedBonus] = foldAndCheckNumber(attack.bonus)
    if (!valid) continue
    const rawNotation = `1d20 + (${foldedBonus})`
    const [validFormula, foldedFormula] = foldAndCheckNumber(rawNotation)
    if (!validFormula) continue
    const name = attack.name || `未命名攻击 ${counter++}`
    results.push({
      id: attack.id,
      name: name,
      bonus: foldedBonus,
      formula: foldedFormula,
    })
  }
  return results
})

const rollAttack = async (name: string, formula: string) => {
  // 不需要再验证了，前面已经验证过了
  const result = await parseAndRoll(formula)
  if (result !== null) {
    addDiceResult(result, formula, `攻击检定: ${name}`)
  }
}

const popoverPos = ref({ top: 0, left: 0 })
const anchorEl = ref<HTMLElement | null>(null)
const updatePopoverPosition = () => {
  const el = anchorEl.value
  if (!el) return

  const rect = el.getBoundingClientRect()

  popoverPos.value = {
    // 对应原来的 top: 50% + transform: translateY(-50%)
    top: rect.top + rect.height / 2,
    // 对应原来的 left: calc(100% + 10px)
    left: rect.left + rect.width + 10,
  }
}
const openAttackConfig = (e: MouseEvent | HTMLElement, id: string) => {
  if ('currentTarget' in e) anchorEl.value = e.currentTarget as HTMLElement | null
  else anchorEl.value = e as HTMLElement | null
  showAttackRollConfig.value = id
  updatePopoverPosition()
}

const attackPopoverStyle = computed(() => ({
  position: 'fixed',
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
  transform: 'translateY(-50%)',
}))

onMounted(() => {
  // capture = true，可以捕获到任意滚动容器的 scroll 事件
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', updatePopoverPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', updatePopoverPosition)
})
</script>

<template>
  <div class="attacks-panel">
    <div class="panel-divider"></div>

    <div class="table-container">
      <div v-for="attack in attacksView" :key="attack.id" class="grid-row">
        <!-- 攻击名称 -->
        <div class="name-label">
          {{ attack.name }}
        </div>

        <!-- 攻击加值 -->
        <div class="bonus-label">
          {{ attack.formula }}
        </div>

        <!-- 投掷按钮 -->
        <div
          class="roll-btn"
          @click="rollAttack(attack.name, attack.formula)"
          style="position: relative"
          @contextmenu.prevent.stop="
            (e) => {
              if (isUsingMouse) openAttackConfig(e, attack.id)
            }
          "
          v-longpress="
            (e: PointerEvent, el: HTMLElement) => {
              if (!isUsingMouse) openAttackConfig(el, attack.id)
            }
          "
        >
          <DiceIcon class="clickable" />
          <teleport to="body">
            <RollConfigPopover
              v-if="showAttackRollConfig === attack.id"
              :title="'攻击检定:' + attack.name"
              :baseModifier="attack.bonus"
              :style="attackPopoverStyle"
              :enable-elven-accuracy="true"
              @close="((showAttackRollConfig = null), (anchorEl = null))"
          /></teleport>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 整体容器风格 (复用 D&D 卡片风格) --- */
.attacks-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 100%;
}

/* --- 表格布局核心 --- */
.table-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 281px;
}

/* Grid 定义：根据内容重要性分配宽度比例 */
.grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding: 8px 0;
}

.name-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--dnd-ink-primary);
}

.bonus-label {
  font-size: 1rem;
  color: var(--dnd-ink-primary);
  text-align: center;
}

.roll-btn {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
}
</style>
