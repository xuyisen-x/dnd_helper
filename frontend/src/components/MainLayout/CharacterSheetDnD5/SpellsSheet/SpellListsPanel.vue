<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data, SpellTypeDnd5 } from '@/stores/rules/dnd5'
import { storeToRefs } from 'pinia'
import { useSpellStore } from '@/stores/rules/dnd5/spells'
import SpellListItem from './SpellListItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const spellStore = useSpellStore()
const { spellsMap, isLoading, error } = storeToRefs(spellStore)
const { getSpell } = spellStore

const props = defineProps<{
  idx: number
  selectedSpellId: string | undefined
}>()

const emit = defineEmits<{
  (e: 'select', spell: Spell): void
}>()

const isValidSpell = (spellDnD5: SpellTypeDnd5): boolean => {
  if (typeof spellDnD5 === 'string') {
    return spellsMap.value[spellDnD5] !== undefined
  }
  return true
}

const selectedTab = ref<number>(-1)

// const currentSpells = computed(() => {
//   let filteredSpells = sheet.value.spells.list[props.idx]!.spells.map((item, idx) => ({
//     item: item,
//     index: idx,
//   }))
//   filteredSpells = filteredSpells.filter((s) => isValidSpell(s.item.spell))
//   let result = filteredSpells.map((s) => {
//     const spellData = getSpell(s.item.spell)[0]
//     return {
//       index: s.index,
//       id: spellData.id,
//       level: spellData.level,
//     }
//   })
//   if (selectedTab.value >= 0) {
//     result = result.filter((s) => s.level === selectedTab.value)
//   }
//   return result
// })

const currentSpells = computed({
  get: () => {
    let filteredSpells = sheet.value.spells.list[props.idx]!.spells.map((item, idx) => ({
      item: item,
      index: idx,
    }))
    filteredSpells = filteredSpells.filter((s) => isValidSpell(s.item.spell))
    let result = filteredSpells.map((s) => {
      const spellData = getSpell(s.item.spell)[0]
      return {
        originalIndex: s.index,
        id: spellData.id,
        level: spellData.level,
      }
    })
    if (selectedTab.value >= 0) {
      result = result.filter((s) => s.level === selectedTab.value)
    }
    return result
  },
  set: (newOrder) => {
    const fullList = [...sheet.value.spells.list[props.idx]!.spells]
    const movedItems = newOrder.map((viewItem) => fullList[viewItem.originalIndex])

    // 按照 newOrder 的顺序，将这些项依次放回它们原本占据的那些“坑位”里
    // 比如你显示了第 3, 5, 8 项，拖拽后变成了 5, 3, 8，那我们就把 5 放到 3 的位置，3 放到 5 的位置
    const targetOriginalIndices = currentSpells.value.map((v) => v.originalIndex)

    targetOriginalIndices.forEach((originalIdx, i) => {
      sheet.value.spells.list[props.idx]!.spells[originalIdx] = movedItems[i]!
    })
  },
})

const preparedCount = computed(() => {
  const list = sheet.value.spells.list[props.idx]?.spells
  if (!list) return 0
  return list.filter((s) => s.prepared && getSpell(s.spell)[0].level !== 0 && !s.dontCount).length
})
</script>

<template>
  <div class="spell-lists-panel">
    <div class="sheet-tabs">
      <div class="tab-item" :class="{ active: selectedTab === -1 }" @click="selectedTab = -1">
        <div>{{ selectedTab === -1 ? '全部' : '全' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 0 }" @click="selectedTab = 0">
        <div>{{ selectedTab === 0 ? '戏法' : '戏' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 1 }" @click="selectedTab = 1">
        <div>{{ selectedTab === 1 ? '一环' : '一' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 2 }" @click="selectedTab = 2">
        <div>{{ selectedTab === 2 ? '二环' : '二' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 3 }" @click="selectedTab = 3">
        <div>{{ selectedTab === 3 ? '三环' : '三' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 4 }" @click="selectedTab = 4">
        <div>{{ selectedTab === 4 ? '四环' : '四' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 5 }" @click="selectedTab = 5">
        <div>{{ selectedTab === 5 ? '五环' : '五' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 6 }" @click="selectedTab = 6">
        <div>{{ selectedTab === 6 ? '六环' : '六' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 7 }" @click="selectedTab = 7">
        <div>{{ selectedTab === 7 ? '七环' : '七' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 8 }" @click="selectedTab = 8">
        <div>{{ selectedTab === 8 ? '八环' : '八' }}</div>
      </div>
      <div class="tab-item" :class="{ active: selectedTab === 9 }" @click="selectedTab = 9">
        <div>{{ selectedTab === 9 ? '九环' : '九' }}</div>
      </div>
      <div class="prepare-count">已准备数量：{{ preparedCount }}</div>
    </div>
    <div class="main-content">
      <div v-if="isLoading" class="status">正在加载法术数据...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-else-if="currentSpells.length === 0" class="status">没有相关的法术</div>
      <div v-else class="spell-list">
        <div class="table-header grid-layout">
          <div></div>
          <div class="col-header center">准备</div>
          <div class="col-header">法术名</div>
          <div class="col-header center">环阶</div>
          <div class="col-header center">学派</div>
          <div class="col-header center">成分</div>
          <div class="col-header center">仪式</div>
          <div class="col-header center">专注</div>
          <div class="col-header center">免费次数</div>
          <div class="col-header">备注</div>
          <div></div>
        </div>
        <VueDraggable
          v-model="currentSpells"
          :animation="150"
          handle=".drag-handle"
          ghost-class="ghost-item"
          :force-fallback="true"
        >
          <SpellListItem
            v-for="spellInfo in currentSpells"
            :key="spellInfo.id"
            :list-idx="props.idx"
            :index="spellInfo.originalIndex"
            :selected="spellInfo.id === props.selectedSpellId"
            @select="emit('select', $event)"
          />
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spell-lists-panel {
  max-height: 700px;
  display: flex;
  flex-direction: column;
}
.sheet-tabs {
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  gap: 5px;
  margin-bottom: 0;
  overflow-x: auto;
  flex: 0 0 auto;
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

  font-weight: bold;
  opacity: 1;
}

.main-content {
  background-color: var(--dnd-parchment-bg);
  overflow-y: auto;
  flex: 0 1 auto;
  min-height: 0;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  padding: 10px;
}

.status {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(40, 32, 24, 0.2);
  color: rgba(40, 32, 24, 0.6);
}

.status.error {
  border-color: rgba(188, 69, 69, 0.5);
  color: #a13c3c;
}

.grid-layout {
  display: grid;
  grid-template-columns: 15px 40px 1.5fr 80px 33px 47px 33px 33px 1fr 1.5fr 50px;
  gap: 10px;
}

.table-header {
  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 1px solid var(--dnd-ink-secondary);
}

.col-header {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
}

.center {
  display: flex;
  justify-content: center;
  text-align: center;
}

.prepare-count {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center;
  justify-content: right;
  flex: 1;
}

.ghost-item {
  opacity: 0.4;
  background-color: var(--dnd-dragon-red-trans30);
  border: 1px dashed var(--dnd-dragon-red);
  border-radius: 4px;
}
</style>
