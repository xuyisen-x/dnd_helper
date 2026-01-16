import type { Ref, ComputedRef } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5Data, FeatureDnd5, SixAbilityKeysDnd5 } from '@/stores/rules/dnd5'
import { useDiceBox } from '../useDiceBox'

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
      id:
        sheet.value.attacks.length === 0
          ? 1
          : Math.max(...sheet.value.attacks.map((a) => a.id)) + 1,
      name: '',
      bonus: '',
      damage: '',
      damageType: '',
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
  }
}
