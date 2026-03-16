<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { type Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import AttackItem from './AttackItem.vue'
import { VueDraggable } from 'vue-draggable-plus'
const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { addAttack } = useDnd5Logic(sheet)
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

      <VueDraggable
        v-model="sheet.attacks"
        :animation="150"
        handle=".drag-handle"
        ghost-class="ghost-item"
        class="rows-list"
      >
        <AttackItem
          v-for="(attack, index) in sheet.attacks"
          :key="attack.id"
          :index="index"
        ></AttackItem>
      </VueDraggable>
      <div v-if="sheet.attacks.length === 0" class="empty-tip">点击下方按钮添加攻击方式</div>
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
  max-height: 385px;
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
.col-bonus {
  text-align: center;
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

.col-drag {
  display: flex;
  justify-content: center;
}

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
