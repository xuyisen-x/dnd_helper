import { defineStore } from 'pinia'
import { ref } from 'vue'

const NUM_MAX_TOAST = 3

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
  timer?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])
  let idCounter = 0

  // 从列表中移除特定id的toast
  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1 && toasts.value[index]) {
      clearTimeout(toasts.value[index].timer)
      toasts.value.splice(index, 1)
    }
  }

  // 向列表中添加toast
  function add(message: string, type: ToastType = 'info', duration = 3000) {
    // 如果超过最大数量，移除最早的toast
    if (toasts.value.length >= NUM_MAX_TOAST) {
      const oldest = toasts.value[0]
      if (oldest) remove(oldest.id)
    }

    const id = idCounter++

    // 定时销毁
    let timer: ReturnType<typeof setTimeout> | undefined
    if (duration > 0) {
      timer = window.setTimeout(() => {
        remove(id)
      }, duration)
    }

    const newItem: ToastItem = { id, message, type, duration, timer }

    toasts.value.push(newItem)
  }

  return { toasts, add, remove }
})

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const { add } = useToastStore()
  add(message, type, duration)
}
