import type { Field } from '../components/form';
import * as O from '../content/options';

// 各種紀錄的表單欄位
export const PERIOD_FIELDS: Field[] = [
  { key: 'start', label: '月經開始日', type: 'date', required: true, half: true },
  { key: 'end', label: '月經結束日', type: 'date', half: true, hint: '還沒結束可以先空著' },
  { key: 'flow', label: '月經量', type: 'select', options: O.FLOW, half: true },
  { key: 'pain', label: '經痛程度', type: 'scale', min: 0, max: 10, scaleLabels: ['不痛', '非常痛'] },
  { key: 'symptoms', label: '經期症狀', type: 'multi', options: O.PERIOD_SYMPTOMS },
  { key: 'note', label: '備註', type: 'textarea' },
];
export const CYCLE_DAY_FIELDS: Field[] = [
  { key: 'date', label: '日期', type: 'date', required: true, half: true },
  { key: 'bbt', label: '基礎體溫', type: 'number', unit: '°C', step: 0.01, half: true, hint: '早上醒來、下床前量' },
  { key: 'opk', label: '排卵試紙', type: 'select', options: O.OPK, half: true },
  { key: 'note', label: '備註', type: 'textarea' },
];
export const BODY_FIELDS: Field[] = [
  { key: 'date', label: '日期', type: 'date', required: true, half: true },
  { key: 'weight', label: '體重', type: 'number', unit: 'kg', step: 0.1, half: true },
  { key: 'bodyFat', label: '體脂率', type: 'number', unit: '%', step: 0.1, half: true },
  { key: 'bbt', label: '基礎體溫', type: 'number', unit: '°C', step: 0.01, half: true },
  { key: 'mood', label: '心情', type: 'select', options: O.MOODS, half: true },
  { key: 'symptoms', label: '身體症狀', type: 'multi', options: O.BODY_SYMPTOMS },
  { key: 'note', label: '備註', type: 'textarea' },
];
