import type { Spell, Klass, MagicSchool, Source } from '@/types/dnd5-spells'

const levelLabels: Record<number, string> = {
  0: '戏法(零环)',
  1: '一环',
  2: '二环',
  3: '三环',
  4: '四环',
  5: '五环',
  6: '六环',
  7: '七环',
  8: '八环',
  9: '九环',
}

const schoolLabels: Record<MagicSchool, string> = {
  abjuration: '防护',
  conjuration: '咒法',
  divination: '预言',
  enchantment: '惑控',
  evocation: '塑能',
  illusion: '幻术',
  necromancy: '死灵',
  transmutation: '变化',
}

const classLabels: Record<Klass, string> = {
  artificer: '奇械师',
  barbarian: '野蛮人',
  bard: '吟游诗人',
  cleric: '牧师',
  druid: '德鲁伊',
  fighter: '战士',
  monk: '武僧',
  paladin: '圣武士',
  ranger: '游侠',
  rogue: '游荡者',
  sorcerer: '术士',
  warlock: '契术师',
  wizard: '法师',
}

const classLabelsO: Record<Klass, string> = {
  artificer: '械',
  barbarian: '野蛮人',
  bard: '诗',
  cleric: '牧',
  druid: '德',
  fighter: '战士',
  monk: '武僧',
  paladin: '帕',
  ranger: '软',
  rogue: '游荡者',
  sorcerer: '术',
  warlock: '锁',
  wizard: '法',
}

const sourceLabels: Record<Source, string> = {
  PHB24: 'PHB24',
  PHB14: 'PHB14',
  XGE: 'XGE',
  TCE: 'TCE',
  FTD: 'FTD',
  BMT: 'BMT',
  GGR: 'GGR',
  AI: 'AI',
  SCC: 'SCC',
  AAG: 'AAG',
  SO: 'SO',
  FR: 'FR',
  MODULE: '模组',
}

export const getLevelLabel = (level: number) => levelLabels[level] ?? `${level}环`

export const getSchoolLabel = (school: MagicSchool) => schoolLabels[school] ?? school

export const getSourceLabel = (source: Source) => sourceLabels[source] ?? source

export const getClassLabel = (cls: Klass) => classLabels[cls] ?? cls

export const getClassNames = (spell: Spell) => {
  const names = spell.class_list.map((item) => {
    let tmp = classLabels[item.class] ?? item.class
    if (item.source !== null) {
      tmp += item.source
    }
    return tmp
  })
  return Array.from(new Set(names)).join(' / ')
}

export const getClassHtml = (spell: Spell) => {
  const names = spell.class_list.map((item) => {
    const className = classLabels[item.class] ?? item.class
    if (item.source !== null) {
      // 直接把 HTML 标签拼进去
      return `${className}<sup>${item.source}</sup>`
    }
    return className
  })

  // 去重并拼接
  return Array.from(new Set(names)).join(' / ')
}

export const getClassNamesO = (spell: Spell) => {
  const names = spell.class_list.map((item) => {
    let tmp = classLabelsO[item.class] ?? item.class
    if (item.source !== null) {
      tmp += `*`
    }
    return tmp
  })
  return Array.from(new Set(names)).join(' ')
}

export const formatComponents = (spell: Spell) => {
  const components = [
    spell.need_verbal ? 'V' : null,
    spell.need_somatic ? 'S' : null,
    spell.material ? 'M' : null,
  ]
  return components.filter(Boolean).join(', ')
}
