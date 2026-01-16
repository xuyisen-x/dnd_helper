import { reactive, readonly } from 'vue'

type ConfirmationResolver = (value: boolean) => void

interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  resolve: ConfirmationResolver | null
}

const confirmationState = reactive<ConfirmationState>({
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
})

const resetState = () => {
  confirmationState.isOpen = false
  confirmationState.title = ''
  confirmationState.message = ''
  confirmationState.resolve = null
}

const finish = (result: boolean) => {
  const resolver = confirmationState.resolve
  resetState()
  if (resolver) {
    resolver(result)
  }
}

export const confirmationBox = (title: string, message: string) => {
  if (confirmationState.isOpen && confirmationState.resolve) {
    confirmationState.resolve(false)
  }

  confirmationState.title = title
  confirmationState.message = message
  confirmationState.isOpen = true

  return new Promise<boolean>((resolve) => {
    confirmationState.resolve = resolve
  })
}

export const useConfirmationBox = () => {
  return {
    state: readonly(confirmationState),
    confirm: () => finish(true),
    cancel: () => finish(false),
  }
}
