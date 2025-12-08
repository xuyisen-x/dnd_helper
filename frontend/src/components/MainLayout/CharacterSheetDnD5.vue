<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import SheetHeader from './CharacterSheetDnD5/MainSheet/SheetHeader.vue'
import MainSheet from './CharacterSheetDnD5/MainSheet.vue'
import SpellsSheet from './CharacterSheetDnD5/SpellsSheet.vue'
import DiceTools from './CharacterSheetDnD5/DiceTools.vue'
import SpellList from './CharacterSheetDnD5/SpellList.vue'
import GlossaryList from './CharacterSheetDnD5/GlossaryList.vue'

// --- Tabs 逻辑 ---
const currentTab = ref<'main' | 'spells' | 'dice' | 'spell_list' | 'glossary'>('main')
const tabs = {
  main: MainSheet,
  spells: SpellsSheet,
  dice: DiceTools,
  spell_list: SpellList,
  glossary: GlossaryList,
}
const currentComponent = computed(() => tabs[currentTab.value])

// --- 双层容器缩放逻辑 ---
const BASE_WIDTH = 1300
const MIN_SCALE = 0.7
const MAX_SCALE = 1.0

// 状态
const scaleRatio = ref(1)
const wrapperStyle = ref({ width: '1300px', height: 'auto' }) // 中间层样式
const sheetRef = ref<HTMLElement | null>(null) // 绑定最内层

// 核心计算函数
const updateLayout = async () => {
  // 1. 计算缩放比例
  const currentWidth = window.innerWidth
  const availableWidth = currentWidth - 120

  let ratio = availableWidth / BASE_WIDTH
  // 限制在 0.8 - 1.0 之间
  ratio = Math.min(Math.max(ratio, MIN_SCALE), MAX_SCALE)
  scaleRatio.value = ratio

  // 2. 等待 Vue 渲染完成 (特别是切换 Tab 后)
  await nextTick()

  if (sheetRef.value) {
    // 3. 获取内部内容的【原始】高度 (不受 transform 影响的高度)
    const rawHeight = sheetRef.value.scrollHeight

    // 4. 强制设置中间层容器的大小
    // Safari 修复关键：显式告诉浏览器这个容器在屏幕上占多少像素
    wrapperStyle.value = {
      width: `${BASE_WIDTH * ratio}px`,
      height: `${rawHeight * ratio}px`,
    }
  }
}

// 监听器
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)

  // 监听内部元素的高度变化 (比如切换到法术页，内容变高了)
  if (sheetRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })
    resizeObserver.observe(sheetRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="layout-anchor">
    <div class="sheet-tabs" :style="{ width: wrapperStyle.width }">
      <button :class="{ active: currentTab === 'main' }" @click="currentTab = 'main'">
        主要属性
      </button>
      <button :class="{ active: currentTab === 'spells' }" @click="currentTab = 'spells'">
        法术
      </button>
      <button :class="{ active: currentTab === 'dice' }" @click="currentTab = 'dice'">
        快速掷骰工具
      </button>
      <div class="blank"></div>
      <button :class="{ active: currentTab === 'glossary' }" @click="currentTab = 'glossary'">
        术语速查表
      </button>
      <button :class="{ active: currentTab === 'spell_list' }" @click="currentTab = 'spell_list'">
        法术速查表
      </button>
    </div>

    <div class="scale-wrapper" :style="wrapperStyle">
      <div class="dnd-sheet" ref="sheetRef" :style="{ transform: `scale(${scaleRatio})` }">
        <SheetHeader v-if="['main', 'spells', 'dice'].includes(currentTab)" />
        <KeepAlive> <component :is="currentComponent" /> </KeepAlive>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 布局容器样式 --- */

/* 1. 最外层：确保整体居中 */
.layout-anchor {
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  width: 100%;
  overflow-x: hidden; /* 防止极小屏幕出现横向滚动条 */
}

/* 2. 中间层：关键修复层 */
.scale-wrapper {
  /* 必须 hidden，Safari 才会忽略 transform 之前的原始尺寸 */
  overflow: hidden;
  /* 平滑过渡，让缩放看起来更丝滑 */
  transition:
    width 0.1s linear,
    height 0.1s linear;
  /* 建立层叠上下文 */
  position: relative;
}

/* 3. 最内层：内容层 */
.dnd-sheet {
  /* 核心：缩放原点设为左上角，配合 Wrapper 的计算 */
  transform-origin: 0 0;
  /* 开启硬件加速，防止字体模糊和残影 */
  will-change: transform;

  /* 保持原有样式 */
  width: 1300px;
  min-height: 800px; /* 给一个最小高度 */
  background-color: var(--dnd-parchment-bg, #f0e6d2);
  color: var(--dnd-ink-primary, #2b2118);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  padding: 30px;
  border-radius: 4px;
  font-family: 'Georgia', serif;

  /* 确保 padding 不会撑大 1300px */
  box-sizing: border-box;
  /* 移除原本可能存在的 margin，由外层控制 */
  margin: 0;
}

/* --- Tabs --- */
.sheet-tabs {
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  /* 宽度通过 style 动态绑定，与 sheet 保持同宽 */
  transition: width 0.1s linear;
}
.sheet-tabs button {
  padding: 10px 20px;
  border: none;
  background: var(--color-background-mute);
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
  color: var(--color-text-soft);
  white-space: nowrap;
}
.sheet-tabs button.active {
  background: var(--dnd-parchment-bg);
  color: var(--dnd-dragon-red);
}
.blank {
  flex: 1;
}

/* --- 原有样式保持不变 --- */
:deep(input),
:deep(textarea) {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dnd-ink-secondary, #75604e);
  color: var(--dnd-ink-primary, #2b2118);
  font-family: inherit;
  outline: none;
  width: 100%;
}
:deep(input:focus),
:deep(textarea:focus) {
  border-bottom-color: var(--dnd-dragon-red, #8a1c1c);
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.clickable) {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    color 0.2s;
}
body.has-mouse .dnd-sheet :deep(.clickable:hover) {
  color: var(--dnd-dragon-red);
}
body.has-mouse .dnd-sheet :deep(.clickable:active) {
  transform: scale(0.95);
}
</style>
