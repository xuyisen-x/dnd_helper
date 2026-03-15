<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps(nodeViewProps)

const scaleInput = ref(100) // 用来绑定输入框的值（默认 100）
const imgContainerRef = ref<HTMLElement | null>(null) // 获取图片容器的 DOM 引用，用于计算位置
const popupRef = ref<HTMLElement | null>(null) // 1. 新增：获取弹窗的 DOM 引用
const popupStyle = ref({ top: '0px', left: '0px' }) // 动态计算的弹窗样式

// 组件挂载时，读取已有的宽度并回显到输入框
onMounted(() => {
  const width = props.node.attrs.width
  if (width && typeof width === 'string' && width.endsWith('%')) {
    scaleInput.value = parseInt(width.replace('%', ''), 10)
  }
})

// 计算并更新弹窗的绝对位置
const updatePosition = () => {
  if (!imgContainerRef.value || !props.selected) return // 只有在图片被选中时才显示弹窗并计算位置
  const rect = imgContainerRef.value.getBoundingClientRect()
  popupStyle.value = {
    top: `${rect.top + window.scrollY - 65}px`,
    left: `${rect.left + window.scrollX + rect.width / 2}px`,
  }
}

const handleOutsideClick = (event: MouseEvent) => {
  if (!props.selected) return
  const target = event.target as Node
  const isInsideImage = imgContainerRef.value?.contains(target)
  const isInsidePopup = popupRef.value?.contains(target)

  if (!isInsideImage && !isInsidePopup) {
    // 检查是否点击了编辑器内部的其他文字区域
    const isInsideEditor = props.editor.view.dom.contains(target)

    if (!isInsideEditor) {
      // 如果点击了编辑器完全外部的区域（如网页侧边栏、空白处）
      // 我们通过把光标移动到图片后面来强制取消图片的选中状态
      const pos = props.getPos()
      if (typeof pos === 'number') {
        props.editor.commands.setTextSelection(pos + 1)
      }
    }
  }
}

watch(
  () => props.selected,
  (isSelected) => {
    if (isSelected) {
      nextTick(updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      window.addEventListener('mousedown', handleOutsideClick)
    } else {
      // 取消监听，隐藏弹窗
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  },
)
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('mousedown', handleOutsideClick)
})

// 应用缩放比例
const applyScale = () => {
  let scale = scaleInput.value
  // 做一个简单的边界限制
  if (scale < 10) scale = 10
  if (scale > 200) scale = 200
  scaleInput.value = scale // 纠正输入框里可能存在的越界数值

  // 更新 Tiptap 模型中的 width 属性，带上 '%' 号
  props.updateAttributes({ width: `${scale}%` })

  // 尺寸改变后，图片大小变了，需要重新计算弹窗位置
  nextTick(updatePosition)
}

const setScala = (scale: number) => {
  scaleInput.value = scale
  applyScale()
}
</script>

<template>
  <NodeViewWrapper class="image-node-wrapper">
    <div class="image-container" :class="{ 'is-selected': selected }" ref="imgContainerRef">
      <Teleport to="body">
        <div v-if="selected" class="scale-popup" :style="popupStyle" ref="popupRef">
          <div class="scale-btn" :class="{ active: scaleInput === 25 }" @click="setScala(25)">
            25%
          </div>
          <div class="scale-btn" :class="{ active: scaleInput === 50 }" @click="setScala(50)">
            50%
          </div>
          <div class="scale-btn" :class="{ active: scaleInput === 75 }" @click="setScala(75)">
            75%
          </div>
          <div class="scale-btn" :class="{ active: scaleInput === 100 }" @click="setScala(100)">
            100%
          </div>

          <div class="divider"></div>

          <div class="custom-input-wrapper">
            <input
              v-model.number="scaleInput"
              type="number"
              min="10"
              max="100"
              class="scale-input"
              @change="applyScale"
              title="自定义比例"
            />
            <span class="label">%</span>
          </div>
        </div>
      </Teleport>

      <img
        :src="node.attrs.src"
        :alt="node.attrs.alt"
        :title="node.attrs.title"
        :style="{ width: node.attrs.width || '100%' }"
      />
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.image-node-wrapper {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0; /* 上下多留一点空间，防止小弹窗挡住上一行文字 */
}

.image-container {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 100%; /* 占满容器，但图片自身由 style 控制 */
}

.image-container img {
  border-radius: 4px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

/* 选中时的图片外边框提示 */
.image-container.is-selected img {
  border-color: var(--dnd-magic-blue);
}

/* --- 悬浮输入框样式 --- */
.scale-popup {
  position: absolute;
  transform: translateX(-50%);
  background-color: var(--dnd-parchment-card);
  border: 1px solid var(--dnd-ink-secondary);
  padding: 6px; /* 增加一点内边距让菜单更舒展 */
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 阴影调柔和一点 */
  display: flex;
  align-items: center;
  gap: 2px; /* 按钮之间的基础间距缩小，靠 padding 撑开 */
  z-index: 20;
  user-select: none;
  font-size: 14px;
  color: var(--dnd-ink-primary);
}

/* --- 快捷按钮样式 --- */
.scale-btn {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

body.has-mouse .scale-btn:hover {
  background-color: rgba(0, 0, 0, 0.05); /* 浅色悬浮背景 */
}

/* 当前处于该比例时的高亮样式 */
.scale-btn.active {
  background-color: var(--dnd-magic-blue);
  color: var(--dnd-mithral-text);
}

.divider {
  width: 1px;
  height: 18px;
  background-color: var(--dnd-ink-secondary);
  margin: 0 6px;
  opacity: 0.5; /* 半透明不抢戏 */
}

/* --- 自定义输入框包装器 --- */
.custom-input-wrapper {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.03); /* 默认微暗底色 */
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 6px;
  transition: all 0.2s ease;
}

.custom-input-wrapper:focus-within {
  border-color: var(--dnd-magic-blue);
  background-color: transparent;
}

.scale-input {
  width: 32px;
  text-align: right; /* 数字靠右和 % 号挨着更好看 */
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: var(--dnd-ink-primary);
  padding: 0;
  appearance: textfield; /* 隐藏火狐的上下小箭头 */
}

.scale-input::-webkit-outer-spin-button,
.scale-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.label {
  font-size: 13px;
  color: var(--dnd-ink-secondary);
  margin-left: 2px;
  font-weight: 500;
}
</style>
