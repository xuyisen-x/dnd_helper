<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5rData } from '@/stores/rules/dnd5r'
import { useDnd5rLogic } from '@/composables/rules/useDnd5rLogic'
import ClassManager from './ClassManager.vue'

const store = useActiveCharacterStore()

const sheet = computed({
  get: () => store.data as Dnd5rData,
  set: (val) => (store.data = val),
})

const { totalLevel } = useDnd5rLogic(sheet)

// 处理只允许输入正整数的函数
const handleNumberInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const cleanValue = target.value.replace(/\D/g, '') // 1. 移除所有非数字字符
  target.value = cleanValue === '' ? '0' : cleanValue // 2. 更新输入框显示
  sheet.value.basic.xp = cleanValue === '' ? 0 : Number(cleanValue) // 3. 更新数据模型
}

const shortRest = () => {
  console.log('Short Rest triggered')
  // TODO
}

const longRest = () => {
  console.log('Long Rest triggered')
  // TODO
}
</script>

<template>
  <header class="sheet-header" v-if="sheet">
    <div class="top-section">
      <div class="main-grid">
        <div class="char-name-box">
          <input
            type="text"
            v-model="sheet.basic.name"
            class="input-title"
            placeholder="未命名角色"
          />
          <label>角色姓名</label>
        </div>
        <div class="btn-group">
          <div class="rest-btn short-rest" @click="shortRest" title="消耗生命骰恢复生命">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <g fill="currentColor">
                <path d="M13 6h-2v1a1 1 0 1 0 2 0z" />
                <path
                  fill-rule="evenodd"
                  d="M6 2v2h1v3a5 5 0 0 0 5 5a5 5 0 0 0-5 5v3H6v2h12v-2h-1v-3a5 5 0 0 0-5-5a5 5 0 0 0 5-5V4h1V2zm3 2h6v3a3 3 0 1 1-6 0zm0 13v3h6v-3a3 3 0 1 0-6 0"
                  clip-rule="evenodd"
                />
              </g>
            </svg>
            短休
          </div>

          <div class="rest-btn long-rest" @click="longRest" title="恢复所有生命值和法术位">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="4"
              >
                <path d="M44 35h-4L24 6.5L8 35H4" />
                <path
                  d="M24 31c-2.761 0-5 3.582-5 8v2h10v-2c0-4.418-2.239-8-5-8M4 41h40M15 23s5-4 9-4s9 4 9 4m7-17l-2 3l2 3m0-6l2 3l-2 3M7 17l-1 2l1 2m0-4l1 2l-1 2"
                />
              </g></svg
            >长休
          </div>
        </div>
      </div>

      <div class="side-grid">
        <div class="info-grid">
          <div class="field-group">
            <input type="text" v-model="sheet.basic.race" />
            <label>种族</label>
          </div>
          <div class="field-group">
            <input type="text" v-model="sheet.basic.background" />
            <label>背景</label>
          </div>
          <div class="field-group">
            <input
              type="text"
              :value="sheet.basic.xp"
              inputmode="numeric"
              @input="handleNumberInput"
            />
            <label>经验值</label>
          </div>
          <div class="field-group highlight-group">
            <input class="static-val" type="text" :value="totalLevel" disabled />
            <label>总等级</label>
          </div>
        </div>
        <div class="info-grid2">
          <div class="field-group">
            <input type="text" v-model="sheet.basic.alignment" />
            <label>阵营</label>
          </div>
          <ClassManager />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sheet-header {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* --- 上半部分布局 --- */
.top-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: flex-end; /* 底部对齐 */
}

/* 姓名栏 */
.char-name-box {
  flex: 1; /* 占据剩余空间 */
  min-width: 200px;
}
.input-title {
  font-size: 2rem; /* 姓名特别大 */
  font-weight: bold;
  height: 50px;
  font-family: 'Georgia', serif;
}

.main-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 10px;
}

.side-grid {
  background-color: rgba(0, 0, 0, 0.03); /* 极淡的背景区分 */
  border-radius: 6px;
  border: 1px solid var(--color-border, #e0e0e0);
}

/* 右侧信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px; /* 最后一列给总等级留窄一点 */
  gap: 15px;
  padding: 10px 15px;
  align-items: start;
}

.info-grid2 {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 15px;
  padding: 10px 15px;
  align-items: start;
}

.class-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.3);
  padding: 5px;
  border-radius: 4px;
}

.col-class {
  flex: 1.5;
}
.col-subclass {
  flex: 2;
}
.col-level {
  width: 60px;
}
.col-actions {
  width: 30px;
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
}

/* 文本居中辅助类 */
.text-center {
  text-align: center;
}

/* --- 通用 Label 样式 (复用 D&D 风格) --- */
.field-group {
  display: flex;
  flex-direction: column-reverse;
}
.field-group label {
  font-size: 1rem;
  color: var(--dnd-ink-secondary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-group .static-val {
  font-weight: bold;
  color: var(--dnd-dragon-red);
}

.info-grid input {
  font-size: 1.2rem;
  text-align: center;
  color: var(--dnd-ink-primary);
}

.info-grid2 input {
  font-size: 1.2rem;
  text-align: center;
  color: var(--dnd-ink-primary);
}

.btn-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* --- 按钮通用样式 --- */
.rest-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 6px 0;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  /* 防止文字被选中 */
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 点击时的按压效果 */
.rest-btn:active {
  transform: translateY(1px);
  box-shadow: none;
}

/* --- 短休 (Short Rest) - 描边风格 --- */
.short-rest {
  background-color: rgba(255, 255, 255, 0.4);
  border: 1px solid var(--dnd-ink-secondary);
  color: var(--dnd-ink-primary);
}

.short-rest:hover {
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--dnd-ink-primary);
}

/* --- 长休 (Long Rest) - 实心风格 --- */
.long-rest {
  background-color: var(--dnd-dragon-red);
  border: 1px solid var(--dnd-ink-secondary);
  color: var(--dnd-mithral-text); /* 白字 */
}

.long-rest:hover {
  background-color: var(--dnd-dragon-red-hover);
}
</style>
