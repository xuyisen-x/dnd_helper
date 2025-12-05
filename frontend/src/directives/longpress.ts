import type { Directive, DirectiveBinding } from 'vue'

interface LongPressOptions {
  delay?: number
  handler: (e: PointerEvent, el: LongPressEl) => void
}

type LongPressBinding = LongPressOptions | ((e: PointerEvent) => void)

interface LongPressState {
  timer: number | null
  startX: number
  startY: number
}

type LongPressEl = HTMLElement & {
  __lp_state__?: LongPressState
  __lp_cleanup__?: () => void
}

const DEFAULT_DELAY = 500
const MOVE_TOLERANCE = 10

const longpress: Directive<LongPressEl, LongPressBinding> = {
  mounted(el, binding: DirectiveBinding<LongPressBinding>) {
    const value = binding.value

    if (!value) return

    const delay = typeof value === 'object' && value.delay ? value.delay : DEFAULT_DELAY

    const handler = typeof value === 'function' ? value : value.handler

    const state: LongPressState = {
      timer: null,
      startX: 0,
      startY: 0,
    }

    el.__lp_state__ = state

    const start = (e: PointerEvent) => {
      // 只处理鼠标左键 / 触控 / 笔
      if (e.pointerType === 'mouse' && e.button !== 0) return

      state.startX = e.clientX
      state.startY = e.clientY

      if (state.timer) {
        window.clearTimeout(state.timer)
      }

      state.timer = window.setTimeout(() => {
        // 定时到期仍未取消 → 触发长按
        handler(e, el)
        state.timer = null
      }, delay)
    }

    const move = (e: PointerEvent) => {
      if (!state.timer) return
      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
        window.clearTimeout(state.timer)
        state.timer = null
      }
    }

    const cancel = () => {
      if (!state.timer) return
      window.clearTimeout(state.timer)
      state.timer = null
    }

    el.addEventListener('pointerdown', start)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', cancel)
    el.addEventListener('pointercancel', cancel)
    el.addEventListener('pointerleave', cancel)

    el.__lp_cleanup__ = () => {
      el.removeEventListener('pointerdown', start)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', cancel)
      el.removeEventListener('pointercancel', cancel)
      el.removeEventListener('pointerleave', cancel)
    }
  },

  unmounted(el) {
    el.__lp_cleanup__?.()
  },
}

export default longpress
