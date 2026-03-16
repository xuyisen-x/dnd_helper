<script setup lang="ts">
import { computed } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import EquipmentItem from './EquipmentItem.vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import { nanoid } from 'nanoid'
import { VueDraggable } from 'vue-draggable-plus'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})
const { attunedCount } = useDnd5Logic(sheet)

const addFeature = () => {
  store.data.equipment.push({
    id: nanoid(),
    name: '',
    description: '',
    quantity: 1,
    attunement: false,
    chargesLimit: '',
    chargesCurrent: 0,
    afterShortRest: '',
    afterLongRest: '',
  })
}
</script>

<template>
  <div class="equipment-panel">
    <div class="panel-header">
      <span class="label">装备与物品</span>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-body">
      <div class="equipment-list">
        <VueDraggable
          v-model="store.data.equipment"
          :animation="150"
          handle=".drag-handle"
          ghost-class="ghost-item"
          class="equipment-items"
          :force-fallback="true"
        >
          <EquipmentItem
            v-for="(equip, index) in store.data.equipment"
            :key="equip.id"
            :index="index"
          />
        </VueDraggable>
        <div v-if="store.data.equipment.length === 0" class="empty-tip">点击下方按钮添加</div>
        <div class="equipment-footer">
          <button class="btn-add" @click="addFeature">+ 添加特性</button>
        </div>
      </div>
    </div>
    <div class="panel-footer" v-if="attunedCount > 0">
      <span class="label">已同调魔法物品数：{{ attunedCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.equipment-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 6px 0;
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
  flex-shrink: 0;
}

.panel-body {
  flex: 1;
  padding: 2px 2px;
  min-height: 0;
  overflow: auto;
}

.equipment-list {
  margin: 0 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: auto;
}

.equipment-items {
  display: flex;
  flex-direction: column;
}

.equipment-footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.btn-add {
  background: transparent;
  border: 1px dashed var(--dnd-ink-secondary);
  color: var(--dnd-ink-secondary);
  padding: 6px 15px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.7rem;
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
  padding: 8px 0 4px;
  opacity: 0.7;
}

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
