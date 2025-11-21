<template>
  <div class="sheet-tabs">
    <button :class="{ active: currentTab === 'main' }" @click="currentTab = 'main'">
      主要属性
    </button>
    <button :class="{ active: currentTab === 'background' }" @click="currentTab = 'background'">
      背景与故事
    </button>
    <button :class="{ active: currentTab === 'spells' }" @click="currentTab = 'spells'">
      法术
    </button>
  </div>
  <div class="dnd-sheet">
    <header class="sheet-header">
      <div class="header-main">
        <div class="char-name-box">
          <input type="text" placeholder="角色姓名" class="input-title" />
          <label>角色姓名</label>
        </div>
        <div class="char-info-grid">
          <div class="field-group"><input type="text" /><label>职业 & 等级</label></div>
          <div class="field-group"><input type="text" /><label>背景</label></div>
          <div class="field-group"><input type="text" /><label>玩家名称</label></div>
          <div class="field-group"><input type="text" /><label>种族</label></div>
          <div class="field-group"><input type="text" /><label>阵营</label></div>
          <div class="field-group"><input type="text" /><label>经验值</label></div>
        </div>
      </div>
    </header>

    <div v-if="currentTab === 'main'">这是主页面</div>
    <div v-if="currentTab === 'background'">这是背景页面</div>
    <div v-if="currentTab === 'spells'">这是法术页面</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 用于切换页面（Page 1: 战斗/属性, Page 2: 背景, Page 3: 法术）
const currentTab = ref<'main' | 'spells' | 'background'>('main')
</script>

<style scoped>
/* 使用 D&D 变量 */
.sheet-wrapper {
  width: fit-content;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--color-background-mute);
  padding: 20px;
  overflow-y: auto;
}

.dnd-sheet {
  /* A4 纸张比例模拟，但在网页上自适应宽度 */
  width: 100%;
  max-width: 1000px;
  background-color: var(--dnd-parchment-bg, #f0e6d2);
  color: var(--dnd-ink-primary, #2b2118);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  padding: 30px;
  border-radius: 4px;
  font-family: 'Georgia', serif; /* 衬线体更有味道 */
}

/* 输入框通用重置 */
input,
textarea {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dnd-ink-secondary, #75604e);
  color: var(--dnd-ink-primary, #2b2118);
  font-family: inherit;
  outline: none;
  width: 100%;
}
input:focus,
textarea:focus {
  border-bottom-color: var(--dnd-dragon-red, #8a1c1c);
  background-color: rgba(255, 255, 255, 0.2);
}

/* --- Header --- */
.sheet-header {
  margin-bottom: 20px;
  border-bottom: 3px double var(--dnd-gold, #c5a059);
  padding-bottom: 10px;
}
.header-main {
  display: flex;
  gap: 20px;
}
.char-name-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.input-title {
  font-size: 1.5rem;
  font-weight: bold;
  height: 40px;
}
.char-info-grid {
  flex: 2;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  background: var(--color-background-soft);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}
.field-group {
  display: flex;
  flex-direction: column-reverse; /* Label 在下 */
}
.field-group label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--dnd-ink-secondary);
}

/* --- Layout Grid Page 1 --- */
.page-main {
  display: grid;
  grid-template-columns: 220px 1fr; /* 左侧窄，右侧宽 */
  gap: 20px;
}
/* 移动端适配 */
@media (max-width: 768px) {
  .page-main {
    grid-template-columns: 1fr;
  }
  .header-main {
    flex-direction: column;
  }
}

/* --- Left Column (Abilities) --- */
.ability-block {
  display: flex;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 5px;
}
.ability-score-box {
  width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--dnd-ink-primary);
  border-radius: 10px 10px 20px 20px; /* 盾牌形状 */
  padding: 5px;
  background: var(--dnd-parchment-bg);
  z-index: 1;
}
.ability-score-box label {
  font-weight: bold;
  font-size: 0.8rem;
}
.mod-score {
  font-size: 1.5rem;
  text-align: center;
  border: none;
  font-weight: bold;
}
.raw-score {
  font-size: 0.9rem;
  text-align: center;
  width: 40px;
  border: 1px solid #ccc;
  border-radius: 10px;
}

.skill-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 10px;
  font-size: 0.85rem;
}
.skill-item {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}
.prof-check {
  width: auto;
  margin-right: 5px;
}
.skill-mod {
  margin-right: 5px;
  min-width: 20px;
  border-bottom: 1px solid #aaa;
  text-align: center;
}

/* --- Center Column (Combat) --- */
.combat-stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}
.shield-box,
.box-square {
  width: 80px;
  height: 90px;
  border: 2px solid var(--dnd-ink-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.shield-box {
  border-radius: 50% 50% 50% 50% / 15% 15% 85% 85%;
} /* 盾牌 */
.shield-box input,
.box-square input {
  font-size: 2rem;
  text-align: center;
  border: none;
}
.shield-box label,
.box-square label {
  font-size: 0.7rem;
  position: absolute;
  bottom: 10px;
  text-transform: uppercase;
}

.hp-section {
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
}
.hp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}
.hp-inputs {
  display: flex;
  gap: 10px;
}
.hp-inputs input {
  width: 60px;
  text-align: center;
  border: 1px solid var(--color-border);
}
.hp-temp {
  height: 40px;
  resize: none;
}

.panel-border {
  border: 1px solid var(--dnd-ink-primary);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.3);
}
.panel-border h4 {
  margin-bottom: 5px;
  font-size: 0.9rem;
  text-transform: uppercase;
  border-bottom: 1px solid #ccc;
  color: var(--dnd-ink-secondary);
}

.attacks-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.attacks-table th {
  text-align: left;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
}
.attacks-table td {
  padding: 2px;
}

.sheet-footer-row {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}
.col-sm {
  flex: 1;
}
.col-lg {
  flex: 2;
}
textarea {
  resize: vertical;
  min-height: 80px;
}

/* --- Tabs --- */
.sheet-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  width: 100%;
  max-width: 1000px;
}
.sheet-tabs button {
  padding: 10px 20px;
  border: none;
  background: var(--color-background-mute);
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
  color: var(--color-text-soft);
}
.sheet-tabs button.active {
  background: var(--dnd-parchment-bg);
  color: var(--dnd-dragon-red);
}

/* --- Page 2 Styles --- */
.spell-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;
}
.spell-stat-box {
  border: 2px solid var(--color-border);
  padding: 10px;
  text-align: center;
  border-radius: 8px;
  width: 120px;
}
.spell-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.spell-row {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  border-bottom: 1px dotted #ccc;
}
.spell-name {
  flex: 1;
  border: none;
}
.lvl-header {
  background: var(--dnd-ink-primary);
  color: var(--dnd-parchment-bg);
  padding: 2px 10px;
  border-radius: 4px;
  margin: 10px 0 5px 0;
  display: flex;
  justify-content: space-between;
}
.coin-row {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}
.coin-box {
  border: 1px solid var(--dnd-gold);
  padding: 5px;
  text-align: center;
  flex: 1;
  border-radius: 50%;
}
</style>
