import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import type { Dnd5Data } from './rules/dnd5'
import { createEmptyDnd5Data } from './rules/dnd5'
import { showToast } from '@/stores/toast'

// 可以适配多种不同的规则
export type RuleSystem = 'dnd5r' | 'dnd5e'
export type CharacterData = Dnd5Data | Record<string, never>

export const useActiveCharacterStore = defineStore('active-character', () => {
  const rule = ref<RuleSystem>('dnd5r')
  const data = ref<CharacterData>(createEmptyDnd5Data())

  const getCharacterName = () => {
    if (rule.value === 'dnd5r' || rule.value === 'dnd5e') {
      const tmp = (data.value as Dnd5Data).basic.name
      return tmp ? tmp : '未命名角色'
    }
    return '未知角色'
  }

  const exportData = () => {
    return JSON.stringify({ rule: rule.value, data: toRaw(data.value) })
  }

  const importData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      if (parsed.rule && parsed.data) {
        rule.value = parsed.rule
        data.value = parsed.data
      } else {
        showToast('导入失败：数据格式不正确', 'error')
      }
    } catch (error) {
      showToast('导入失败：无法解析JSON: ' + (error as Error).message, 'error')
    }
  }

  return { rule, data, exportData, importData, getCharacterName }
})
