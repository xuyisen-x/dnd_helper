<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data, SpellTypeDnd5 } from '@/stores/rules/dnd5'
import { storeToRefs } from 'pinia'
import { useSpellStore } from '@/stores/rules/dnd5/spells'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const spellStore = useSpellStore()
const { spellsMap, isLoading, error } = storeToRefs(spellStore)

const props = defineProps<{
  id: string
}>()

const isValidSpell = (spellDnD5: SpellTypeDnd5): boolean => {
  if (typeof spellDnD5 === 'string') {
    return spellsMap.value[spellDnD5] !== undefined
  }
  return true
}

const getSpells = (spellDnD5: SpellTypeDnd5) => {
  if (typeof spellDnD5 === 'string') {
    return spellsMap.value[spellDnD5]!
  } else {
    return spellDnD5
  }
}

const selectedTab = ref<number>(-1)

const currentSpells = computed(() => {
  // if (isLoading || error) return []
  let filteredSpells = sheet.value.spells.list.find((s) => s.id === props.id)!.spells
  filteredSpells = filteredSpells.filter((s) => isValidSpell(s.spell))
  let result = filteredSpells.map((s) => {
    const spellData = getSpells(s.spell)
    return {
      id: spellData.id,
      spell: spellData,
      raw: s,
    }
  })
  if (selectedTab.value >= 0) {
    result = result.filter((s) => s.spell.level === selectedTab.value)
  }
  return result
})

const emit = defineEmits<{
  (e: 'select', spell: Spell): void
}>()
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
    </div>
    <div class="main-content">
      <div v-if="isLoading" class="status">正在加载法术数据...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-else-if="currentSpells.length === 0" class="status">没有相关的法术</div>
      <div v-else class="spell-list">
        <div v-for="spell in currentSpells" :key="spell.id" @click="emit('select', spell.spell)">
          {{ spell.spell.name }}
        </div>
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
</style>
