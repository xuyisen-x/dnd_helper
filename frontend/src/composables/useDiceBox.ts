import { computed, ref } from 'vue'

import type DiceBox from '@3d-dice/dice-box'

// 用于规则自定义的宏替换
import { useActiveCharacterStore } from '@/stores/active-character'
import { useDnd5Logic } from './rules/useDnd5Logic'
import {
  rollWithoutAnimation,
  tryFoldDiceExpression,
  checkNumber,
  checkConstantInteger,
} from '@/wasm_utils/oxidice/pkg/oxidice'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import type { DiceBoxResponse, OutputNode } from '@/wasm_utils/oxidice/pkg/oxidice'

import { showToast } from '@/stores/toast'
import type { DieResultObject } from '@3d-dice/dice-box'
import { DiceRollerWithDiceBox } from '@/wasm_utils/oxidice/pkg/oxidice'

const colorCycler = {
  palette: [
    '#FF3B30', // 红
    '#FF9500', // 橙
    '#FFCC00', // 黄
    '#4CD964', // 绿
    '#007AFF', // 蓝
    '#5856D6', // 靛
    '#AF52DE', // 紫
  ],

  _currentIndex: 0,

  next: function () {
    const color = this.palette[this._currentIndex]
    this._currentIndex = (this._currentIndex + 1) % this.palette.length
    return color
  },

  reset: function () {
    this._currentIndex = 0
  },
}

function globalMacroReplace(input: string): string {
  // TODO: 全局生效的宏替换
  return input
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

// 是否显示动画，全局变量
const showAnimation = ref(true)

let cancelPreviousRoll: (() => void) | null = null
let rollToken: object | null = null // 用于标记当前的投掷任务

export function useDiceBox() {
  const initDiceBox = async (containerId: string) => {
    if (diceBoxInstance || isInitializing) return // 避免重复初始化
    isInitializing = true

    const { default: DiceBox } = await import('@3d-dice/dice-box')

    diceBoxInstance = new DiceBox({
      container: containerId,
      id: 'dice-canvas',
      assetPath: '/assets/',
      scale: 5,
      origin: window.location.origin + import.meta.env.BASE_URL,
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

  const diceBoxFunction = (functionName: 'add' | 'roll') => {
    return async (
      ...args: Parameters<DiceBox['roll']>
    ): Promise<Array<DieResultObject> | undefined> => {
      const box = getDiceBox()

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
        }, 100 * 1000) // 100秒超时，仅用于保底
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
        let results: Array<DieResultObject> = []
        if (functionName === 'roll') {
          results = await Promise.race([box.roll(...args), timeoutPromise, cancelPromise])
        } else if (functionName === 'add') {
          results = await Promise.race([box.add(...args), timeoutPromise, cancelPromise])
        }
        clearTimeout(timeoutId) // 清理超时定时器
        // 清理手动取消函数
        if (cancelPreviousRoll === cancelThisRun) {
          cancelPreviousRoll = null
        }
        return results
      } catch (error) {
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
        return undefined
      }
    }
  }
  const diceBoxRoll = diceBoxFunction('roll')
  const diceBoxAdd = diceBoxFunction('add')

  const rollWithAnimation = async (
    notation: string,
    recursion_limit: number,
    dice_count_limit: number,
  ): Promise<OutputNode | null> => {
    const myToken = {} // 生成本次投掷任务的唯一令牌
    rollToken = myToken // 保存当前令牌
    canvasOpacity.value = 1 // 重置透明度
    const box = getDiceBox()
    box.clear() // 清理之前的投掷
    let diceRoller: DiceRollerWithDiceBox | null = null

    try {
      // 下面放置投掷逻辑
      let first_flag = true
      // 创建投掷器
      diceRoller = new DiceRollerWithDiceBox(notation, recursion_limit, dice_count_limit)
      // 第一次尝试获取结果
      while (true) {
        // 1.检查令牌是否还匹配
        if (rollToken !== myToken) return null
        // 2.状态机推进一步
        diceRoller.evaluation()
        // 3.处理移除请求
        for (const id of diceRoller.removeRequests()) {
          getDiceBox().remove(id)
        }
        // 4. 尝试获取最终结果
        const finalResult = diceRoller.tryGetResults()
        if (finalResult) {
          return finalResult
        }
        // 5. 获取投掷请求
        const request = diceRoller.getRequests()
        // 6. 如果有投掷请求，处理投掷请求
        if (request.length !== 0) {
          const notation = request.map((req) => {
            return {
              qty: req.count,
              sides: req.face,
              themeColor: colorCycler.next(),
            }
          })
          const callF = first_flag ? diceBoxRoll : diceBoxAdd
          first_flag = false
          // 投掷前，检查令牌是否还匹配
          if (rollToken !== myToken) return null
          const dieResults = await callF(notation)
          if (dieResults === undefined) return null

          // 将平铺的结果按照groupId重新分组
          const groupedDieResults: DieResultObject[][] = []
          let currentGroupIdx = undefined
          for (const dieResult of dieResults) {
            if (dieResult.groupId !== currentGroupIdx) {
              currentGroupIdx = dieResult.groupId
              groupedDieResults.push([])
            }
            groupedDieResults[groupedDieResults.length - 1]?.push(dieResult)
          }
          // 构造响应
          const responses: DiceBoxResponse[] = []
          for (let i = 0; i < request.length; i++) {
            const idx = request[i]?.idx
            const dieResult = groupedDieResults[i]
            if (idx === undefined || dieResult === undefined) {
              return null
            }
            const values = dieResult.map((d) => d.value)
            const results = dieResult.map((d) => {
              return {
                groupId: d.groupId,
                rollId: d.rollId,
              }
            })
            responses.push({
              idx: idx,
              results: results,
              values: values,
            })
          }
          // 提供响应
          diceRoller.setResponses(responses)
        } else {
          diceRoller.setResponses([]) // 没有请求时也要调用此方法
        }
      }
    } finally {
      diceRoller?.free()
      setTimeout(async () => {
        // 如果令牌变了，说名用户发情了新的投掷，则终止
        if (rollToken !== myToken) return

        // 淡出，timeout时间需要与动画时间一致
        canvasOpacity.value = 0
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 再次检查令牌，防止在淡出过程中用户又投掷了
        if (rollToken !== myToken) return

        // 真正清理物理世界
        rollToken = null
        const box = getDiceBox()
        box.clear()
        canvasOpacity.value = 1 // 重置透明度 (因为已经空了，设回 1 也没关系，为下次投掷做准备)
      }, 1000) // 1秒后开始淡出
    }
  }

  const parseAndRoll = async (notation: string): Promise<OutputNode | null> => {
    if (showAnimation.value) {
      try {
        const preprocessedNotion = specificMacroReplace(notation)
        return await rollWithAnimation(preprocessedNotion, 20, 2000) // 后续改为带动画的投掷
      } catch (e) {
        showToast(e as string, 'error')
        return null
      }
    } else {
      try {
        const preprocessedNotion = specificMacroReplace(notation)
        return rollWithoutAnimation(preprocessedNotion, 20, 2000)
      } catch (e) {
        showToast(e as string, 'error')
        return null
      }
    }
  }

  const foldAndCheckConstantsInteger = (notation: string): [true, number] | [false, string] => {
    // 如果结果为真，表示合法，第二个返回值为折叠后的表达式
    // 如果结果为假，表示不合法，第二个返回值为错误信息
    try {
      const preprocessedNotation = specificMacroReplace(notation)
      const evalResult = checkConstantInteger(preprocessedNotation)
      if (evalResult.result === 'constant') {
        return [true, evalResult.value]
      } else {
        return [false, evalResult.value] // 错误信息
      }
    } catch (e) {
      let errorMessage: string
      if (e instanceof Error) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      } else {
        // 兜底：保证不再抛异常
        errorMessage = String(e) || '未知错误'
      }
      return [false, errorMessage]
    }
  }

  const checkNotationValidAndFold = (notation: string): [boolean, string] => {
    // 如果结果为真，表示合法，第二个返回值为折叠后的表达式
    // 如果结果为假，表示不合法，第二个返回值为错误信息
    try {
      const preprocessedNotation = specificMacroReplace(notation)
      const evalResult = tryFoldDiceExpression(preprocessedNotation)
      if (evalResult.result === 'valid') {
        return [true, evalResult.value]
      } else {
        return [false, evalResult.value] // 错误信息
      }
    } catch (e) {
      let errorMessage: string
      if (e instanceof Error) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      } else {
        // 兜底：保证不再抛异常
        errorMessage = String(e) || '未知错误'
      }
      return [false, errorMessage]
    }
  }

  const foldAndCheckNumber = (notation: string): [boolean, string] => {
    // 如果结果为真，表示合法，第二个返回值为折叠后的表达式
    // 如果结果为假，表示不合法，第二个返回值为错误信息
    try {
      const preprocessedNotation = specificMacroReplace(notation)
      const evalResult = checkNumber(preprocessedNotation)
      if (evalResult.result === 'number') {
        return [true, evalResult.value]
      } else {
        return [false, evalResult.value] // 错误信息
      }
    } catch (e) {
      let errorMessage: string
      if (e instanceof Error) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      } else {
        // 兜底：保证不再抛异常
        errorMessage = String(e) || '未知错误'
      }
      return [false, errorMessage]
    }
  }

  // 暴露给组件使用的属性和方法
  return {
    initDiceBox,
    getDiceBox,
    showAnimation,
    canvasOpacity,
    parseAndRoll,
    checkNotationValidAndFold,
    foldAndCheckNumber,
    foldAndCheckConstantsInteger,
  }
}
