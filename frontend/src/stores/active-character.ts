import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Dnd5rData } from './rules/dnd5r'
import { createEmptyDnd5rData } from './rules/dnd5r'

// 可以适配多种不同的规则
export type RuleSystem = 'dnd5r'
export type CharacterData = Dnd5rData | Record<string, never>

export const useActiveCharacterStore = defineStore('active-character', () => {
  const rule = ref<RuleSystem>('dnd5r')
  const data = ref<CharacterData>(createEmptyDnd5rData())

  return { rule, data }
})
