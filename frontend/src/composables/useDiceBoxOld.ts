import { computed, ref } from 'vue'

import type DiceBox from '@3d-dice/dice-box'
import DiceParser from '@3d-dice/dice-parser-interface'
import { DiceRoller } from 'dice-roller-parser'
import type { RollBase } from 'dice-roller-parser'

import { showToast } from '@/stores/toast'
import type { RollObject } from '@3d-dice/dice-box'

import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { useDnd5Logic } from './rules/useDnd5Logic'

function getPreprocessFuction() {
  const store = useActiveCharacterStore()

  if (store.rule === 'dnd5e' || store.rule === 'dnd5r') {
    const sheet = computed({
      get: () => store.data as Dnd5Data,
      set: (val) => (store.data = val),
    })
    const { evalStringWithVariables } = useDnd5Logic(sheet)
    return (input: string): string => {
      const evaluated = String(evalStringWithVariables(input))
      if (evaluated.startsWith('-')) {
        return `(${evaluated})`
      } else {
        return evaluated
      }
    }
  } else {
    // 如果均不匹配，返回恒等变换
    return (input: string): string => input
  }
}

function parseExpression(expression: string): string[] {
  const parts = []
  let buffer = ''
  let parenDepth = 0

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]

    if (char === '(') {
      parenDepth++
    } else if (char === ')') {
      parenDepth--
    }

    // 如果在顶层（不在括号内）遇到了 + 或 -
    if (parenDepth === 0 && (char === '+' || char === '-')) {
      // 把之前积攒的 buffer (比如 "1d4") 存入结果
      if (buffer.trim().length > 0) {
        parts.push(buffer.trim())
      }
      // 把运算符也存入结果
      parts.push(char)
      // 清空 buffer，准备读取下一段
      buffer = ''
    } else {
      // 否则，把字符加入 buffer
      buffer += char
    }
  }

  // 循环结束后，把最后剩下的 buffer 存入结果
  if (buffer.trim().length > 0) {
    parts.push(buffer.trim())
  }

  return parts
}

function Preprocess(expression: string): string {
  const parts = parseExpression(expression)
  const preprocessItem = getPreprocessFuction()
  const processedParts = parts.map((input) => {
    if (/^(d\d|\d+d\d+)/.test(input)) {
      return input
    }
    if (input === '+' || input === '-') {
      return input
    }
    // 加上括号
    return preprocessItem(input)
  })
  return processedParts.join('')
}

type RealRollBase = RollBase & {
  rolls?: Array<{
    value: number
    roll: number
    valid: boolean
    die: number
    critical?: string
  }>
  dice?: Array<RealRollBase>
  ops?: Array<string>
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

const canvasOpacity = ref(1)

// 这样无论调用多少次 useDiceBox，它们都共享这一个实例
let diceBoxInstance: null | DiceBox = null
let isInitializing = false // 锁
let isReady = false

// 用于取消前一次投掷
let cancelPreviousRoll: (() => void) | null = null
// 用于唯一标识当前投掷任务
let rollToken: object | null = null

// DiceParser 实例，唯一实例，重新parseNotation后便可以复用
const DP = new DiceParser()
const diceRoller = new DiceRoller()

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

  const parseOuptput = (rollResult: RollBase | null): RollOutput | null => {
    // 定义辅助函数
    const mapRolls = (rolls?: RealRollBase['rolls']) =>
      rolls?.map((r) => ({
        value: r.value,
        roll: r.roll,
        valid: r.valid,
        info: r.critical ? r.critical : '',
        die: r.die,
      }))

    if (!rollResult) return null
    if (rollResult.type === 'expressionroll') {
      const realRollResult = rollResult as RealRollBase
      for (const d of realRollResult.dice || []) {
        if (d.type !== 'number' && d.type !== 'die') {
          showToast('Unsupported roll result type in expressionroll', 'error')
          return null
        }
      }
      return {
        result: realRollResult.value,
        groups:
          realRollResult.dice?.map((d) => {
            return {
              type: d.type as 'die' | 'number', // 已经过滤过了，不会有别的类型
              value: d.value,
              dices: mapRolls(d.rolls),
            }
          }) || [],
        opts: realRollResult.ops || [],
      }
    } else if (rollResult.type === 'die' || rollResult.type === 'number') {
      const realRollResult = rollResult as RealRollBase
      return {
        result: realRollResult.value,
        groups: [
          {
            type: realRollResult.type as 'die' | 'number', // 已经过滤过了，不会有别的类型
            value: realRollResult.value,
            dices: mapRolls(realRollResult.rolls),
          },
        ],
        opts: [], // 单个骰子或数字没有加减选项
      }
    } else {
      showToast('Unsupported roll result type', 'error')
      return null
    }
  }

  const diceBoxFunction = (functionName: 'add' | 'roll') => {
    return async (...args: Parameters<DiceBox['roll']>): Promise<boolean> => {
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
        if (functionName === 'roll') {
          await Promise.race([box.roll(...args), timeoutPromise, cancelPromise])
        } else if (functionName === 'add') {
          await Promise.race([box.add(...args), timeoutPromise, cancelPromise])
        }
        clearTimeout(timeoutId) // 清理超时定时器
        // 清理手动取消函数
        if (cancelPreviousRoll === cancelThisRun) {
          cancelPreviousRoll = null
        }
        return true
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

        return false
      }
    }
  }
  const diceBoxRoll = diceBoxFunction('roll')
  const diceBoxAdd = diceBoxFunction('add')

  // 不带动画的投掷，直接使用DiceRoller计算结果，直接返回，不需要Promise
  const parseAndRollWithoutAnimation = (notation: string): RollBase | null => {
    // 获取解析结果
    let rollResult: RealRollBase | null = null
    try {
      rollResult = diceRoller.roll(notation)
    } catch (e) {
      showToast('DiceRoller roll error: ' + (e as Error).message, 'error')
      return null
    }

    return rollResult
  }

  const parseAndRollWithAnimation = async (notation: string): Promise<RollBase | null> => {
    const myToken = {} // 生成本次投掷任务的唯一令牌
    rollToken = myToken // 保存当前令牌
    canvasOpacity.value = 1 // 重置透明度

    const box = getDiceBox()
    box.clear() // 清理之前的投掷

    let firstRoll: Array<RollObject> | null = null
    try {
      firstRoll = DP.parseNotation(notation)
    } catch (e) {
      showToast('DiceParser parseNotation error: ' + (e as Error).message, 'error')
      return null
    }
    if (firstRoll.length === 0) {
      const rollResult = box.getRollResults()
      const finalResult = DP.parseFinalResults(rollResult)
      return finalResult
    }
    if (!(await diceBoxRoll(firstRoll))) return null

    // 处理重新投掷
    let rollResult = box.getRollResults()
    let rerollList = DP.handleRerolls(rollResult)

    while (rerollList.length > 0) {
      if (!(await diceBoxAdd(rerollList))) return null
      rollResult = box.getRollResults()
      rerollList = DP.handleRerolls(rollResult)
    }

    // 解析最终结果
    const finalResult = DP.parseFinalResults(rollResult)

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

    return finalResult
  }

  const parseAndRoll = async (notation: string): Promise<RollOutput | null> => {
    const preprocessedNotion = Preprocess(notation)
    if (showAnimation.value) {
      const output = await parseAndRollWithAnimation(preprocessedNotion)
      return parseOuptput(output)
    } else {
      const output = parseAndRollWithoutAnimation(preprocessedNotion)
      return parseOuptput(output)
    }
  }

  // 暴露给组件使用的属性和方法
  return {
    initDiceBox,
    getDiceBox,
    showAnimation,
    canvasOpacity,
    parseAndRoll,
    Preprocess,
    parseExpression,
  }
}
