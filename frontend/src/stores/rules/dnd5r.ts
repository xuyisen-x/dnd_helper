// ==========================================
// 1. 辅助类型、接口定义
// ==========================================
export type SixAbilityKeysDnd5r = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// 单个属性 (如: 力量)
export interface AbilityDnd5r {
  score: number // 属性值
  save: boolean // 是否有该属性豁免的熟练
}

// 单个技能
export interface SkillDnd5r {
  key: SixAbilityKeysDnd5r // 关联的属性
  prof: boolean // 是否熟练
  expert: boolean // 是否精通
}

// 显式定义包含所有 18 个技能的结构
export interface SkillsListDnd5r {
  // 力量
  athletics: SkillDnd5r // 运动

  // 敏捷
  acrobatics: SkillDnd5r // 体操
  sleight_of_hand: SkillDnd5r // 巧手
  stealth: SkillDnd5r // 隐匿

  // 智力
  arcana: SkillDnd5r // 奥秘
  history: SkillDnd5r // 历史
  investigation: SkillDnd5r // 调查
  nature: SkillDnd5r // 自然
  religion: SkillDnd5r // 宗教

  // 感知
  animal_handling: SkillDnd5r // 驯兽
  insight: SkillDnd5r // 洞悉
  medicine: SkillDnd5r // 医药
  perception: SkillDnd5r // 察觉
  survival: SkillDnd5r // 求生

  // 魅力
  deception: SkillDnd5r // 欺瞒
  intimidation: SkillDnd5r // 威吓
  performance: SkillDnd5r // 表演
  persuasion: SkillDnd5r // 说服
}

// 钱币
export interface CoinsDnd5r {
  cp: number // 铜币Copper Piece (CP)
  sp: number // 银币Silver Piece (SP)
  ep: number // 银金币Electrum Piece (EP)
  gp: number // 金币Gold Piece (GP)
  pp: number // 铂金币Platinum Piece (PP)
}

// 武器/攻击
export interface AttackDnd5r {
  name: string // 武器/攻击名称
  key: SixAbilityKeysDnd5r // 关联的属性，比如力量或敏捷
  bonus: string // 攻击加值
  damage: string // 伤害
  offhand: boolean // 是否为副手攻击
  notes: string // 备注
}

// 法术位
export interface SpellSlotsDnd5r {
  total: number // 法术位总数
  used: number // 已使用的法术位数
}

// 职业列表中的单个职业项
export interface ClassItemDnd5r {
  id: number // 唯一编号
  name: string // 职业名称
  subclass: string // 子职名称
  level: number // 该职业的等级
  isPrimary: boolean // 是否为主职业
}

// ==========================================
// 2. 辅助映射表
// ==========================================

export const DND5R_ABILITY_FULL_NAMES: Record<SixAbilityKeysDnd5r, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '感知',
  cha: '魅力',
}

export const DND5R_SKILL_FULL_NAMES: Record<keyof SkillsListDnd5r, string> = {
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

// ==========================================
// 3. 核心数据结构定义
// ==========================================

export interface Dnd5rData {
  // --- 基础信息 ---
  basic: {
    name: string
    background: string
    race: string
    classes: ClassItemDnd5r[] // 职业列表
    alignment: string
    xp: number
  }

  // --- 六维属性 ---
  abilities: {
    str: AbilityDnd5r
    dex: AbilityDnd5r
    con: AbilityDnd5r
    int: AbilityDnd5r
    wis: AbilityDnd5r
    cha: AbilityDnd5r
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
    ac: number
    speed: number
    inspiration: boolean
    deathSaves: {
      success: number
      fail: number
    }
    exhaustion: number
  }

  // --- 熟练项与列表 ---
  skills: SkillsListDnd5r

  // --- 武器/攻击 ---
  attacks: AttackDnd5r[] // 使用 AttackDnd5r

  // --- 法术 ---
  spells: {
    slots: SpellSlotsDnd5r[] // 使用 SpellSlotsDnd5r
    list: string[]
    ability: 'int' | 'wis' | 'cha' | ''
  }

  extra_modify: {
    save: {
      str: number
      dex: number
      con: number
      int: number
      wis: number
      cha: number
    }
    skill: {
      athletics: number
      acrobatics: number
      sleight_of_hand: number
      stealth: number
      arcana: number
      history: number
      investigation: number
      nature: number
      religion: number
      animal_handling: number
      insight: number
      medicine: number
      perception: number
      survival: number
      deception: number
      intimidation: number
      performance: number
      persuasion: number
    }
  }
}

// ==========================================
// 4. 工厂函数 (类型也随之更新)
// ==========================================

export function createEmptyDnd5rData(): Dnd5rData {
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
      ac: 10,
      speed: 30,
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
    attacks: [],
    spells: {
      slots: Array.from({ length: 10 }, () => ({ total: 0, used: 0 })),
      list: [],
      ability: '',
    },
    extra_modify: {
      save: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      skill: {
        athletics: 0,
        acrobatics: 0,
        sleight_of_hand: 0,
        stealth: 0,
        arcana: 0,
        history: 0,
        investigation: 0,
        nature: 0,
        religion: 0,
        animal_handling: 0,
        insight: 0,
        medicine: 0,
        perception: 0,
        survival: 0,
        deception: 0,
        intimidation: 0,
        performance: 0,
        persuasion: 0,
      },
    },
  }
}
