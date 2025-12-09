// ==========================================
// 1. 辅助类型、接口定义
// ==========================================
export type SixAbilityKeysDnd5 = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// 单个属性 (如: 力量)
export interface AbilityDnd5 {
  score: number // 属性值
  save: boolean // 是否有该属性豁免的熟练
}

// 单个技能
export interface SkillDnd5 {
  key: SixAbilityKeysDnd5 // 关联的属性
  prof: boolean // 是否熟练
  expert: boolean // 是否精通
}

// 显式定义包含所有 18 个技能的结构
export interface SkillsListDnd5 {
  // 力量
  athletics: SkillDnd5 // 运动

  // 敏捷
  acrobatics: SkillDnd5 // 体操
  sleight_of_hand: SkillDnd5 // 巧手
  stealth: SkillDnd5 // 隐匿

  // 智力
  arcana: SkillDnd5 // 奥秘
  history: SkillDnd5 // 历史
  investigation: SkillDnd5 // 调查
  nature: SkillDnd5 // 自然
  religion: SkillDnd5 // 宗教

  // 感知
  animal_handling: SkillDnd5 // 驯兽
  insight: SkillDnd5 // 洞悉
  medicine: SkillDnd5 // 医药
  perception: SkillDnd5 // 察觉
  survival: SkillDnd5 // 求生

  // 魅力
  deception: SkillDnd5 // 欺瞒
  intimidation: SkillDnd5 // 威吓
  performance: SkillDnd5 // 表演
  persuasion: SkillDnd5 // 说服
}

// 钱币
export interface CoinsDnd5 {
  cp: number // 铜币Copper Piece (CP)
  sp: number // 银币Silver Piece (SP)
  ep: number // 银金币Electrum Piece (EP)
  gp: number // 金币Gold Piece (GP)
  pp: number // 铂金币Platinum Piece (PP)
}

// 武器/攻击
export interface AttackDnd5 {
  id: number // 唯一编号
  name: string // 武器/攻击名称
  bonus: string // 攻击加值
  damage: string // 伤害
  damageType: string // 伤害类型
  notes: string // 备注
}

// 法术位
export interface SpellSlotDnd5 {
  total: number // 法术位总数
  used: number // 已使用的法术位数
}

// 法术位们
export interface SpellSlotsDnd5 {
  1: SpellSlotDnd5
  2: SpellSlotDnd5
  3: SpellSlotDnd5
  4: SpellSlotDnd5
  5: SpellSlotDnd5
  6: SpellSlotDnd5
  7: SpellSlotDnd5
  8: SpellSlotDnd5
  9: SpellSlotDnd5
}

// 职业列表中的单个职业项
export interface ClassItemDnd5 {
  id: number // 唯一编号
  name: string // 职业名称
  subclass: string // 子职名称
  level: number // 该职业的等级
  isPrimary: boolean // 是否为主职业
}

// 伤害易感性
export interface DamageSusceptibilitiesDnd5 {
  bludgeoning: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  slashing: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  piercing: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  fire: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  cold: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  lightning: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  thunder: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  poison: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  acid: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  psychic: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  force: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  radiant: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
  necrotic: 'normal' | 'immunity' | 'resistance' | 'vulnerability'
}

// ==========================================
// 2. 辅助映射表
// ==========================================

export const DND5R_ABILITY_FULL_NAMES: Record<SixAbilityKeysDnd5, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '感知',
  cha: '魅力',
}

export const DND5R_SKILL_FULL_NAMES: Record<keyof SkillsListDnd5, string> = {
  athletics: '运动',
  acrobatics: '体操',
  sleight_of_hand: '巧手',
  stealth: '隐匿',
  arcana: '奥秘',
  history: '历史',
  investigation: '调查',
  nature: '自然',
  religion: '宗教',
  animal_handling: '驯兽',
  insight: '洞悉',
  medicine: '医药',
  perception: '察觉',
  survival: '求生',
  deception: '欺瞒',
  intimidation: '威吓',
  performance: '表演',
  persuasion: '说服',
}

export const DAMAGE_TYEP_NAMES: Record<keyof DamageSusceptibilitiesDnd5, string> = {
  bludgeoning: '钝击',
  slashing: '挥砍',
  piercing: '穿刺',
  fire: '火焰',
  cold: '寒冷',
  lightning: '闪电',
  thunder: '雷鸣',
  poison: '毒素',
  acid: '强酸',
  psychic: '心灵',
  force: '力场',
  radiant: '光耀',
  necrotic: '暗蚀',
}

// ==========================================
// 3. 核心数据结构定义
// ==========================================

export interface Dnd5Data {
  // --- 基础信息 ---
  basic: {
    name: string
    background: string
    race: string
    classes: ClassItemDnd5[] // 职业列表
    alignment: string
    xp: number
  }

  // --- 六维属性 ---
  abilities: {
    str: AbilityDnd5
    dex: AbilityDnd5
    con: AbilityDnd5
    int: AbilityDnd5
    wis: AbilityDnd5
    cha: AbilityDnd5
  }

  // --- 战斗核心 ---
  combat: {
    hp: {
      current: number
      max: number
      temp: string
    }
    hitDice: {
      d6: { total: number; current: number }
      d8: { total: number; current: number }
      d10: { total: number; current: number }
      d12: { total: number; current: number }
    }
    ac: string
    speed: number
    size: string
    inspiration: boolean
    deathSaves: {
      success: number
      fail: number
    }
    exhaustion: number
  }

  // --- 熟练项与列表 ---
  skills: SkillsListDnd5

  // --- 装备熟练与工具熟练 ---
  proficiencies: {
    armor: {
      light: boolean
      medium: boolean
      heavy: boolean
      shield: boolean
    }
    weapons: string
    tools: string
  }

  // --- 武器/攻击 ---
  attacks: AttackDnd5[] // 使用 AttackDnd5r

  // 特性与能力
  features: {
    damage_susceptibilities: DamageSusceptibilitiesDnd5
  }

  // --- 法术 ---
  spells: {
    slots: SpellSlotsDnd5
    pact_slots: SpellSlotsDnd5
    list: string[]
    ability: 'int' | 'wis' | 'cha' | ''
  }

  extra_modify: {
    save: {
      str: string
      dex: string
      con: string
      int: string
      wis: string
      cha: string
    }
    skill: {
      athletics: string
      acrobatics: string
      sleight_of_hand: string
      stealth: string
      arcana: string
      history: string
      investigation: string
      nature: string
      religion: string
      animal_handling: string
      insight: string
      medicine: string
      perception: string
      survival: string
      deception: string
      intimidation: string
      performance: string
      persuasion: string
    }
    initiative: string
  }

  // 立绘图片的Base64字符串
  portraitBase64: string

  // 背景故事
  background: {
    story: string
    languages: string
  }
}

// ==========================================
// 4. 工厂函数 (类型也随之更新)
// ==========================================

export function createEmptyDnd5Data(): Dnd5Data {
  return {
    basic: {
      name: '',
      classes: [{ id: 1, name: '', subclass: '', level: 0, isPrimary: true }],
      background: '',
      race: '',
      alignment: '',
      xp: 0,
    },
    abilities: {
      str: { score: 10, save: false },
      dex: { score: 10, save: false },
      con: { score: 10, save: false },
      int: { score: 10, save: false },
      wis: { score: 10, save: false },
      cha: { score: 10, save: false },
    },
    combat: {
      hp: { current: 0, max: 0, temp: '' },
      hitDice: {
        d6: { total: 0, current: 0 },
        d8: { total: 0, current: 0 },
        d10: { total: 0, current: 0 },
        d12: { total: 0, current: 0 },
      },
      ac: '10+@dex',
      speed: 30,
      size: '中型',
      inspiration: false,
      deathSaves: { success: 0, fail: 0 },
      exhaustion: 0,
    },
    skills: {
      athletics: { key: 'str', prof: false, expert: false },
      acrobatics: { key: 'dex', prof: false, expert: false },
      sleight_of_hand: { key: 'dex', prof: false, expert: false },
      stealth: { key: 'dex', prof: false, expert: false },
      arcana: { key: 'int', prof: false, expert: false },
      history: { key: 'int', prof: false, expert: false },
      investigation: { key: 'int', prof: false, expert: false },
      nature: { key: 'int', prof: false, expert: false },
      religion: { key: 'int', prof: false, expert: false },
      animal_handling: { key: 'wis', prof: false, expert: false },
      insight: { key: 'wis', prof: false, expert: false },
      medicine: { key: 'wis', prof: false, expert: false },
      perception: { key: 'wis', prof: false, expert: false },
      survival: { key: 'wis', prof: false, expert: false },
      deception: { key: 'cha', prof: false, expert: false },
      intimidation: { key: 'cha', prof: false, expert: false },
      performance: { key: 'cha', prof: false, expert: false },
      persuasion: { key: 'cha', prof: false, expert: false },
    },
    proficiencies: {
      armor: {
        light: false,
        medium: false,
        heavy: false,
        shield: false,
      },
      weapons: '',
      tools: '',
    },
    attacks: [
      {
        id: 1,
        name: '徒手攻击',
        bonus: '(@str+@pb)',
        damage: '1+@str',
        damageType: '钝击',
        notes: '',
      },
    ],
    features: {
      damage_susceptibilities: {
        bludgeoning: 'normal',
        slashing: 'normal',
        piercing: 'normal',
        fire: 'normal',
        cold: 'normal',
        lightning: 'normal',
        thunder: 'normal',
        poison: 'normal',
        acid: 'normal',
        psychic: 'normal',
        force: 'normal',
        radiant: 'normal',
        necrotic: 'normal',
      },
    },
    spells: {
      slots: {
        1: { total: 0, used: 0 },
        2: { total: 0, used: 0 },
        3: { total: 0, used: 0 },
        4: { total: 0, used: 0 },
        5: { total: 0, used: 0 },
        6: { total: 0, used: 0 },
        7: { total: 0, used: 0 },
        8: { total: 0, used: 0 },
        9: { total: 0, used: 0 },
      },
      pact_slots: {
        1: { total: 0, used: 0 },
        2: { total: 0, used: 0 },
        3: { total: 0, used: 0 },
        4: { total: 0, used: 0 },
        5: { total: 0, used: 0 },
        6: { total: 0, used: 0 },
        7: { total: 0, used: 0 },
        8: { total: 0, used: 0 },
        9: { total: 0, used: 0 },
      },
      list: [],
      ability: '',
    },
    extra_modify: {
      save: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
      skill: {
        athletics: '',
        acrobatics: '',
        sleight_of_hand: '',
        stealth: '',
        arcana: '',
        history: '',
        investigation: '',
        nature: '',
        religion: '',
        animal_handling: '',
        insight: '',
        medicine: '',
        perception: '',
        survival: '',
        deception: '',
        intimidation: '',
        performance: '',
        persuasion: '',
      },
      initiative: '',
    },
    portraitBase64: '',
    background: {
      story: '',
      languages: '',
    },
  }
}
