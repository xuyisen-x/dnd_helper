<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { DAMAGE_OPTIONS, type Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import HitIcon from '@/components/Icons/HitIcon.vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import RollConfigPopover from '../Common/RollConfigPopover.vue'
import { isUsingMouse } from '@/composables/useGlobalState'

const props = defineProps<{
  index: number
  draggingIndex: number | null
  dragOverIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'drag-start'): void
  (e: 'drag-over'): void
  (e: 'drag-end'): void
  (e: 'drop'): void
}>()

const showAttackRollConfig = ref<boolean>(false)
const critical = ref<boolean>(false)

const { parseAndRoll, foldAndCheckNumber } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const attackItem = computed(() => sheet.value.attacks[props.index]!)

const { removeAttack } = useDnd5Logic(sheet)

const DealWithCitical = (damage: string, isCritical: boolean) => {
  if (!isCritical) return damage
  return 'rpdice(' + damage + ')'
}

const rollAttack = async () => {
  const attack = attackItem.value
  const bonus = computedBonus.value.isValid ? attack.bonus : '0'
  const formula =
    bonus.startsWith('+') || bonus.startsWith('-') ? `1d20 ${bonus}` : `1d20 + ${bonus}`
  const [valid, foledFormula] = foldAndCheckNumber(formula)
  if (!valid) return // 公式无效则不投掷
  const result = await parseAndRoll(formula)
  if (result !== null) {
    addDiceResult(result, foledFormula, `攻击检定: ${attack.name}`)
  }
}

const rollDamage = async () => {
  const attack = attackItem.value
  if (!attack.damage) return
  const damage = DealWithCitical(attack.damage, critical.value)
  const [valid, foledDamage] = foldAndCheckNumber(damage)
  if (!valid) return // 公式无效则不投掷
  const result = await parseAndRoll(foledDamage)
  if (result !== null) {
    addDiceResult(result, foledDamage, `伤害: ${attack.name}`)
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
const openAttackConfig = (e: MouseEvent | HTMLElement) => {
  if ('currentTarget' in e) anchorEl.value = e.currentTarget as HTMLElement | null
  else anchorEl.value = e as HTMLElement | null
  showAttackRollConfig.value = true
  updatePopoverPosition()
}

const attackPopoverStyle = computed(() => ({
  position: 'fixed',
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
  transform: 'translateY(-50%)',
}))

const toggleCritical = () => {
  critical.value = !critical.value
}

const computedBonus = computed(() => {
  const bonusString = attackItem.value.bonus
  const [result, message] = foldAndCheckNumber(bonusString)
  return { isValid: result, message }
})

const computedDamage = computed(() => {
  const damageString = DealWithCitical(attackItem.value.damage, critical.value)
  const [result, message] = foldAndCheckNumber(damageString)
  return { isValid: result, message }
})

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
  <div
    class="grid-row data-row"
    :class="{
      dragging: props.draggingIndex === props.index,
      'drag-target': props.dragOverIndex === props.index && props.draggingIndex !== null,
    }"
    draggable="true"
    @dragstart="emit('drag-start')"
    @dragend="emit('drag-end')"
    @dragover.prevent="emit('drag-over')"
    @dragenter.prevent
    @drop.prevent="emit('drop')"
  >
    <div class="col-drag">
      <div class="drag-handle" title="拖动排序">⠿</div>
    </div>
    <div class="input-wrap col-name">
      <input type="text" v-model="attackItem.name" class="bare-input" placeholder="长剑" />
    </div>

    <div class="input-wrap col-bonus">
      <div class="two-row-container">
        <input
          type="text"
          v-model="attackItem.bonus"
          class="bare-input text-center"
          placeholder="@str + @pb"
        />
        <div class="eval-label" :class="{ 'warning-text': !computedBonus.isValid }">
          {{ computedBonus.message }}
        </div>
      </div>
      <div
        @click="rollAttack()"
        style="position: relative"
        @contextmenu.prevent.stop="
          (e) => {
            if (isUsingMouse) openAttackConfig(e)
          }
        "
        v-longpress="
          (e: PointerEvent, el: HTMLElement) => {
            if (!isUsingMouse) openAttackConfig(el)
          }
        "
      >
        <DiceIcon class="clickable" />
        <teleport to="body">
          <RollConfigPopover
            v-if="showAttackRollConfig"
            :title="'攻击检定:' + attackItem.name"
            :baseModifier="computedBonus.isValid ? attackItem.bonus : 0"
            :style="attackPopoverStyle"
            :enable-elven-accuracy="true"
            @close="((showAttackRollConfig = false), (anchorEl = null))"
        /></teleport>
      </div>
    </div>

    <div class="input-wrap col-damage">
      <div class="two-row-container">
        <input
          type="text"
          v-model="attackItem.damage"
          class="bare-input text-center"
          placeholder="1d8 + @str"
        />
        <div
          class="eval-label"
          :class="{
            'critical-label': critical && computedDamage.isValid,
            'warning-text': !computedDamage.isValid,
          }"
        >
          {{ computedDamage.message }}
        </div>
      </div>
      <div @click="toggleCritical()" class="icon-check icon">
        <HitIcon title="重击！！" :class="{ checked: critical }" />
      </div>
      <div @click="rollDamage()" class="icon"><DiceIcon class="clickable" /></div>
    </div>

    <div class="input-wrap col-damage-type">
      <select v-model="attackItem.damageType" class="dnd-select">
        <option v-for="option in DAMAGE_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="input-wrap col-notes">
      <input type="text" v-model="attackItem.notes" class="bare-input" placeholder="请输入备注" />
    </div>

    <div class="col-action">
      <button class="btn-delete" @click="removeAttack(props.index)" title="删除此条目">×</button>
    </div>
  </div>
</template>

<style scoped>
.col-damage,
.col-bonus {
  text-align: center;
}

/* 数据行样式 */
.data-row {
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1); /* 淡淡的分割线 */
  -webkit-user-drag: element; /* WKWebView 专供：强制允许拖拽 */
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.data-row.dragging {
  opacity: 0.6;
}

.data-row.drag-target {
  border-color: var(--dnd-dragon-red);
  background-color: rgba(138, 28, 28, 0.05);
}

/* 输入框容器 */
.input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- 输入框基础样式 --- */
.bare-input {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.bare-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
  font-weight: normal;
  font-size: 0.85rem;
}
.text-center {
  text-align: center;
}

/* --- 按钮样式 --- */
.btn-delete {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.5;
  transition: all 0.2s;
}
body.has-mouse .btn-delete:hover {
  color: var(--dnd-dragon-red);
  opacity: 1;
}

.two-row-container {
  display: flex;
  flex-direction: column;
}

.eval-label {
  font-size: 0.7rem;
  color: var(--dnd-ink-secondary);
}

.warning-text.eval-label {
  color: var(--dnd-dragon-red);
}

.icon {
  font-size: 1.5rem;
  margin-left: 0.2rem;
}

.icon-check {
  user-select: none;
  -webkit-user-select: none; /* Safari/Chrome */
  -webkit-touch-callout: none;
  cursor: pointer;
  opacity: 0.8;
  transition:
    opacity 0.2s,
    color 0.2s;
}

body.has-mouse .icon-check:hover {
  color: var(--dnd-dragon-red);
}
body.has-mouse .icon-check:active {
  transform: scale(0.95);
}

.icon.checked {
  color: var(--dnd-dragon-red);
  opacity: 1;
}

.critical-label {
  font-weight: bold;
  color: var(--dnd-dragon-red);
}

.col-drag {
  display: flex;
  justify-content: center;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--dnd-ink-secondary);
  font-size: 1rem;
}

.dnd-select {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
}
</style>
