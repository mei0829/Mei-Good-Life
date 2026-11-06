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
export interface FileRec { id: string; name: string; type: string; size: number; blob: Blob; createdAt: number }

export interface Settings {
  id: 'me'; name: string; stage: Stage; lmp?: string; edd?: string; pregnantSince?: string;
  defaultCycle?: number; budgetMonthly?: number; budgetByCat?: Record<string, number>;
  favorites?: string[]; heroPhoto?: string; updatedAt: number
}

export interface Tables {
  periods: Period; body: BodyDay; supplements: Supplement; supplementLogs: SupplementLog; sleep: Sleep; exercise: Exercise;
  hospitals: Hospital; doctors: Doctor; visits: Visit; insurance: Insurance; expenses: Expense; journal: Journal
}
export type TableName = keyof Tables;
export const TABLES: TableName[] = ['periods', 'body', 'supplements', 'supplementLogs', 'sleep', 'exercise', 'hospitals', 'doctors', 'visits', 'insurance', 'expenses', 'journal'];
export const TABLE_LABEL: Record<TableName, string> = {
  periods: '月經紀錄', body: '身體紀錄', supplements: '營養補充品', supplementLogs: '補充品攝取', sleep: '睡眠', exercise: '運動',
  hospitals: '醫院', doctors: '醫師', visits: '看診與產檢', insurance: '保險', expenses: '花費', journal: '日記'
};
