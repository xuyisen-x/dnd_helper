<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import SingleItem from './SingleItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

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
    <VueDraggable
      v-model="sheet.diceTools.items"
      :animation="150"
      handle=".drag-handle"
      ghost-class="ghost-item"
      :force-fallback="true"
    >
      <SingleItem
        v-for="(attack, index) in sheet.diceTools.items"
        :key="attack.id"
        :index="index"
      ></SingleItem>
    </VueDraggable>
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
.text-center {
  text-align: center;
}

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
