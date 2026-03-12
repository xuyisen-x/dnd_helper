<script setup lang="ts">
import type { Spell } from '@/types/dnd5-spells'
import {
  formatComponents,
  getClassHtml,
  getLevelLabel,
  getSchoolLabel,
  getSourceLabel,
} from '@/utils/dnd5/spellDisplay.ts'

const props = defineProps<{
  spell: Spell | null
}>()
</script>

<template>
  <div class="detail-panel-inner">
    <div v-if="!props.spell" class="detail-empty">请选择一个法术查看详情</div>
    <div v-else class="detail-content">
      <header class="detail-header">
        <h2>{{ props.spell.name }}</h2>
        <p class="english">{{ props.spell.english_name }}</p>
        <div class="tag-row">
          <span>{{ getLevelLabel(props.spell.level) }}</span>
          <span>{{ getSchoolLabel(props.spell.school) }}</span>
          <span>{{ getSourceLabel(props.spell.source) }}</span>
          <span v-if="props.spell.is_ritual">仪式</span>
        </div>
      </header>

      <div class="detail-grid">
        <div>
          <span class="label">施法时间</span>
          <span class="value">{{ props.spell.casting_time }}</span>
        </div>
        <div>
          <span class="label">施法距离</span>
          <span class="value">{{ props.spell.range }}</span>
        </div>
        <div class="full">
          <span class="label">持续时间</span>
          <span class="value">{{ props.spell.duration }}</span>
          <span v-if="props.spell.need_concentration" class="value red">（需要专注）</span>
        </div>
        <div class="full">
          <span class="label">成分</span>
          <span class="value">
            {{ formatComponents(props.spell) }}
          </span>
          <span v-if="props.spell.material" class="value">（{{ props.spell.material }}）</span>
        </div>
        <div class="full">
          <span class="label">职业</span>
          <div class="value" v-html="getClassHtml(props.spell)"></div>
        </div>
      </div>

      <section class="description">
        <div class="dcp-title">法术描述</div>
        <p v-html="props.spell.description"></p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail-panel-inner {
  border-radius: 14px;
  padding: 16px 18px;
  border: 2px solid var(--dnd-ink-secondary);
  min-width: 0;
  overflow-x: auto;
  max-height: 100%;
  overflow-y: auto;
}

.detail-empty {
  text-align: center;
  color: var(--dnd-ink-secondary);
  padding: 80px 0;
  height: 260px;
}

.detail-header h2 {
  margin: 0;
  color: var(--dnd-dragon-red);
}

.english {
  margin: 4px 0 10px;
  font-style: italic;
  color: var(--dnd-ink-secondary);
}

.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-row span {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
  font-size: 12px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin: 18px 0;
}

.detail-grid .full {
  grid-column: 1 / -1;
}

.label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(40, 32, 24, 0.6);
}

.value {
  font-weight: 600;
}

.description h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.description p {
  margin: 0 0 8px;
  line-height: 1.6;
}

.red {
  color: var(--dnd-dragon-red);
}

.dcp-title {
  font-weight: bold;
  font-size: 18px;
  color: var(--dnd-dragon-red);
}
</style>
