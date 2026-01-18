<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import HitIcon from '@/components/Icons/HitIcon.vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import RollConfigPopover from './RollConfigPopover.vue'
import { isUsingMouse } from '@/composables/useGlobalState'

const showAttackRollConfig = ref<number | null>(null)
const criticalList = ref<number[]>([])

const { parseAndRoll, foldAndCheckNumber } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { addAttack, removeAttack } = useDnd5Logic(sheet)

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleDragStart = (index: number) => {
  draggingIndex.value = index
}

const handleDragOver = (index: number) => {
  if (draggingIndex.value === null || draggingIndex.value === index) return
  dragOverIndex.value = index
}

const handleDragEnd = () => {
  draggingIndex.value = null
  dragOverIndex.value = null
}

const handleDrop = (index: number) => {
  if (draggingIndex.value === null) return
  const from = draggingIndex.value
  if (from === index) return handleDragEnd()
  const [moved] = sheet.value.attacks.splice(from, 1)
  if (moved) {
    sheet.value.attacks.splice(index, 0, moved)
  }
  handleDragEnd()
}

const DealWithCitical = (damage: string, isCritical: boolean) => {
  if (!isCritical) return damage
  return 'rpdice(' + damage + ')'
}

const rollAttack = async (index: number) => {
  const attack = sheet.value.attacks[index]
  if (!attack) return
  const bonus = computedBonus.value[index]?.isValid ? attack.bonus : '0'
  const formula =
    bonus.startsWith('+') || bonus.startsWith('-') ? `1d20 ${bonus}` : `1d20 + ${bonus}`
  const [valid, foledFormula] = foldAndCheckNumber(formula)
  if (!valid) return // 公式无效则不投掷
  const result = await parseAndRoll(formula)
  if (result !== null) {
    addDiceResult(result, foledFormula, `攻击检定: ${attack.name}`)
  }
}

const rollDamage = async (index: number) => {
  const attack = sheet.value.attacks[index]
  if (!attack || !attack.damage) return
  const damage = DealWithCitical(attack.damage, criticalList.value.includes(index))
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
const openAttackConfig = (e: MouseEvent | HTMLElement, index: number) => {
  if ('currentTarget' in e) anchorEl.value = e.currentTarget as HTMLElement | null
  else anchorEl.value = e as HTMLElement | null
  showAttackRollConfig.value = index
  updatePopoverPosition()
}

const attackPopoverStyle = computed(() => ({
  position: 'fixed',
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
  transform: 'translateY(-50%)',
}))

const toggleCritical = (index: number) => {
  const idx = criticalList.value.indexOf(index)
  if (idx === -1) {
    criticalList.value.push(index)
  } else {
    criticalList.value.splice(idx, 1)
  }
}

const computedBonus = computed(() => {
  return sheet.value.attacks.map((attack) => {
    const bonusString = attack.bonus
    const [result, message] = foldAndCheckNumber(bonusString)
    return { isValid: result, message }
  })
})

const computedDamage = computed(() => {
  return sheet.value.attacks.map((attack, index) => {
    const damageString = DealWithCitical(attack.damage, criticalList.value.includes(index))
    const [result, message] = foldAndCheckNumber(damageString)
    return { isValid: result, message }
  })
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
  <div class="attacks-panel">
    <div class="panel-title-bar">
      <span class="label">武器 & 伤害戏法</span>
    </div>

    <div class="panel-divider"></div>

    <div class="table-container">
      <div class="grid-row header-row">
        <div class="col-header col-drag"></div>
        <div class="col-header col-name">名称</div>
        <div class="col-header col-bonus">攻击加值</div>
        <div class="col-header col-damage">伤害</div>
        <div class="col-header col-damage-type">类型</div>
        <div class="col-header col-notes">备注</div>
        <div class="col-header col-action"></div>
      </div>

      <div class="rows-list">
        <div
          v-for="(attack, index) in sheet.attacks"
          :key="attack.id"
          class="grid-row data-row"
          :class="{
            dragging: draggingIndex === index,
            'drag-target': dragOverIndex === index && draggingIndex !== null,
          }"
          @dragover.prevent="handleDragOver(index)"
          @drop.prevent="handleDrop(index)"
        >
          <div class="col-drag">
            <div
              class="drag-handle"
              title="拖动排序"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragend="handleDragEnd"
            >
              ⠿
            </div>
          </div>
          <div class="input-wrap col-name">
            <input type="text" v-model="attack.name" class="bare-input" placeholder="长剑" />
          </div>

          <div class="input-wrap col-bonus">
            <div class="two-row-container">
              <input
                type="text"
                v-model="attack.bonus"
                class="bare-input text-center"
                placeholder="@str + @pb"
              />
              <div class="eval-label" :class="{ 'warning-text': !computedBonus[index]?.isValid }">
                {{ computedBonus[index]?.message }}
              </div>
            </div>
            <div
              @click="rollAttack(index)"
              style="position: relative"
              @contextmenu.prevent.stop="
                (e) => {
                  if (isUsingMouse) openAttackConfig(e, index)
                }
              "
              v-longpress="
                (e: PointerEvent, el: HTMLElement) => {
                  if (!isUsingMouse) openAttackConfig(el, index)
                }
              "
            >
              <DiceIcon class="clickable" />
              <teleport to="body">
                <RollConfigPopover
                  v-if="showAttackRollConfig === index"
                  :title="'攻击检定:' + attack.name"
                  :baseModifier="computedBonus[index]?.isValid ? attack.bonus : 0"
                  :style="attackPopoverStyle"
                  :enable-elven-accuracy="true"
                  @close="((showAttackRollConfig = null), (anchorEl = null))"
              /></teleport>
            </div>
          </div>

          <div class="input-wrap col-damage">
            <div class="two-row-container">
              <input
                type="text"
                v-model="attack.damage"
                class="bare-input text-center"
                placeholder="1d8 + @str"
              />
              <div
                class="eval-label"
                :class="{
                  'critical-label': criticalList.includes(index) && computedDamage[index]?.isValid,
                  'warning-text': !computedDamage[index]?.isValid,
                }"
              >
                {{ computedDamage[index]?.message }}
              </div>
            </div>
            <div @click="toggleCritical(index)" class="icon-check icon">
              <HitIcon title="重击！！" :class="{ checked: criticalList.includes(index) }" />
            </div>
            <div @click="rollDamage(index)" class="icon"><DiceIcon class="clickable" /></div>
          </div>

          <div class="input-wrap col-damage-type">
            <input
              type="text"
              v-model="attack.damageType"
              class="bare-input text-center"
              placeholder="挥砍"
            />
          </div>

          <div class="input-wrap col-notes">
            <input type="text" v-model="attack.notes" class="bare-input" placeholder="请输入备注" />
          </div>

          <div class="col-action">
            <button class="btn-delete" @click="removeAttack(index)" title="删除此条目">×</button>
          </div>
        </div>
        <div v-if="sheet.attacks.length === 0" class="empty-tip">点击下方按钮添加攻击方式</div>
      </div>
      <div class="panel-footer">
        <button class="btn-add" @click="addAttack">+ 添加攻击</button>
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

/* --- 标题栏 --- */
.panel-title-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
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

/* --- 表格布局核心 --- */
.table-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 281px;
}

/* Grid 定义：根据内容重要性分配宽度比例 */
.grid-row {
  display: grid;
  /* 拖动(24px) 名称(3) 加值(1.5) 伤害(2) 类型(0.75) 备注(1.5) 删除按钮(auto) */
  grid-template-columns: 24px 1fr 2fr 2fr 0.75fr 1.5fr 30px;
  gap: 10px;
  align-items: center;
}

/* 表头样式 */
.header-row {
  padding-bottom: 4px;
  border-bottom: 1px solid var(--dnd-ink-secondary);
}
.col-header {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
}
.col-damage,
.col-damage-type,
.col-bonus {
  text-align: center;
}

/* 数据行样式 */
.data-row {
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1); /* 淡淡的分割线 */
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

.panel-footer {
  display: flex;
  justify-content: center;
}
.btn-add {
  background: transparent;
  border: 1px dashed var(--dnd-ink-secondary);
  color: var(--dnd-ink-secondary);
  padding: 6px 15px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.6rem;
  transition: all 0.2s;
}
body.has-mouse .btn-add:hover {
  border-style: solid;
  color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.05);
}

.empty-tip {
  text-align: center;
  color: var(--dnd-ink-secondary);
  font-style: italic;
  padding: 15px 0;
  opacity: 0.7;
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
</style>
