import { computed, ref } from 'vue'

import type DiceBox from '@3d-dice/dice-box'

// 用于规则自定义的宏替换
import { useActiveCharacterStore } from '@/stores/active-character'
import { useDnd5Logic } from './rules/useDnd5Logic'
import type { Dnd5Data } from '@/stores/rules/dnd5'

function globalMacroReplace(input: string): string {
  // TODO: 全局生效的宏替换
  return input
}

export type RollOutput = {
  result: number
  groups: Array<{
    type: 'die' | 'number'
    value: number
    dices?: Array<{
      value: number
      roll: number
      valid: boolean
      die: number
      info: string
    }>
  }>
  opts: Array<string>
}

export function recusiveMacroReplace(
  input: string,
  comstomReplace: (input: string) => string,
  maxDepth = 5,
): string {
  let result = input
  for (let i = 0; i < maxDepth; i++) {
    const replaced = comstomReplace(result)
    const globallyReplaced = globalMacroReplace(replaced)
    if (globallyReplaced === result) {
      break
    }
    result = globallyReplaced
  }
  // 检查是否还有未替换的宏，宏是以@开头的连续字母、数字或下划线
  const hasUnreplacedMacro = /@[\w\d_]+/.test(result)
  if (hasUnreplacedMacro) {
    throw new Error(`Macro replacement did not converge: ${result}`)
  }
  return result
}

export function specificMacroReplace(input: string, maxDepth = 5): string {
  const store = useActiveCharacterStore()
  let comstomReplace = (s: string): string => {
    return s
  }
  if (store.rule === 'dnd5r' || store.rule === 'dnd5e') {
    const sheet = computed({
      get: () => store.data as Dnd5Data,
      set: (val) => (store.data = val),
    })
    const { costomMacroReplace } = useDnd5Logic(sheet)
    comstomReplace = costomMacroReplace
  }
  return recusiveMacroReplace(input, comstomReplace, maxDepth)
}

const canvasOpacity = ref(1)

// 这样无论调用多少次 useDiceBox，它们都共享这一个实例
let diceBoxInstance: null | DiceBox = null
let isInitializing = false // 锁
let isReady = false // 是否初始化完成

// 用于取消前一次投掷
// let cancelPreviousRoll: (() => void) | null = null

// 是否显示动画，全局变量
const showAnimation = ref(true)

export function useDiceBox() {
  const initDiceBox = async (containerId: string) => {
    if (diceBoxInstance || isInitializing) return // 避免重复初始化
    isInitializing = true

    const { default: DiceBox } = await import('@3d-dice/dice-box')

    diceBoxInstance = new DiceBox({
      container: containerId,
      id: 'dice-canvas',
      assetPath: '/assets/',
      scale: 6,
      theme: 'default',
    })

    try {
      await diceBoxInstance.init()
      isReady = true
    } finally {
      isInitializing = false
    }
  }

  const getDiceBox = () => {
    if (!diceBoxInstance || !isReady) {
      throw new Error('DiceBox is not initialized. Please call initDiceBox first.')
    }
    return diceBoxInstance
  }

  const Preprocess = (input: string): string => {
    // 这里可以添加一些预处理逻辑，比如宏替换等
    return input
  }

  // const diceBoxFunction = (functionName: 'add' | 'roll') => {
  //   return async (...args: Parameters<DiceBox['roll']>): Promise<boolean> => {
  //     const box = getDiceBox()

  //     // 如果前一次投掷没有完成，取消它
  //     if (cancelPreviousRoll) {
  //       cancelPreviousRoll()
  //       cancelPreviousRoll = null // 重置，防止重复调用
  //     }

  //     // 用于超时的Promise
  //     let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
  //     const timeoutPromise = new Promise<never>((_, reject) => {
  //       timeoutId = setTimeout(() => {
  //         reject(new Error('Roll timeout'))
  //       }, 100 * 1000) // 100秒超时，仅用于保底
  //     })

  //     // 用于手动取消的Promise
  //     let cancelThisRun: (() => void) | undefined
  //     const cancelPromise = new Promise<never>((_, reject) => {
  //       cancelThisRun = () => reject(new Error('Cancelled by new roll'))
  //     })
  //     if (cancelThisRun) {
  //       cancelPreviousRoll = cancelThisRun
  //     }

  //     try {
  //       if (functionName === 'roll') {
  //         await Promise.race([box.roll(...args), timeoutPromise, cancelPromise])
  //       } else if (functionName === 'add') {
  //         await Promise.race([box.add(...args), timeoutPromise, cancelPromise])
  //       }
  //       clearTimeout(timeoutId) // 清理超时定时器
  //       // 清理手动取消函数
  //       if (cancelPreviousRoll === cancelThisRun) {
  //         cancelPreviousRoll = null
  //       }
  //       return true
  //     } catch (error) {
  //       clearTimeout(timeoutId)
  //       // 清理手动取消函数
  //       if (cancelPreviousRoll === cancelThisRun) {
  //         cancelPreviousRoll = null
  //       }

  //       const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  //       const isCancelled = errorMessage === 'Cancelled by new roll'
  //       if (!isCancelled) {
  //         // 如果不是被取消的投掷，立刻清理DiceBox
  //         getDiceBox().clear()
  //       }
  //       return false
  //     }
  //   }
  // }
  // const diceBoxRoll = diceBoxFunction('roll')
  // const diceBoxAdd = diceBoxFunction('add')

  // // 不带动画的投掷，直接使用DiceRoller计算结果，直接返回，不需要Promise
  // const parseAndRollWithoutAnimation = (notation: string): RollBase | null => {
  //   console.log('notation', notation)
  //   return null
  // }

  // const parseAndRollWithAnimation = async (notation: string): Promise<RollBase | null> => {
  //   console.log('notation', notation)
  //   return null
  // }

  const parseAndRoll = async (notation: string): Promise<RollOutput | null> => {
    // const preprocessedNotion = Preprocess(notation)
    // if (showAnimation.value) {
    //   const output = await parseAndRollWithAnimation(preprocessedNotion)
    //   return parseOuptput(output)
    // } else {
    //   const output = parseAndRollWithoutAnimation(preprocessedNotion)
    //   return parseOuptput(output)
    // }
    console.log('notation', notation)
    return null
  }

  // 暴露给组件使用的属性和方法
  return {
    initDiceBox,
    getDiceBox,
    showAnimation,
    canvasOpacity,
    parseAndRoll,
    Preprocess,
  }
}
