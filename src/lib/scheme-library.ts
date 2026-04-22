import type { LoanRecommendation } from '@/lib/types'

export type SchemeLibraryItem = {
  name: LoanRecommendation
  priority: number
  description: string
  suitableFor: string[]
  suitableExamples: string[]
  strongPoints: string[]
  riskNotes: string[]
  notIdealExamples: string[]
  requiredDocuments: string[]
  notes: string
}

export const schemeLibrary: SchemeLibraryItem[] = [
  {
    name: '信用貸款',
    priority: 1,
    description: '以薪轉、勞保、在職年資與信用條件為主；若有銀行排除條件，銀行方案先不列入考量。',
    suitableFor: ['有薪轉', '有勞保', '工作穩定', '信用正常'],
    suitableExamples: ['薪轉與勞保都正常', '在職時間穩定且無嚴重遲繳', '有信用卡且持卡超過 3 個月'],
    strongPoints: ['不需抵押', '可作為一般條件參考'],
    riskNotes: ['警示戶、無信用卡、持卡未滿 3 個月、銀行呆帳、銀行協商、嚴重遲繳，銀行不列入考量'],
    notIdealExamples: ['無信用卡', '持卡未滿 3 個月', '銀行呆帳或銀行協商', '嚴重遲繳'],
    requiredDocuments: ['身分證正反面', '薪轉證明', '勞保或工會資料', '信用卡或聯徵補充資料'],
    notes: '銀行條件不符時，改看車房或專案型方案。'
  },
  {
    name: '房貸',
    priority: 2,
    description: '直接詢問專員，需先看房子市值與房貸餘額。',
    suitableFor: ['名下有房屋土地'],
    suitableExamples: ['可提供房屋市值與房貸餘額', '有明確的產權資料'],
    strongPoints: ['額度可觀', '先由專員人工評估'],
    riskNotes: ['月付與期數一律請詢問專員', '需先評估市值與餘額'],
    notIdealExamples: ['沒有可評估的房屋', '產權複雜或順位不清', '資料不完整無法先評估'],
    requiredDocuments: ['房屋權狀', '土地登記謄本', '現有房貸明細', '身分證正反面'],
    notes: '需詢問專員。'
  },
  {
    name: '買車找錢',
    priority: 3,
    description: '有無汽車駕照皆可，名下不可有汽車；繳款期數過半且有勞保 3 個月以上或汽車駕照者優先。',
    suitableFor: ['名下沒有汽車', '有勞保 3 個月以上或有汽車駕照', '既有貸款已繳過半'],
    suitableExamples: ['沒有車但有穩定工作', '貸款期數已過一半', '可配合專員評估配車與額度'],
    strongPoints: ['可先看整體條件', '不要求一定有汽車駕照'],
    riskNotes: ['名下有汽車不列入此方案', '融資不可嚴重遲繳', '月付與期數一律請詢問專員'],
    notIdealExamples: ['名下已有汽車', '既有貸款未過半且遲繳嚴重', '條件無法先補強'],
    requiredDocuments: ['身分證正反面', '勞保或薪轉證明', '汽車駕照（如有）', '既有貸款明細'],
    notes: '需評估整體狀況配車跟額度，請詢問專員。'
  },
  {
    name: '原車融資',
    priority: 4,
    description: '名下有汽車且車貸已繳過半、無嚴重遲繳者，可針對車輛殘值與結清金額評估。',
    suitableFor: ['名下有汽車', '車貸繳款過半', '沒有嚴重遲繳'],
    suitableExamples: ['車貸已繳 1/2 以上', '車況與車齡仍有殘值', '可提供結清金額與車型年分'],
    strongPoints: ['可用車輛殘值再拉額度'],
    riskNotes: ['額度需評估車型、年分、結清金額', '若有嚴重遲繳或車貸期數未過半，先不列入'],
    notIdealExamples: ['車貸剛開始繳', '車貸遲繳嚴重', '無法提供車輛與結清資料'],
    requiredDocuments: ['行照', '車貸明細', '結清金額', '車型年分資料'],
    notes: '適合已持有車貸且繳款穩定的客戶。'
  },
  {
    name: '汽車改裝分期',
    priority: 5,
    description: '有汽車者可評估 15 萬內改裝分期，車貸剛核准或遲繳不超過 15 天者較適合。',
    suitableFor: ['名下有汽車', '近期車貸剛核准', '或遲繳未超過 15 天'],
    suitableExamples: ['汽車剛核貸完成', '偶發短天數遲繳但未超過 15 天', '需要 15 萬內改裝分期'],
    strongPoints: ['額度清楚', '可先用車輛條件評估'],
    riskNotes: ['有嚴重遲繳或車況不明者不優先', '月付與期數一律請詢問專員'],
    notIdealExamples: ['名下沒有汽車', '遲繳超過 15 天', '條件不完整'],
    requiredDocuments: ['行照', '車貸明細', '身分證正反面'],
    notes: '最高可評估 15 萬。'
  },
  {
    name: '機車改裝分期',
    priority: 6,
    description: '有機車者可評估 8 萬內改裝分期，遲繳不超過 15 天者較適合。',
    suitableFor: ['名下有機車', '遲繳未超過 15 天'],
    suitableExamples: ['名下有機車且沒有重大遲繳', '短期改裝需求小額處理'],
    strongPoints: ['門檻較低', '適合小額改裝需求'],
    riskNotes: ['有嚴重遲繳或資料不完整時需先人工確認', '月付與期數一律請詢問專員'],
    notIdealExamples: ['名下沒有機車', '遲繳超過 15 天', '資金需求超過方案上限'],
    requiredDocuments: ['行照', '身分證正反面'],
    notes: '最高可評估 8 萬。'
  },
  {
    name: '機車貸款',
    priority: 7,
    description: '有機車可申辦；勞保 6 個月以上可先看 25 萬，未滿 6 個月或無勞保可先看 10 萬。',
    suitableFor: ['名下有機車', '有勞保或工作可佐證'],
    suitableExamples: ['勞保滿 6 個月以上', '沒有勞保但有機車且條件可補強'],
    strongPoints: ['小額門檻較低', '額度可分 25 萬與 10 萬方向'],
    riskNotes: ['有嚴重遲繳或警示戶，需先人工覆核', '月付與期數一律請詢問專員'],
    notIdealExamples: ['名下沒有機車', '有重大信用異常', '資料不足無法評估車籍'],
    requiredDocuments: ['行照', '身分證正反面', '勞保或薪轉證明'],
    notes: '勞保 6 個月以上先看 25 萬，未滿 6 個月或無勞保先看 10 萬。'
  },
  {
    name: '商品貸款',
    priority: 8,
    description: '商品貸與手機貸合計不超過 5 筆時，可先評估 20 萬內方案。',
    suitableFor: ['商品貸 / 手機貸合計不超過 5 筆', '小中額需求'],
    suitableExamples: ['目前商品貸與手機貸合計 3 筆', '想先處理 20 萬內週轉'],
    strongPoints: ['小中額需求容易快速盤點'],
    riskNotes: ['若商品貸 / 手機貸合計超過 5 筆，先不列入', '月付與期數一律請詢問專員'],
    notIdealExamples: ['商品貸與手機貸合計超過 5 筆', '需求金額超過 20 萬', '資料不足'],
    requiredDocuments: ['既有商品貸與手機貸明細', '身分證正反面'],
    notes: '最高可評估 20 萬。'
  },
  {
    name: '手機貸款',
    priority: 9,
    description: '商品貸與手機貸合計不超過 5 筆時，可先評估 12 萬內方案。',
    suitableFor: ['商品貸 / 手機貸合計不超過 5 筆', '小額需求'],
    suitableExamples: ['目前商品貸與手機貸合計 2 筆', '想先處理 12 萬內小額需求'],
    strongPoints: ['額度較小，流程通常較快'],
    riskNotes: ['若商品貸 / 手機貸合計超過 5 筆，先不列入', '月付與期數一律請詢問專員'],
    notIdealExamples: ['商品貸與手機貸合計超過 5 筆', '需求金額超過 12 萬', '資料不足'],
    requiredDocuments: ['既有商品貸與手機貸明細', '身分證正反面'],
    notes: '最高可評估 12 萬。'
  },
  {
    name: '呆帳專案',
    priority: 10,
    description: '銀行或融資呆帳、協商案件可申辦；有車可先看 25 萬，有機車可先看 8 萬。',
    suitableFor: ['銀行呆帳', '融資呆帳', '協商案件', '可配合車輛條件'],
    suitableExamples: ['有銀行或融資呆帳，且名下有車', '有協商紀錄但仍可補強車輛或機車條件'],
    strongPoints: ['可先由專員看專案條件'],
    riskNotes: ['月付與期數一律請詢問專員', '銀行呆帳、銀行協商與嚴重遲繳案件會更保守'],
    notIdealExamples: ['完全沒有呆帳 / 協商條件', '沒有可補強的車輛條件', '資料太少無法專案評估'],
    requiredDocuments: ['呆帳或協商證明', '車籍資料或行照', '身分證正反面'],
    notes: '有車可先評估 25 萬，有機車可先評估 8 萬。'
  },
  {
    name: '汽車貸款',
    priority: 11,
    description: '以名下汽車作為條件，重點看車籍、車況與剩餘價值。',
    suitableFor: ['名下有汽車', '可提供車籍資料'],
    suitableExamples: ['名下有自用車且車籍清楚', '收入證明一般但有車可補強', '需要較快週轉'],
    strongPoints: ['可用車輛條件補強', '額度通常高於機車貸'],
    riskNotes: ['車齡太高、車況差或有多筆負債時需保守評估', '月付與期數一律請詢問專員'],
    notIdealExamples: ['車齡太高或車況不佳', '車籍資料不完整', '同時有多筆遲繳與高負債'],
    requiredDocuments: ['行照', '車籍資料', '身分證正反面'],
    notes: '適合有車但收入證明不夠漂亮的客戶。'
  },
  {
    name: '汽車增貸',
    priority: 12,
    description: '已持有車貸或有車輛時，針對剩餘價值再做增貸評估。',
    suitableFor: ['名下有汽車', '現有車貸已繳一定期數'],
    suitableExamples: ['現有車貸已繳 12 期以上且無明顯遲繳', '車輛仍有足夠殘值', '想在原有貸款上再拉額度'],
    strongPoints: ['可在原有車輛基礎上再取得額度'],
    riskNotes: ['如原車貸遲繳或車價不足，增貸空間會受限', '月付與期數一律請詢問專員'],
    notIdealExamples: ['原車貸剛繳不久', '有遲繳或展延紀錄', '車價剩餘空間不足'],
    requiredDocuments: ['行照', '原車貸明細', '身分證正反面'],
    notes: '適合已有車貸且繳款正常的客戶。'
  },
  {
    name: '機車貸款',
    priority: 13,
    description: '以名下機車作為初步評估標的，金額通常較小。',
    suitableFor: ['名下有機車', '資金需求較小'],
    suitableExamples: ['小額急用', '剛起步工作或收入較低', '想先處理短期週轉'],
    strongPoints: ['門檻相對低', '可快速評估'],
    riskNotes: ['額度較低，較適合作為短期小額週轉', '月付與期數一律請詢問專員'],
    notIdealExamples: ['需求金額偏高', '希望用單一方案解決多筆負債', '已有明顯高風險紀錄'],
    requiredDocuments: ['行照', '身分證正反面'],
    notes: '適合小額資金需求或剛起步的客戶。'
  },
  {
    name: '房屋二胎',
    priority: 14,
    description: '以名下房屋或土地作為擔保，通常適合較高額資金需求。',
    suitableFor: ['名下有房屋土地', '需要較高額度'],
    suitableExamples: ['有自有住宅', '資金需求較高', '需要整合多筆高月付負債'],
    strongPoints: ['額度空間大', '適合整合高額負債'],
    riskNotes: ['需評估產權、現有抵押順位與房屋價值', '月付與期數一律請詢問專員'],
    notIdealExamples: ['名下沒有可設定擔保品', '產權複雜或順位太前面', '短期小額需求不適合'],
    requiredDocuments: ['房屋權狀', '土地登記謄本', '身分證正反面', '收入證明'],
    notes: '適合資金需求高、又有不動產條件的客戶。'
  },
  {
    name: '代書貸款',
    priority: 15,
    description: '針對收入證明較弱、條件較複雜的客戶，以人工審核方式評估。',
    suitableFor: ['收入證明不足', '條件偏複雜', '需人工協助'],
    suitableExamples: ['無法用單一文件完整證明收入', '條件有點雜但仍有補強空間', '需要先由業務人工研判'],
    strongPoints: ['彈性高', '可針對特殊條件調整'],
    riskNotes: ['通常需要較多補件，且會更重視實際風險'],
    notIdealExamples: ['資料已完整且條件漂亮，通常可先走一般方案', '完全沒有可補強的資料', '高風險且不願補件'],
    requiredDocuments: ['身分證正反面', '收入證明', '聯絡資料', '其他輔助文件'],
    notes: '適合條件不漂亮但仍有機會補強的客戶。'
  },
  {
    name: '整合負債',
    priority: 16,
    description: '把多筆負債集中處理，先改善月付壓力與還款結構。',
    suitableFor: ['有多筆貸款', '信用卡循環偏高', '每月月付壓力大'],
    suitableExamples: ['卡循與現有貸款合計月付太高', '想先降低月付壓力', '多筆分期需要整併'],
    strongPoints: ['可降低每月負擔', '方便統一管理債務'],
    riskNotes: ['若遲繳太多或警示戶，仍需先人工覆核'],
    notIdealExamples: ['沒有明顯債務壓力', '負債結構很單純', '希望用負債整合包裝高風險案件'],
    requiredDocuments: ['現有貸款清單', '信用卡帳單', '收入證明'],
    notes: '適合多筆借款、負債比偏高的客戶。'
  },
  {
    name: '商品貸',
    priority: 17,
    description: '適合小額、短期、以生活週轉或特定商品需求為主的案件。',
    suitableFor: ['小額資金需求', '收入較低', '條件需快速處理'],
    suitableExamples: ['短期小額週轉', '月薪較低但需求不大', '先解決燃眉之急'],
    strongPoints: ['額度與流程較簡單', '可作為短期過渡方案'],
    riskNotes: ['通常不適合大額或高風險案件'],
    notIdealExamples: ['大額需求', '已有多筆遲繳', '需要長期結構調整'],
    requiredDocuments: ['身分證正反面', '聯絡資料'],
    notes: '適合金額不大、需要快速度處理的客戶。'
  },
  {
    name: '人工覆核',
    priority: 18,
    description: '當條件複雜、風險較高或資料不完整時，先交給真人審核。',
    suitableFor: ['有遲繳', '有前科', '警示戶', '法院扣款', '資料不完整'],
    suitableExamples: ['有負面信用紀錄但仍有補強空間', '資料還沒整理完整', '需要業務先做人工判斷'],
    strongPoints: ['避免 AI 亂判', '可由業務判斷補件與送件方向'],
    riskNotes: ['需要更完整的人工判斷，不建議直接自動送件'],
    notIdealExamples: ['條件很明確且可直接送件', '案件很單純不需要人工加值', '客戶希望自動快速給結論'],
    requiredDocuments: ['補充說明', '收入證明', '既有貸款明細', '必要補件'],
    notes: '高風險或特殊案件的安全閥。'
  },
  {
    name: '暫不建議承作',
    priority: 19,
    description: '若風險過高或條件明顯不符，先不建議承作。',
    suitableFor: ['警示戶', '重大遲繳', '收入不足', '負債壓力過高'],
    suitableExamples: ['重大遲繳且無法補強', '警示戶或強制扣款案件', '目前收入明顯不足以負擔月付'],
    strongPoints: ['避免過度送件造成浪費'],
    riskNotes: ['建議先改善條件再重新評估'],
    notIdealExamples: ['只差補件就能送件', '還有清楚可行的替代方案', '需要先做人工覆核'],
    requiredDocuments: ['改善後再評估'],
    notes: '用來保護案件品質與送件成功率。'
  }
]

export function getOrderedSchemeLibrary() {
  return [...schemeLibrary].sort((a, b) => a.priority - b.priority)
}

export function getSchemeLibraryJson() {
  return JSON.stringify(getOrderedSchemeLibrary(), null, 2)
}

export function getBusinessReplyTemplate() {
  return [
    '請固定輸出以下四段，段落名稱請照抄：',
    '1. 可走方案：列出 1 到 2 個最適合的方案，先講結論，再講原因與適合條件。',
    '2. 不可走原因：若有明顯不適合的方案，簡短說明，語氣要像業務在幫客戶避雷。',
    '3. 補件清單：列出目前最需要的 3 到 5 項文件或資訊，優先寫最能補強案件的項目。',
    '4. 建議話術：用客服/業務可直接轉述的口吻，寫成「可直接發給客戶」的說法，溫和但要有成交感。',
    '規則：不要承諾過件，不要自行新增方案，不要超出提供的條件與方案庫，先結論後理由，內容簡潔直接。',
    '若客戶詢問月付或期數，一律回答「請詢問專員」。'
  ].join('\n')
}
