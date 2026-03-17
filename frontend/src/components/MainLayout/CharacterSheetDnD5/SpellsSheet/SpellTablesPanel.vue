<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { nanoid } from 'nanoid'
import { confirmationBox } from '@/composables/useConfirmationBox'
import SpellTableItem from './SpellTableItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

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
</script>

<template>
  <div class="spell-table-panel">
    <div class="sheet-tabs">
      <div class="add-button tab-item" @click="addSpellList">+</div>
      <VueDraggable
        v-model="sheet.spells.list"
        :animation="150"
        handle=".drag-handle"
        ghost-class="ghost-item"
        class="rows-list"
        :force-fallback="true"
        direction="horizontal"
      >
        <div
          v-for="list in sheet.spells.list"
          class="tab-item"
          :key="list.id"
          :class="{
            active: list.id === selectedListId,
          }"
          @click="selectedListId = list.id"
        >
          <div class="col-drag">
            <div class="drag-handle" title="拖动排序">⠿</div>
          </div>
          <div>{{ list.name || '未命名' }}</div>
          <div class="btn-delete" @click.stop="removeSpellList(list.id)">×</div>
        </div>
      </VueDraggable>
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
.rows-list {
  display: flex;
  gap: 5px;
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
.btn-delete {
  background: transparent;
  border: none;
  color: var(--dnd-ink-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  font-family: Helvetica, Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
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

.col-drag {
  display: flex;
  justify-content: center;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--dnd-ink-secondary);
  font-size: 1rem;
}

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
