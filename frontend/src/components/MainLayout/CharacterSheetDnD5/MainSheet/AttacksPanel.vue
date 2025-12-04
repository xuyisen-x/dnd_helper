<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'

const { parseAndRoll } = useDiceBox()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { addAttack, removeAttack } = useDnd5Logic(sheet)

// const rollAttack = (id: number) => async () => {
//   // TODO
// }

const rollDamage = async (index: number) => {
  const attack = sheet.value.attacks[index]
  console.log(attack)
  if (!attack || !attack.damage) return
  const result = await parseAndRoll(attack.damage)
  if (result !== null) {
    addDiceResult(result, attack.damage, `伤害: ${attack.name}`)
  }
}
</script>

<template>
  <div class="attacks-panel">
    <div class="panel-title-bar">
      <span class="label">武器 & 伤害戏法</span>
    </div>

    <div class="panel-divider"></div>

    <div class="table-container">
      <div class="grid-row header-row">
        <div class="col-header col-name">名称</div>
        <div class="col-header col-bonus">攻击加值</div>
        <div class="col-header col-damage">伤害</div>
        <div class="col-header col-damage-type">类型</div>
        <div class="col-header col-notes">备注</div>
        <div class="col-header col-action"></div>
      </div>

      <div class="rows-list">
        <div v-for="(attack, index) in sheet.attacks" :key="attack.id" class="grid-row data-row">
          <div class="input-wrap col-name">
            <input type="text" v-model="attack.name" class="bare-input" placeholder="长剑" />
          </div>

          <div class="input-wrap col-bonus">
            <input
              type="text"
              v-model="attack.bonus"
              class="bare-input text-center"
              placeholder="@str + @pb"
            />
            <div><DiceIcon class="clickable" /></div>
          </div>

          <div class="input-wrap col-damage">
            <input
              type="text"
              v-model="attack.damage"
              class="bare-input text-center"
              placeholder="1d8 + @str"
            />
            <div @click="rollDamage(index)"><DiceIcon class="clickable" /></div>
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
  border: 2px solid var(--dnd-ink-secondary);
  overflow: hidden;
  margin-top: 10px; /* 与上方组件拉开距离 */
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
  height: 270px;
  overflow-y: auto;
}

/* Grid 定义：根据内容重要性分配宽度比例 */
.grid-row {
  display: grid;
  /* 名称(3) 加值(1.5) 伤害(2) 备注(2.5) 删除按钮(auto) */
  grid-template-columns: 1fr 2fr 2fr 0.75fr 2.5fr 30px;
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
.btn-delete:hover {
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
.btn-add:hover {
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
</style>
