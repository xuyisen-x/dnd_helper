<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { nanoid } from 'nanoid'
import { VueDraggable } from 'vue-draggable-plus'

const TipTapEditor = defineAsyncComponent(() => import('@/components/Common/TipTapEditor.vue'))

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const nowDateString = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const addStoryEntry = () => {
  const newEntry = {
    id: nanoid(),
    title: '',
    content: '',
    createdAt: nowDateString(),
    editedAt: nowDateString(),
  }
  sheet.value.story.push(newEntry)
}

const deleteStoryEntry = (index: number) => {
  sheet.value.story.splice(index, 1)
}

// 选择相关逻辑
const selectedEntryId = ref<string | null>(null)
const selectedEntry = computed(() => {
  return sheet.value.story.find((entry) => entry.id === selectedEntryId.value) || null
})
</script>

<template>
  <div class="story-sheet">
    <div class="timeline-container">
      <div class="timeline-list">
        <VueDraggable
          v-model="sheet.story"
          :animation="150"
          handle=".drag-handle"
          ghost-class="ghost-item"
          :force-fallback="true"
          class="drag-wrapper"
        >
          <div
            v-for="(item, index) in sheet.story"
            :key="item.id"
            class="timeline-item"
            :class="{ active: selectedEntryId === item.id }"
            @click.stop="selectedEntryId = item.id"
          >
            <div class="drag-handle" title="按住左侧边缘拖拽排序"></div>

            <div>
              <div class="timeline-dot"></div>
              <div class="timeline-dash"></div>
              <div class="timeline-content">
                <input
                  v-model.lazy="item.title"
                  class="title"
                  placeholder="未命名冒险"
                  @change="item.editedAt = nowDateString()"
                />
                <p class="desc">创建于：{{ item.createdAt }}</p>
                <p class="desc">编辑于：{{ item.editedAt }}</p>
              </div>
            </div>

            <div
              class="delete-record-btn"
              @click.stop="deleteStoryEntry(index)"
              title="删除此冒险记录"
            >
              ×
            </div>
          </div>
        </VueDraggable>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-dash"></div>
          <div class="timeline-content">
            <h3 class="title btn-add" @click="addStoryEntry()">+ 开启一段新的冒险</h3>
          </div>
        </div>
      </div>
    </div>
    <div class="story-editor">
      <TipTapEditor
        v-if="selectedEntry !== null"
        v-model="selectedEntry.content"
        placeholder="请记录您的冒险故事"
        @update:model-value="selectedEntry.editedAt = nowDateString()"
      />
      <div v-else class="empty-tip">请选择左侧的冒险记录进行编辑</div>
    </div>
  </div>
</template>

<style scoped>
.story-sheet {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 2fr;
  min-height: 400px;
  max-height: 700px;
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
}

.story-editor {
  padding: 10px;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  overflow-y: auto;
  min-height: 0;
}

/* --- 整体容器 --- */
.timeline-container {
  position: relative;
  min-height: 0;
  overflow-y: auto;
}

/* 2. 【新增】内部容器：画线的地方 */
.timeline-list {
  position: relative; /* 核心：让内部这块无限长的画板作为定位基准 */
  padding-top: 10px; /* 顶部留点空隙 */
  min-height: 100%;
  padding-bottom: 20px; /* 让父容器自身底部留白，代替 margin */
}

/* 确保拖拽容器占满宽度，不影响布局 */
.drag-wrapper {
  display: block;
  width: 100%;
}

/* --- 拖拽手柄 --- */
.drag-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 50px;
  cursor: grab;
  z-index: 10;
  /* 移除了之前所有兼容原生拖拽的 -webkit-user-drag 代码，因为不再需要了 */
}
.drag-handle:active {
  cursor: grabbing;
}

/* --- 拖拽时的占位符样式 (SortableJS 自动挂载) --- */
.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}

/* 3. 贯穿的线：现在画在内部画板上 */
.timeline-list::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0; /* 这里的 bottom: 0 指的是所有内容的最底部，再也不会断了！ */
  left: 15px;
  width: 2px;
  background-color: var(--dnd-ink-primary);
}

/* --- 单个节点容器 --- */
.timeline-item {
  position: relative;
  padding-left: 50px; /* 给左侧的线、圆点、横线留出足够的空间 */
  padding-right: 50px;
  padding-top: 20px;
  padding-bottom: 20px;
  margin-bottom: 20px; /* 节点与节点之间的垂直间距 */
  display: grid;
  grid-template-columns: 1fr auto; /* 左侧内容占满剩余空间，右侧按钮自适应 */
  align-items: center; /* 垂直居中对齐 */
  gap: 20px; /* 左右两列之间的水平间距 */
}
.timeline-item.active {
  background-color: var(--dnd-dragon-red-trans30);
  border-radius: 4px;
}

/* --- 圆点 (*) --- */
.timeline-dot {
  position: absolute;
  left: 10px;
  top: 23px; /* 微调高度，使其与右侧标题对齐 */
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--dnd-dragon-red);
  z-index: 1;
  box-sizing: border-box;
}

/* --- 横线 (----) --- */
.timeline-dash {
  position: absolute;
  left: 22px; /* 从圆点的右侧开始画 */
  top: 28px; /* 垂直居中于标题 */
  width: 20px; /* 横线的长度 */
  height: 2px;
  background-color: var(--dnd-ink-secondary);
}

/* --- 文本内容 --- */
.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}
.desc {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.btn-add {
  cursor: pointer;
  color: var(--dnd-ink-primary);
  transition: color 0.2s;
  border: 1px dashed var(--dnd-ink-primary);
  border-radius: 4px;
  width: fit-content;
  padding: 5px 10px;
  position: relative;
  top: -5px; /* 微调位置，使其与其他节点对齐 */
}
body.has-mouse .btn-add:hover {
  color: var(--dnd-dragon-red);
  border: 1px solid var(--dnd-dragon-red);
}

.delete-record-btn {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary); /* 默认淡色，不抢眼 */
  font-weight: bold;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 4px;
  margin-left: 8px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
}

body.has-mouse .delete-record-btn:hover {
  color: var(--dnd-dragon-red);
  opacity: 0.6;
}

.empty-tip {
  color: var(--dnd-ink-secondary);
  text-align: center;
  margin-top: 30px;
}

.ghost-row {
  opacity: 0.5;
  background: var(--dnd-dragon-red-trans30) !important;
}
</style>
