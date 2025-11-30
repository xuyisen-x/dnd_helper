<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5rData } from '@/stores/rules/dnd5r'
import { useDnd5rLogic } from '@/composables/rules/useDnd5rLogic'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5rData,
  set: (val) => (store.data = val),
})

// 复用逻辑钩子中的 addClass 和 removeClass
const { addClass, removeClass } = useDnd5rLogic(sheet)

// 处理等级输入（防止非法字符）
const handleLevelInput = (e: Event, index: number) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '') // 只留数字
  if (val === '') val = '0'

  target.value = val
  if (sheet.value.basic.classes[index]) {
    sheet.value.basic.classes[index].level = Number(val)
  }
}
</script>

<template>
  <div class="class-manager">
    <div class="manager-header">
      <span class="col-header col-name">职业</span>
      <span class="col-header col-sub">子职</span>
      <span class="col-header col-lvl">等级</span>
      <span class="col-header col-act"></span>
    </div>

    <div class="class-list">
      <div v-for="(cls, index) in sheet.basic.classes" :key="cls.id" class="class-row">
        <div class="input-wrap col-name">
          <input type="text" v-model="cls.name" />
        </div>
        <div class="input-wrap col-sub">
          <input type="text" v-model="cls.subclass" />
        </div>

        <div class="input-wrap col-lvl">
          <input
            type="number"
            inputmode="numeric"
            :value="cls.level"
            @input="(e) => handleLevelInput(e, index)"
            class="text-center"
          />
        </div>

        <div class="col-act">
          <button
            v-if="cls.isPrimary !== true"
            @click="removeClass(index)"
            class="btn-delete"
            title="删除此职业"
          >
            ×
          </button>
          <button
            v-if="cls.isPrimary === true"
            @click="addClass"
            class="btn-delete"
            title="添加职业"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.class-list {
  max-height: 70px;
  overflow-y: auto;
}

.class-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  border: 1px solid var(--color-border, #e0e0e0);
  padding: 10px 15px;
}

/* --- Grid 布局定义 --- */
/* 定义列宽比例：职业(3) 子职(3) 等级(1) 操作(0.5) */
.manager-header,
.class-row {
  display: grid;
  grid-template-columns: 3fr 3fr 1fr 30px;
  gap: 5px;
  align-items: center;
}

/* --- 表头样式 --- */
.col-header {
  font-size: 1rem;
  color: var(--dnd-ink-secondary);
  /* font-weight: bold; */
  text-transform: uppercase;
}

.col-lvl,
.col-act {
  text-align: center;
}

/* --- 行样式 --- */
.class-row {
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}
.class-row:last-child {
  border-bottom: none;
}

/* --- 输入框样式 --- */
.input-wrap input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--dnd-ink-secondary);
  background: transparent;
  color: var(--dnd-ink-primary);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 2px 4px;
  outline: none;
  transition: border-color 0.2s;
  text-align: center;
}

.input-wrap input:focus {
  border-bottom-color: var(--dnd-dragon-red);
  background-color: rgba(255, 255, 255, 0.2);
}

.input-wrap input::placeholder {
  color: rgba(0, 0, 0, 0.3);
  font-weight: normal;
  font-size: 0.8rem;
}

.text-center {
  text-align: center;
}

/* --- 按钮样式 --- */
.btn-delete {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
}
.btn-delete:hover {
  color: var(--dnd-dragon-red);
  opacity: 1;
  transform: scale(1.2);
}
</style>
