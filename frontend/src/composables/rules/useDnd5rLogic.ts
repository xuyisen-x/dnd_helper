import type { Ref } from 'vue'
import { computed, reactive } from 'vue'
import type { Dnd5rData, SixAbilityKeysDnd5r } from '@/stores/rules/dnd5r'

export function useDnd5rLogic(sheet: Ref<Dnd5rData>) {
  const totalLevel = computed(() => {
    const classes = sheet.value.basic.classes
    if (!classes || classes.length === 0) return 0
    // 这里的 cls.level 可能是字符串(输入框)，转换一下保险
    return classes.reduce((sum, cls) => sum + Number(cls.level || 0), 0)
  })

  const getModify = (ability: SixAbilityKeysDnd5r): number => {
    const abilityScore = sheet.value.abilities[ability].score
    return Math.floor((abilityScore - 10) / 2)
  }
  const abilityModifies: Record<SixAbilityKeysDnd5r, number> = reactive({
    str: computed(() => getModify('str')),
    dex: computed(() => getModify('dex')),
    con: computed(() => getModify('con')),
    int: computed(() => getModify('int')),
    wis: computed(() => getModify('wis')),
    cha: computed(() => getModify('cha')),
  })

  return { totalLevel, abilityModifies }
}
