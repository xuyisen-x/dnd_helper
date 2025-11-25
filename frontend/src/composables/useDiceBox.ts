import { ref } from 'vue'
import type DiceBox from '@3d-dice/dice-box'

const canvasOpacity = ref(1)

// 这样无论调用多少次 useDiceBox，它们都共享这一个实例
let diceBoxInstance: null | DiceBox = null
let isReady = false
let clearToken: object | null = null

// 用于取消前一次投掷
let cancelPreviousRoll: (() => void) | null = null

export function useDiceBox() {
  const initDiceBox = async (containerId: string) => {
    if (diceBoxInstance) return // 避免重复初始化

    const { default: DiceBox } = await import('@3d-dice/dice-box')

    diceBoxInstance = new DiceBox({
      container: containerId,
      id: 'dice-canvas',
      assetPath: '/assets/',
      scale: 6,
      theme: 'default',
    })

    await diceBoxInstance.init()
    isReady = true
  }

  const getDiceBox = () => {
    if (!diceBoxInstance || !isReady) {
      throw new Error('DiceBox is not initialized. Please call initDiceBox first.')
    }
    return diceBoxInstance
  }

  const clearDiceBoxAfter = (timeout: number) => {
    const myToken = {} // 生成本次清理任务的唯一令牌
    clearToken = myToken

    setTimeout(async () => {
      // 如果令牌变了（说明用户点了 roll 或发起了新清理），则终止
      if (clearToken !== myToken) return

      // 淡出，timeout时间需要与动画时间一致
      canvasOpacity.value = 0
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 再次检查令牌，防止在淡出过程中用户又投掷了
      if (clearToken !== myToken) return

      // 真正清理物理世界
      const box = getDiceBox()
      box.clear()

      // 重置透明度 (因为已经空了，设回 1 也没关系，为下次投掷做准备)
      canvasOpacity.value = 1

      // 清理引用
      if (clearToken === myToken) clearToken = null
    }, timeout)
  }

  const roll = async (notation: string) => {
    const box = getDiceBox()

    // 立即停止清理任务，并确保骰子可见
    clearToken = null
    canvasOpacity.value = 1

    // 如果前一次投掷没有完成，取消它
    if (cancelPreviousRoll) {
      cancelPreviousRoll()
      cancelPreviousRoll = null // 重置，防止重复调用
    }

    // 用于超时的Promise
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Roll timeout'))
      }, 1000 * 100) // 100秒超时，仅用于保底
    })

    // 用于手动取消的Promise
    let cancelThisRun: (() => void) | undefined
    const cancelPromise = new Promise<never>((_, reject) => {
      cancelThisRun = () => reject(new Error('Cancelled by new roll'))
    })
    if (cancelThisRun) {
      cancelPreviousRoll = cancelThisRun
    }

    try {
      const result = await Promise.race([box.roll(notation), timeoutPromise, cancelPromise])
      // 清理超时定时器
      clearTimeout(timeoutId)
      // 清理手动取消函数
      if (cancelPreviousRoll === cancelThisRun) {
        cancelPreviousRoll = null
      }
      return {
        status: 'success',
        result: result,
        error: null,
      }
    } catch (error) {
      // 清理超时定时器
      clearTimeout(timeoutId)
      // 清理手动取消函数
      if (cancelPreviousRoll === cancelThisRun) {
        cancelPreviousRoll = null
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      const isCancelled = errorMessage === 'Cancelled by new roll'
      if (!isCancelled) {
        // 如果不是被取消的投掷，立刻清理DiceBox
        getDiceBox().clear()
      }

      // 如果是因为解析错误报的错，应该通知用户，输入正确的格式
      if (errorMessage.startsWith('Invalid notation: ')) {
        const invalidNotation = errorMessage.replace('Invalid notation: ', '')
        alert('非法表达式：' + invalidNotation)
      }

      return {
        status: 'failed',
        result: null,
        error: errorMessage,
      }
    }
  }

  // 暴露给组件使用的属性和方法
  return { initDiceBox, getDiceBox, clearDiceBoxAfter, roll, canvasOpacity }
}
