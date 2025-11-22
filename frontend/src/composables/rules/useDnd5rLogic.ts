import type { Ref } from 'vue'
import { computed } from 'vue'
import type { Dnd5rData } from '@/stores/rules/dnd5r'

export function useDnd5rLogic(sheet: Ref<Dnd5rData>) {
  const totalLevel = computed(() => {
    const classes = sheet.value.basic.classes
    if (!classes || classes.length === 0) return 0
    // 这里的 cls.level 可能是字符串(输入框)，转换一下保险
    return classes.reduce((sum, cls) => sum + Number(cls.level || 0), 0)
  })

  return { totalLevel }
}
