<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5rData } from '@/stores/rules/dnd5r'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5rData,
  set: (val) => (store.data = val),
})

const toggleInspiration = () => {
  sheet.value.combat.inspiration = !sheet.value.combat.inspiration
}
</script>

<template>
  <div class="shield-card inspiration-shield">
    <div class="card-header">
      <h3>英雄激励</h3>
    </div>

    <div class="content-container" @click="toggleInspiration">
      <div class="icon-wrapper" :class="{ active: sheet.combat.inspiration }">
        <svg viewBox="0 0 24 24" class="star-icon">
          <path
            fill="currentColor"
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"
          />
        </svg>
        <div class="glow-bg" v-if="sheet.combat.inspiration"></div>
      </div>

      <svg class="bg-lines" viewBox="0 0 160 100" preserveAspectRatio="none">
        <path d="M0 20 Q 40 80 80 80" fill="none" class="line-stroke" stroke-width="1.5" />
        <path d="M160 20 Q 120 80 80 80" fill="none" class="line-stroke" stroke-width="1.5" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* --- 整体容器 --- */
.shield-card {
  width: 160px; /* 宽度固定 */
  /* 关键：高度自适应，填充父容器剩余空间 */
  height: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px 10px 50px 50px; /* 底部圆角更大，像个U型盾 */
  background-color: var(--color-background);
  position: relative;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  overflow: hidden;
  margin: 0 auto;

  /* 最小高度，防止空间太小时被压扁 */
  min-height: 100px;
}

/* --- 标题 --- */
.card-header {
  text-align: center;
  padding-top: 12px;
  padding-bottom: 8px;
}
.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--dnd-ink-primary);
}

/* --- 内容容器 --- */
.content-container {
  flex: 1; /* 占据卡片剩余所有高度 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  position: relative;
  cursor: pointer; /* 提示可点击 */
  padding: 20px 0;
}

/* --- 星星图标 --- */
.icon-wrapper {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  transition: all 0.2s ease;

  /* 默认状态：灰色、半透明 */
  color: var(--dnd-ink-secondary);
  opacity: 0.4;
}
.icon-wrapper:hover {
  color: var(--dnd-gold);
  opacity: 0.7;
}

/* 激活状态 */
.icon-wrapper.active {
  color: var(--dnd-gold); /* 变成金色 */
  opacity: 1;
  transform: scale(1.1); /* 稍微放大 */
  filter: drop-shadow(0 0 5px var(--dnd-gold)); /* 发光效果 */
}

.icon-wrapper.active:hover {
  color: var(--dnd-gold); /* 变成金色 */
  opacity: 0.7;
}

.star-icon {
  width: 100%;
  height: 100%;
}

/* 激活时的背景光晕 (可选，增加华丽度) */
.glow-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--dnd-gold-dim) 0%, transparent 70%);
  z-index: -1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}

/* --- 背景线条 --- */
.bg-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
.line-stroke {
  stroke: var(--dnd-ink-secondary);
  opacity: 0.4;
}
</style>
