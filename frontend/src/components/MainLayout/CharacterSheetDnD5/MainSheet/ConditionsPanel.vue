<script setup lang="ts">
import { computed, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'

const store = useActiveCharacterStore()

const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const inputDraft = ref<string>('')

const addCondition = () => {
  if (inputDraft.value.trim() === '') return
  sheet.value.conditions.push([inputDraft.value.trim(), true])
  inputDraft.value = ''
}

const deleteCondition = (index: number) => {
  sheet.value.conditions.splice(index, 1)
}

const triggleActive = (index: number) => {
  sheet.value.conditions[index]![1] = !sheet.value.conditions[index]![1]
}
</script>

<template>
  <div class="conditions-panel">
    <label class="title">角色状态</label>
    <div class="content">
      <div
        class="condition-item"
        v-for="([title, active], index) in sheet.conditions"
        :key="index"
        :class="{ active: active }"
        @click="triggleActive(index)"
      >
        <div class="contition-title">{{ title }}</div>
        <button
          class="btn-delete"
          :class="{ active: active }"
          @click.stop="deleteCondition(index)"
          title="删除此状态"
        >
          ×
        </button>
      </div>
      <div class="add-condition">
        <input class="add-input" v-model="inputDraft" type="text" placeholder="添加状态" />
        <button class="btn-add" @click="addCondition()">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title {
  font-size: 1rem;
  font-weight: bold;
}

.conditions-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  max-height: 65px;
}

.content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  overflow-y: auto;
}

.condition-item {
  background-color: var(--dnd-parchment-bg);
  color: var(--dnd-ink-primary);
  border: 1px dashed var(--dnd-ink-secondary);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 10px;
  cursor: pointer;
  user-select: none;
  height: 28px;
}

.condition-item.active {
  background-color: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
  border: 1px solid var(--dnd-dragon-red);
}

.add-condition {
  background-color: var(--dnd-parchment-bg);
  color: var(--dnd-ink-primary);
  border: 1px dashed var(--dnd-ink-secondary);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 10px;
  height: 28px;
}

.add-input {
  width: 80px; /* 给一个固定或合适的宽度 */
}

.contition-title {
  font-size: 1rem;
  display: grid;
  place-items: center; /* 水平竖直同时居中 */
}

.btn-delete.active {
  background: transparent;
  border: none;
  color: var(--dnd-mithral-text);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.5;
  transition: all 0.2s;
}
body.has-mouse .btn-delete.active:hover {
  color: var(--dnd-mithral-text);
  opacity: 1;
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

.btn-add {
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
body.has-mouse .btn-add:hover {
  color: var(--dnd-ink-secondary);
  opacity: 1;
}

.condition-item,
.add-condition {
  flex-shrink: 0; /* 必须加这一行，否则在滚动条出现前，它们会变窄 */
  white-space: nowrap; /* 保证文字不换行 */
}
</style>
