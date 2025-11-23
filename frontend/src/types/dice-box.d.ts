declare module '@3d-dice/dice-box' {
  // 1. 配置项接口
  export interface DiceBoxOptions {
    id?: string
    container?: string
    assetPath?: string
    origin?: string
    scale?: number
    theme?: string
    themeColor?: string
    offscreen?: boolean
    // ... 你可以根据需要添加更多配置项
  }

  // 2. 投掷结果接口 (根据实际返回结构简化)
  export interface DiceRollResult {
    qty: number
    sides: number
    value: number // 最重要的点数
    rollId?: number
    groupId?: number
    theme?: string
    // ... 其他属性
  }

  // 3. DiceBox 类声明
  export default class DiceBox {
    constructor(options: DiceBoxOptions)

    // 初始化方法
    init(): Promise<void>

    // 投掷方法
    // 支持字符串 (e.g., '2d20') 或对象配置
    roll(notation: string | object): Promise<DiceRollResult[]>

    // 清理方法
    clear(): void

    // 隐藏/显示
    hide(): void
    show(): void

    // 重新调整大小
    resize(): void
  }
}
