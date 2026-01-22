import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'

import type { Spell } from '@/types/dnd5-spells'

const STORAGE_KEY = 'dnd5_spells_cache_v1'

export const useSpellStore = defineStore('spells', () => {
  const spells = ref<Spell[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSpells = async () => {
    // 1. 内存中已有数据，直接返回
    if (spells.value.length > 0) return

    isLoading.value = true
    error.value = null

    try {
      // 2. 检查 LocalStorage (本地缓存)
      // const cachedData = localStorage.getItem(STORAGE_KEY)
      // if (cachedData) {
      //   const parsed = JSON.parse(cachedData)
      //   spells.value = markRaw(parsed)
      //   isLoading.value = false
      //   return
      // }

      // 3. 本地没有，发起网络请求
      // 'https://npm.elemecdn.com/@xuyisen--x/dnd5-spells-cn@1.0.0/dnd5_spells.json'
      const url = 'https://unpkg.com/@xuyisen--x/dnd5-spells-cn@1.0.0/dnd5_spells.json'
      const response = await fetch(url)

      if (!response.ok) throw new Error('网络请求失败')

      const data = await response.json()

      // // 4. 存入本地缓存
      // try {
      //   localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // } catch (e) {
      //   console.warn('缓存写入失败(可能是存储空间已满):', e)
      // }

      // 5. 更新状态 (同样使用 markRaw)
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

  return { spells, isLoading, error, fetchSpells, clearCache }
})
