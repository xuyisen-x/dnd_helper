import type { Ref, ComputedRef } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5Data, SixAbilityKeysDnd5 } from '@/stores/rules/dnd5'

export function formatWithSign(num: number): string {
  return num > 0 ? `+${num}` : `${num}`
}

const MATH_CONTEXT =
  'const min = Math.min; const max = Math.max; const floor = Math.floor; const ceil = Math.ceil; const abs = Math.abs;'

export function useDnd5rLogic(sheet: Ref<Dnd5Data>) {
  const SKILL_KEYS: Array<keyof Dnd5Data['skills']> = Object.keys(sheet.value.skills) as Array<
    keyof Dnd5Data['skills']
  >

  const replaceVariablesInString = (input: string) => {
    const regex = /@(str|dex|con|int|wis|cha|pb)\b/gi
    return input.replace(regex, (match, key) => {
      const lowerKey = key.toLowerCase()

      let value: number | undefined
      if (lowerKey === 'pb') {
        value = proficiencyBonus.value
      } else {
        value = abilityModifies[lowerKey as SixAbilityKeysDnd5]
      }
      return value !== undefined ? String(value) : '0'
    })
  }

  const _isValidNumberExpression = (input: string): boolean => {
    const clearedInput = input.replace(/\s+/g, '')
    // 允许空字符串，表示没有额外调整
    if (clearedInput === '') return true
    try {
      const func = new Function(`${MATH_CONTEXT} return ${input};`)
      const result = func()
      return typeof result === 'number' && !isNaN(result)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false
    }
  }

  const _evalStringExpression = (input: string) => {
    try {
      const func = new Function(`${MATH_CONTEXT} return ${input};`)
      const result = func()
      if (typeof result === 'number' && !isNaN(result)) {
        return result
      } else {
        return 0
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 0
    }
  }

  const evalStringWithVariables = (input: string): number => {
    const replaced = replaceVariablesInString(input)
    return _evalStringExpression(replaced)
  }

  const isValidStringWithVariables = (input: string): boolean => {
    const replaced = replaceVariablesInString(input)
    return _isValidNumberExpression(replaced)
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
    str: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.str)),
    dex: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.dex)),
    con: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.con)),
    int: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.int)),
    wis: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.wis)),
    cha: computed(() => evalStringWithVariables(sheet.value.extra_modify.save.cha)),
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
        acc[skillKey] = computed(() =>
          evalStringWithVariables(sheet.value.extra_modify.skill[skillKey]),
        )
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

  const passivePerception = computed(() => {
    return 10 + skillModifies.perception
  })

  const initiativeTotal = computed(() => {
    return (
      abilityModifies.dex +
      // 加上用户自定义的额外调整值（表达式计算）
      // 不允许不确定性，必须是确定的数字
      evalStringWithVariables(sheet.value.extra_modify.initiative)
    )
  })

  return {
    evalStringWithVariables,
    isValidStringWithVariables,
    totalLevel,
    abilityModifies,
    proficiencyBonus,
    saveModifies,
    skillModifies,
    addClass,
    removeClass,
    passivePerception,
    initiativeTotal,
  }
}
