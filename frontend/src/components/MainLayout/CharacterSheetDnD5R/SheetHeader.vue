<template>
  <header class="sheet-header">
    <div class="header-main">
      <div class="char-name-box">
        <input type="text" class="input-title" />
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
</template>

<style scoped>
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
</style>
