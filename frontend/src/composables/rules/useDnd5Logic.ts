import type { Ref, ComputedRef } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5Data, FeatureDnd5, SixAbilityKeysDnd5 } from '@/stores/rules/dnd5'
import { useDiceBox } from '../useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import { nanoid } from 'nanoid'

export interface FeatureViewDnd5 {
  name: string // 特性名称
  description: string // 特性描述
  displayCount: number // 视图显示的数值（经过截断的）
  displayLimit: number // 视图显示的上限数值，undefined表示无限制
  setCount: (val: number) => void
}

export interface EquipmentViewDnd5 {
  name: string // 装备名称
  description: string // 装备描述
  quantity: number // 数量
  attunement: boolean // 是否已同调
  displayLimit: number // 视图显示的上限数值，undefined表示无限制
  displayCharges: number // 视图显示的数值（经过截断的）
  setCharges: (val: number) => void
  toggleAttunement: () => void
  changeQuantity: (delta: number) => void
}

export function formatWithSign(num: number): string {
  return num > 0 ? `+${num}` : `${num}`
}

export function useDnd5Logic(sheet: Ref<Dnd5Data>) {
  const SKILL_KEYS: Array<keyof Dnd5Data['skills']> = Object.keys(sheet.value.skills) as Array<
    keyof Dnd5Data['skills']
  >

  const costomMacroReplace = (input: string) => {
    const regex = /@(ras|str|dex|con|int|wis|cha|pb|lv\d+)\b/gi
    return input.replace(regex, (match, key) => {
      const lowerKey = key.toLowerCase()

      let value: number | string | undefined = undefined
      if (lowerKey === 'pb') {
        value = proficiencyBonus.value
      } else if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(lowerKey)) {
        value = abilityModifies[lowerKey as SixAbilityKeysDnd5]
      } else if (/^lv\d+$/.test(lowerKey)) {
        const index = parseInt(lowerKey.slice(2))
        if (index === 0) {
          // lv0 对应总等级
          value = totalLevel.value
        } else {
          value = sheet.value.basic.classes[index - 1]?.level || 0
        }
      } else if (lowerKey === 'ras') {
        value = 'sortd([4d6kh3]**6)' // 这里返回一个骰子表达式字符串，表示属性点随机方法
      }
      return String(value)
    })
  }

  const evalCostomFamula = (input: string): number => {
    if (input.trim() === '') return 0
    const { foldAndCheckConstantsInteger } = useDiceBox()
    const [result, value] = foldAndCheckConstantsInteger(input)
    return result ? value : 0
  }

  const totalLevel = computed(() => {
    const classes = sheet.value.basic.classes
    if (!classes || classes.length === 0) return 0
    // 这里的 cls.level 可能是字符串(输入框)，转换一下保险
    return classes.reduce((sum, cls) => sum + Number(cls.level || 0), 0)
  })

  const getAbilityModify = (ability: SixAbilityKeysDnd5): number => {
    const abilityScore = sheet.value.abilities[ability].score
    return Math.floor((abilityScore - 10) / 2)
  }
  const abilityModifies: Record<SixAbilityKeysDnd5, number> = reactive({
    str: computed(() => getAbilityModify('str')),
    dex: computed(() => getAbilityModify('dex')),
    con: computed(() => getAbilityModify('con')),
    int: computed(() => getAbilityModify('int')),
    wis: computed(() => getAbilityModify('wis')),
    cha: computed(() => getAbilityModify('cha')),
  })

  const proficiencyBonus = computed(() => {
    if (totalLevel.value <= 4) {
      return 2
    } else if (totalLevel.value <= 8) {
      return 3
    } else if (totalLevel.value <= 12) {
      return 4
    } else if (totalLevel.value <= 16) {
      return 5
    } else {
      return 6
    }
  })

  // 计算成本较大，需要缓存
  const extraSaveModifies: Record<SixAbilityKeysDnd5, number> = reactive({
    str: computed(() => evalCostomFamula(sheet.value.extra_modify.save.str)),
    dex: computed(() => evalCostomFamula(sheet.value.extra_modify.save.dex)),
    con: computed(() => evalCostomFamula(sheet.value.extra_modify.save.con)),
    int: computed(() => evalCostomFamula(sheet.value.extra_modify.save.int)),
    wis: computed(() => evalCostomFamula(sheet.value.extra_modify.save.wis)),
    cha: computed(() => evalCostomFamula(sheet.value.extra_modify.save.cha)),
  })
  const getSaveModify = (ability: SixAbilityKeysDnd5): number => {
    return (
      abilityModifies[ability] + // 能力调整值
      (sheet.value.abilities[ability].save ? proficiencyBonus.value : 0) + // 如果熟练豁免加上熟练加值
      extraSaveModifies[ability] // 加上用户自定义的额外调整值
    )
  }
  const saveModifies: Record<SixAbilityKeysDnd5, number> = reactive({
    str: computed(() => getSaveModify('str')),
    dex: computed(() => getSaveModify('dex')),
    con: computed(() => getSaveModify('con')),
    int: computed(() => getSaveModify('int')),
    wis: computed(() => getSaveModify('wis')),
    cha: computed(() => getSaveModify('cha')),
  })

  const extraSkillModifies: Record<keyof Dnd5Data['skills'], number> = reactive(
    SKILL_KEYS.reduce(
      (acc, skillKey) => {
        acc[skillKey] = computed(() => evalCostomFamula(sheet.value.extra_modify.skill[skillKey]))
        return acc
      },
      {} as Record<keyof Dnd5Data['skills'], ComputedRef<number>>,
    ),
  )
  const getSkillModify = (skillKey: keyof Dnd5Data['skills']): number => {
    const skill = sheet.value.skills[skillKey]
    const ability = skill.key
    return (
      abilityModifies[ability] + // 能力调整值
      (skill.prof ? proficiencyBonus.value : 0) + // 如果熟练该技能加上熟练加值
      (skill.prof && skill.expert ? proficiencyBonus.value : 0) + // 如果精通该技能再加一次熟练加值
      extraSkillModifies[skillKey] // 加上用户自定义的额外调整值
    )
  }
  const skillModifies: Record<keyof Dnd5Data['skills'], number> = reactive(
    SKILL_KEYS.reduce(
      (acc, skillKey) => {
        acc[skillKey] = computed(() => getSkillModify(skillKey))
        return acc
      },
      {} as Record<keyof Dnd5Data['skills'], ComputedRef<number>>,
    ),
  )

  const addClass = (): void => {
    // 如果是第一个插入的职业，则是主职业，负责不是
    const isPrimary = sheet.value.basic.classes.length === 0 ? true : false
    const id =
      sheet.value.basic.classes.length === 0
        ? 1
        : Math.max(...sheet.value.basic.classes.map((c) => c.id)) + 1
    sheet.value.basic.classes.push({
      id: id,
      name: '',
      subclass: '',
      level: 0,
      isPrimary: isPrimary,
    })
  }

  const removeClass = (index: number): void => {
    sheet.value.basic.classes.splice(index, 1)
  }

  const addAttack = (): void => {
    sheet.value.attacks.push({
      id: nanoid(),
      name: '',
      bonus: '',
      damage: '',
      damageType: 'nonmagicalbludgeoning',
      notes: '',
    })
  }

  const removeAttack = (index: number): void => {
    sheet.value.attacks.splice(index, 1)
  }

  const passivePerception = computed(() => {
    return 10 + skillModifies.perception
  })

  const initiativeTotal = computed(() => {
    return (
      abilityModifies.dex +
      // 加上用户自定义的额外调整值（表达式计算）
      // 不允许不确定性，必须是确定的数字
      evalCostomFamula(sheet.value.extra_modify.initiative)
    )
  })

  // 特性限制和使用次数相关逻辑
  const calculateLimit = (limitStr: string): number => {
    if (limitStr.trim() === '') return Infinity
    const max = Math.floor(evalCostomFamula(limitStr))
    return Math.max(max, 0)
  }

  // 特性的视图数据
  const createFeatureViewList = (
    rawListGetter: () => FeatureDnd5[],
  ): ComputedRef<FeatureViewDnd5[]> => {
    return computed(() => {
      const list = rawListGetter()

      return list.map((feature) => {
        const displayLimit = calculateLimit(feature.usageLimit)
        const displayCount =
          displayLimit === Infinity
            ? feature.usageCount
            : Math.max(Math.min(feature.usageCount, displayLimit), 0)

        return {
          name: feature.name,
          description: feature.description,
          displayCount,
          displayLimit,
          setCount: (newVal: number) => {
            let targetVal = newVal < 0 ? 0 : newVal
            if (displayLimit !== Infinity && targetVal > displayLimit) {
              targetVal = displayLimit
            }
            feature.usageCount = targetVal
          },
        }
      })
    })
  }
  const classFeaturesView = createFeatureViewList(() => sheet.value.features.class_features)
  const raceFeaturesView = createFeatureViewList(() => sheet.value.features.race_features)
  const featFeaturesView = createFeatureViewList(() => sheet.value.features.feat)

  // 装备的视图数据
  const equipmentView: ComputedRef<EquipmentViewDnd5[]> = computed(() => {
    return sheet.value.equipment.map((equip) => {
      const displayLimit = calculateLimit(equip.chargesLimit)
      const displayCharges =
        displayLimit === Infinity
          ? equip.chargesCurrent
          : Math.max(Math.min(equip.chargesCurrent, displayLimit), 0)
      const displayQuantity = equip.quantity < 0 ? 0 : equip.quantity

      return {
        name: equip.name,
        description: equip.description,
        quantity: displayQuantity,
        attunement: equip.attunement,
        displayLimit,
        displayCharges,
        setCharges: (newVal: number) => {
          let targetVal = newVal < 0 ? 0 : newVal
          if (displayLimit !== Infinity && targetVal > displayLimit) {
            targetVal = displayLimit
          }
          equip.chargesCurrent = targetVal
        },
        toggleAttunement: () => {
          equip.attunement = !equip.attunement
        },
        changeQuantity: (delta: number) => {
          let newQuantity = equip.quantity + delta
          if (newQuantity < 0) newQuantity = 0
          equip.quantity = newQuantity
        },
      }
    })
  })

  const attunedCount = computed(() => {
    return equipmentView.value.reduce((count, equip) => {
      return count + (equip.attunement ? 1 : 0)
    }, 0)
  })

  // 长休逻辑
  const longRest = async (is5R: boolean) => {
    // 检查的逻辑
    const {
      foldAndCheckNumber,
      foldAndCheckConstantsInteger,
      checkNotationValidAndFold,
      parseAndRoll,
    } = useDiceBox()

    // 1. 恢复生命值到最大值，并清除临时生命值
    sheet.value.combat.hp.current = sheet.value.combat.hp.max
    sheet.value.combat.hp.temp = ''

    // 2. 恢复生命骰
    if (is5R) {
      // 5R规则下，生命骰全部恢复
      sheet.value.combat.hitDice.d6.current = sheet.value.combat.hitDice.d6.total
      sheet.value.combat.hitDice.d8.current = sheet.value.combat.hitDice.d8.total
      sheet.value.combat.hitDice.d10.current = sheet.value.combat.hitDice.d10.total
      sheet.value.combat.hitDice.d12.current = sheet.value.combat.hitDice.d12.total
    } else {
      // 5E 规则下，生命骰总数的一半，向下取整，至少恢复一个
      // 计算总生命骰数
      const totalHitDice =
        sheet.value.combat.hitDice.d6.total +
        sheet.value.combat.hitDice.d8.total +
        sheet.value.combat.hitDice.d10.total +
        sheet.value.combat.hitDice.d12.total
      let remainingToRecover = Math.max(Math.floor(totalHitDice / 2), 1)
      // 按照 d12, d10, d8, d6 的顺序恢复
      const hitDiceTypes: Array<keyof Dnd5Data['combat']['hitDice']> = ['d12', 'd10', 'd8', 'd6']
      for (const type of hitDiceTypes) {
        if (remainingToRecover <= 0) break
        const current = sheet.value.combat.hitDice[type].current
        const total = sheet.value.combat.hitDice[type].total
        const canRecover = total - current
        if (canRecover > 0) {
          const toRecover = Math.min(canRecover, remainingToRecover)
          sheet.value.combat.hitDice[type].current += toRecover
          remainingToRecover -= toRecover
        }
      }
    }

    // 3. 恢复所有法术位
    sheet.value.spells.slots[1].used = 0
    sheet.value.spells.slots[2].used = 0
    sheet.value.spells.slots[3].used = 0
    sheet.value.spells.slots[4].used = 0
    sheet.value.spells.slots[5].used = 0
    sheet.value.spells.slots[6].used = 0
    sheet.value.spells.slots[7].used = 0
    sheet.value.spells.slots[8].used = 0
    sheet.value.spells.slots[9].used = 0

    // 4. 恢复所有魔契法术位
    sheet.value.spells.pact_slots[1].used = 0
    sheet.value.spells.pact_slots[2].used = 0
    sheet.value.spells.pact_slots[3].used = 0
    sheet.value.spells.pact_slots[4].used = 0
    sheet.value.spells.pact_slots[5].used = 0
    sheet.value.spells.pact_slots[6].used = 0
    sheet.value.spells.pact_slots[7].used = 0
    sheet.value.spells.pact_slots[8].used = 0
    sheet.value.spells.pact_slots[9].used = 0

    // 5. 按照循序遍历所有特性，如果有 afterLongRest 字段，收集到一起，最后统一执行
    // index, limit, expression
    const afterLongRestActions: Array<[number, number, string]> = []
    const allFeatures = [
      ...sheet.value.features.class_features,
      ...sheet.value.features.race_features,
      ...sheet.value.features.feat,
      ...sheet.value.equipment,
    ]
    for (const [index, feature] of allFeatures.entries()) {
      // 1. 检查是否有 afterLongRest 字段
      if (!feature.afterLongRest || feature.afterLongRest.trim() === '') continue
      // 2. 检查是否定义了上限
      const limit = calculateLimit(
        'usageLimit' in feature ? feature.usageLimit : feature.chargesLimit,
      )
      if (limit === Infinity) continue // 无上限的不处理
      // 3. 重置使用次数/充能到上限
      const current = 'usageCount' in feature ? feature.usageCount : feature.chargesCurrent
      if (current >= limit) continue // 已经满的跳过
      // 4. 检查 afterLongRest 是否为常数
      const [isConstant, value] = foldAndCheckConstantsInteger(feature.afterLongRest)
      // 是常数，直接添加
      if (isConstant) {
        if ('usageCount' in feature) {
          feature.usageCount = Math.min(value + current, limit)
        } else {
          feature.chargesCurrent = Math.min(value + current, limit)
        }
        continue
      }
      // 不是常数，检查是否为合法的数字表达式，满足则添加到待执行列表
      const [isNumber, evalValue] = foldAndCheckNumber(feature.afterLongRest)
      if (isNumber) {
        afterLongRestActions.push([index, limit, evalValue]) // 直接传入折叠好的数字，可以避免一部分的重复计算
      }
    }

    // 6. 如果没有需要执行的动作，可以直接返回了
    if (afterLongRestActions.length === 0) return

    // 7. 组合成一个列表表达式，统一执行
    const expression = `[${afterLongRestActions.map((item) => item[2]).join(',')}]`
    const result = checkNotationValidAndFold(expression)
    if (!result[0]) return // 理论上不可能失败

    // 8. 投掷！
    const outputNode = await parseAndRoll(expression)
    if (!outputNode) return
    addDiceResult(outputNode, expression, '长休资源恢复')

    // 9. 解析结果，更新对应的特性使用次数/充能
    if (outputNode.value.type !== 'list') return // 理论上不可能失败
    const values = outputNode.value.value
    for (let i = 0; i < afterLongRestActions.length; i++) {
      const featureIndex = afterLongRestActions[i]![0]
      const limit = afterLongRestActions[i]![1]
      const rolledValue = values[i]!
      const item = allFeatures[featureIndex]!
      if ('usageCount' in item) {
        const current = item.usageCount
        item.usageCount = Math.min(current + rolledValue, limit)
      } else {
        const current = item.chargesCurrent
        item.chargesCurrent = Math.min(current + rolledValue, limit)
      }
    }
  }

  // 短休逻辑
  const shortRest = async () => {
    // 消耗生命骰的逻辑外部交互式处理，不在本函数中
    // 检查的逻辑
    const {
      foldAndCheckNumber,
      foldAndCheckConstantsInteger,
      checkNotationValidAndFold,
      parseAndRoll,
    } = useDiceBox()

    // 1. 恢复所有魔契法术位
    sheet.value.spells.pact_slots[1].used = 0
    sheet.value.spells.pact_slots[2].used = 0
    sheet.value.spells.pact_slots[3].used = 0
    sheet.value.spells.pact_slots[4].used = 0
    sheet.value.spells.pact_slots[5].used = 0
    sheet.value.spells.pact_slots[6].used = 0
    sheet.value.spells.pact_slots[7].used = 0
    sheet.value.spells.pact_slots[8].used = 0
    sheet.value.spells.pact_slots[9].used = 0

    // 2. 按照循序遍历所有特性，如果有 afterShortRest 字段，收集到一起，最后统一执行
    // index, limit, expression
    const afterShortRestActions: Array<[number, number, string]> = []
    const allFeatures = [
      ...sheet.value.features.class_features,
      ...sheet.value.features.race_features,
      ...sheet.value.features.feat,
      ...sheet.value.equipment,
    ]
    for (const [index, feature] of allFeatures.entries()) {
      // 1. 检查是否有 afterShortRest 字段
      if (!feature.afterShortRest || feature.afterShortRest.trim() === '') continue
      // 2. 检查是否定义了上限
      const limit = calculateLimit(
        'usageLimit' in feature ? feature.usageLimit : feature.chargesLimit,
      )
      if (limit === Infinity) continue // 无上限的不处理
      // 3. 重置使用次数/充能到上限
      const current = 'usageCount' in feature ? feature.usageCount : feature.chargesCurrent
      if (current >= limit) continue // 已经满的跳过
      // 4. 检查 afterShortRest 是否为常数
      const [isConstant, value] = foldAndCheckConstantsInteger(feature.afterShortRest)
      // 是常数，直接添加
      if (isConstant) {
        if ('usageCount' in feature) {
          feature.usageCount = Math.min(value + current, limit)
        } else {
          feature.chargesCurrent = Math.min(value + current, limit)
        }
        continue
      }
      // 不是常数，检查是否为合法的数字表达式，满足则添加到待执行列表
      const [isNumber, evalValue] = foldAndCheckNumber(feature.afterShortRest)
      if (isNumber) {
        afterShortRestActions.push([index, limit, evalValue]) // 直接传入折叠好的数字，可以避免一部分的重复计算
      }
    }

    // 3. 如果没有需要执行的动作，可以直接返回了
    if (afterShortRestActions.length === 0) return

    // 4. 组合成一个列表表达式，统一执行
    const expression = `[${afterShortRestActions.map((item) => item[2]).join(',')}]`
    const result = checkNotationValidAndFold(expression)
    if (!result[0]) return // 理论上不可能失败

    // 5. 投掷！
    const outputNode = await parseAndRoll(expression)
    if (!outputNode) return
    addDiceResult(outputNode, expression, '短休资源恢复')

    // 6. 解析结果，更新对应的特性使用次数/充能
    if (outputNode.value.type !== 'list') return // 理论上不可能失败
    const values = outputNode.value.value
    for (let i = 0; i < afterShortRestActions.length; i++) {
      const featureIndex = afterShortRestActions[i]![0]
      const limit = afterShortRestActions[i]![1]
      const rolledValue = values[i]!
      const item = allFeatures[featureIndex]!
      if ('usageCount' in item) {
        const current = item.usageCount
        item.usageCount = Math.min(current + rolledValue, limit)
      } else {
        const current = item.chargesCurrent
        item.chargesCurrent = Math.min(current + rolledValue, limit)
      }
    }
  }

  return {
    costomMacroReplace,
    totalLevel,
    abilityModifies,
    proficiencyBonus,
    saveModifies,
    skillModifies,
    addClass,
    removeClass,
    addAttack,
    removeAttack,
    passivePerception,
    initiativeTotal,
    evalCostomFamula,
    classFeaturesView,
    raceFeaturesView,
    featFeaturesView,
    equipmentView,
    attunedCount,
    longRest,
    shortRest,
  }
}
