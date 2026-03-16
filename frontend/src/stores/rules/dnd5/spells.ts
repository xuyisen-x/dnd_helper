import { defineStore } from 'pinia'
import { computed, markRaw, ref } from 'vue'

import type { Spell } from '@/types/dnd5-spells'
import type { SpellTypeDnd5 } from '../dnd5'

const STORAGE_KEY = 'dnd5_spells_cache_v1'

export const useSpellStore = defineStore('spells', () => {
  const spells = ref<Spell[]>([])
  const spellsMap = computed(() => {
    const map: Record<string, Spell> = {}
    spells.value.forEach((spell) => {
      map[spell.id] = spell
    })
    return map
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSpells = async () => {
    // 1. 内存中已有数据，直接返回
    if (spells.value.length > 0) return

    isLoading.value = true
    error.value = null

    try {
      const spellModule = await import('@/assets/dnd5_spells.json')
      const data = spellModule.default as Spell[]
      spells.value = markRaw(data)
    } catch (err) {
      console.error('获取法术数据失败:', err)
      error.value = '加载失败'
    } finally {
      isLoading.value = false
    }
  }

  const clearCache = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  const getSpell = (spellDnD5: SpellTypeDnd5): [Spell, boolean] => {
    if (typeof spellDnD5 === 'string') {
      return [spellsMap.value[spellDnD5]!, false]
    } else {
      return [spellDnD5, true]
    }
  }

  return { spellsMap, spells, isLoading, error, fetchSpells, clearCache, getSpell }
})
