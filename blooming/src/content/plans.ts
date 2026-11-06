// 檢查與申請規劃的預設清單：第一次打開時放好，之後可以自己改、刪、新增
import type { Plan } from '../data/types';
import { PRECONCEPTION_CHECKS, PRENATAL_CHECKS, PRENATAL_VISITS } from './medical';

// 官方網站（只放首頁，最新規定請在網站內查）
export const SITES = {
  mammy: 'https://mammy.hpa.gov.tw/',   // 國民健康署 孕產婦關懷網站
  hpa: 'https://www.hpa.gov.tw/',       // 國民健康署
  bli: 'https://www.bli.gov.tw/',       // 勞動部勞工保險局
  nhi: 'https://www.nhi.gov.tw/',       // 衛生福利部中央健康保險署
};
export const PLAN_KIND = ['公費產檢', '超音波', '篩檢', '備孕檢查', '補助申請', '其他'];
export const PLAN_STATUS = ['待安排', '已預約', '已完成', '不需要'];
export const SUBSIDY = ['公費', '健保', '部分補助', '自費'];

type NewPlan = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>;

// 各項目要提前幾週預約、去哪裡、補充說明
const EXTRA: Record<string, Partial<NewPlan>> = {
  us1: { kind: '超音波', lead: 0, note: '通常在產檢時一起做' },
  edu1: { kind: '其他', lead: 0, note: '產檢時醫院會安排' },
  nt: { kind: '篩檢', lead: 3, where: '有做胎兒頸部透明帶檢查的婦產科', note: '熱門時段很快額滿，建議提早預約；價格依醫院不同，請先詢問' },
  nipt: { kind: '篩檢', lead: 1, where: '婦產科或檢驗所', note: '價格依檢測項目與院所不同，請先詢問' },
  pe: { kind: '篩檢', lead: 3, where: '婦產科（常和早期唐氏症篩檢一起做）', note: '價格依醫院不同，請先詢問' },
  amnio: { kind: '篩檢', lead: 3, where: '有做產前遺傳診斷的醫院', applyAt: '符合資格者在做檢查的醫院申請補助', url: SITES.hpa },
  us2: { kind: '超音波', lead: 0, note: '通常在產檢時一起做' },
  lvus: { kind: '超音波', lead: 4, where: '有高層次超音波的醫院或診所', note: '名額少，建議盡早預約；價格依院所不同，請先詢問' },
  gdm: { kind: '篩檢', lead: 0, note: '照醫院指示準備（有些需要空腹）' },
  hb: { kind: '篩檢', lead: 0 },
  us3: { kind: '超音波', lead: 0, note: '通常在產檢時一起做' },
  edu2: { kind: '其他', lead: 0 },
  gbs: { kind: '篩檢', lead: 0 },
  pre: { lead: 2, where: '國健署孕前健康檢查合約院所', applyAt: '到合約院所預約時說要做孕前健康檢查', url: SITES.hpa },
  rubella: { lead: 0, note: '通常包含在孕前健康檢查裡' },
  std: { lead: 0, note: '通常包含在孕前健康檢查裡' },
  thal: { lead: 0, note: '通常包含在孕前健康檢查裡' },
};

export function planSeeds(): NewPlan[] {
  const preg: NewPlan[] = [...PRENATAL_VISITS, ...PRENATAL_CHECKS].map(c => ({
    seedId: c.id, name: c.title, stage: 'preg', kind: c.id.startsWith('v') ? '公費產檢' : '其他',
    weekFrom: c.weeks?.[0], weekTo: c.weeks?.[1], lead: c.id === 'v1' ? 1 : 0,
    subsidy: c.cost, where: '產檢的醫院或診所', url: SITES.mammy, status: '待安排',
    note: [c.purpose, c.id.startsWith('v') ? (c.id === 'v1' ? '第一次產檢要自己預約；之後通常在上次產檢時約好' : '通常在上次產檢時就會約好') : c.note].filter(Boolean).join('。'),
    ...EXTRA[c.id],
  }));
  const pre: NewPlan[] = PRECONCEPTION_CHECKS.map(c => ({
    seedId: c.id, name: c.title, stage: 'pre', kind: '備孕檢查', subsidy: c.cost, where: '婦產科或家醫科', status: '待安排',
    note: [c.purpose, c.note].filter(Boolean).join('。'), url: c.cost === '自費' ? undefined : SITES.hpa,
    ...EXTRA[c.id],
  }));
  // 公費項目預估費用填 0（通常只要付掛號費）；自費項目留白，請自己填醫院報價
  return [...pre, ...preg].map(p => p.subsidy === '公費' || p.subsidy === '健保' ? { ...p, cost: 0 } : p);
}

// 福利清單補上「去哪裡申請」與相關網站（依名稱對應）
export const BENEFIT_WHERE: Record<string, { where: string; url?: string }> = {
  '孕前健康檢查補助': { where: '國健署孕前健康檢查合約院所', url: SITES.hpa },
  '人工生殖（試管）補助': { where: '做療程的人工生殖機構', url: SITES.hpa },
  '孕婦健康手冊': { where: '產檢的醫院、診所或衛生所', url: SITES.mammy },
  '產前檢查補助（14 次）': { where: '產檢的醫院或診所', url: SITES.mammy },
  '產前超音波補助': { where: '產檢的醫院或診所', url: SITES.mammy },
  '孕期篩檢補助': { where: '產檢的醫院或診所', url: SITES.mammy },
  '產前遺傳診斷補助': { where: '有做產前遺傳診斷的醫院', url: SITES.hpa },
  '孕婦專用停車位': { where: '戶籍地縣市政府' },
  '產檢假 7 天': { where: '向公司人資申請' },
  '陪產檢及陪產假 7 天': { where: '爸爸向公司人資申請' },
  '產假 8 週': { where: '向公司人資申請' },
  '勞保生育給付': { where: '勞動部勞工保險局（可線上申請）', url: SITES.bli },
  '國民年金生育給付': { where: '勞動部勞工保險局', url: SITES.bli },
  '中央生育補助': { where: '依衛福部與勞保局公告方式申請', url: SITES.bli },
  '縣市生育津貼': { where: '戶籍地區公所' },
  '新生兒篩檢、聽力篩檢': { where: '生產的醫院', url: SITES.hpa },
  '兒童健康手冊、預防接種': { where: '生產的醫院、衛生所', url: SITES.hpa },
  '育兒津貼': { where: '戶籍地區公所' },
  '托育補助': { where: '戶籍地區公所或托育機構' },
  '育嬰留職停薪津貼': { where: '勞動部勞工保險局（向公司申請育嬰假後）', url: SITES.bli },
  '幼兒學前特別扣除額': { where: '報所得稅時填寫' },
};
