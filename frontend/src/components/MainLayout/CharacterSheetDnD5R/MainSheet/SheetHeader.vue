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

const { totalLevel } = useDnd5rLogic(sheet)

// 处理只允许输入正整数的函数
const handleNumberInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const cleanValue = target.value.replace(/\D/g, '') // 1. 移除所有非数字字符
  target.value = cleanValue === '' ? '0' : cleanValue // 2. 更新输入框显示
  sheet.value.basic.xp = cleanValue === '' ? 0 : Number(cleanValue) // 3. 更新数据模型
}
</script>

<template>
  <header class="sheet-header" v-if="sheet">
    <div class="top-section">
      <div class="char-name-box">
        <input
          type="text"
          v-model="sheet.basic.name"
          class="input-title"
          placeholder="未命名角色"
        />
        <label>角色姓名</label>
      </div>

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
    </div>
  </header>
</template>

<style scoped>
.sheet-header {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* --- 上半部分布局 --- */
.top-section {
  display: flex;
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

/* 右侧信息网格 */
.info-grid {
  flex: 2;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px; /* 最后一列给总等级留窄一点 */
  gap: 15px;
  padding: 10px 15px;
  background-color: rgba(0, 0, 0, 0.03); /* 极淡的背景区分 */
  border-radius: 6px;
  border: 1px solid var(--color-border, #e0e0e0);
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
</style>
