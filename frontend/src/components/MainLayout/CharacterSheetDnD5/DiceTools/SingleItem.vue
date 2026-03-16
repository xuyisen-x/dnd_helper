<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { DAMAGE_OPTIONS } from '@/stores/rules/dnd5'
import { computed } from 'vue'
import { useDiceBox } from '@/composables/useDiceBox'
import NumberStepper from './NumberStepper.vue'

const props = defineProps<{
  index: number
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const attackItem = computed(() => {
  return sheet.value.diceTools.items[props.index]!
})

const { foldAndCheckNumber } = useDiceBox()

const removeAttack = (index: number) => {
  sheet.value.diceTools.items.splice(index, 1)
}

const computedDamage = computed(() => {
  const [result, message] = foldAndCheckNumber(attackItem.value.expression)
  return { isValid: result, message }
})
</script>

<template>
  <div
    class="grid-row data-row"
    :class="{
      selected: attackItem.count + attackItem.criticalCount > 0,
    }"
  >
    <!-- 排序图标 -->
    <div class="col-drag">
      <div class="drag-handle" title="拖动排序">⠿</div>
    </div>
    <!-- 计数器，实际上是一个input -->
    <div class="text-center">
      <NumberStepper v-model="attackItem.count" />
    </div>
    <!-- 另一个计数器计数器，实际上是一个input -->
    <div class="text-center">
      <NumberStepper v-model="attackItem.criticalCount" />
    </div>
    <!-- 名称 -->
    <div class="input-wrap col-name">
      <input
        type="text"
        v-model="attackItem.name"
        class="bare-input name-input"
        placeholder="长剑"
      />
    </div>
    <!-- 伤害表达式 -->
    <div class="input-wrap text-center">
      <div class="two-row-container">
        <input
          type="text"
          v-model="attackItem.expression"
          class="bare-input text-center notation-input"
          placeholder="1d8 + @str"
        />
        <div class="eval-label" :class="{ warning: !computedDamage.isValid }">
          {{ computedDamage.message }}
        </div>
      </div>
    </div>
    <!-- 伤害类型下拉框 -->
    <div class="input-wrap">
      <select v-model="attackItem.damageType" class="dnd-select">
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
</template>

<style scoped>
.selected {
  background-color: var(--dnd-dragon-red-trans30);
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
