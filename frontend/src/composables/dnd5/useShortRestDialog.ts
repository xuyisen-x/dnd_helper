import { reactive, readonly } from 'vue'

interface ShortRestDialogState {
  isOpen: boolean
}

const shortRestDialogState = reactive<ShortRestDialogState>({
  isOpen: false,
})

export const useShortRestDialog = () => {
  const open = () => {
    shortRestDialogState.isOpen = true
  }

  const close = () => {
    shortRestDialogState.isOpen = false
  }

  return {
    state: readonly(shortRestDialogState),
    open,
    close,
  }
}
