import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RollOutput } from '@/composables/useDiceBox'

export interface RollResultItem {
  id: number
  notation: string // 公式，如 "2d20kh + 3"
  title: string // 业务标题，如 "游说检定" 或 "自定义投掷"
  output: RollOutput
  timestamp: number
}

export const useDiceResultStore = defineStore('dice-result', () => {
  const results = ref<RollResultItem[]>([])
  let idCounter = 0
  const MAX_Items = 3
  const AUTO_DISMISS_TIME = 10 * 1000 // 10秒后自动移除

  const addResult = (output: RollOutput, notation: string, title: string = '自定义') => {
    const id = idCounter++

    results.value.unshift({
      id,
      notation,
      title,
      output,
      timestamp: Date.now(),
    })

    if (results.value.length > MAX_Items) {
      results.value.pop()
    }

    setTimeout(() => {
      removeResult(id)
    }, AUTO_DISMISS_TIME)
  }

  const removeResult = (id: number) => {
    const index = results.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      results.value.splice(index, 1)
    }
  }

  return { results, addResult, removeResult }
})

export function addDiceResult(output: RollOutput, notation: string, title: string = '自定义') {
  const { addResult } = useDiceResultStore()
  addResult(output, notation, title)
}

export function removeDiceResult(id: number) {
  const { removeResult } = useDiceResultStore()
  removeResult(id)
}
