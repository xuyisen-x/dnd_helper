declare module '@3d-dice/dice-parser-interface' {
  import type { RollObject, RollResultObject } from '@3d-dice/dice-box'
  import type { RollBase } from 'dice-roller-parser'

  export interface FinalDiceResult {
    failures: number
    vaild: boolean
    value: number
    dice: Array<object>
  }

  export default class DiceParser {
    constructor()

    parseNotation(notation: string): Array<RollObject>

    handleRerolls(rollResults: Array<RollResultObject>): Array<RollObject>

    parseFinalResults(rollResults: Array<RollResultObject>): RollBase
  }
}
