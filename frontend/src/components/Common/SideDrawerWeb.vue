<script setup lang="ts">
import { ref, watch } from 'vue'
import AboutView from './AboutView.vue'

const isOpen = ref(false)

// 切换抽屉的开合状态，打开时顺便刷新一下数据
const toggleDrawer = async () => {
  isOpen.value = !isOpen.value
}

// 处理点击以外区域时自动关闭抽屉
const drawerRef = ref<HTMLElement | null>(null)
const handleClickOutside = (event: MouseEvent) => {
  if (drawerRef.value && !drawerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

watch(isOpen, (newVal) => {
  if (newVal) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div :class="['history-drawer', { 'is-open': isOpen }]" ref="drawerRef">
    <div class="drawer-content" :class="{ 'is-open': isOpen }">
      <div class="tab-content about-wrapper">
        <AboutView />
      </div>
    </div>

    <button class="toggle-btn" @click="toggleDrawer">
      <span class="arrow">{{ isOpen ? '◀' : '▶' }}</span>
    </button>
  </div>
</template>

<style scoped>
.history-drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 10000;
  display: flex;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-drawer.is-open {
  transform: translateX(0);
}

.drawer-content {
  height: 100%;
  background-color: var(--dnd-parchment-bg);
  color: var(--dnd-ink-primary);
  display: flex;
  flex-direction: column;
  width: 600px;
}

.drawer-content.is-open {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border-right: 2px solid var(--dnd-parchment-card);
}

.drawer-tabs {
  display: flex;
  border-bottom: 1px solid var(--dnd-ink-primary);
  background-color: var(--dnd-parchment-card);
  flex-shrink: 0; /* 防止 tabs 被挤压 */
  gap: 10px;
  padding-left: 20px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  padding: 16px 0;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  border-radius: 5px 5px 0 0;
  width: 100px;
}

body.has-mouse .tab-btn:hover {
  color: var(--dnd-dragon-red); /* 悬停变红 */
  background-color: rgba(255, 255, 255, 0.3);
}
.tab-btn.active {
  background-color: rgba(255, 255, 255, 0.3);
  border-bottom-color: var(--dnd-dragon-red);
}

/* 🌟 新增：内容区域容器 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.about-wrapper {
  padding: 15px;
}

.history-list {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--dnd-parchment-card);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  border: 1px dashed var(--dnd-ink-primary);
}

.file-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-time {
  font-size: 0.75rem;
  color: var(--dnd-ink-secondary);
  margin-top: 4px;
}

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
body.has-mouse .btn-delete:hover {
  color: var(--dnd-dragon-red);
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 0.9rem;
}

.toggle-btn {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 80px;
  background-color: var(--dnd-parchment-card);
  border: none;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  color: var(--dnd-dragon-red);
}

.toggle-btn:hover {
  background-color: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
}

.arrow {
  font-size: 0.8rem;
}
</style>
