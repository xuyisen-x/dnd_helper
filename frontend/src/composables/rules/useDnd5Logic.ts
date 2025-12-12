import type { Ref, ComputedRef } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5Data, SixAbilityKeysDnd5 } from '@/stores/rules/dnd5'
import { recusiveMacroReplace } from '../useDiceBox'
import { check_constant_integer } from '@/wasm_utils/dice/pkg/dice_roller'

export function formatWithSign(num: number): string {
  return num > 0 ? `+${num}` : `${num}`
}

export function useDnd5Logic(sheet: Ref<Dnd5Data>) {
  const SKILL_KEYS: Array<keyof Dnd5Data['skills']> = Object.keys(sheet.value.skills) as Array<
    keyof Dnd5Data['skills']
  >

  const costomMacroReplace = (input: string) => {
    const regex = /@(str|dex|con|int|wis|cha|pb|lv\d+)\b/gi
    return input.replace(regex, (match, key) => {
      const lowerKey = key.toLowerCase()

      let value: number | undefined = undefined
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
      }
      return String(value)
    })
  }

  const evalCostomFamula = (input: string): number => {
    if (input.trim() === '') return 0
    try {
      const replaced = recusiveMacroReplace(input, costomMacroReplace, 5)
      const evalResult = check_constant_integer(replaced)
      if (evalResult.result === 'Constant') {
        return evalResult.value
      } else {
        return 0
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 0
    }
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
  }
}
