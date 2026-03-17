<script setup lang="ts">
import { computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { confirmationBox } from '@/composables/useConfirmationBox'

const store = useActiveCharacterStore()

const is5R = computed(() => store.rule === 'dnd5r')
const ruleLabel = computed(() => (is5R.value ? '5R' : '5E'))
const targetRuleLabel = computed(() => (is5R.value ? '5E' : '5R'))
const actionLabel = computed(() => (is5R.value ? '切换到 5E' : '切换到 5R'))

const toggleRule = async () => {
  const confirmed = await confirmationBox(
    '规则切换',
    `当前规则为 ${ruleLabel.value}，你确定要切换到${targetRuleLabel.value} 吗？\n所有数据都不会丢失。`,
  )
  if (!confirmed) return
  store.rule = is5R.value ? 'dnd5e' : 'dnd5r'
}
</script>

<template>
  <button class="rule-toggle" type="button" @click="toggleRule">
    <span class="rule-value">{{ ruleLabel }}</span>
    <span class="rule-action">{{ actionLabel }}</span>
  </button>
</template>

<style scoped>
.rule-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 6px 8px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: Georgia, 'Songti SC', 'SimSun', serif;

  border: 1px solid var(--dnd-ink-secondary);
  color: var(--dnd-ink-primary);
  background-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rule-toggle:active {
  transform: translateY(1px);
  box-shadow: none;
}

body.has-mouse .rule-toggle:hover {
  background-color: rgba(255, 255, 255, 0.7);
}

.rule-title {
  font-weight: 600;
}

.rule-value {
  font-weight: 700;
  font-size: larger;
  color: var(--dnd-dragon-red);
}

.rule-action {
  font-size: 0.85rem;
  color: var(--dnd-ink-secondary);
}
</style>
