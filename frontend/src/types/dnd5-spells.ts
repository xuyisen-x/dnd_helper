export type Klass =
  | 'artificer' // 奇械师
  | 'barbarian' // 野蛮人
  | 'bard' // 吟游诗人
  | 'cleric' // 牧师
  | 'druid' // 德鲁伊
  | 'fighter' // 战士
  | 'monk' // 武僧
  | 'paladin' // 圣武士
  | 'ranger' // 游侠
  | 'rogue' // 游荡者
  | 'sorcerer' // 术士
  | 'warlock' // 契术师
  | 'wizard' // 法师

export type MagicSchool =
  | 'abjuration' // 防护
  | 'conjuration' // 咒法
  | 'divination' // 预言
  | 'enchantment' // 惑控
  | 'evocation' // 塑能
  | 'illusion' // 幻术
  | 'necromancy' // 死灵
  | 'transmutation' // 变化

export type Source =
  | 'PHB24' // 玩家手册 2024版
  | 'PHB14' // 玩家手册 2014版
  | 'XGE'
  | 'TCE'
  | 'FTD'
  | 'BMT'
  | 'GGR'
  | 'AI'
  | 'SCC'
  | 'AAG'
  | 'SO'
  | 'FR'
  | 'MODULE' // 模组自定义

export interface SpellClassInfo {
  class: Klass
  source: string | null
}

export interface Spell {
  /** 法术唯一标识符 (hash) */
  id: string

  /** 法术名称 (中文) */
  name: string

  /** 法术英文名称 */
  english_name: string

  /** 法术等级，0为戏法 */
  level: number

  /** 魔法学派 */
  school: MagicSchool

  /** 可使用该法术的职业列表 */
  class_list: SpellClassInfo[]

  /** 是否为仪式法术 */
  is_ritual: boolean

  /** 施法时间 */
  casting_time: string

  /** 施法范围 (注意：Python 属性是 spell_range，但 JSON key 是 range) */
  range: string

  /** 法术成分：言语 (V) */
  need_verbal: boolean

  /** 法术成分：姿势 (S) */
  need_somatic: boolean

  /** 法术成分：材料 (M) */
  material: string | null

  /** 是否需要专注 */
  need_concentration: boolean

  /** 持续时间 */
  duration: string

  /** 法术描述 */
  description: string

  /** 法术来源书籍 */
  source: Source

  /** 是否已经过时 (Legacy) */
  is_legacy: boolean
}
