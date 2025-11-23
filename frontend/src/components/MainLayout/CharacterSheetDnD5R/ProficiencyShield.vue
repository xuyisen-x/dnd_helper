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

const { proficiencyBonus, formatWithSign } = useDnd5rLogic(sheet)
</script>

<template>
  <div class="shield-card proficiency-shield">
    <div class="card-header">
      <h3>熟练加值</h3>
    </div>

    <div class="bonus-container">
      <span class="bonus-value">{{ formatWithSign(proficiencyBonus) }}</span>

      <svg class="bg-lines" viewBox="0 0 150 100" preserveAspectRatio="none">
        <path d="M0,0 Q20,60 75,90" fill="none" class="line-stroke" stroke-width="1.5" />
        <path d="M150,0 Q130,60 75,90" fill="none" class="line-stroke" stroke-width="1.5" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* --- 整体容器 (复用 AbilityShield 的基础样式) --- */
.shield-card {
  width: 160px; /* 需求：宽度相同 */
  border: 2px solid var(--dnd-ink-secondary);
  /* 保持相同的盾牌圆角 */
  border-radius: 10px 10px 40px 40px;
  background-color: var(--color-background);
  /* 调整内边距以适应单一数字的布局 */
  padding-bottom: 25px;
  position: relative;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  overflow: hidden;
  margin: 0 auto;
  /* 确保高度足以展示大数字，并与其他盾牌视觉平衡 */
  min-height: 130px;
  display: flex;
  flex-direction: column;
}

/* --- 标题 --- */
.card-header {
  text-align: center;
  padding-top: 12px;
  z-index: 2;
}
.card-header h3 {
  margin: 0;
  /* 字体稍微比属性名小一点点，因为四个字比较宽 */
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--dnd-ink-primary);
}

/* --- 核心数值区 --- */
.bonus-container {
  position: relative;
  flex: 1; /* 占据剩余空间 */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

/* 大数值样式 */
.bonus-value {
  /* 巨大的字体，突出显示 */
  font-size: 4rem;
  font-weight: 900;
  line-height: 1;
  color: var(--dnd-ink-primary);
  z-index: 2;
  /* 添加一点文字描边/阴影，确保背景线不会穿过数字，提高可读性 */
  text-shadow:
    2px 2px 0 var(--color-background),
    -2px -2px 0 var(--color-background),
    2px -2px 0 var(--color-background),
    -2px 2px 0 var(--color-background);
}

/* --- 背景装饰线 (完全复用) --- */
.line-stroke {
  stroke: var(--dnd-ink-secondary);
  opacity: 0.5;
}
.bg-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80%; /* 控制线条高度只在下半部分 */
  z-index: 0;
  pointer-events: none;
}
</style>
