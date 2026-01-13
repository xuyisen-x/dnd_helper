import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OutputNode, ValueSummary } from '@/wasm_utils/oxidice/pkg/oxidice'

export interface RollResultItem {
  id: number
  notation: string // 公式，如 "2d20kh + 3"
  title: string // 业务标题，如 "游说检定" 或 "自定义投掷"
  output: OutputNode // 投掷结果
  showedValue: ValueSummary | undefined // 需要展示的值
  showedID: number | undefined // 需要展示的值对应的节点ID
  timestamp: number
}

export const useDiceResultStore = defineStore('dice-result', () => {
  const results = ref<RollResultItem[]>([])
  let idCounter = 0
  const MAX_Items = 3
  const AUTO_DISMISS_TIME = 30 * 1000 // 30秒后自动移除

  const addResult = (output: OutputNode, notation: string, title: string = '自定义') => {
    const id = idCounter++

    results.value.unshift({
      id,
      notation,
      title,
      output,
      showedValue: undefined,
      showedID: undefined,
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

  const setShowedValue = (itemId: number, value: ValueSummary, nodeId: number) => {
    const item = results.value.find((item) => item.id === itemId)
    if (item) {
      item.showedValue = value
      item.showedID = nodeId
    }
  }

  const removeShowedValue = (itemId: number) => {
    const item = results.value.find((item) => item.id === itemId)
    if (item) {
      item.showedValue = undefined
      item.showedID = undefined
    }
  }

  const getShowedId = (itemId: number): number | undefined => {
    const item = results.value.find((item) => item.id === itemId)
    return item?.showedID
  }

  return { results, addResult, removeResult, setShowedValue, removeShowedValue, getShowedId }
})

export function addDiceResult(output: OutputNode, notation: string, title: string = '自定义') {
  const { addResult } = useDiceResultStore()

  addResult(output, notation.replace(/\s/g, ''), title)
}

export function removeDiceResult(id: number) {
  const { removeResult } = useDiceResultStore()
  removeResult(id)
}
