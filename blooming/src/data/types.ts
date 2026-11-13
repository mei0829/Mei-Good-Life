// ---------- 資料型別：所有紀錄都有 id、建立與修改時間 ----------
export type Stage = 'preconception' | 'pregnant' | 'postpartum';

export interface Base { id: string; createdAt: number; updatedAt: number }

export interface Period extends Base { start: string; end?: string; flow?: string; pain?: number; symptoms?: string[]; note?: string }
/** 每日身體紀錄（同一天只會有一筆）：Wellness 與 Cycle 共用（基礎體溫、排卵試紙） */
export interface BodyDay extends Base { date: string; weight?: number; bodyFat?: number; bbt?: number; opk?: string; symptoms?: string[]; mood?: string; note?: string }
export interface Supplement extends Base { name: string; brand?: string; dose?: string; actual?: string; time?: string; start?: string; end?: string; note?: string }
export interface SupplementLog extends Base { date: string; supplementId: string; amount?: string; time?: string }
export interface Sleep extends Base { date: string; bed?: string; wake?: string; hours?: number; quality?: number; note?: string }
export interface Exercise extends Base { date: string; name: string; minutes?: number; intensity?: string; done?: boolean; note?: string; activityId?: string }
export interface Hospital extends Base { name: string; address?: string; phone?: string; favorite?: boolean; note?: string }
export interface Doctor extends Base { name: string; hospitalId?: string; dept?: string; phone?: string; note?: string }
export interface Visit extends Base {
  date: string; kind: string; hospitalId?: string; doctorId?: string; items?: string; results?: string; advice?: string;
  nextDate?: string; week?: string; efw?: number; ultrasound?: string; files?: string[]
}
export interface Insurance extends Base {
  company?: string; name: string; type?: string; insured?: string; sum?: number; premium?: number; freq?: string; effective?: string;
  waiting?: string; exclusions?: string; maternity?: string; claims?: string; status?: string; note?: string; files?: string[]
}
export interface Expense extends Base { date: string; category: string; item?: string; amount: number; note?: string }
export interface Journal extends Base {
  date: string; mood?: string; body?: string; sleep?: string; appetite?: string; discomfort?: string[]; text?: string; photos?: string[];
  vomit?: number; nausea?: number; appetiteChange?: string; fetal?: string; pregSymptoms?: string[]
}
/** 嬰兒用品清單 */
export interface BabyItem extends Base { name: string; cat?: string; qty?: string; budget?: number; price?: number; done?: boolean; src?: string; note?: string }
/** 準媽媽福利 */
export interface Benefit extends Base { name: string; cat?: string; status?: string; amount?: number; date?: string; note?: string }
export interface FileRec { id: string; name: string; type: string; size: number; blob: Blob; createdAt: number }

export interface Settings {
  id: 'me'; name: string; stage: Stage; lmp?: string; edd?: string; pregnantSince?: string;
  defaultCycle?: number; budgetMonthly?: number; budgetByCat?: Record<string, number>;
  favorites?: string[]; heroPhoto?: string;
  /** 顏色主題（全站共用的選擇優先）；themeAuto 已不再使用 */ theme?: string; themeAuto?: boolean;
  /** 已經放好預設的嬰兒用品與福利清單 */ prepSeeded?: boolean;
  updatedAt: number
}

export interface Tables {
  periods: Period; body: BodyDay; supplements: Supplement; supplementLogs: SupplementLog; sleep: Sleep; exercise: Exercise;
  hospitals: Hospital; doctors: Doctor; visits: Visit; insurance: Insurance; expenses: Expense; journal: Journal;
  items: BabyItem; benefits: Benefit
}
export type TableName = keyof Tables;
export const TABLES: TableName[] = ['periods', 'body', 'supplements', 'supplementLogs', 'sleep', 'exercise', 'hospitals', 'doctors', 'visits', 'insurance', 'expenses', 'journal', 'items', 'benefits'];
export const TABLE_LABEL: Record<TableName, string> = {
  periods: '月經紀錄', body: '身體紀錄', supplements: '營養補充品', supplementLogs: '補充品攝取', sleep: '睡眠', exercise: '運動',
  hospitals: '醫院', doctors: '醫師', visits: '看診與產檢', insurance: '保險', expenses: '花費', journal: '日記',
  items: '嬰兒用品', benefits: '準媽媽福利'
};
