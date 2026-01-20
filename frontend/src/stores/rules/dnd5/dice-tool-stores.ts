import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ValueSummary } from '@/wasm_utils/oxidice/pkg/oxidice'

export const useDiceToolsResultStore = defineStore('dice-tools-result', () => {
  const selectedValue = ref<ValueSummary | undefined>(undefined)
  const selectedNodeId = ref<number | undefined>(undefined)

  const setSelectedValue = (value: ValueSummary, nodeId: number) => {
    selectedValue.value = value
    selectedNodeId.value = nodeId
  }

  const clearSelectedValue = () => {
    selectedValue.value = undefined
    selectedNodeId.value = undefined
  }

  const isSelectedNode = (nodeId: number) => selectedNodeId.value === nodeId

  return { selectedValue, selectedNodeId, setSelectedValue, clearSelectedValue, isSelectedNode }
})
