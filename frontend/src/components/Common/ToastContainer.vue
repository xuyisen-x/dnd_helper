<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

// 获取全局状态
const { toasts, remove } = useToastStore()

// 根据类型返回不同的图标或颜色样式
const getTypeClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'toast-success'
    case 'error':
      return 'toast-error'
    case 'warning':
      return 'toast-warning'
    default:
      return 'toast-info'
  }
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="toast-item"
        :class="getTypeClass(item.type)"
        @click="remove(item.id)"
      >
        <span class="icon" v-if="item.type === 'success'">✅</span>
        <span class="icon" v-else-if="item.type === 'error'">❌</span>
        <span class="icon" v-else-if="item.type === 'warning'">⚠️</span>
        <span class="icon" v-else>ℹ️</span>

        <span class="message">{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px; /* 距离顶端 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998; /* 比DiceBox低一层 */

  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 10px; /* 横幅之间的间距 */
  width: 300px;
  pointer-events: none; /* 让容器本身不阻挡鼠标，只让里面的 item 阻挡 */
}

.toast-item {
  pointer-events: auto; /* 恢复点击 */
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;

  /* D&D 风格基础 */
  border: 1px solid var(--dnd-ink-secondary);
  background-color: var(--dnd-parchment-bg);
  color: var(--dnd-ink-primary);
}

/* 不同类型的微调 */
.toast-success {
  border-left: 5px solid #4caf50;
}
.toast-error {
  border-left: 5px solid #f44336;
}
.toast-warning {
  border-left: 5px solid #ff9800;
}
.toast-info {
  border-left: 5px solid #2196f3;
}

.icon {
  margin-right: 8px;
}

/* === 核心动画 (Vue TransitionGroup Magic) === */

/* 1. 进入和离开的过渡状态 */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s ease;
}

/* 2. 进入前 / 离开后 (透明，且向上位移) */
.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-30px); /* 向上飞走/向下飞入 */
}

/* 3. 关键：这是让剩余元素“平滑补位”的魔法 */
.toast-list-leave-active {
  /* 这里的 absolute 是为了让被删除的元素脱离文档流，
     从而让后面的元素能识别到位置变化并触发 move 动画 */
  position: absolute;
}

/* 4. 移动中的元素 (Vue 会自动添加这个类) */
.toast-list-move {
  transition: all 0.4s ease;
}
</style>
