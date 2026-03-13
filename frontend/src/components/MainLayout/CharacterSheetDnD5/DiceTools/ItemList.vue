<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { DAMAGE_OPTIONS } from '@/stores/rules/dnd5'
import { computed, ref } from 'vue'
import { nanoid } from 'nanoid'
import { useDiceBox } from '@/composables/useDiceBox'
import NumberStepper from './NumberStepper.vue'

const { foldAndCheckNumber } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const addAttack = () => {
  sheet.value.diceTools.items.push({
    id: nanoid(),
    name: '',
    expression: '1d4',
    damageType: 'nonmagicalbludgeoning',
    count: 0,
    criticalCount: 0,
  })
}

const removeAttack = (index: number) => {
  sheet.value.diceTools.items.splice(index, 1)
}

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
  const [moved] = sheet.value.diceTools.items.splice(from, 1)
  if (moved) {
    sheet.value.diceTools.items.splice(index, 0, moved)
  }
  handleDragEnd()
}

const computedDamage = computed(() => {
  return sheet.value.diceTools.items.map((attack) => {
    const [result, message] = foldAndCheckNumber(attack.expression)
    return { isValid: result, message }
  })
})
</script>

<template>
  <div>
    <div class="grid-row header-row">
      <div class="col-header"></div>
      <div class="col-header text-center">计数</div>
      <div class="col-header text-center">暴击计数</div>
      <div class="col-header">名称</div>
      <div class="col-header text-center">伤害表达式</div>
      <div class="col-header">伤害类型</div>
      <div class="col-header"></div>
    </div>
    <div
      v-for="(attack, index) in sheet.diceTools.items"
      :key="attack.id"
      class="grid-row data-row"
      :class="{
        dragging: draggingIndex === index,
        'drag-target': dragOverIndex === index && draggingIndex !== null,
        selected: attack.count + attack.criticalCount > 0,
      }"
      draggable="true"
      @dragstart="handleDragStart(index)"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver(index)"
      @drop.prevent="handleDrop(index)"
    >
      <!-- 排序图标 -->
      <div class="col-drag">
        <div class="drag-handle" title="拖动排序">⠿</div>
      </div>
      <!-- 计数器，实际上是一个input -->
      <div class="text-center">
        <NumberStepper v-model="attack.count" />
      </div>
      <!-- 另一个计数器计数器，实际上是一个input -->
      <div class="text-center">
        <NumberStepper v-model="attack.criticalCount" />
      </div>
      <!-- 名称 -->
      <div class="input-wrap col-name">
        <input type="text" v-model="attack.name" class="bare-input name-input" placeholder="长剑" />
      </div>
      <!-- 伤害表达式 -->
      <div class="input-wrap text-center">
        <div class="two-row-container">
          <input
            type="text"
            v-model="attack.expression"
            class="bare-input text-center notation-input"
            placeholder="1d8 + @str"
          />
          <div class="eval-label" :class="{ warning: !computedDamage[index]!.isValid }">
            {{ computedDamage[index]!.message }}
          </div>
        </div>
      </div>
      <!-- 伤害类型下拉框 -->
      <div class="input-wrap">
        <select v-model="attack.damageType" class="dnd-select">
          <option v-for="option in DAMAGE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <!-- 删除按钮 -->
      <div class="input-wrap">
        <button class="btn-delete" @click="removeAttack(index)" title="删除此条目">×</button>
      </div>
    </div>
    <div v-if="sheet.diceTools.items.length === 0" class="empty-tip">点击下方按钮添加攻击方式</div>
    <div class="panel-footer">
      <button class="btn-add" @click="addAttack">+ 添加伤害项</button>
    </div>
  </div>
</template>

<style scoped>
.grid-row {
  display: grid;
  grid-template-columns: 24px 90px 90px 2fr 3fr 90px 30px;
  gap: 5px;
}
.selected {
  background-color: var(--dnd-dragon-red-trans30);
}
.header-row {
  padding-bottom: 4px;
  border-bottom: 1px solid var(--dnd-ink-secondary);
}
.col-header {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
}
.panel-footer {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}
.empty-tip {
  text-align: center;
  color: var(--dnd-ink-secondary);
  font-style: italic;
  padding: 15px 0;
  opacity: 0.7;
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

.col-drag {
  display: flex;
  justify-content: center;
  align-items: center;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--dnd-ink-secondary);
  font-size: 1rem;
}
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

.input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bare-input {
  background: transparent;
  border: none;
  width: 100%;
  outline: none;
  padding: 2px 4px;
  color: var(--dnd-ink-primary);
  font-family: inherit;
  font-weight: 600;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.two-row-container {
  display: flex;
  flex-direction: column;
}
.text-center {
  text-align: center;
}
.eval-label {
  font-size: 0.7rem;
  color: var(--dnd-ink-secondary);
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
.name-input {
  font-size: 1rem;
}
.notation-input {
  font-size: 0.95rem;
}
.warning {
  color: var(--dnd-dragon-red);
}
</style>
