<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { nanoid } from 'nanoid'
import { confirmationBox } from '@/composables/useConfirmationBox'
import SpellTableItem from './SpellTableItem.vue'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const selectedListId = ref<string | null>(null)

const chooseFirstList = () => {
  if (sheet.value.spells.list.length > 0) {
    selectedListId.value = sheet.value.spells.list[0]!.id
  } else {
    selectedListId.value = null
  }
}

const addSpellList = () => {
  const newID = nanoid()
  sheet.value.spells.list.push({
    id: newID,
    name: '',
    ability: '',
    extra_attack_bonus: [],
    extra_dc: [],
    spells: [],
  })
  selectedListId.value = newID
}

const removeSpellList = async (id: string) => {
  const index = sheet.value.spells.list.findIndex((list) => list.id === id)
  if (index !== -1) {
    const item = sheet.value.spells.list[index]!
    const confirmed = await confirmationBox(
      '删除法术列表',
      `确定要删除法术列表 ${item.name} 吗？此操作无法撤销。`,
    )
    if (!confirmed) return
    sheet.value.spells.list.splice(index, 1)
  }
}

const selectedValid = computed(() => {
  if (selectedListId.value === null) {
    return sheet.value.spells.list.length === 0
  }
  return sheet.value.spells.list.some((list) => list.id === selectedListId.value)
})

watch(
  selectedValid,
  (isValid) => {
    if (!isValid) {
      chooseFirstList()
    }
  },
  { immediate: true },
)

// 拖动排序相关
// ====== 新增：拖拽排序逻辑 ======
// 记录当前正在拖拽的标签索引
const draggedIndex = ref<number | null>(null)
// 记录当前被拖拽经过的标签索引（用于增加视觉反馈）
const dragOverIndex = ref<number | null>(null)

const onDragStart = (index: number) => {
  draggedIndex.value = index
}

const onDragEnter = (index: number) => {
  dragOverIndex.value = index
}

const onDrop = (dropIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    // 没有拖拽有效元素，或者原地放下，不做处理
    dragOverIndex.value = null
    return
  }

  // 获取源数据数组
  const list = sheet.value.spells.list
  // 取出被拖拽的元素
  const [movedItem] = list.splice(draggedIndex.value, 1)
  // 将其插入到目标位置
  list.splice(dropIndex, 0, movedItem!)

  // 清理状态
  draggedIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  // 确保拖拽意外中断时清理状态
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="spell-table-panel">
    <div class="sheet-tabs">
      <div class="add-button tab-item" @click="addSpellList">+</div>
      <div
        v-for="(list, index) in sheet.spells.list"
        class="tab-item"
        :key="list.id"
        :class="{
          active: list.id === selectedListId,
          'is-dragging': draggedIndex === index,
          'is-dragover-left': dragOverIndex === index && draggedIndex! > index,
          'is-dragover-right': dragOverIndex === index && draggedIndex! < index,
        }"
        @click="selectedListId = list.id"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragover.prevent
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <div>{{ list.name || '未命名' }}</div>
        <div class="btn-delete" @click.stop="removeSpellList(list.id)">×</div>
      </div>
    </div>
    <SpellTableItem :id="selectedListId" />
  </div>
</template>

<style scoped>
.sheet-tabs {
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  overflow-x: auto;
}
.tab-item {
  text-decoration: none;
  color: var(--dnd-ink-secondary); /* 未选中：浅墨色 */
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; /* 标签高度 */
  padding: 0 1rem;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--dnd-ink-primary);
  border-bottom: 1px solid var(--dnd-parchment-bg);
  background-color: var(--dnd-gold-dim);
  position: relative;
  opacity: 0.7;
  gap: 8px;
  flex-shrink: 0; /* 禁止子元素在 flex 容器中被压缩 */
  white-space: nowrap; /* 确保里面的文字绝对不会换行 */
  user-select: none;
}
body.has-mouse .tab-item:hover {
  color: var(--dnd-dragon-red); /* 悬停变红 */
  background-color: rgba(255, 255, 255, 0.3);
  opacity: 1;
}
.tab-item.active {
  color: var(--dnd-dragon-red); /* 选中文字变红 */
  background-color: var(--dnd-parchment-bg); /* 背景变亮（羊皮纸色） */

  /* 边框处理：让它看起来像连着下面的内容 */
  border-bottom: 1px solid var(--dnd-parchment-bg); /* 底部颜色与内容区一致，造成无缝效果 */
  border-top: 3px solid var(--dnd-dragon-red); /* 顶部加粗红线强调 */

  font-weight: bold;
  opacity: 1;
}
.tab-item.is-dragging {
  opacity: 0.3;
  transform: scale(0.95);
}
.tab-item.is-dragover-right {
  border-right: 3px solid var(--dnd-dragon-red);
  background-color: rgba(255, 255, 255, 0.5);
}
.tab-item.is-dragover-left {
  border-left: 3px solid var(--dnd-dragon-red);
  background-color: rgba(255, 255, 255, 0.5);
}
.tab-item[draggable='true']:active {
  cursor: grabbing;
}
.btn-delete {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  font-family: Arial, sans-serif;
}
body.has-mouse .btn-delete:hover {
  color: var(--dnd-dragon-red);
  opacity: 1;
  transform: scale(1.2);
}
.add-button {
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 20px;
}
</style>
