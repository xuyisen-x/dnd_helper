import type { Ref } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5rData, SixAbilityKeysDnd5r } from '@/stores/rules/dnd5r'

export function formatWithSign(num: number): string {
  return num > 0 ? `+${num}` : `${num}`
}

export function useDnd5rLogic(sheet: Ref<Dnd5rData>) {
  const totalLevel = computed(() => {
    const classes = sheet.value.basic.classes
    if (!classes || classes.length === 0) return 0
    // 这里的 cls.level 可能是字符串(输入框)，转换一下保险
    return classes.reduce((sum, cls) => sum + Number(cls.level || 0), 0)
  })

  const getAbilityModify = (ability: SixAbilityKeysDnd5r): number => {
    const abilityScore = sheet.value.abilities[ability].score
    return Math.floor((abilityScore - 10) / 2)
  }
  const abilityModifies: Record<SixAbilityKeysDnd5r, number> = reactive({
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

  const getSaveModify = (ability: SixAbilityKeysDnd5r): number => {
    return (
      abilityModifies[ability] + // 能力调整值
      (sheet.value.abilities[ability].save ? proficiencyBonus.value : 0) + // 如果熟练豁免加上熟练加值
      sheet.value.extra_modify.save[ability] // 加上用户自定义的额外调整值
    )
  }
  const saveModifies: Record<SixAbilityKeysDnd5r, number> = reactive({
    str: computed(() => getSaveModify('str')),
    dex: computed(() => getSaveModify('dex')),
    con: computed(() => getSaveModify('con')),
    int: computed(() => getSaveModify('int')),
    wis: computed(() => getSaveModify('wis')),
    cha: computed(() => getSaveModify('cha')),
  })

  const getSkillModify = (skillKey: keyof Dnd5rData['skills']): number => {
    const skill = sheet.value.skills[skillKey]
    const ability = skill.key
    return (
      abilityModifies[ability] + // 能力调整值
      (skill.prof ? proficiencyBonus.value : 0) + // 如果熟练该技能加上熟练加值
      (skill.prof && skill.expert ? proficiencyBonus.value : 0) + // 如果精通该技能再加一次熟练加值
      sheet.value.extra_modify.skill[skillKey] // 加上用户自定义的额外调整值
    )
  }
  const skillModifies: Record<keyof Dnd5rData['skills'], number> = reactive({
    acrobatics: computed(() => getSkillModify('acrobatics')),
    animal_handling: computed(() => getSkillModify('animal_handling')),
    arcana: computed(() => getSkillModify('arcana')),
    athletics: computed(() => getSkillModify('athletics')),
    deception: computed(() => getSkillModify('deception')),
    history: computed(() => getSkillModify('history')),
    insight: computed(() => getSkillModify('insight')),
    intimidation: computed(() => getSkillModify('intimidation')),
    investigation: computed(() => getSkillModify('investigation')),
    medicine: computed(() => getSkillModify('medicine')),
    nature: computed(() => getSkillModify('nature')),
    perception: computed(() => getSkillModify('perception')),
    performance: computed(() => getSkillModify('performance')),
    persuasion: computed(() => getSkillModify('persuasion')),
    religion: computed(() => getSkillModify('religion')),
    sleight_of_hand: computed(() => getSkillModify('sleight_of_hand')),
    stealth: computed(() => getSkillModify('stealth')),
    survival: computed(() => getSkillModify('survival')),
  })

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

  return {
    totalLevel,
    abilityModifies,
    proficiencyBonus,
    saveModifies,
    skillModifies,
    addClass,
    removeClass,
  }
}
