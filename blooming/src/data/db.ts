import Dexie, { type Table } from 'dexie';
import type { Tables, Settings, FileRec } from './types';

// IndexedDB（透過 Dexie）：資料只存在這個瀏覽器
export class BloomDB extends Dexie {
  periods!: Table<Tables['periods'], string>;
  body!: Table<Tables['body'], string>;
  supplements!: Table<Tables['supplements'], string>;
  supplementLogs!: Table<Tables['supplementLogs'], string>;
  sleep!: Table<Tables['sleep'], string>;
  exercise!: Table<Tables['exercise'], string>;
  hospitals!: Table<Tables['hospitals'], string>;
  doctors!: Table<Tables['doctors'], string>;
  visits!: Table<Tables['visits'], string>;
  insurance!: Table<Tables['insurance'], string>;
  expenses!: Table<Tables['expenses'], string>;
  journal!: Table<Tables['journal'], string>;
  items!: Table<Tables['items'], string>;
  benefits!: Table<Tables['benefits'], string>;
  plans!: Table<Tables['plans'], string>;
  files!: Table<FileRec, string>;
  settings!: Table<Settings, string>;
  constructor(name = 'blooming-days') {
    super(name);
    this.version(1).stores({
      periods: 'id, start', body: 'id, &date', supplements: 'id, name', supplementLogs: 'id, date, supplementId, [date+supplementId]',
      sleep: 'id, &date', exercise: 'id, date', hospitals: 'id, name', doctors: 'id, name', visits: 'id, date, nextDate',
      insurance: 'id, name', expenses: 'id, date, category', journal: 'id, &date', files: 'id', settings: 'id'
    });
    // 第 2 版：新增嬰兒用品與準媽媽福利（原本的資料不受影響）
    this.version(2).stores({ items: 'id, cat', benefits: 'id, cat' });
    // 第 3 版：新增檢查與申請規劃
    this.version(3).stores({ plans: 'id, date, stage' });
  }
}
