import type DiceBox from '@3d-dice/dice-box'

// 这样无论调用多少次 useDiceBox，它们都共享这一个实例
let diceBoxInstance: null | DiceBox = null
let isReady = false

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

  // 暴露给组件使用的属性和方法
  return { initDiceBox, getDiceBox }
}
